import { describe, expect, it } from 'vitest'
import { deriveProfile } from '@/lib/matching/derive'

describe('deriveProfile', () => {
  it('derives region, tuổi, nạp âm and the day pillar', () => {
    expect(deriveProfile({ birthDate: '2000-01-01', city: 'Sài Gòn' })).toEqual({
      region: 'miền Nam', lunarYear: 1999, yearStem: 'Kỷ', yearBranch: 'Mão', napAm: 'Thành Đầu Thổ',
      napAmElement: 'Thổ', dayStem: 'Mậu', dayBranch: 'Ngọ', dayElement: 'Thổ',
    })
  })

  it('moves a birth after 23:00 to the next day pillar', () => {
    expect(deriveProfile({ birthDate: '2000-01-01', birthTime: '23:30' })).toMatchObject({ dayStem: 'Kỷ', dayBranch: 'Mùi' })
  })

  it('leaves astrology empty until there is a birth date', () => {
    const derived = deriveProfile({ city: 'Huế' })
    expect(derived.region).toBe('miền Trung')
    expect(Object.entries(derived).filter(([k, v]) => k !== 'region' && v !== null)).toEqual([])
  })
})
