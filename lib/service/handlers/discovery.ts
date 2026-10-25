/** The Duyên box and "ask Bà Mối" search. */
import { z } from 'zod'
import {
  EMPTY_PROFILE, claimDailyOpening, countDiscoveriesSince, finishDailyOpening, getCard, getProfile, insertDiscovery, listPool, poolBuckets,
  loadExclusions, lockMemberQuota, type Discovery, type DiscoverySource,
} from '@/lib/db/repo'
import { pickWeighted } from '@/lib/matching/pick'
import { vnDate } from '@/lib/matching/privacy'
import { THRESHOLD, mentionsPhrase } from '@/lib/matching/score'
import type { PoolCard } from '@/lib/matching/types'
import { redactCardForCurrentPool } from '../cards'
import { CONSENT_VERSION } from '../copy'
import { hasCurrentConsent } from '../consent'
import { SEARCH_DAILY_LIMIT, SEARCH_RESULTS_MAX, nextVnDayStart, vnDayStart } from '../limits'
import { fitFor, partyFromMember, partyFromPool, rankCandidates, withInterests, type Party, type Ranked } from '../pairs'
import { missingFields } from '../profile'
import { defineTool, fail, type ToolContext, type ToolFailure } from '../tool'

/** The member as a pool party, or why she can't use the pool yet. */
export async function poolReadyViewer(ctx: ToolContext): Promise<{ viewer: Party } | { failure: ToolFailure }> {
  const { deps: { db }, member } = ctx
  if (!hasCurrentConsent(member)) return { failure: fail('consent_required') }
  if (member.status === 'paused') return { failure: fail('paused') }
  const [profile, card] = await Promise.all([getProfile(db, member.id), getCard(db, member.id)])
  const missing = missingFields(profile ?? EMPTY_PROFILE)
  if (!profile || missing.length > 0) return { failure: fail('profile_incomplete', { missing }) }
  if (!card?.discoverable) return { failure: fail('card_unconfirmed') }
  const viewer = partyFromMember(member, profile, card, CONSENT_VERSION)
  return viewer ? { viewer } : { failure: fail('profile_incomplete', { missing }) }
}

type PoolBuckets = Awaited<ReturnType<typeof poolBuckets>>

async function rankedPool(ctx: ToolContext, viewer: Party, buckets: PoolBuckets): Promise<Ranked[]> {
  const { deps: { db }, member, now } = ctx
  const [pool, exclusions] = await Promise.all([listPool(db, member.id, 1000, CONSENT_VERSION), loadExclusions(db, member.id)])
  const parties = pool.map(partyFromPool).filter((p): p is Party => p !== null)
    .map((party) => ({ ...party, card: redactCardForCurrentPool(party.card, buckets) }))
  return rankCandidates(viewer, parties, exclusions, now)
}

async function recordDiscovery(ctx: ToolContext, viewer: Party, ranked: Ranked, source: DiscoverySource): Promise<Discovery | null> {
  const { candidate, score } = ranked
  const discovery = await insertDiscovery(ctx.deps.db, {
    viewerId: viewer.memberId,
    candidateId: candidate.memberId,
    source,
    aToB: score.aToB,
    bToA: score.bToA,
    mutual: score.mutual,
    tier: score.tier!,
    cardSnapshot: candidate.card,
    fit: { ...fitFor(viewer, candidate, score) },
  })
  // Scores are logged for tuning the weights later; ids only.
  ctx.deps.log({
    event: 'discovery', requestId: ctx.requestId, source, viewer: viewer.memberId, candidate: candidate.memberId,
    aToB: score.aToB, bToA: score.bToA, mutual: score.mutual, sample: candidate.isSample, recorded: discovery !== null,
  })
  return discovery
}

/** What the persona gets for one introduction: the card as shown, and the fit from her side. */
function present(discovery: Discovery, buckets: PoolBuckets) {
  const card = redactCardForCurrentPool(discovery.cardSnapshot, buckets)
  return {
    discovery_id: discovery.id,
    card,
    fit: card.region ? discovery.fit : { ...discovery.fit, same_region: null },
    is_sample: card.isSample === true,
  }
}

