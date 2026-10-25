/**
 * The Duyên box pick and the daily-turn rule, ported from Moon
 * (lib/nhan-duyen/matching.ts and daily.ts): a weighted random choice above
 * the threshold, so stronger pairs are likelier but not always chosen.
 */
import { THRESHOLD } from './score'

export interface ScoredCandidate<T> {
  item: T
  aToB: number
  bToA: number
}

export function candidateWeight(candidate: Pick<ScoredCandidate<unknown>, 'aToB' | 'bToA'>, threshold = THRESHOLD): number {
  const score = Math.min(candidate.aToB, candidate.bToA)
  if (score < threshold) return 0
  return Math.max(1, score - threshold + 1)
}

export function pickWeighted<T>(
  candidates: Array<ScoredCandidate<T>>,
  threshold = THRESHOLD,
  random: () => number = Math.random,
): ScoredCandidate<T> | null {
  const weighted = candidates
    .map((candidate) => ({ candidate, weight: candidateWeight(candidate, threshold) }))
    .filter((entry) => entry.weight > 0)
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0)
  if (total <= 0) return null
  let cursor = random() * total
  for (const entry of weighted) {
    cursor -= entry.weight
    if (cursor <= 0) return entry.candidate
  }
  return weighted[weighted.length - 1]?.candidate ?? null
}

export type DailyOpeningStatus = 'pending' | 'matched' | 'no_match' | 'void'

/** One box per Vietnam calendar day; a no_match still uses the turn (Moon's rule). */
export function dailyOpeningConsumesTurn(status: string | null | undefined): boolean {
  return status === 'pending' || status === 'matched' || status === 'no_match'
}
