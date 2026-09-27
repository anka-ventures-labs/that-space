/** Interest signals: sending one, reading inbound ones, and answering. */
import { z } from 'zod'
import {
  countInterestsSince, createInterest, getCard, getDiscoveryForViewer, getMember, getProfile, listPendingSignals,
  loadExclusions, respondToSignal,
} from '@/lib/db/repo'
import { pairKey } from '@/lib/matching/filters'
import { checkTextForLeaks } from '@/lib/matching/privacy'
import { SIGNAL_CLOSED, SIGNAL_RECEIVED } from '../copy'
import { INTEREST_DAILY_LIMIT, vnDayStart } from '../limits'
import { send } from '../outbox'
import { fitFor, partyFromMember, scorePair } from '../pairs'
import { defineTool, fail } from '../tool'
import { poolReadyViewer } from './discovery'
import { openMatch } from './matches'

const InterestArgs = z.object({ discovery_id: z.uuid() })

export const interest = defineTool(InterestArgs, async (ctx, args) => {
  const { deps, member, now } = ctx
  const { db } = deps
  const ready = await poolReadyViewer(ctx)
  if ('failure' in ready) return ready.failure
  const sender = ready.viewer

  const discovery = await getDiscoveryForViewer(db, args.discovery_id, member.id)
  if (!discovery) return fail('not_found')
  if (discovery.status === 'void') return fail('stale')
  if (discovery.status === 'matched') return { ok: true, result: 'already_matched' }
  const candidate = await getMember(db, discovery.candidateId)
  if (!candidate) return fail('gone')
  if (candidate.isSample) return { ok: true, result: 'sample' }
  // Repeating a yes already sent doesn't count against the day's limit.
  if (discovery.status === 'active' && (await countInterestsSince(db, member.id, vnDayStart(now))) >= INTEREST_DAILY_LIMIT) {
    return fail('daily_limit', { interests_left: 0 })
  }

  const [profile, card, exclusions] = await Promise.all([
    getProfile(db, candidate.id), getCard(db, candidate.id), loadExclusions(db, member.id),
  ])
  const recipient = partyFromMember(candidate, profile, card)
  if (!recipient?.available || exclusions.blocked.has(pairKey(member.id, candidate.id))) return fail('gone')

  // The recipient's view: the sender's card and how the two fit, seen from her side.
  const payload = { card: sender.card, fit: fitFor(recipient, sender, scorePair(recipient, sender)) }
  const leaks = checkTextForLeaks(JSON.stringify(payload), [
    member.displayName, member.discourseUsername, sender.profile.city, sender.profile.occupation,
    sender.profile.birthDate, sender.profile.birthTime,
  ])
  if (!leaks.ok) {
    deps.log({ event: 'recipient_payload_leak', requestId: ctx.requestId, sender: member.id, violations: leaks.violations })
    return fail('internal')
  }

  const result = await createInterest(db, { discoveryId: discovery.id, fromId: member.id, toId: candidate.id, recipientPayload: payload, now })
  if (result.match) {
    await openMatch(ctx, result.match)
    return { ok: true, result: 'matched' }
  }
  if (result.created) {
    await send(deps, `signal:${result.interest.id}`, { kind: 'persona_notice', memberId: candidate.id, raw: SIGNAL_RECEIVED })
  }
  return { ok: true, result: result.created ? 'sent' : 'already_sent' }
})

export const signals = defineTool(z.object({}), async ({ deps: { db }, member, now }) => {
  if (!member.consentVersion) return fail('consent_required')
  const pending = await listPendingSignals(db, member.id, now)
  return {
    ok: true,
    signals: pending.map((s) => ({ signal_id: s.id, card: s.recipientPayload.card, fit: s.recipientPayload.fit, expires_at: s.expiresAt })),
  }
})

const RespondArgs = z.object({ signal_id: z.uuid(), response: z.enum(['accept', 'decline', 'dismiss']) })

export const signalRespond = defineTool(RespondArgs, async (ctx, args) => {
  const { deps, member, now } = ctx
  if (!member.consentVersion) return fail('consent_required')
  const result = await respondToSignal(deps.db, { interestId: args.signal_id, recipientId: member.id, response: args.response, now })
  if (!result.ok) return fail(result.error === 'not_pending' ? 'already_answered' : result.error)
  if (result.match) {
    await openMatch(ctx, result.match)
    return { ok: true, result: 'matched' }
  }
  // The sender only ever hears "chưa có duyên", whether declined or let go.
  await send(deps, `signal-closed:${result.interest.id}`, { kind: 'persona_notice', memberId: result.interest.fromId, raw: SIGNAL_CLOSED })
  return { ok: true, result: args.response === 'decline' ? 'declined' : 'dismissed' }
})
