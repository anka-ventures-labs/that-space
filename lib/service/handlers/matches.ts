/** Matches: opening the relay threads, listing, and end, block or reveal. */
import { z } from 'zod'
import {
  closeMatch, getCard, getMatchForMember, getMember, getProfile, getRelayTopic, insertBlock, insertRelayTopic,
  listMatchesForMember, poolBuckets, setReveal, type Match,
} from '@/lib/db/repo'
import { addressLabel, aliasFor, calculateAge } from '@/lib/matching/privacy'
import { redactAliasForCurrentPool, redactCardForCurrentPool } from '../cards'
import { BLOCK_CONFIRMED, CONSENT_VERSION, MATCH_ENDED, matchOpened, relayIntro, relayTitle, revealAsked, revealed } from '../copy'
import { deliverAll, queue } from '../outbox'
import { defineTool, fail, type ToolContext, type ToolResult } from '../tool'

/**
 * Opens a match: each side gets a relay thread from Thư Duyên and a notice
 * from Bà Mối. Each side's alias for the other is a form of address relative
 * to herself, plus the initial when the rule of 5 allows ("Chị L."). Safe to
 * call twice: a side whose relay topic exists is skipped.
 */
export async function openMatch({ deps, now }: ToolContext, match: Match): Promise<void> {
  const keys = await deps.db.transaction((db) => queueMatch({ deps: { ...deps, db }, now }, match))
  await deliverAll(deps, keys)
}

/** Stages both private threads and notices in the transaction that creates the match. */
export async function queueMatch({ deps, now }: Pick<ToolContext, 'deps' | 'now'>, match: Match): Promise<string[]> {
  const { db } = deps
  const keys: string[] = []
  const buckets = await poolBuckets(db, CONSENT_VERSION)
  const sides = await Promise.all([match.memberA, match.memberB].map(async (id) => {
    const [member, profile, card] = await Promise.all([getMember(db, id), getProfile(db, id), getCard(db, id)])
    return { id, member, profile, card }
  }))
  for (const [index, me] of sides.entries()) {
    const other = sides[1 - index]
    if (!me.member || !me.profile || !other.profile?.gender) continue
    const address = addressLabel(calculateAge(me.profile.birthDate, now), calculateAge(other.profile.birthDate, now), other.profile.gender)
    const alias = aliasFor(address, other.card ? redactCardForCurrentPool(other.card.card, buckets).initial : null)
    if (!(await insertRelayTopic(db, { matchId: match.id, memberId: me.id, aliasForOther: alias }))) continue
    keys.push(await queue(db, `relay-topic:${match.id}:${me.id}`, {
      kind: 'relay_topic', matchId: match.id, memberId: me.id, title: relayTitle(alias), raw: relayIntro(alias),
    }, now))
    keys.push(await queue(db, `match:${match.id}:${me.id}`, { kind: 'persona_notice', memberId: me.id, matchId: match.id, raw: matchOpened(alias) }, now))
  }
  return keys
}

export const matches = defineTool(z.object({}), async ({ deps: { db, config }, member }) => {
  const list = await listMatchesForMember(db, member.id)
  const buckets = await poolBuckets(db, CONSENT_VERSION)
  const rows = await Promise.all(list.map(async (m) => {
    const topic = await getRelayTopic(db, m.id, member.id)
    const mine = m.memberA === member.id
    return {
      match_id: m.id,
      alias: topic ? redactAliasForCurrentPool(topic.aliasForOther, buckets) : null,
      state: m.state,
      i_asked_to_reveal: mine ? m.revealA : m.revealB,
      they_asked_to_reveal: mine ? m.revealB : m.revealA,
      chat_url: topic?.discourseTopicId ? `${config.discourseUrl}/t/${topic.discourseTopicId}` : null,
    }
  }))
  return { ok: true, matches: rows }
})

const MatchActionArgs = z.object({ match_id: z.uuid(), action: z.enum(['end', 'block', 'reveal']) })

export const matchAction = defineTool(MatchActionArgs, async (ctx, args) => {
  const { deps, member } = ctx
  const keys: string[] = []
  const result = await deps.db.transaction<ToolResult>(async (db) => {
    const { config } = deps
    const match = await getMatchForMember(db, args.match_id, member.id, true)
    if (!match) return fail('not_found')
    if (match.state === 'closed') return fail('closed')
    if (args.action === 'reveal' && match.state === 'revealed') return { ok: true, result: 'revealed' }
    const otherId = match.memberA === member.id ? match.memberB : match.memberA

    if (args.action !== 'reveal') {
      if (args.action === 'block') await insertBlock(db, member.id, otherId)
      await closeMatch(db, match.id, args.action === 'block' ? 'blocked' : 'ended')
      // The other side is told the chat ended, never that she was blocked.
      keys.push(await queue(db, `closed:${match.id}:${otherId}`, { kind: 'relay_post', matchId: match.id, memberId: otherId, raw: MATCH_ENDED, allowClosed: true }, ctx.now))
      keys.push(await queue(db, `closed:${match.id}:${member.id}`, {
        kind: 'relay_post', matchId: match.id, memberId: member.id, raw: args.action === 'block' ? BLOCK_CONFIRMED : MATCH_ENDED, allowClosed: true,
      }, ctx.now))
      return { ok: true, result: args.action === 'block' ? 'blocked' : 'ended' }
    }

    const alreadyAsked = match.memberA === member.id ? match.revealA : match.revealB
    const updated = await setReveal(db, match.id, member.id)
    if (!updated) return fail('not_found')
    if (updated.state === 'revealed' && match.state !== 'revealed') {
      // Both have asked: each side gets the other's Discourse profile link.
      for (const [me, other] of [[member.id, otherId], [otherId, member.id]]) {
        const [topic, otherMember] = await Promise.all([getRelayTopic(db, match.id, me), getMember(db, other)])
        if (!topic || !otherMember?.discourseUsername) continue
        const username = otherMember.discourseUsername
        keys.push(await queue(db, `revealed:${match.id}:${me}`, {
          kind: 'relay_post', matchId: match.id, memberId: me, notice: 'revealed',
          raw: revealed(topic.aliasForOther, username, `${config.discourseUrl}/u/${encodeURIComponent(username)}`),
        }, ctx.now))
      }
      return { ok: true, result: 'revealed' }
    }
    if (!alreadyAsked) {
      const theirs = await getRelayTopic(db, match.id, otherId)
      if (theirs) {
        keys.push(await queue(db, `reveal-asked:${match.id}:${member.id}`, {
          kind: 'relay_post', matchId: match.id, memberId: otherId, notice: 'reveal_asked', raw: revealAsked(theirs.aliasForOther),
        }, ctx.now))
      }
    }
    return { ok: true, result: 'waiting_for_other' }
  })
  await deliverAll(deps, keys)
  return result
})
