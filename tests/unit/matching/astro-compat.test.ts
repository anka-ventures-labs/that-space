import { describe, expect, it } from 'vitest'
import { TUOI_SIGNAL_LABELS, tuoiCompat, type Tuoi } from '@/lib/matching/tuoi'
import { DAY_PILLAR_SIGNAL_LABELS, dayPillarCompat, type DayPillar } from '@/lib/matching/bazi'
import { BRANCHES, STEMS } from '@/lib/matching/lunar'
import { napAmOfLunarYear } from '@/lib/matching/napam'

const tuoi = (lunarYear: number, stem: Tuoi['stem'], branch: Tuoi['branch']): Tuoi => ({
  lunarYear, stem, branch, napAm: napAmOfLunarYear(lunarYear),
})

describe('tuổi hợp', () => {
  it('rewards tam hợp and penalises lục xung', () => {
    // Thìn (1988) and Thân (1992) are tam hợp; Tý (1984) and Ngọ (1990) are lục xung.
    const tamHop = tuoiCompat(tuoi(1988, 'Mậu', 'Thìn'), tuoi(1992, 'Nhâm', 'Thân'))
    const lucXung = tuoiCompat(tuoi(1984, 'Giáp', 'Tý'), tuoi(1990, 'Canh', 'Ngọ'))
    expect(tamHop.signals).toContain('tam_hop')
    expect(lucXung.signals).toContain('luc_xung')
    expect(tamHop.score).toBeGreaterThan(lucXung.score)
  })

  it('is symmetric and bounded', () => {
    for (let y = 1970; y < 2006; y += 3) {
      for (let z = 1972; z < 2006; z += 5) {
        const a = tuoi(y, STEMS[((y - 4) % 60) % 10], BRANCHES[((y - 4) % 60) % 12])
        const b = tuoi(z, STEMS[((z - 4) % 60) % 10], BRANCHES[((z - 4) % 60) % 12])
        const ab = tuoiCompat(a, b)
        const ba = tuoiCompat(b, a)
        expect(ab.score).toBeCloseTo(ba.score)
        expect(ab.score).toBeGreaterThanOrEqual(0)
        expect(ab.score).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('day pillar compatibility', () => {
  const dp = (stem: DayPillar['stem'], branch: DayPillar['branch'], element: DayPillar['element']): DayPillar => ({ stem, branch, element })

  it('treats a day-master stem combination as strong attraction', () => {
    const hop = dayPillarCompat(dp('Giáp', 'Dần', 'Mộc'), dp('Kỷ', 'Mão', 'Thổ'))
    expect(hop.signals).toContain('nhat_chu_hop')
    expect(hop.score).toBeGreaterThan(0.5)
  })

  it('scores the spouse palace: lục hợp up, xung down', () => {
    const lucHop = dayPillarCompat(dp('Bính', 'Tý', 'Hỏa'), dp('Bính', 'Sửu', 'Hỏa'))
    const xung = dayPillarCompat(dp('Bính', 'Tý', 'Hỏa'), dp('Bính', 'Ngọ', 'Hỏa'))
    expect(lucHop.signals).toContain('nhat_chi_luc_hop')
    expect(xung.signals).toContain('nhat_chi_xung')
    expect(lucHop.score).toBeGreaterThan(xung.score)
  })
})

describe('signal labels never reveal a stem or branch', () => {
  const names = [...STEMS, ...BRANCHES]
  it.each([...Object.values(TUOI_SIGNAL_LABELS), ...Object.values(DAY_PILLAR_SIGNAL_LABELS)])('%s', (label) => {
    for (const name of names) {
      expect(new RegExp(`(?<![\\p{L}])${name}(?![\\p{L}])`, 'u').test(label)).toBe(false)
    }
  })
})
