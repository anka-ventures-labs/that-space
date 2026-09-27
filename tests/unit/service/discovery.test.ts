import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Db } from '@/lib/db/db'
import { getMemberByDiscourseId } from '@/lib/db/repo'
import { SAMPLE_MEMBERS, seedSampleMembers } from '@/lib/db/samples'
import { calculateAge } from '@/lib/matching/privacy'
import { cardMatches } from '@/lib/service/handlers/discovery'
import { PROFILE, createHarness, onboard, seededRandom, testUser, type Harness } from '../../helpers/service'

describe('the Duyên box and search, over the sample pool', () => {
  let h: Harness
  beforeAll(async () => {
    h = await createHarness()
    await seedSampleMembers(h.db, h.now)
  })
  afterAll(async () => h.close())

  it('opens one box per Vietnam day, never bringing the same person twice', async () => {
    const user = testUser('lan')
    await onboard(h, user)
    const first = await h.call('box_open', user)
    expect(first.body).toMatchObject({ ok: true, result: 'match', next_box_at: '2026-09-27T17:00:00.000Z' })
    const intro = first.body.introduction
    expect(Object.keys(intro).sort()).toEqual(['card', 'discovery_id', 'fit', 'is_sample'])
    expect(Object.keys(intro.fit).sort()).toEqual(['astrology', 'same_region', 'shared_hobbies', 'tier', 'tier_label'])
    expect(intro.is_sample).toBe(true)
    expect(intro.card.seeking).not.toBe('male') // she is a woman seeking men; he must want women too

    // Nothing private about the candidate reaches the persona.
    const sample = SAMPLE_MEMBERS.find((s) => s.summary === intro.card.summary)!
    const text = JSON.stringify(first.body)
    for (const secret of [sample.profile.birthDate!, sample.profile.city!, sample.occupation, sample.profile.openAnswer!]) {
      expect(text).not.toContain(secret)
    }

    expect((await h.call('box_open', user)).body).toMatchObject({ ok: true, result: 'cooldown' })
    expect((await h.call('status', user)).body.box_available).toBe(false)

    h.setNow(new Date('2026-09-27T17:00:00Z')) // midnight in Vietnam
    const second = await h.call('box_open', user)
    expect(second.body.result).toBe('match')
    expect(second.body.introduction.card.summary).not.toBe(intro.card.summary)
    h.setNow(new Date('2026-09-27T03:00:00Z'))
  })

  it('uses the turn when no one qualifies', async () => {
    const user = testUser('mai')
    await onboard(h, user, { birth_date: '1950-01-01', age_min: 90, age_max: 100 })
    expect((await h.call('box_open', user)).body).toMatchObject({ ok: true, result: 'no_match' })
    expect((await h.call('box_open', user)).body.result).toBe('cooldown')
  })

  it("gives the turn back when opening fails on our side", async () => {
    const user = testUser('ngoc')
    await onboard(h, user)
    const realDb = h.deps.db
    const failing: Db = {
      query: (text, params) => (text.includes('from (select') ? Promise.reject(new Error('pool query failed')) : realDb.query(text, params)),
      transaction: (fn) => realDb.transaction(fn),
    }
    h.deps.db = failing
    try {
      expect((await h.call('box_open', user)).status).toBe(500)
    } finally {
      h.deps.db = realDb
    }
    expect((await h.call('box_open', user)).body.result).toBe('match')
  })

  it('searches by what cards show, counts results toward the daily limit, and never repeats', async () => {
    const user = testUser('hoa')
    await onboard(h, user, { intent: 'friendship', seeking: 'female', age_min: 25, age_max: 60 })
    const first = await h.call('search', user, { keywords: ['thiền'] })
    expect(first.body.ok).toBe(true)
    expect(first.body.results.length).toBeGreaterThan(0)
    for (const r of first.body.results) {
      expect(cardMatches(r.card, { keywords: ['thiền'] })).toBe(true)
      expect(r.card.intent).toBe('friendship')
    }
    expect(first.body.search_results_left).toBe(6 - first.body.results.length)

    const shown = new Set(first.body.results.map((r: { card: { summary: string } }) => r.card.summary))
    const second = await h.call('search', user, {})
    for (const r of second.body.results) expect(shown.has(r.card.summary)).toBe(false)

    let left = second.body.search_results_left
    while (left > 0) {
      const next = await h.call('search', user, {})
      if (next.body.results.length === 0) break
      left = next.body.search_results_left
    }
    if (left === 0) expect((await h.call('search', user, {})).body).toMatchObject({ ok: false, error: 'daily_limit' })
  })

  it('matches search criteria against cards only', () => {
    const card = {
      ageBand: '35-39', region: null, initial: null, gender: 'female' as const, seeking: 'male' as const,
      intent: 'long_term' as const, hobbies: ['leo núi', 'trà đạo'], element: 'Thổ' as const, dayMaster: 'Giáp Mộc',
      summary: 'Mê những chuyến đi xa.',
    }
    expect(cardMatches(card, { keywords: ['leo nui'] })).toBe(true)
    expect(cardMatches(card, { keywords: ['đi xa'] })).toBe(true)
    expect(cardMatches(card, { keywords: ['bơi'] })).toBe(false)
    expect(cardMatches(card, { region: 'miền Bắc' })).toBe(false) // a hidden region never matches
    expect(cardMatches(card, { age_min: 38, age_max: 50 })).toBe(true)
    expect(cardMatches(card, { age_min: 40 })).toBe(false)
    expect(cardMatches({ ...card, ageBand: '70+' }, { age_min: 75 })).toBe(true)
    expect(cardMatches(card, { element: 'Kim' })).toBe(false)
  })
})

