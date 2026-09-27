/**
 * Hard filters from the spec. A pair is considered only if every check
 * passes in BOTH directions; filters are never softened into scores.
 */
import type { Gender, Intent, MaritalStatus, PoolState, Seeking } from './types'

export interface FilterSubject {
  memberId: string
  intent: Intent
  gender: Gender
  seeking: Seeking
  age: number | null
  ageMin: number
  ageMax: number
  marital: MaritalStatus
  pool: PoolState
}

/** Pair keys for exclusions. Ordered pairs use "viewer>candidate", unordered use sorted "a|b". */
export interface Exclusions {
  /** Unordered pairs where either blocked the other. */
  blocked: ReadonlySet<string>
  /** Ordered pairs (viewer>candidate) the viewer has already been shown. */
  discovered: ReadonlySet<string>
  /** Unordered pairs with a declined interest in either direction (decline is final). */
  declined: ReadonlySet<string>
  /** Unordered pairs that already matched. */
  matched: ReadonlySet<string>
}

export const EMPTY_EXCLUSIONS: Exclusions = {
  blocked: new Set(), discovered: new Set(), declined: new Set(), matched: new Set(),
}

export function orderedKey(viewerId: string, candidateId: string): string {
  return `${viewerId}>${candidateId}`
}

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/** Married members get friendship introductions only (spec default; Thảo decides). */
export function effectiveIntent(subject: Pick<FilterSubject, 'intent' | 'marital'>): Intent {
  return subject.marital === 'married' ? 'friendship' : subject.intent
}

/** Friendship only with friendship, casual only with casual; long-term and marriage match each other. */
export function intentsCompatible(a: Intent, b: Intent): boolean {
  if (a === b) return true
  const serious = (i: Intent) => i === 'long_term' || i === 'marriage'
  return serious(a) && serious(b)
}

/** Whether someone seeking `seeking` accepts a person of `gender`. "Khác" only matches "Cả hai". */
export function seekingAccepts(seeking: Seeking, gender: Gender): boolean {
  if (seeking === 'both') return true
  if (gender === 'other') return false
  return seeking === gender
}

export type FilterFailure =
  | 'self' | 'unavailable' | 'underage' | 'intent' | 'gender' | 'age'
  | 'blocked' | 'already_discovered' | 'declined' | 'matched'

export type FilterResult = { ok: true } | { ok: false; reason: FilterFailure }

function available(pool: PoolState): boolean {
  return pool.discoverable && !pool.paused && !pool.deleted
}

function inRange(age: number | null, min: number, max: number): boolean {
  return age != null && age >= min && age <= max
}

export function hardFilter(viewer: FilterSubject, candidate: FilterSubject, exclusions: Exclusions = EMPTY_EXCLUSIONS): FilterResult {
  if (viewer.memberId === candidate.memberId) return { ok: false, reason: 'self' }
  if (!available(viewer.pool) || !available(candidate.pool)) return { ok: false, reason: 'unavailable' }
  if (viewer.age == null || candidate.age == null || viewer.age < 18 || candidate.age < 18) {
    return { ok: false, reason: 'underage' }
  }
  if (!intentsCompatible(effectiveIntent(viewer), effectiveIntent(candidate))) return { ok: false, reason: 'intent' }
  if (!seekingAccepts(viewer.seeking, candidate.gender) || !seekingAccepts(candidate.seeking, viewer.gender)) {
    return { ok: false, reason: 'gender' }
  }
  if (!inRange(candidate.age, viewer.ageMin, viewer.ageMax) || !inRange(viewer.age, candidate.ageMin, candidate.ageMax)) {
    return { ok: false, reason: 'age' }
  }
  const pair = pairKey(viewer.memberId, candidate.memberId)
  if (exclusions.blocked.has(pair)) return { ok: false, reason: 'blocked' }
  if (exclusions.declined.has(pair)) return { ok: false, reason: 'declined' }
  if (exclusions.matched.has(pair)) return { ok: false, reason: 'matched' }
  if (exclusions.discovered.has(orderedKey(viewer.memberId, candidate.memberId))) {
    return { ok: false, reason: 'already_discovered' }
  }
  return { ok: true }
}
