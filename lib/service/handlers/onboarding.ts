/** Consent, the interview, and the anonymous card. */
import { z } from 'zod'
import {
  EMPTY_PROFILE, countDiscoveriesSince, countInterestsSince, deleteMember, getCard, getDailyOpening, getProfile,
  listMatchesForMember, listPendingSignals, listRelayTopicsForMatch, recordConsent, saveCard, saveProfile, setMemberStatus,
} from '@/lib/db/repo'
import { deriveProfile, type DerivedProfile } from '@/lib/matching/derive'
import { dailyOpeningConsumesTurn } from '@/lib/matching/pick'
import { vnDate } from '@/lib/matching/privacy'
import type { MemberProfile } from '@/lib/matching/types'
import { SUMMARY_MAX_LENGTH, buildCard, summaryViolations, templateSummary } from '../cards'
import { confirmationRequired, consumeConfirmation } from '../confirmation'
import { CONSENT_TEXT, CONSENT_VERSION, MATCH_ENDED } from '../copy'
import { hasCurrentConsent } from '../consent'
import { INTEREST_DAILY_LIMIT, SEARCH_DAILY_LIMIT, nextVnDayStart, vnDayStart } from '../limits'
import { deliverAll, queue } from '../outbox'
import { ProfileUpdateArgs, applyProfileUpdate, missingFields, toMemberProfile } from '../profile'
import { defineTool, fail, type ToolContext } from '../tool'

const NoArgs = z.object({})

export const status = defineTool(NoArgs, async ({ deps: { db }, member, now }) => {
  const [profile, card, opening, searches, interests, signals, matches] = await Promise.all([
    getProfile(db, member.id),
    getCard(db, member.id),
    getDailyOpening(db, member.id, vnDate(now)),
    countDiscoveriesSince(db, member.id, 'search', vnDayStart(now)),
    countInterestsSince(db, member.id, vnDayStart(now)),
    listPendingSignals(db, member.id, now),
    listMatchesForMember(db, member.id),
  ])
  const draft = profile ?? EMPTY_PROFILE
  return {
    ok: true,
    opted_in: hasCurrentConsent(member),
    /** Present until she has agreed to this version; the persona shows it word for word. */
    consent: hasCurrentConsent(member) ? null : { version: CONSENT_VERSION, text: CONSENT_TEXT },
    paused: member.status === 'paused',
    missing: missingFields(draft),
    married_friendship_only: draft.marital === 'married' && draft.intent !== null && draft.intent !== 'friendship',
    card: !card ? 'none' : card.discoverable ? 'confirmed' : 'needs_confirmation',
    box_available: !dailyOpeningConsumesTurn(opening?.status),
    next_box_at: nextVnDayStart(now).toISOString(),
    search_results_left: Math.max(0, SEARCH_DAILY_LIMIT - searches),
    interests_left: Math.max(0, INTEREST_DAILY_LIMIT - interests),
    pending_signals: signals.length,
    open_matches: matches.filter((m) => m.state !== 'closed').length,
  }
})

const ConsentArgs = z.object({
  action: z.enum(['opt_in', 'pause', 'resume', 'delete']),
  /** She said she is 18 or older, as part of agreeing. */
  adult_confirmed: z.boolean().optional(),
  /** Fresh token returned by the service after it asks for confirmation. */
  confirmation_token: z.string().max(2048).optional(),
})

export const consent = defineTool(ConsentArgs, async (ctx, args) => {
  const { deps: { db }, member, now } = ctx
  switch (args.action) {
    case 'opt_in':
      if (args.adult_confirmed !== true) return fail('adult_required')
      await recordConsent(db, member.id, CONSENT_VERSION, now)
      return { ok: true, opted_in: true, consent_version: CONSENT_VERSION }
    case 'pause':
      await setMemberStatus(db, member.id, 'paused')
      return { ok: true, paused: true }
    case 'resume':
      if (!hasCurrentConsent(member)) return fail('consent_required')
      await setMemberStatus(db, member.id, 'active')
      return { ok: true, paused: false }
    case 'delete':
      if (!(await consumeConfirmation(ctx, args.confirmation_token, 'delete', 'member-data'))) {
        return await confirmationRequired(ctx, 'delete', 'member-data')
      }
      return deleteEverything(ctx)
  }
})

