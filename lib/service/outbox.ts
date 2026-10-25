/**
 * Database first, Discourse second. Every post the service makes goes through
 * queue() persists the intent with the domain change; deliver() runs after
 * commit. A lease prevents concurrent sends for the same key. Discourse
 * failures remain queued for cron; failure to store intent rolls back the
 * domain transaction. Discourse has no remote idempotency contract, so a
 * crash after its response but before markPostSent can still duplicate a post.
 */
import {
  claimDuePosts, enqueuePost, getMatchForMember, getMember, getRelayTopic, markPostFailed, markPostSent, poolBuckets, setPersonaTopic,
  setRelayTopicDiscourseId, setRelayedPostId, type PendingPost,
} from '@/lib/db/repo'
import type { Db } from '@/lib/db/db'
import { redactAliasForCurrentPool } from './cards'
import { CONSENT_VERSION, PERSONA_THREAD_TITLE, matchOpened, relayedMessage, relayIntro, relayTitle, revealAsked, revealed } from './copy'
import type { ServiceDeps } from './deps'

export type Outbound =
  /** A notice from Bà Mối in the member's conversation with her: her direct chat, or her private thread (opened if she has none). */
  | { kind: 'persona_notice'; memberId: string; raw: string; matchId?: string }
  /** Opens the member's relay thread for a match: a private message from Thư Duyên. */
  | { kind: 'relay_topic'; matchId: string; memberId: string; title: string; raw: string }
  /** A post by Thư Duyên in the member's relay thread, which must already exist. */
  | { kind: 'relay_post'; matchId: string; memberId: string; raw: string; text?: string; notice?: 'reveal_asked' | 'revealed'; relayMessageId?: number; allowClosed?: boolean }
  /** A post into a known topic, for notices that outlive the rows (after a deletion). */
  | { kind: 'topic_post'; as: 'persona' | 'relay'; topicId: number; raw: string }

class NotReady extends Error {}

async function perform(deps: ServiceDeps, item: Outbound): Promise<void> {
  const { db, discourse, config } = deps
  if (item.kind === 'persona_notice') {
    let raw = item.raw
    if (item.matchId) {
      const match = await getMatchForMember(db, item.matchId, item.memberId)
      if (!match || match.state === 'closed') return
      const topic = await getRelayTopic(db, item.matchId, item.memberId)
      if (!topic) return
      raw = matchOpened(redactAliasForCurrentPool(topic.aliasForOther, await poolBuckets(db, CONSENT_VERSION)))
    }
    const member = await getMember(db, item.memberId)
    if (!member?.discourseUsername) return // deleted since, or a sample: nothing to notify
    if (config.noticeTransport === 'chat') {
      // Upserted each time: Discourse returns the existing one-to-one chat.
      const { channelId } = await discourse.openDirectChat({ asUsername: config.personaUsername, targetUsername: member.discourseUsername })
      await discourse.createChatMessage({ asUsername: config.personaUsername, channelId, raw })
      return
    }
    if (member.personaTopicId) {
      await discourse.createPost({ asUsername: config.personaUsername, topicId: member.personaTopicId, raw })
      return
    }
    const { topicId } = await discourse.createPrivateMessage({
      asUsername: config.personaUsername, recipients: [member.discourseUsername], title: PERSONA_THREAD_TITLE, raw,
    })
    await setPersonaTopic(db, member.id, topicId)
    return
  }

  if (item.kind === 'topic_post') {
    const asUsername = item.as === 'persona' ? config.personaUsername : config.relayUsername
    await discourse.createPost({ asUsername, topicId: item.topicId, raw: item.raw })
    return
  }

  const match = await getMatchForMember(db, item.matchId, item.memberId)
  if (!match || (match.state === 'closed' && !(item.kind === 'relay_post' && item.allowClosed))) return
  const topic = await getRelayTopic(db, item.matchId, item.memberId)
  if (!topic) return // the match was deleted with a member

  if (item.kind === 'relay_topic') {
    if (topic.discourseTopicId) return // already opened
    const member = await getMember(db, item.memberId)
    if (!member?.discourseUsername) return
    const alias = redactAliasForCurrentPool(topic.aliasForOther, await poolBuckets(db, CONSENT_VERSION))
    const { topicId } = await discourse.createPrivateMessage({
      asUsername: config.relayUsername, recipients: [member.discourseUsername], title: relayTitle(alias), raw: relayIntro(alias),
    })
    await setRelayTopicDiscourseId(db, item.matchId, item.memberId, topicId)
    return
  }

  if (!topic.discourseTopicId) {
    if (match.state === 'closed') return // no thread was opened, so there is no chat to close
    throw new NotReady('relay topic not opened yet')
  }
  let raw = item.raw
  if (item.text !== undefined || item.notice) {
    const alias = redactAliasForCurrentPool(topic.aliasForOther, await poolBuckets(db, CONSENT_VERSION))
    if (item.notice === 'reveal_asked') raw = revealAsked(alias)
    else if (item.notice === 'revealed') {
      if (match.state !== 'revealed') return
      const other = await getMember(db, match.memberA === item.memberId ? match.memberB : match.memberA)
      if (!other?.discourseUsername) return
      raw = revealed(alias, other.discourseUsername, `${config.discourseUrl}/u/${encodeURIComponent(other.discourseUsername)}`)
    } else raw = relayedMessage(alias, item.text!)
  }
  const { postId } = await discourse.createPost({ asUsername: config.relayUsername, topicId: topic.discourseTopicId, raw })
  if (item.relayMessageId !== undefined) await setRelayedPostId(db, item.relayMessageId, postId)
}

