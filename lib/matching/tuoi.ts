import { canChiOfLunarYear, solarToLunar, type Branch, type Stem } from './lunar'
import { napAmOfLunarYear, type NapAm } from './napam'
import { LUC_HOP, LUC_XUNG, TAM_HOP, THIEN_HOP, TU_HANH_XUNG, elementRelation, inSameSet } from './tables'

export interface Tuoi {
  lunarYear: number
  stem: Stem
  branch: Branch
  napAm: NapAm
}

/** Tuổi from a solar birth date, using the Vietnamese lunar calendar (UTC+7). */
export function tuoiOf(birthDate: string): Tuoi {
  const { lunarYear } = solarToLunar(birthDate, 7)
  const { stem, branch } = canChiOfLunarYear(lunarYear)
  return { lunarYear, stem, branch, napAm: napAmOfLunarYear(lunarYear) }
}

export type TuoiSignal =
  | 'tam_hop' | 'luc_hop' | 'luc_xung' | 'tu_hanh_xung'
  | 'thien_hop' | 'menh_sinh' | 'menh_khac' | 'menh_binh'

/**
 * Member-facing labels. They describe the relationship without naming either
 * person's animal or stem: with an age band, those would reveal a birth year.
 */
export const TUOI_SIGNAL_LABELS: Record<TuoiSignal, string> = {
  tam_hop: 'Tuổi hai người nằm trong cùng một bộ tam hợp',
  luc_hop: 'Tuổi hai người là một cặp lục hợp',
  luc_xung: 'Tuổi hai người thuộc thế lục xung, cần nhiều thấu hiểu',
  tu_hanh_xung: 'Tuổi hai người cùng nhóm tứ hành xung, dễ khác quan điểm',
  thien_hop: 'Thiên can năm sinh hai người tương hợp',
  menh_sinh: 'Mệnh hai người tương sinh',
  menh_khac: 'Mệnh hai người tương khắc, cần dung hòa',
  menh_binh: 'Mệnh hai người cùng hành, bình hòa',
}

export interface AstroCompat<S extends string> {
  /** 0..1, symmetric. */
  score: number
  signals: S[]
}

export function tuoiCompat(a: Tuoi, b: Tuoi): AstroCompat<TuoiSignal> {
  const signals: TuoiSignal[] = []
  let score = 0.5

  if (a.branch !== b.branch) {
    if (inSameSet(TAM_HOP, a.branch, b.branch)) {
      signals.push('tam_hop')
      score += 0.25
    } else if (LUC_HOP[a.branch] === b.branch) {
      signals.push('luc_hop')
      score += 0.2
    }
    if (LUC_XUNG[a.branch] === b.branch) {
      signals.push('luc_xung')
      score -= 0.3
    } else if (inSameSet(TU_HANH_XUNG, a.branch, b.branch)) {
      signals.push('tu_hanh_xung')
      score -= 0.15
    }
  }

  if (THIEN_HOP[a.stem] === b.stem) {
    signals.push('thien_hop')
    score += 0.1
  }

  const relation = elementRelation(a.napAm.element, b.napAm.element)
  if (relation === 'same') {
    signals.push('menh_binh')
    score += 0.05
  } else if (relation === 'sinh') {
    signals.push('menh_sinh')
    score += 0.15
  } else if (relation === 'khac') {
    signals.push('menh_khac')
    score -= 0.15
  }

  return { score: Math.min(1, Math.max(0, score)), signals }
}