/** Deletes her rows (every table cascades), then tells each open match's other side the chat has ended. */
async function deleteEverything({ deps, member }: ToolContext) {
  const keys = await deps.db.transaction(async (db) => {
    const notices: Array<{ matchId: string; topicId: number }> = []
    for (const match of await listMatchesForMember(db, member.id)) {
      if (match.state === 'closed') continue
      for (const topic of await listRelayTopicsForMatch(db, match.id)) {
        if (topic.memberId !== member.id && topic.discourseTopicId) notices.push({ matchId: match.id, topicId: topic.discourseTopicId })
      }
    }
    await deleteMember(db, member.id)
    const keys: string[] = []
    for (const { matchId, topicId } of notices) {
      keys.push(await queue(db, `closed:${matchId}:deleted`, { kind: 'topic_post', as: 'relay', topicId, raw: MATCH_ENDED }, deps.now()))
    }
    return keys
  })
  await deliverAll(deps, keys)
  deps.log({ event: 'member_deleted', memberId: member.id })
  return { ok: true as const, deleted: true }
}

export const profileUpdate = defineTool(ProfileUpdateArgs, async ({ deps: { db }, member, now }, args) => {
  if (!hasCurrentConsent(member)) return fail('consent_required')
  const current = await getProfile(db, member.id)
  const applied = applyProfileUpdate(current ?? EMPTY_PROFILE, args, now)
  if (!applied.ok) return fail(applied.error)
  const derived = deriveProfile(applied.profile)
  const { cardUnconfirmed } = await saveProfile(db, member.id, applied.profile, derived)

  // A confirmed card follows answers that don't need re-confirming, such as hobbies or city.
  const card = await getCard(db, member.id)
  const complete = toMemberProfile(member.id, applied.profile)
  if (card?.confirmedAt && complete) {
    const fresh = await buildCard(db, member, { ...complete, ...derived }, card.summaryText, now, CONSENT_VERSION)
    await saveCard(db, member.id, fresh, card.summaryText, card.confirmedAt)
  }
  return {
    ok: true,
    missing: missingFields(applied.profile),
    card_needs_confirmation: cardUnconfirmed,
    age_range: { min: applied.profile.ageMin, max: applied.profile.ageMax },
  }
})

async function completeProfile({ deps: { db }, member }: ToolContext): Promise<{ profile: MemberProfile & DerivedProfile } | { missing: string[] }> {
  const profile = await getProfile(db, member.id)
  const complete = profile ? toMemberProfile(member.id, profile) : null
  return profile && complete ? { profile: { ...profile, ...complete } } : { missing: missingFields(profile ?? EMPTY_PROFILE) }
}

export const cardPreview = defineTool(NoArgs, async (ctx) => {
  const { deps: { db }, member, now } = ctx
  if (!hasCurrentConsent(member)) return fail('consent_required')
  const loaded = await completeProfile(ctx)
  if (!('profile' in loaded)) return fail('profile_incomplete', { missing: loaded.missing })
  const stored = await getCard(db, member.id)
  return {
    ok: true,
    card: await buildCard(db, member, loaded.profile, null, now, CONSENT_VERSION),
    template_summary: templateSummary(loaded.profile),
    current_summary: stored?.summaryText ?? null,
    confirmed: !!stored?.discoverable,
    summary_max_length: SUMMARY_MAX_LENGTH,
  }
})

const CardConfirmArgs = z.object({ summary_text: z.string().trim().min(10).max(SUMMARY_MAX_LENGTH) })

export const cardConfirm = defineTool(CardConfirmArgs, async (ctx, args) => {
  const { deps: { db }, member, now } = ctx
  if (!hasCurrentConsent(member)) return fail('consent_required')
  const loaded = await completeProfile(ctx)
  if (!('profile' in loaded)) return fail('profile_incomplete', { missing: loaded.missing })
  const violations = summaryViolations(args.summary_text, member, loaded.profile)
  if (violations.length > 0) return fail('summary_leaks', { violations })
  const card = await buildCard(db, member, loaded.profile, args.summary_text, now, CONSENT_VERSION)
  await saveCard(db, member.id, card, args.summary_text, now)
  return { ok: true, card, in_pool: member.status === 'active' }
})
