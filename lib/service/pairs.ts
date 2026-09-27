/**
 * Scoring a pair, and the facts about the fit that the persona may use.
 * Scores read both private profiles; the fit facts carry only what the other
 * person's card shows plus relationship labels (spec privacy rules 3 and 4),
 * so the persona can't leak what it is never given.
 */
import type { Member, PoolCandidate, StoredCard, StoredProfile } from '@/lib/db/repo'
import { DAY_PILLAR_SIGNAL_LABELS, dayPillarCompat, type DayPillar, type DayPillarSignal } from '@/lib/matching/bazi'
import type { DerivedProfile } from '@/lib/matching/derive'
import { effectiveIntent, hardFilter, type Exclusions, type FilterSubject } from '@/lib/matching/filters'
import { calculateAge } from '@/lib/matching/privacy'
import {
  TIER_LABELS, astrologyBlend, childrenFit, directionalScore, hobbyOverlap, mutualScore, openAnswerFit, regionFit,
  sharedHobbies, tierFor, type Tier,
} from '@/lib/matching/score'
import { TUOI_SIGNAL_LABELS, tuoiCompat, type Tuoi, type TuoiSignal } from '@/lib/matching/tuoi'
import type { MemberProfile, PoolCard } from '@/lib/matching/types'
import { toMemberProfile } from './profile'

/** One side of a pair: the private profile for scoring, and the card, which is all the other side may learn. */
export interface Party {
  memberId: string
  profile: MemberProfile & DerivedProfile
  card: PoolCard
  /** Active and discoverable. */
  available: boolean
  isSample: boolean
}

export function toParty(input: { memberId: string; profile: StoredProfile; card: PoolCard; available: boolean; isSample: boolean }): Party | null {
  const complete = toMemberProfile(input.memberId, input.profile)
  if (!complete || !input.profile.yearStem || !input.profile.dayStem) return null
  return { memberId: input.memberId, profile: { ...input.profile, ...complete }, card: input.card, available: input.available, isSample: input.isSample }
}

export function partyFromPool(row: PoolCandidate): Party | null {
  return toParty({ memberId: row.memberId, profile: row, card: row.card, available: true, isSample: row.isSample })
}

export function partyFromMember(member: Member, profile: StoredProfile | null, card: StoredCard | null): Party | null {
  if (!profile || !card) return null
  return toParty({
    memberId: member.id, profile, card: card.card, isSample: member.isSample,
    available: card.discoverable && member.status === 'active' && member.consentVersion !== null,
  })
}

function tuoiOf(p: Party): Tuoi {
  const d = p.profile
  return { lunarYear: d.lunarYear!, stem: d.yearStem!, branch: d.yearBranch!, napAm: { name: d.napAm!, element: d.napAmElement! } }
}

function dayPillarOf(p: Party): DayPillar {
  return { stem: p.profile.dayStem!, branch: p.profile.dayBranch!, element: p.profile.dayElement! }
}

export function filterSubject(p: Party, now: Date): FilterSubject {
  return {
    memberId: p.memberId,
    intent: p.profile.intent,
    gender: p.profile.gender,
    seeking: p.profile.seeking,
    age: calculateAge(p.profile.birthDate, now),
    ageMin: p.profile.ageMin,
    ageMax: p.profile.ageMax,
    marital: p.profile.marital,
    pool: { discoverable: p.available, paused: false, deleted: false },
  }
}

export interface PairScore {
  aToB: number
  bToA: number
  mutual: number
  tier: Tier | null
  tuoiSignals: TuoiSignal[]
  daySignals: DayPillarSignal[]
}

export function scorePair(a: Party, b: Party): PairScore {
  const tuoi = tuoiCompat(tuoiOf(a), tuoiOf(b))
  const day = dayPillarCompat(dayPillarOf(a), dayPillarOf(b))
  const shared = {
    hobbies: hobbyOverlap(a.profile.hobbies, b.profile.hobbies),
    astrology: astrologyBlend(tuoi.score, day.score),
    children: childrenFit({ ...a.profile, intent: effectiveIntent(a.profile) }, { ...b.profile, intent: effectiveIntent(b.profile) }),
    region: regionFit(a.profile.region, b.profile.region),
  }
  const aToB = directionalScore({ openAnswerFit: openAnswerFit(a.profile.openAnswer, b.card), ...shared }).total
  const bToA = directionalScore({ openAnswerFit: openAnswerFit(b.profile.openAnswer, a.card), ...shared }).total
  const mutual = mutualScore(aToB, bToA)
  return { aToB, bToA, mutual, tier: tierFor(mutual), tuoiSignals: tuoi.signals, daySignals: day.signals }
}

/** What the persona may say about the pair, from the viewer's side. */
export interface Fit {
  tier: Tier
  tier_label: string
  /** Their hobbies she shares, as their card shows them. */
  shared_hobbies: string[]
  /** Relationship labels only: never a stem, branch or year. */
  astrology: string[]
  /** null when their card hides the region (rule of 5). */
  same_region: boolean | null
}

export function fitFor(viewer: Party, candidate: Party, score: PairScore): Fit {
  const tier = score.tier ?? 'hop'
  return {
    tier,
    tier_label: TIER_LABELS[tier],
    shared_hobbies: sharedHobbies(viewer.profile.hobbies, candidate.card.hobbies),
    astrology: [
      ...score.tuoiSignals.map((s) => TUOI_SIGNAL_LABELS[s]),
      ...score.daySignals.map((s) => DAY_PILLAR_SIGNAL_LABELS[s]),
    ],
    same_region: candidate.card.region ? candidate.card.region === viewer.profile.region : null,
  }
}

/**
 * A search's keywords count as her interests while scoring that search.
 * Otherwise someone matching exactly what she asked for could fall below the
 * threshold on her usual hobbies alone.
 */
export function withInterests(p: Party, keywords: string[]): Party {
  if (keywords.length === 0) return p
  const openAnswer = [p.profile.openAnswer, keywords.join(', ')].filter(Boolean).join('. ')
  return { ...p, profile: { ...p.profile, hobbies: [...p.profile.hobbies, ...keywords], openAnswer } }
}

export interface Ranked {
  candidate: Party
  score: PairScore
}

/** Candidates who pass every hard filter both ways and clear the threshold, best first. */
export function rankCandidates(viewer: Party, pool: Party[], exclusions: Exclusions, now: Date): Ranked[] {
  const me = filterSubject(viewer, now)
  return pool
    .filter((c) => hardFilter(me, filterSubject(c, now), exclusions).ok)
    .map((candidate) => ({ candidate, score: scorePair(viewer, candidate) }))
    .filter((r) => r.score.tier !== null)
    .sort((x, y) => y.score.mutual - x.score.mutual)
}
