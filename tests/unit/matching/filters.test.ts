import { describe, expect, it } from 'vitest'
import {
  EMPTY_EXCLUSIONS, effectiveIntent, hardFilter, intentsCompatible, orderedKey, pairKey, seekingAccepts,
  type FilterSubject,
} from '@/lib/matching/filters'
import type { Gender, Intent, MaritalStatus, Seeking } from '@/lib/matching/types'

const INTENTS: Intent[] = ['friendship', 'casual', 'long_term', 'marriage']
const GENDERS: Gender[] = ['female', 'male', 'other']
const SEEKINGS: Seeking[] = ['female', 'male', 'both']
const MARITAL: MaritalStatus[] = ['single', 'divorced', 'widowed', 'married']

function subject(id: string, over: Partial<FilterSubject> = {}): FilterSubject {
  return {
    memberId: id, intent: 'long_term', gender: 'female', seeking: 'male', age: 30, ageMin: 25, ageMax: 40,
    marital: 'single', pool: { discoverable: true, paused: false, deleted: false }, ...over,
  }
}

describe('intent matrix', () => {
  it('matches like with like, and long-term with marriage', () => {
    expect(intentsCompatible('friendship', 'friendship')).toBe(true)
    expect(intentsCompatible('casual', 'casual')).toBe(true)
    expect(intentsCompatible('long_term', 'marriage')).toBe(true)
    expect(intentsCompatible('marriage', 'long_term')).toBe(true)
    expect(intentsCompatible('friendship', 'marriage')).toBe(false)
    expect(intentsCompatible('casual', 'long_term')).toBe(false)
  })

  it('treats married members as friendship-only', () => {
    expect(effectiveIntent({ intent: 'marriage', marital: 'married' })).toBe('friendship')
    expect(effectiveIntent({ intent: 'casual', marital: 'divorced' })).toBe('casual')
  })
})

describe('gender preference', () => {
  it('lets "Khác" match only people seeking both', () => {
    expect(seekingAccepts('both', 'other')).toBe(true)
    expect(seekingAccepts('female', 'other')).toBe(false)
    expect(seekingAccepts('male', 'male')).toBe(true)
  })
})

describe('hardFilter never passes an incompatible pair, in either direction', () => {
  it('holds over every intent, gender, seeking and marital combination', () => {
    let passes = 0
    for (const ia of INTENTS) for (const ib of INTENTS)
      for (const ga of GENDERS) for (const gb of GENDERS)
        for (const sa of SEEKINGS) for (const sb of SEEKINGS)
          for (const ma of MARITAL) for (const mb of MARITAL) {
            const a = subject('a', { intent: ia, gender: ga, seeking: sa, marital: ma })
            const b = subject('b', { intent: ib, gender: gb, seeking: sb, marital: mb })
            const ab = hardFilter(a, b)
            const ba = hardFilter(b, a)
            expect(ab.ok).toBe(ba.ok) // symmetric
            const shouldPass = intentsCompatible(effectiveIntent(a), effectiveIntent(b))
              && seekingAccepts(sa, gb) && seekingAccepts(sb, ga)
            expect(ab.ok).toBe(shouldPass)
            if (ab.ok) {
              passes++
              if (ma === 'married' || mb === 'married') {
                expect(effectiveIntent(a)).toBe('friendship')
                expect(effectiveIntent(b)).toBe('friendship')
              }
            }
          }
    expect(passes).toBeGreaterThan(0)
  })

  it('requires both to be adults and inside each other\'s age range', () => {
    expect(hardFilter(subject('a'), subject('b', { age: 17 })).ok).toBe(false)
    expect(hardFilter(subject('a', { ageMax: 29 }), subject('b', { gender: 'male', seeking: 'female' })).ok).toBe(false)
    expect(hardFilter(subject('a'), subject('b', { gender: 'male', seeking: 'female', ageMin: 31 })).ok).toBe(false)
    expect(hardFilter(subject('a'), subject('b', { gender: 'male', seeking: 'female' }))).toEqual({ ok: true })
  })

  it('excludes paused, deleted, undiscoverable and self', () => {
    const b = subject('b', { gender: 'male', seeking: 'female' })
    expect(hardFilter(subject('a'), { ...b, pool: { discoverable: true, paused: true, deleted: false } }).ok).toBe(false)
    expect(hardFilter(subject('a'), { ...b, pool: { discoverable: false, paused: false, deleted: false } }).ok).toBe(false)
    expect(hardFilter(subject('a'), subject('a'))).toEqual({ ok: false, reason: 'self' })
  })

  it('honours blocks, final declines, matches and already-shown pairs', () => {
    const a = subject('a')
    const b = subject('b', { gender: 'male', seeking: 'female' })
    const base = { ...EMPTY_EXCLUSIONS }
    expect(hardFilter(a, b, { ...base, blocked: new Set([pairKey('b', 'a')]) })).toEqual({ ok: false, reason: 'blocked' })
    expect(hardFilter(a, b, { ...base, declined: new Set([pairKey('a', 'b')]) })).toEqual({ ok: false, reason: 'declined' })
    expect(hardFilter(b, a, { ...base, declined: new Set([pairKey('a', 'b')]) })).toEqual({ ok: false, reason: 'declined' })
    expect(hardFilter(a, b, { ...base, matched: new Set([pairKey('a', 'b')]) })).toEqual({ ok: false, reason: 'matched' })
    const shown = { ...base, discovered: new Set([orderedKey('a', 'b')]) }
    expect(hardFilter(a, b, shown)).toEqual({ ok: false, reason: 'already_discovered' })
    expect(hardFilter(b, a, shown).ok).toBe(true) // only a has seen b
  })
})
