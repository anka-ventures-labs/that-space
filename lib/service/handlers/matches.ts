/** Matches: opening the relay threads, listing, and end, block or reveal. */
import { z } from 'zod'
import {
  closeMatch, getCard, getMatchForMember, getMember, getProfile, getRelayTopic, insertBlock, insertRelayTopic,
  listMatchesForMember, setReveal, type Match,
} from '@/lib/db/repo'
import { addressLabel, aliasFor, calculateAge } from '@/lib/matching/privacy'
import { BLOCK_CONFIRMED, MATCH_ENDED, matchOpened, relayIntro, relayTitle, revealAsked, revealed } from '../copy'
import { send } from '../outbox'
import { defineTool, fail, type ToolContext } from '../tool'

/**
 * Opens a match: each side gets a relay thread from Thư Duyên and a notice
 * from Bà Mối. Each side's alias for the other is a form of address relative
 * to herself, plus the initial when the rule of 5 allows ("Chị L."). Safe to
 * call twice: a side whose relay topic exists is skipped.
 */
export async function openMatch({ deps, now }: ToolContext, match: Match): Promise<void> {
  const { db } = deps
  const sides = await Promise.all([match.memberA, match.memberB].map(async (id) => {
    const [member, profile, card] = await Promise.all([getMember(db, id), getProfile(db, id), getCard(db, id)])
    return { id, member, profile, card }
  }))
  for (const [index, me] of sides.entries()) {
    const other = sides[1 - index]
    if (!me.member || !me.profile || !other.profile?.gender) continue
    const address = addressLabel(calculateAge(me.profile.birthDate, now), calculateAge(other.profile.birthDate, now), other.profile.gender)
    const alias = aliasFor(address, other.card?.card.initial ?? null)
    if (!(await insertRelayTopic(db, { matchId: match.id, memberId: me.id, aliasForOther: alias }))) continue
    await send(deps, `relay-topic:${match.id}:${me.id}`, {
      kind: 'relay_topic', matchId: match.id, memberId: me.id, title: relayTitle(alias), raw: relayIntro(alias),
    })
    await send(deps, `match:${match.id}:${me.id}`, { kind: 'persona_notice', memberId: me.id, raw: matchOpened(alias) })
  }
}

export const matches = defineTool(z.object({}), async ({ deps: { db, config }, member }) => {
  const list = await listMatchesForMember(db, member.id)
  const rows = await Promise.all(list.map(async (m) => {
    const topic = await getRelayTopic(db, m.id, member.id)
    const mine = m.memberA === member.id
    return {
      match_id: m.id,
      alias: topic?.aliasForOther ?? null,
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
  const { db, config } = deps
  const match = await getMatchForMember(db, args.match_id, member.id)
  if (!match) return fail('not_found')
  if (match.state === 'closed') return fail('closed')
  const otherId = match.memberA === member.id ? match.memberB : match.memberA

  if (args.action !== 'reveal') {
    if (args.action === 'block') await insertBlock(db, member.id, otherId)
    await closeMatch(db, match.id, args.action === 'block' ? 'blocked' : 'ended')
    // The other side is told the chat ended, never that she was blocked.
    await send(deps, `closed:${match.id}:${otherId}`, { kind: 'relay_post', matchId: match.id, memberId: otherId, raw: MATCH_ENDED })
    await send(deps, `closed:${match.id}:${member.id}`, {
      kind: 'relay_post', matchId: match.id, memberId: member.id, raw: args.action === 'block' ? BLOCK_CONFIRMED : MATCH_ENDED,
    })
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
      await send(deps, `revealed:${match.id}:${me}`, {
        kind: 'relay_post', matchId: match.id, memberId: me,
        raw: revealed(topic.aliasForOther, username, `${config.discourseUrl}/u/${encodeURIComponent(username)}`),
      })
    }
    return { ok: true, result: 'revealed' }
  }
  if (!alreadyAsked) {
    const theirs = await getRelayTopic(db, match.id, otherId)
    if (theirs) {
      await send(deps, `reveal-asked:${match.id}:${member.id}`, {
        kind: 'relay_post', matchId: match.id, memberId: otherId, raw: revealAsked(theirs.aliasForOther),
      })
    }
  }
  return { ok: true, result: 'waiting_for_other' }
})
