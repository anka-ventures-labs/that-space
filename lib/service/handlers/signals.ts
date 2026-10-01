/** Interest signals: sending one, reading inbound ones, and answering. */
import { z } from 'zod'
import {
  countInterestsSince, createInterest, getCard, getDiscoveryForViewer, getMember, getProfile, listPendingSignals, poolBuckets,
  loadExclusions, lockMemberQuota, respondToSignal,
} from '@/lib/db/repo'
import { pairKey } from '@/lib/matching/filters'
import { checkTextForLeaks } from '@/lib/matching/privacy'
import type { PoolCard } from '@/lib/matching/types'
import { redactCardForCurrentPool } from '../cards'
import { CONSENT_VERSION, SIGNAL_CLOSED, SIGNAL_RECEIVED } from '../copy'
import { hasCurrentConsent } from '../consent'
import { INTEREST_DAILY_LIMIT, vnDayStart } from '../limits'
import { deliverAll, queue } from '../outbox'
import { fitFor, partyFromMember, scorePair } from '../pairs'
import { defineTool, fail } from '../tool'
import { poolReadyViewer } from './discovery'
import { queueMatch } from './matches'

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

  const [profile, card, exclusions, buckets] = await Promise.all([
    getProfile(db, candidate.id), getCard(db, candidate.id), loadExclusions(db, member.id), poolBuckets(db, CONSENT_VERSION),
  ])
  const recipient = partyFromMember(candidate, profile, card, CONSENT_VERSION)
  if (!recipient?.available || exclusions.blocked.has(pairKey(member.id, candidate.id))) return fail('gone')

  // The recipient's view: the sender's card and how the two fit, seen from her side.
  const visibleSender = { ...sender, card: redactCardForCurrentPool(sender.card, buckets) }
  const payload = { card: visibleSender.card, fit: fitFor(recipient, visibleSender, scorePair(recipient, sender)) }
  const leaks = checkTextForLeaks(JSON.stringify(payload), [
    member.displayName, member.discourseUsername, sender.profile.city, sender.profile.occupation,
    sender.profile.birthDate, sender.profile.birthTime,
  ])
  if (!leaks.ok) {
    deps.log({ event: 'recipient_payload_leak', requestId: ctx.requestId, sender: member.id, violations: leaks.violations })
    return fail('internal')
  }

  const keys: string[] = []
  const result = await db.transaction(async (tx) => {
    await lockMemberQuota(tx, member.id)
    // Refresh under the quota lock: a repeated yes never spends another turn.
    const current = await getDiscoveryForViewer(tx, discovery.id, member.id)
    if (current?.status === 'active' && (await countInterestsSince(tx, member.id, vnDayStart(now))) >= INTEREST_DAILY_LIMIT) return null
    const result = await createInterest(tx, { discoveryId: discovery.id, fromId: member.id, toId: candidate.id, recipientPayload: payload, now })
    if (result.match) keys.push(...await queueMatch({ deps: { ...deps, db: tx }, now }, result.match))
    else if (result.created) keys.push(await queue(tx, `signal:${result.interest.id}`, { kind: 'persona_notice', memberId: candidate.id, raw: SIGNAL_RECEIVED }, now))
    return result
  })
  if (!result) return fail('daily_limit', { interests_left: 0 })
  await deliverAll(deps, keys)
  if (result.match) return { ok: true, result: 'matched' }
  return { ok: true, result: result.created ? 'sent' : 'already_sent' }
})

export const signals = defineTool(z.object({}), async ({ deps: { db }, member, now }) => {
  if (!hasCurrentConsent(member)) return fail('consent_required')
  const [pending, buckets] = await Promise.all([listPendingSignals(db, member.id, now), poolBuckets(db, CONSENT_VERSION)])
  return {
    ok: true,
    signals: pending.map((s) => {
      const payload = s.recipientPayload as { card: PoolCard; fit: { same_region: boolean | null } }
      const card = redactCardForCurrentPool(payload.card, buckets)
      return {
        signal_id: s.id,
        card,
        fit: card.region ? payload.fit : { ...payload.fit, same_region: null },
        expires_at: s.expiresAt,
      }
    }),
  }
})

const RespondArgs = z.object({ signal_id: z.uuid(), response: z.enum(['accept', 'decline', 'dismiss']) })

export const signalRespond = defineTool(RespondArgs, async (ctx, args) => {
  const { deps, member, now } = ctx
  if (!hasCurrentConsent(member)) return fail('consent_required')
  const keys: string[] = []
  const result = await deps.db.transaction(async (tx) => {
    const result = await respondToSignal(tx, { interestId: args.signal_id, recipientId: member.id, response: args.response, now })
    if (!result.ok) return result
    if (result.match) keys.push(...await queueMatch({ deps: { ...deps, db: tx }, now }, result.match))
    else keys.push(await queue(tx, `signal-closed:${result.interest.id}`, { kind: 'persona_notice', memberId: result.interest.fromId, raw: SIGNAL_CLOSED }, now))
    return result
  })
  await deliverAll(deps, keys)
  if (!result.ok) return fail(result.error === 'not_pending' ? 'already_answered' : result.error)
  if (result.match) {
    return { ok: true, result: 'matched' }
  }
  // The sender only ever hears "chưa có duyên", whether declined or let go.
  return { ok: true, result: args.response === 'decline' ? 'declined' : 'dismissed' }
})
