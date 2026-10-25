/** Daily limits (spec: safety) and the Vietnam calendar day they reset on. */
import { vnDate } from '@/lib/matching/privacy'

/** Search results (not calls) per Vietnam day; each search returns up to SEARCH_RESULTS_MAX. */
export const SEARCH_DAILY_LIMIT = 6
export const SEARCH_RESULTS_MAX = 3
export const INTEREST_DAILY_LIMIT = 5

// Vietnam has no daylight saving time, so the offset is fixed.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** The instant the Vietnam calendar day containing `at` began. */
export function vnDayStart(at: Date): Date {
  const [y, m, d] = vnDate(at).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) - VN_OFFSET_MS)
}

export function nextVnDayStart(at: Date): Date {
  return new Date(vnDayStart(at).getTime() + DAY_MS)
}
