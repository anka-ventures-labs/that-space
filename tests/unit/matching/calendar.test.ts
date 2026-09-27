import { describe, expect, it } from 'vitest'
import { canChiOfLunarYear, solarToLunar } from '@/lib/matching/lunar'
import { napAmOfLunarYear } from '@/lib/matching/napam'
import { tuoiOf } from '@/lib/matching/tuoi'
import { dayMasterLabel, dayPillarOf } from '@/lib/matching/bazi'

const canChi = (y: number) => {
  const { stem, branch } = canChiOfLunarYear(y)
  return `${stem} ${branch}`
}

describe('Vietnamese lunar calendar (UTC+7)', () => {
  it('uses the Vietnamese Tết for 1985, which differs from China', () => {
    // Vietnam: Tết Ất Sửu = 1985-01-21. China (UTC+8): 1985-02-20.
    expect(tuoiOf('1985-01-20').lunarYear).toBe(1984)
    expect(tuoiOf('1985-01-21').lunarYear).toBe(1985)
    expect(`${tuoiOf('1985-02-01').stem} ${tuoiOf('1985-02-01').branch}`).toBe('Ất Sửu')
    expect(solarToLunar('1985-02-01', 8).lunarYear).toBe(1984) // China would say Giáp Tý
  })

  it('switches year exactly at Tết 1990', () => {
    expect(`${tuoiOf('1990-01-26').stem} ${tuoiOf('1990-01-26').branch}`).toBe('Kỷ Tỵ')
    expect(`${tuoiOf('1990-01-27').stem} ${tuoiOf('1990-01-27').branch}`).toBe('Canh Ngọ')
    expect(solarToLunar('1990-01-27')).toMatchObject({ lunarYear: 1990, lunarMonth: 1, lunarDay: 1 })
  })

  it('names can chi of lunar years', () => {
    expect(canChi(1984)).toBe('Giáp Tý')
    expect(canChi(1989)).toBe('Kỷ Tỵ')
    expect(canChi(1996)).toBe('Bính Tý')
    expect(canChi(2024)).toBe('Giáp Thìn')
    expect(canChi(1943)).toBe('Quý Mùi')
  })

  it('rejects malformed dates', () => {
    expect(() => solarToLunar('1990/01/27')).toThrow()
  })
})

describe('Nạp âm', () => {
  it.each([
    [1984, 'Hải Trung Kim', 'Kim'],
    [1988, 'Đại Lâm Mộc', 'Mộc'],
    [1990, 'Lộ Bàng Thổ', 'Thổ'],
    [1996, 'Giản Hạ Thủy', 'Thủy'],
    [2024, 'Phú Đăng Hỏa', 'Hỏa'],
    [2043, 'Đại Hải Thủy', 'Thủy'],
  ])('%i is %s (%s)', (year, name, element) => {
    expect(napAmOfLunarYear(year)).toEqual({ name, element })
  })
})

describe('Day pillar (nhật trụ)', () => {
  it('matches known reference days', () => {
    expect(dayPillarOf('1949-10-01')).toMatchObject({ stem: 'Giáp', branch: 'Tý' })
    expect(dayPillarOf('2000-01-01')).toMatchObject({ stem: 'Mậu', branch: 'Ngọ' })
  })

  it('advances one step per day and treats 23:xx as the next day', () => {
    expect(dayPillarOf('2000-01-02')).toMatchObject({ stem: 'Kỷ', branch: 'Mùi' })
    expect(dayPillarOf('2000-01-01', '23:30')).toMatchObject({ stem: 'Kỷ', branch: 'Mùi' })
    expect(dayPillarOf('2000-01-01', '22:59')).toMatchObject({ stem: 'Mậu', branch: 'Ngọ' })
  })

  it('labels the day master with stem and element only', () => {
    expect(dayMasterLabel(dayPillarOf('2000-01-01'))).toBe('Mậu Thổ')
  })
})
