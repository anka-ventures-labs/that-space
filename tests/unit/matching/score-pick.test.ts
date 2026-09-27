import { describe, expect, it } from 'vitest'
import {
  THRESHOLD, TIER_LABELS, WEIGHTS, astrologyBlend, childrenFit, directionalScore, hobbyOverlap,
  mutualScore, regionFit, tierFor,
} from '@/lib/matching/score'
import { candidateWeight, dailyOpeningConsumesTurn, pickWeighted } from '@/lib/matching/pick'

describe('directional scores', () => {
  it('weights parts and spreads a missing part across the rest', () => {
    const full = directionalScore({ openAnswerFit: 1, hobbies: 1, astrology: 1, children: 1, region: 1 })
    expect(full.total).toBe(100)
    const noChildren = directionalScore({ openAnswerFit: 1, hobbies: 1, astrology: 1, children: null, region: 1 })
    expect(noChildren.total).toBe(100)
    const half = directionalScore({ openAnswerFit: 0.5, hobbies: 0.5, astrology: 0.5, children: 0.5, region: 0.5 })
    expect(half.total).toBe(50)
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100)
  })

  it('uses the lower direction as the mutual score (Moon)', () => {
    expect(mutualScore(80, 45)).toBe(45)
  })

  it('shows tiers, never numbers', () => {
    expect(tierFor(THRESHOLD - 1)).toBeNull()
    expect(tierFor(THRESHOLD)).toBe('hop')
    expect(tierFor(70)).toBe('rat_hop')
    expect(tierFor(85)).toBe('hiem_co')
    expect(Object.values(TIER_LABELS).join(' ')).not.toMatch(/\d/)
  })

  it('compares hobbies without accents and treats empty lists as neutral', () => {
    expect(hobbyOverlap(['Đọc sách', 'Yoga'], ['doc sach', 'Leo núi'])).toBe(0.5)
    expect(hobbyOverlap([], ['Yoga'])).toBe(0.5)
  })

  it('scores children plans only for serious intents', () => {
    expect(childrenFit({ intent: 'casual', children: 'none' }, { intent: 'casual', children: 'none' })).toBeNull()
    expect(childrenFit({ intent: 'marriage', children: 'none', wantsChildren: 'yes' }, { intent: 'long_term', children: 'none', wantsChildren: 'no' })).toBe(0)
    expect(childrenFit({ intent: 'marriage', children: 'none', wantsChildren: 'yes' }, { intent: 'marriage', children: 'none', wantsChildren: 'unsure' })).toBe(0.5)
  })

  it('treats unknown regions as neutral and blends astrology', () => {
    expect(regionFit('miền Bắc', 'miền Bắc')).toBe(1)
    expect(regionFit('miền Bắc', null)).toBe(0.5)
    expect(astrologyBlend(1, 0)).toBe(0.5)
  })
})

describe('Duyên box pick (Moon)', () => {
  it('gives zero weight below the threshold and grows above it', () => {
    expect(candidateWeight({ aToB: THRESHOLD - 1, bToA: 90 })).toBe(0)
    expect(candidateWeight({ aToB: THRESHOLD, bToA: THRESHOLD })).toBe(1)
    expect(candidateWeight({ aToB: THRESHOLD + 9, bToA: 90 })).toBe(10)
  })

  it('is weighted, not always the best', () => {
    const candidates = [
      { item: 'threshold', aToB: THRESHOLD, bToA: THRESHOLD },
      { item: 'strong', aToB: THRESHOLD + 10, bToA: THRESHOLD + 10 },
    ]
    expect(pickWeighted(candidates, THRESHOLD, () => 0)?.item).toBe('threshold')
    expect(pickWeighted(candidates, THRESHOLD, () => 0.99)?.item).toBe('strong')
    let seed = 42
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const counts = { threshold: 0, strong: 0 }
    for (let i = 0; i < 2000; i++) counts[pickWeighted(candidates, THRESHOLD, rng)!.item as 'threshold' | 'strong']++
    expect(counts.strong).toBeGreaterThan(counts.threshold * 5)
    expect(counts.threshold).toBeGreaterThan(0)
  })

  it('returns null when nobody qualifies', () => {
    expect(pickWeighted([{ item: 'x', aToB: 90, bToA: THRESHOLD - 1 }])).toBeNull()
    expect(pickWeighted([])).toBeNull()
  })

  it('uses up the daily turn even on no_match', () => {
    expect(dailyOpeningConsumesTurn('pending')).toBe(true)
    expect(dailyOpeningConsumesTurn('matched')).toBe(true)
    expect(dailyOpeningConsumesTurn('no_match')).toBe(true)
    expect(dailyOpeningConsumesTurn('void')).toBe(false)
    expect(dailyOpeningConsumesTurn(null)).toBe(false)
  })
})
