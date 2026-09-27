import { describe, expect, it } from 'vitest'
import {
  MIN_K_ANONYMITY, addressLabel, ageBandForAge, aliasFor, buildPoolCard, calculateAge,
  checkTextForLeaks, isAdult, nameInitial, regionForCity, vnDate,
} from '@/lib/matching/privacy'

describe('ages and the Vietnam calendar day', () => {
  it('computes adulthood on the Vietnam date', () => {
    // 2026-05-29T18:00Z is already 2026-05-30 in Vietnam.
    const at = new Date('2026-05-29T18:00:00Z')
    expect(vnDate(at)).toBe('2026-05-30')
    expect(calculateAge('2008-05-30', at)).toBe(18)
    expect(isAdult('2008-05-31', at)).toBe(false)
    expect(isAdult('2008-05-30', at)).toBe(true)
    expect(isAdult(null, at)).toBe(false)
  })

  it('uses wide age bands (Moon)', () => {
    expect(ageBandForAge(17)).toBeNull()
    expect(ageBandForAge(24)).toBe('18-24')
    expect(ageBandForAge(30)).toBe('30-34')
    expect(ageBandForAge(72)).toBe('70+')
  })
})

describe('rule of 5', () => {
  it('hides initial and region below the threshold', () => {
    expect(nameInitial('Ngọc', MIN_K_ANONYMITY - 1)).toBeNull()
    expect(nameInitial('Ngọc', MIN_K_ANONYMITY)).toBe('N.')
    expect(regionForCity('Hà Nội')).toBe('miền Bắc')
    expect(regionForCity('TP Hồ Chí Minh')).toBe('miền Nam')
    expect(regionForCity('Đà Nẵng')).toBe('miền Trung')
  })

  it('builds a card with no direct identifiers', () => {
    const base = {
      profile: {
        birthDate: '1994-02-01', city: 'Đà Nẵng', gender: 'female' as const, seeking: 'male' as const,
        intent: 'long_term' as const, hobbies: ['Đọc sách', 'Yoga', 'Cà phê', 'Du lịch', 'Nấu ăn', 'Âm nhạc'],
      },
      element: 'Hỏa' as const,
      dayMaster: 'Canh Kim',
      displayName: 'Lan',
      at: new Date('2026-09-27T00:00:00Z'),
    }
    const visible = buildPoolCard({ ...base, regionBucketSize: 8, initialBucketSize: 8 })
    expect(visible).toMatchObject({ initial: 'L.', ageBand: '30-34', region: 'miền Trung', dayMaster: 'Canh Kim' })
    expect(visible.hobbies).toHaveLength(5)
    const hidden = buildPoolCard({ ...base, regionBucketSize: 4, initialBucketSize: 4 })
    expect(hidden).toMatchObject({ initial: null, region: null })
    expect(JSON.stringify(hidden)).not.toMatch(/Đà Nẵng|1994|Lan/)
  })
})

describe('leak check (Moon)', () => {
  it('flags birth dates, times, exact places, names and can-chi pillars', () => {
    const checked = checkTextForLeaks('Bạn này sinh 1994-02-01 lúc 08:30 ở Đà Nẵng, tên Lan, ngày Mậu Thìn.', ['Đà Nẵng', 'Lan'])
    expect(checked.ok).toBe(false)
    expect(checked.violations).toEqual(expect.arrayContaining([
      'dob', 'birth_time', 'can_chi_pillar', 'forbidden_term:Đà Nẵng', 'forbidden_term:Lan',
    ]))
  })

  it('allows element-only day-master labels', () => {
    expect(checkTextForLeaks('Người này mang khí Mậu Thổ, thiên về sự ổn định.')).toEqual({ ok: true, violations: [] })
  })

  it('does not flag names that are ordinary words, but catches them used as names', () => {
    expect(checkTextForLeaks('Người này khá linh hoạt, thông minh, tạo cảm giác bình yên.', ['Linh', 'Minh', 'Yên']).ok).toBe(true)
    expect(checkTextForLeaks('Cảm giác là bình yên.', ['Bình']).ok).toBe(true)
    expect(checkTextForLeaks('Người ấy là Linh.', ['Linh']).violations).toContain('forbidden_term:Linh')
    expect(checkTextForLeaks('Anh Minh có tín hiệu rõ.', ['Minh']).violations).toContain('forbidden_term:Minh')
    expect(checkTextForLeaks('Lá số của Hương cho thấy điều tốt.', ['Hương']).violations).toContain('forbidden_term:Hương')
  })
})

describe('chat aliases', () => {
  it('addresses younger peers as Em, otherwise by gender', () => {
    expect(addressLabel(35, 28, 'female')).toBe('Em')
    expect(addressLabel(28, 35, 'female')).toBe('Chị')
    expect(addressLabel(28, 35, 'male')).toBe('Anh')
    expect(addressLabel(28, 35, 'other')).toBe('Bạn')
    expect(addressLabel(null, 35, 'female')).toBe('Chị')
  })

  it('uses the initial only when the rule of 5 allows', () => {
    expect(aliasFor('Chị', 'L.')).toBe('Chị L.')
    expect(aliasFor('Anh', null)).toBe('Anh ấy')
  })
})
