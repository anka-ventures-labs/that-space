import { describe, expect, it } from 'vitest'
import { listPool, upsertMemberFromDiscourse } from '@/lib/db/repo'
import { SAMPLE_MEMBERS, seedSampleMembers } from '@/lib/db/samples'
import { calculateAge, checkTextForLeaks } from '@/lib/matching/privacy'
import { createTestDb } from '../../helpers/pglite-db'

const AT = new Date('2026-09-27T10:00:00Z')

describe('sample members', () => {
  it('covers every intent and gender with adult ages, valid ranges and summaries that leak nothing', () => {
    expect(SAMPLE_MEMBERS).toHaveLength(30)
    expect(new Set(SAMPLE_MEMBERS.map((s) => s.profile.intent))).toEqual(new Set(['friendship', 'casual', 'long_term', 'marriage']))
    expect(new Set(SAMPLE_MEMBERS.map((s) => s.profile.gender))).toEqual(new Set(['female', 'male', 'other']))
    for (const { name, occupation, summary, profile } of SAMPLE_MEMBERS) {
      expect(calculateAge(profile.birthDate, AT)).toBeGreaterThanOrEqual(18)
      expect(profile.ageMin!).toBeLessThanOrEqual(profile.ageMax!)
      expect(checkTextForLeaks(summary, [name, profile.city, occupation]), name).toEqual({ ok: true, violations: [] })
    }
  })

  it('seeds labelled, discoverable samples under the rule of 5, and reseeding replaces them', async () => {
    const { db, close } = await createTestDb()
    try {
      expect(await seedSampleMembers(db, AT)).toEqual({ removed: 0, inserted: 30 })
      expect(await seedSampleMembers(db, AT)).toEqual({ removed: 30, inserted: 30 })

      const viewer = await upsertMemberFromDiscourse(db, { discourseUserId: 1, username: 'lan' })
      const pool = await listPool(db, viewer.id)
      expect(pool).toHaveLength(30)
      expect(pool.every((p) => p.isSample && p.card.isSample === true && p.card.summary)).toBe(true)
      expect(pool.every((p) => p.card.region !== null)).toBe(true) // every region has at least 5 samples
      expect(pool.filter((p) => p.card.initial !== null).map((p) => p.card.initial)).toEqual(Array(5).fill('N.'))
      expect(pool.every((p) => p.card.dayMaster && p.card.element)).toBe(true)
    } finally {
      await close()
    }
  })
})