export const boxOpen = defineTool(z.object({}), async (ctx) => {
  const { deps: { db, random }, member, now } = ctx
  const ready = await poolReadyViewer(ctx)
  if ('failure' in ready) return ready.failure
  const openDay = vnDate(now)
  const nextAt = nextVnDayStart(now).toISOString()
  if (!(await claimDailyOpening(db, member.id, openDay))) return { ok: true, result: 'cooldown', next_box_at: nextAt }

  try {
    const buckets = await poolBuckets(db, CONSENT_VERSION)
    const ranked = await rankedPool(ctx, ready.viewer, buckets)
    const pick = pickWeighted(ranked.map((r) => ({ item: r, aToB: r.score.aToB, bToA: r.score.bToA })), THRESHOLD, random)
    const discovery = pick ? await recordDiscovery(ctx, ready.viewer, pick.item, 'box') : null
    if (!discovery) {
      await finishDailyOpening(db, member.id, openDay, 'no_match', null) // a no-match still uses the day's turn
      return { ok: true, result: 'no_match', next_box_at: nextAt }
    }
    await finishDailyOpening(db, member.id, openDay, 'matched', discovery.id)
    return { ok: true, result: 'match', next_box_at: nextAt, introduction: present(discovery, buckets) }
  } catch (error) {
    // Don't take her turn for our failure.
    await finishDailyOpening(db, member.id, openDay, 'void', null).catch(() => {})
    throw error
  }
})

/** Criteria use only what cards show, so a search can't reveal anything a card hides. */
const SearchArgs = z.object({
  /** Words or phrases to find in a card's hobbies or summary, e.g. "leo núi". Any one matches. */
  keywords: z.array(z.string().trim().min(2).max(40)).max(5).optional(),
  region: z.enum(['miền Bắc', 'miền Trung', 'miền Nam']).optional(),
  age_min: z.number().int().min(18).max(100).optional(),
  age_max: z.number().int().min(18).max(100).optional(),
  element: z.enum(['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ']).optional(),
})

type SearchCriteria = z.output<typeof SearchArgs>

function bandRange(band: string | null): [number, number] | null {
  if (!band) return null
  if (band.endsWith('+')) return [Number.parseInt(band, 10), 200]
  const [low, high] = band.split('-').map(Number)
  return Number.isFinite(low) && Number.isFinite(high) ? [low, high] : null
}

export function cardMatches(card: PoolCard, c: SearchCriteria): boolean {
  if (c.region && card.region !== c.region) return false
  if (c.element && card.element !== c.element) return false
  if (c.age_min !== undefined || c.age_max !== undefined) {
    const range = bandRange(card.ageBand)
    if (!range || range[1] < (c.age_min ?? 0) || range[0] > (c.age_max ?? 200)) return false
  }
  if (c.keywords?.length) {
    const text = [...card.hobbies, card.summary ?? ''].join(' · ')
    if (!c.keywords.some((k) => mentionsPhrase(text, k))) return false
  }
  return true
}

export const search = defineTool(SearchArgs, (ctx, criteria) => ctx.deps.db.transaction(async (db) => {
  await lockMemberQuota(db, ctx.member.id)
  ctx = { ...ctx, deps: { ...ctx.deps, db } }
  const { member, now } = ctx
  const ready = await poolReadyViewer(ctx)
  if ('failure' in ready) return ready.failure
  const left = SEARCH_DAILY_LIMIT - (await countDiscoveriesSince(db, member.id, 'search', vnDayStart(now)))
  if (left <= 0) return fail('daily_limit', { search_results_left: 0 })

  const seeker = withInterests(ready.viewer, criteria.keywords ?? [])
  const buckets = await poolBuckets(db, CONSENT_VERSION)
  const matches = (await rankedPool(ctx, seeker, buckets)).filter((r) => cardMatches(r.candidate.card, criteria))
  const results = []
  for (const ranked of matches.slice(0, Math.min(SEARCH_RESULTS_MAX, left))) {
    const discovery = await recordDiscovery(ctx, seeker, ranked, 'search')
    if (discovery) results.push(present(discovery, buckets))
  }
  return { ok: true, results, search_results_left: left - results.length }
}))
