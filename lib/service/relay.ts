/**
 * POST /api/ba-moi/v1/webhooks/discourse: the relay (plan: webhook and relay
 * policy). Discourse sends every post_created, including private messages;
 * only a regular post by a relay topic's owner, in an open match, is relayed.
 * Nothing in the body is trusted beyond ids checked against the database.
 */
import {
  clearRelayContactTail, countRelayMessagesSince, getMatchForMember, getMember, getRelayContactTail,
  getRelayTopicByDiscourseId, insertRelayMessage, listRelayTopicsForMatch, lockMemberQuota,
  setRelayContactTail, type RelayStatus,
} from '@/lib/db/repo'
import { PostWebhookSchema, REGULAR_POST_TYPE, verifyWebhookSignature, type PostWebhook } from '@/lib/discourse/webhook'
import { HELD_ATTACHMENT, HELD_CONTACT, RATE_LIMITED, TOO_LONG, relayedMessage } from './copy'
import type { ServiceDeps } from './deps'
import { deliver, queue } from './outbox'
import { RELAY_MAX_LENGTH, RELAY_PER_MINUTE, decideRelay, nextRelayContactTail } from './relay-policy'

export async function relayPost(deps: ServiceDeps, post: PostWebhook['post']): Promise<string> {
  const { db, config } = deps
  if (post.post_type !== REGULAR_POST_TYPE || post.deleted_at) return 'ignored_post_type'
  if (config.botUserIds.includes(post.user_id)) return 'ignored_bot'
  const topic = await getRelayTopicByDiscourseId(db, post.topic_id)
  if (!topic) return 'ignored_topic'
  // The sender is the topic's owner, checked against the author, never taken from the body.
  const sender = await getMember(db, topic.memberId)
  if (!sender || sender.discourseUserId !== post.user_id) return 'ignored_author'
  const match = await getMatchForMember(db, topic.matchId, sender.id)
  if (!match || match.state === 'closed') return 'ignored_closed'
  const target = (await listRelayTopicsForMatch(db, match.id)).find((t) => t.memberId !== sender.id)
  if (!target) return 'ignored_no_target'

  const result = await db.transaction(async (tx) => {
    await lockMemberQuota(tx, sender.id)
    const current = await getMatchForMember(tx, match.id, sender.id, true)
    if (!current || current.state === 'closed') return { key: null, outcome: 'ignored_closed' }
    let status: RelayStatus
    let text: string | null = null
    let notice: string | null = null
    if (post.raw.length > RELAY_MAX_LENGTH) {
      status = 'too_long'
      notice = TOO_LONG
    } else if ((await countRelayMessagesSince(tx, sender.id, new Date(deps.now().getTime() - 60_000))) >= RELAY_PER_MINUTE) {
      status = 'rate_limited'
      notice = RATE_LIMITED
    } else {
      const priorText = current.state === 'revealed' ? '' : await getRelayContactTail(tx, match.id, sender.id)
      const decision = decideRelay(post.raw, current.state === 'revealed', priorText)
      if (decision.action === 'drop') return { key: null, outcome: 'dropped_empty' }
      if (decision.action === 'hold') {
        status = 'held'
        notice = decision.reason === 'contact' ? HELD_CONTACT : HELD_ATTACHMENT
      } else {
        status = 'relayed'
        text = decision.text
      }
    }
    const messageId = await insertRelayMessage(tx, { matchId: match.id, fromMember: sender.id, sourcePostId: post.id, status })
    if (messageId === null) return { key: null, outcome: 'replay' }
    if (current.state === 'revealed') {
      await clearRelayContactTail(tx, match.id, sender.id)
    } else if (status === 'relayed' && text !== null) {
      const priorText = await getRelayContactTail(tx, match.id, sender.id)
      await setRelayContactTail(tx, match.id, sender.id, nextRelayContactTail(priorText, text))
    }
    const key = text !== null ? await queue(tx, `relay:${post.id}`, {
      kind: 'relay_post', matchId: match.id, memberId: target.memberId, raw: relayedMessage(target.aliasForOther, text), text, relayMessageId: messageId,
    }, deps.now()) : await queue(tx, `relay-notice:${post.id}`, { kind: 'relay_post', matchId: match.id, memberId: sender.id, raw: notice! }, deps.now())
    return { key, outcome: status }
  })
  if (result.key) await deliver(deps, result.key)
  return result.outcome
}

export async function handleDiscourseWebhook(request: Request, deps: ServiceDeps): Promise<Response> {
  const started = Date.now()
  const respond = (status: number, outcome: string) => {
    deps.log({ event: 'webhook', status, outcome, ms: Date.now() - started })
    return Response.json({ ok: status === 200, outcome }, { status })
  }
  if (!deps.config.enabled) return respond(503, 'service_disabled')
  const body = new Uint8Array(await request.arrayBuffer())
  if (!verifyWebhookSignature(body, request.headers.get('x-discourse-event-signature'), deps.config.webhookSecret)) {
    return respond(401, 'bad_signature')
  }
  if (request.headers.get('x-discourse-event-type') !== 'post' || request.headers.get('x-discourse-event') !== 'post_created') {
    return respond(200, 'ignored_event')
  }
  let parsed: PostWebhook
  try {
    parsed = PostWebhookSchema.parse(JSON.parse(new TextDecoder().decode(body)))
  } catch {
    return respond(200, 'ignored_payload')
  }
  try {
    return respond(200, await relayPost(deps, parsed.post))
  } catch (error) {
    deps.log({ event: 'webhook_error', error: error instanceof Error ? error.name : 'Error' })
    return respond(500, 'error') // Discourse records the failed delivery; a redelivery is absorbed by source_post_id
  }
}
