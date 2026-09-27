/**
 * Database first, Discourse second. Every post the service makes goes through
 * send(): it is attempted once, right after the database commit, and on
 * failure queued in pending_posts for the cron retry. A failed post never
 * fails the tool call or the webhook. Posts are keyed, so a retried call
 * can't queue the same post twice.
 */
import {
  claimDuePosts, enqueuePost, getMember, getRelayTopic, markPostFailed, markPostSent, setPersonaTopic,
  setRelayTopicDiscourseId, setRelayedPostId,
} from '@/lib/db/repo'
import { PERSONA_THREAD_TITLE } from './copy'
import type { ServiceDeps } from './deps'

export type Outbound =
  /** A notice from Bà Mối in the member's own thread with her (opened if she has none). */
  | { kind: 'persona_notice'; memberId: string; raw: string }
  /** Opens the member's relay thread for a match: a private message from Thư Duyên. */
  | { kind: 'relay_topic'; matchId: string; memberId: string; title: string; raw: string }
  /** A post by Thư Duyên in the member's relay thread, which must already exist. */
  | { kind: 'relay_post'; matchId: string; memberId: string; raw: string; relayMessageId?: number }
  /** A post into a known topic, for notices that outlive the rows (after a deletion). */
  | { kind: 'topic_post'; as: 'persona' | 'relay'; topicId: number; raw: string }

class NotReady extends Error {}

async function perform(deps: ServiceDeps, item: Outbound): Promise<void> {
  const { db, discourse, config } = deps
  if (item.kind === 'persona_notice') {
    const member = await getMember(db, item.memberId)
    if (!member?.discourseUsername) return // deleted since, or a sample: nothing to notify
    if (member.personaTopicId) {
      await discourse.createPost({ asUsername: config.personaUsername, topicId: member.personaTopicId, raw: item.raw })
      return
    }
    const { topicId } = await discourse.createPrivateMessage({
      asUsername: config.personaUsername, recipients: [member.discourseUsername], title: PERSONA_THREAD_TITLE, raw: item.raw,
    })
    await setPersonaTopic(db, member.id, topicId)
    return
  }

  if (item.kind === 'topic_post') {
    const asUsername = item.as === 'persona' ? config.personaUsername : config.relayUsername
    await discourse.createPost({ asUsername, topicId: item.topicId, raw: item.raw })
    return
  }

  const topic = await getRelayTopic(db, item.matchId, item.memberId)
  if (!topic) return // the match was deleted with a member

  if (item.kind === 'relay_topic') {
    if (topic.discourseTopicId) return // already opened
    const member = await getMember(db, item.memberId)
    if (!member?.discourseUsername) return
    const { topicId } = await discourse.createPrivateMessage({
      asUsername: config.relayUsername, recipients: [member.discourseUsername], title: item.title, raw: item.raw,
    })
    await setRelayTopicDiscourseId(db, item.matchId, item.memberId, topicId)
    return
  }

  if (!topic.discourseTopicId) throw new NotReady('relay topic not opened yet')
  const { postId } = await discourse.createPost({ asUsername: config.relayUsername, topicId: topic.discourseTopicId, raw: item.raw })
  if (item.relayMessageId !== undefined) await setRelayedPostId(db, item.relayMessageId, postId)
}

export async function send(deps: ServiceDeps, key: string, item: Outbound): Promise<'sent' | 'queued'> {
  try {
    await perform(deps, item)
    return 'sent'
  } catch (error) {
    await enqueuePost(deps.db, key, item.kind, item as unknown as Record<string, unknown>)
    deps.log({ event: 'outbox_queued', key, kind: item.kind, error: (error as Error).message.slice(0, 200) })
    return 'queued'
  }
}

/** The cron job: retries due posts once each. */
export async function retryDuePosts(deps: ServiceDeps): Promise<{ claimed: number; sent: number; retrying: number; dead: number }> {
  const due = await claimDuePosts(deps.db, deps.now())
  const result = { claimed: due.length, sent: 0, retrying: 0, dead: 0 }
  for (const post of due) {
    try {
      await perform(deps, post.payload as unknown as Outbound)
      await markPostSent(deps.db, post.id)
      result.sent++
    } catch (error) {
      const status = await markPostFailed(deps.db, post.id, (error as Error).message)
      if (status === 'dead') {
        result.dead++
        deps.log({ event: 'outbox_dead', key: post.idempotencyKey, kind: post.kind, attempts: post.attempts })
      } else {
        result.retrying++
      }
    }
  }
  return result
}