/** Can be called inside the transaction that makes the notification necessary. */
export async function queue(db: Db, key: string, item: Outbound, now: Date): Promise<string> {
  await enqueuePost(db, key, item.kind, item as unknown as Record<string, unknown>, now)
  return key
}

async function deliverClaim(deps: ServiceDeps, post: PendingPost): Promise<'sent' | 'pending' | 'dead'> {
  try {
    await perform(deps, post.payload as unknown as Outbound)
    await markPostSent(deps.db, post.id)
    return 'sent'
  } catch (error) {
    // Store only the error class; remote response bodies may contain member data.
    const status = await markPostFailed(deps.db, post.id, error instanceof Error ? error.name : 'Error')
    deps.log({ event: status === 'dead' ? 'outbox_dead' : 'outbox_queued', key: post.idempotencyKey, kind: post.kind, attempts: post.attempts })
    return status
  }
}

export async function deliver(deps: ServiceDeps, key: string): Promise<'sent' | 'queued'> {
  const [post] = await claimDuePosts(deps.db, deps.now(), 1, key)
  if (!post) return 'queued' // already sent, leased by another worker, or waiting for backoff
  return (await deliverClaim(deps, post)) === 'sent' ? 'sent' : 'queued'
}

export async function deliverAll(deps: ServiceDeps, keys: string[]): Promise<void> {
  for (const key of keys) await deliver(deps, key)
}

export async function send(deps: ServiceDeps, key: string, item: Outbound): Promise<'sent' | 'queued'> {
  await queue(deps.db, key, item, deps.now())
  return deliver(deps, key)
}

/** The cron job: retries due posts once each. */
export async function retryDuePosts(deps: ServiceDeps): Promise<{ claimed: number; sent: number; retrying: number; dead: number }> {
  const due = await claimDuePosts(deps.db, deps.now())
  const result = { claimed: due.length, sent: 0, retrying: 0, dead: 0 }
  for (const post of due) {
    const status = await deliverClaim(deps, post)
    if (status === 'sent') result.sent++
    else if (status === 'dead') result.dead++
    else result.retrying++
  }
  return result
}
