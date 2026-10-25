/**
 * Nhật trụ (day pillar) compatibility: the day master (nhật chủ) stem and the
 * day branch (nhật chi, Bát Tự's spouse palace). The day pillar needs only
 * the birth date: sexagenary day = (JDN + 49) mod 60, 0 = Giáp Tý (checked
 * against 1949-10-01 = Giáp Tý and 2000-01-01 = Mậu Ngọ). Relationship
 * tables are Moon's. Moon's full chart engine, which needs a birth time, is
 * a later step (A2).
 *
 * Limitation: in the Tý-hour convention a birth between 23:00 and 24:00
 * belongs to the next day. Without a birth time we use the calendar date.
 */
import type { Element } from './types'
import { BRANCHES, STEMS, jdFromDate, type Branch, type Stem } from './lunar'
import {
  LUC_HOP, LUC_XUNG, STEM_ELEMENT, TAM_HINH, TAM_HOP, THIEN_HOP, TU_HINH,
  elementRelation, inSameSet,
} from './tables'
import type { AstroCompat } from './tuoi'

export interface DayPillar {
  stem: Stem
  branch: Branch
  /** The day master's element, e.g. Giáp -> Mộc. */
  element: Element
}

export function dayPillarOf(birthDate: string, birthTime?: string | null): DayPillar {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birthDate || ''))
  if (!match) throw new Error(`Invalid solar date: ${birthDate}`)
  const [y, m, d] = match.slice(1).map(Number)
  let jd = jdFromDate(d, m, y)
  // Tý-hour convention: 23:00-23:59 counts as the next day.
  if (birthTime && /^23:[0-5]\d$/.test(birthTime)) jd += 1
  const index = (((jd + 49) % 60) + 60) % 60
  const stem = STEMS[index % 10]
  return { stem, branch: BRANCHES[index % 12], element: STEM_ELEMENT[stem] }
}

/** The day master as Moon shows it on the anonymous card, e.g. "Giáp Mộc". */
export function dayMasterLabel(pillar: DayPillar): string {
  return `${pillar.stem} ${pillar.element}`
}

export type DayPillarSignal =
  | 'nhat_chu_hop' | 'nhat_chu_sinh' | 'nhat_chu_khac' | 'nhat_chu_binh'
  | 'nhat_chi_luc_hop' | 'nhat_chi_tam_hop' | 'nhat_chi_xung' | 'nhat_chi_hinh'

/** Labels name relationships, never a person's branch, so no date can be inferred. */
export const DAY_PILLAR_SIGNAL_LABELS: Record<DayPillarSignal, string> = {
  nhat_chu_hop: 'Nhật chủ hai người tương hợp, dễ hút nhau',
  nhat_chu_sinh: 'Nhật chủ hai người tương sinh, nâng đỡ nhau',
  nhat_chu_khac: 'Nhật chủ hai người tương khắc, cần dung hòa',
  nhat_chu_binh: 'Nhật chủ hai người cùng hành, hiểu nhau',
  nhat_chi_luc_hop: 'Nhật chi (cung phu thê) hai người lục hợp',
  nhat_chi_tam_hop: 'Nhật chi (cung phu thê) hai người tam hợp',
  nhat_chi_xung: 'Nhật chi (cung phu thê) hai người xung nhau',
  nhat_chi_hinh: 'Nhật chi (cung phu thê) hai người hình nhau',
}

export function dayPillarCompat(a: DayPillar, b: DayPillar): AstroCompat<DayPillarSignal> {
  const signals: DayPillarSignal[] = []
  let score = 0.5

  // Day master: a stem combination is the classic attraction signal.
  if (THIEN_HOP[a.stem] === b.stem) {
    signals.push('nhat_chu_hop')
    score += 0.25
  } else {
    const relation = elementRelation(a.element, b.element)
    if (relation === 'sinh') {
      signals.push('nhat_chu_sinh')
      score += 0.1
    } else if (relation === 'khac') {
      signals.push('nhat_chu_khac')
      score -= 0.1
    } else if (relation === 'same') {
      signals.push('nhat_chu_binh')
      score += 0.05
    }
  }

  // Day branch (spouse palace).
  if (a.branch === b.branch) {
    if (TU_HINH.has(a.branch)) {
      signals.push('nhat_chi_hinh')
      score -= 0.05
    }
  } else {
    if (LUC_HOP[a.branch] === b.branch) {
      signals.push('nhat_chi_luc_hop')
      score += 0.25
    } else if (inSameSet(TAM_HOP, a.branch, b.branch)) {
      signals.push('nhat_chi_tam_hop')
      score += 0.15
    }
    if (LUC_XUNG[a.branch] === b.branch) {
      signals.push('nhat_chi_xung')
      score -= 0.3
    } else if (inSameSet(TAM_HINH, a.branch, b.branch)) {
      signals.push('nhat_chi_hinh')
      score -= 0.1
    }
  }

  return { score: Math.min(1, Math.max(0, score)), signals }
}