/**
 * Spec "Done means" 3: no discovery or search result ever breaks a hard
 * filter, in either direction. The oracle below restates the spec's rules
 * independently of lib/matching/filters.ts.
 */
describe('hard filters hold for every result, both ways', () => {
  const INTENTS = ['friendship', 'casual', 'long_term', 'marriage'] as const
  const GENDERS = ['female', 'male', 'other'] as const
  const SEEKING = ['female', 'male', 'both'] as const
  const MARITAL = ['single', 'divorced', 'widowed', 'married'] as const
  type Row = { intent: string; gender: string; seeking: string; birth_date: string; age_min: number; age_max: number; marital: string }

  const effective = (p: Row) => (p.marital === 'married' ? 'friendship' : p.intent)
  const serious = (i: string) => i === 'long_term' || i === 'marriage'
  const wants = (a: Row, b: Row) => a.seeking === 'both' || (b.gender !== 'other' && a.seeking === b.gender)
  const at = new Date('2026-09-27T03:00:00Z')
  const ageOk = (a: Row, b: Row) => {
    const age = calculateAge(b.birth_date, at)!
    return age >= 18 && age >= a.age_min && age <= a.age_max
  }
  function oracle(a: Row, b: Row): boolean {
    const [ia, ib] = [effective(a), effective(b)]
    const intentOk = ia === ib || (serious(ia) && serious(ib))
    return intentOk && wants(a, b) && wants(b, a) && ageOk(a, b) && ageOk(b, a)
  }

  let h: Harness
  afterAll(async () => h?.close())

  it('for a random population of 40 members', async () => {
    h = await createHarness({ seed: 2026 })
    const rand = seededRandom(99)
    const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]
    const people: Array<{ user: ReturnType<typeof testUser>; row: Row }> = []
    for (let i = 0; i < 40; i++) {
      const age = 18 + Math.floor(rand() * 45)
      const low = Math.max(18, age - Math.floor(rand() * 12))
      const row: Row = {
        intent: pick(INTENTS), gender: pick(GENDERS), seeking: pick(SEEKING),
        birth_date: `${2026 - age - 1}-0${1 + Math.floor(rand() * 9)}-1${Math.floor(rand() * 9)}`,
        age_min: low, age_max: Math.min(100, low + 4 + Math.floor(rand() * 20)), marital: pick(MARITAL),
      }
      const user = testUser(`m${i}`)
      // Shared interests keep scores high, so the hard filters are what decide.
      await onboard(h, user, { ...PROFILE, ...row }, 'Thích những buổi chiều yên tĩnh và trò chuyện chân thành.')
      people.push({ user, row })
    }

    for (const { user } of people) {
      await h.call('box_open', user)
      await h.call('search', user, {})
    }

    const ids = new Map<string, Row>()
    for (const { user, row } of people) ids.set((await getMemberByDiscourseId(h.db, user.user_id))!.id, row)
    const found = await h.db.query<{ viewer: string; candidate: string }>(`select viewer_id as viewer, candidate_id as candidate from discoveries`)
    expect(found.length).toBeGreaterThan(20) // the property is not vacuous

    let rejectedPairs = 0
    for (const [a, rowA] of ids) for (const [b, rowB] of ids) if (a !== b && !oracle(rowA, rowB)) rejectedPairs++
    expect(rejectedPairs).toBeGreaterThan(found.length) // most pairs are filtered out

    for (const { viewer, candidate } of found) {
      expect(viewer).not.toBe(candidate)
      expect(oracle(ids.get(viewer)!, ids.get(candidate)!)).toBe(true)
      expect(oracle(ids.get(candidate)!, ids.get(viewer)!)).toBe(true)
    }
    const pairs = found.map((f) => `${f.viewer}>${f.candidate}`)
    expect(new Set(pairs).size).toBe(pairs.length)
  })
})
