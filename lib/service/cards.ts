/**
 * The anonymous card: built deterministically from the private profile under
 * the rule of 5, with a summary the persona writes and the service checks.
 */
import type { Db } from '@/lib/db/db'
import { getCard, poolBuckets, type Member } from '@/lib/db/repo'
import { dayMasterLabel } from '@/lib/matching/bazi'
import { findContactDetails } from '@/lib/matching/contact'
import type { DerivedProfile } from '@/lib/matching/derive'
import { INTENT_LABELS, MIN_K_ANONYMITY, buildPoolCard, checkTextForLeaks, initialOf } from '@/lib/matching/privacy'
import type { MemberProfile, PoolCard } from '@/lib/matching/types'

export const SUMMARY_MAX_LENGTH = 400

/** Builds her card. Bucket counts include her, since the card is what she'll be in the pool with. */
export async function buildCard(
  db: Db,
  member: Member,
  profile: MemberProfile & DerivedProfile,
  summary: string | null,
  now: Date,
  currentConsentVersion?: string,
): Promise<PoolCard> {
  const [{ regions, initials }, stored] = await Promise.all([poolBuckets(db, currentConsentVersion), getCard(db, member.id)])
  const alreadyCounted = !!stored?.discoverable && member.status === 'active'
  const self = alreadyCounted ? 0 : 1
  const initial = initialOf(member.displayName)
  return buildPoolCard({
    profile,
    element: profile.napAmElement,
    dayMaster: dayMasterLabel({ stem: profile.dayStem!, branch: profile.dayBranch!, element: profile.dayElement! }),
    displayName: member.displayName,
    regionBucketSize: (profile.region ? regions.get(profile.region) ?? 0 : 0) + self,
    initialBucketSize: (initial ? initials.get(initial) ?? 0 : 0) + self,
    summary,
    isSample: member.isSample,
    at: now,
  })
}

type PoolBuckets = Awaited<ReturnType<typeof poolBuckets>>

/**
 * Removes optional identifiers from a stored card when its bucket no longer
 * reaches the rule-of-5. It never adds a newly eligible identifier: that
 * remains a card-confirmation concern.
 */
export function redactCardForCurrentPool(card: PoolCard, buckets: PoolBuckets): PoolCard {
  const initial = card.initial?.replace(/\.$/, '') ?? null
  return {
    ...card,
    region: card.region && (buckets.regions.get(card.region) ?? 0) < MIN_K_ANONYMITY ? null : card.region,
    initial: initial && (buckets.initials.get(initial) ?? 0) < MIN_K_ANONYMITY ? null : card.initial,
  }
}

/** Existing chat aliases also lose their optional initial when the pool shrinks. */
export function redactAliasForCurrentPool(alias: string, buckets: PoolBuckets): string {
  const initial = alias.match(/\s+(\p{L})\.$/u)?.[1]
  return initial && (buckets.initials.get(initial) ?? 0) < MIN_K_ANONYMITY
    ? alias.replace(/\s+\p{L}\.$/u, '') : alias
}

/** A plain starting point the persona can rewrite in her own voice. */
export function templateSummary(profile: MemberProfile): string {
  const hobbies = profile.hobbies.slice(0, 3).join(', ')
  return `${INTENT_LABELS[profile.intent]}. Lúc rảnh thích ${hobbies}.`
}

/**
 * Why a summary can't go on the card: Moon's leak check (dates, times, can-chi
 * pairs, her name, username, city and occupation) plus any contact detail.
 */
export function summaryViolations(summary: string, member: Member, profile: MemberProfile): string[] {
  const leaks = checkTextForLeaks(summary, [member.displayName, member.discourseUsername, profile.city, profile.occupation])
  const contacts = findContactDetails(summary).map((kind) => `contact:${kind}`)
  return [...new Set([...leaks.violations, ...contacts])]
}
