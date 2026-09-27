/**
 * Directional compatibility scores (0..100). A→B and B→A differ because
 * preferences differ; the mutual score is the lower of the two (Moon's rule),
 * and a pair must clear THRESHOLD in both directions.
 */
import type { Children, Intent, PoolCard, Region, WantsChildren } from './types'

/** Beta constants; scores are logged server-side for tuning later. */
export const WEIGHTS = {
  openAnswer: 25,
  hobbies: 25,
  astrology: 20,
  children: 15,
  region: 15,
} as const

export const THRESHOLD = 50

export type Tier = 'hop' | 'rat_hop' | 'hiem_co'

/** Members see a tier label, never a number. */
export const TIER_LABELS: Record<Tier, string> = {
  hop: 'Hợp',
  rat_hop: 'Rất hợp',
  hiem_co: 'Hiếm có',
}

export function tierFor(mutual: number, threshold = THRESHOLD): Tier | null {
  if (mutual < threshold) return null
  if (mutual >= 80) return 'hiem_co'
  if (mutual >= 65) return 'rat_hop'
  return 'hop'
}

/** Lowercase, accents folded, đ as d: for comparing Vietnamese words typed with or without diacritics. */
export function foldText(value: string): string {
  return value.trim().toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
}

/** Overlap relative to the smaller list, 0..1. Empty lists are neutral (0.5). */
export function hobbyOverlap(a: string[], b: string[]): number {
  const sa = new Set(a.map(foldText).filter(Boolean))
  const sb = new Set(b.map(foldText).filter(Boolean))
  if (sa.size === 0 || sb.size === 0) return 0.5
  let shared = 0
  for (const h of sa) if (sb.has(h)) shared++
  return shared / Math.min(sa.size, sb.size)
}

/** Their hobbies that she shares, as written on their card. */
export function sharedHobbies(mine: string[], theirs: string[]): string[] {
  const own = new Set(mine.map(foldText))
  return theirs.filter((h) => own.has(foldText(h)))
}

function asWords(value: string): string {
  return ` ${foldText(value).replace(/[^a-z0-9]+/g, ' ').trim()} `
}

/** Whether `text` contains `phrase` as whole words, ignoring case and accents. */
export function mentionsPhrase(text: string, phrase: string): boolean {
  const needle = asWords(phrase)
  return needle.trim().length > 0 && asWords(text).includes(needle)
}

/**
 * How well another person's card answers her open answer, 0..1. The service
 * never calls a model, so this is the spec's keyword fallback: each hobby on
 * their card that her answer mentions counts. No answer is neutral (0.5); an
 * answer their card doesn't touch scores a little lower (0.4).
 */
export function openAnswerFit(answer: string | null | undefined, card: Pick<PoolCard, 'hobbies'>): number {
  const text = answer ? asWords(answer) : ''
  if (!text.trim()) return 0.5
  const hits = card.hobbies.map(asWords).filter((phrase) => phrase.trim().length >= 3 && text.includes(phrase)).length
  return hits === 0 ? 0.4 : Math.min(1, 0.6 + 0.2 * hits)
}

export interface ChildrenInfo {
  intent: Intent
  children: Children
  wantsChildren?: WantsChildren | null
}

/** Only for long-term and marriage on both sides; otherwise not applicable (null). */
export function childrenFit(a: ChildrenInfo, b: ChildrenInfo): number | null {
  const serious = (i: Intent) => i === 'long_term' || i === 'marriage'
  if (!serious(a.intent) || !serious(b.intent)) return null
  const wa = a.wantsChildren ?? 'unsure'
  const wb = b.wantsChildren ?? 'unsure'
  if (wa === 'unsure' || wb === 'unsure') return 0.5
  return wa === wb ? 1 : 0
}

export function regionFit(a: Region | null, b: Region | null): number {
  if (!a || !b || a === 'Việt Nam' || b === 'Việt Nam') return 0.5
  return a === b ? 1 : 0
}

export interface DirectionalInputs {
  /** How well the other person's card fits this person's open answer, 0..1. */
  openAnswerFit: number
  hobbies: number
  /** Symmetric astrology score, 0..1 (tuổi and nhật trụ, or Moon's full score later). */
  astrology: number
  children: number | null
  region: number
}

export interface DirectionalScore {
  total: number
  parts: Record<keyof typeof WEIGHTS, number | null>
}

/** Weighted 0..100; a non-applicable component's weight is spread over the rest. */
export function directionalScore(inputs: DirectionalInputs): DirectionalScore {
  const parts: DirectionalScore['parts'] = {
    openAnswer: clamp01(inputs.openAnswerFit),
    hobbies: clamp01(inputs.hobbies),
    astrology: clamp01(inputs.astrology),
    children: inputs.children == null ? null : clamp01(inputs.children),
    region: clamp01(inputs.region),
  }
  let weighted = 0
  let weightSum = 0
  for (const key of Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>) {
    const value = parts[key]
    if (value == null) continue
    weighted += WEIGHTS[key] * value
    weightSum += WEIGHTS[key]
  }
  const total = weightSum === 0 ? 0 : Math.round((weighted / weightSum) * 1000) / 10
  return { total, parts }
}

export function mutualScore(aToB: number, bToA: number): number {
  return Math.min(aToB, bToA)
}

/** Astrology blend: tuổi (year pillar) and nhật trụ (day pillar), equally weighted. */
export function astrologyBlend(tuoi: number, dayPillar: number): number {
  return clamp01((tuoi + dayPillar) / 2)
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
}
