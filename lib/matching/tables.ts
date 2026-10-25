// Can-chi relationship tables, ported from Moon
// (moon2-app lib/astro/compatibility/score-utils.ts). Shared by tuổi (year
// pillar) and nhật trụ (day pillar) scoring.
import type { Element } from './types'
import type { Branch, Stem } from './lunar'

export const STEM_ELEMENT: Record<Stem, Element> = {
  Giáp: 'Mộc', Ất: 'Mộc', Bính: 'Hỏa', Đinh: 'Hỏa', Mậu: 'Thổ',
  Kỷ: 'Thổ', Canh: 'Kim', Tân: 'Kim', Nhâm: 'Thủy', Quý: 'Thủy',
}

export const PRODUCES: Record<Element, Element> = { Mộc: 'Hỏa', Hỏa: 'Thổ', Thổ: 'Kim', Kim: 'Thủy', Thủy: 'Mộc' }
export const CONTROLS: Record<Element, Element> = { Mộc: 'Thổ', Thổ: 'Thủy', Thủy: 'Hỏa', Hỏa: 'Kim', Kim: 'Mộc' }

export const THIEN_HOP: Record<Stem, Stem> = {
  Giáp: 'Kỷ', Kỷ: 'Giáp', Ất: 'Canh', Canh: 'Ất', Bính: 'Tân',
  Tân: 'Bính', Đinh: 'Nhâm', Nhâm: 'Đinh', Mậu: 'Quý', Quý: 'Mậu',
}

export const LUC_HOP: Record<Branch, Branch> = {
  Tý: 'Sửu', Sửu: 'Tý', Dần: 'Hợi', Hợi: 'Dần', Mão: 'Tuất', Tuất: 'Mão',
  Thìn: 'Dậu', Dậu: 'Thìn', Tỵ: 'Thân', Thân: 'Tỵ', Ngọ: 'Mùi', Mùi: 'Ngọ',
}

export const LUC_XUNG: Record<Branch, Branch> = {
  Tý: 'Ngọ', Ngọ: 'Tý', Sửu: 'Mùi', Mùi: 'Sửu', Dần: 'Thân', Thân: 'Dần',
  Mão: 'Dậu', Dậu: 'Mão', Thìn: 'Tuất', Tuất: 'Thìn', Tỵ: 'Hợi', Hợi: 'Tỵ',
}

export const TAM_HOP: ReadonlyArray<ReadonlySet<Branch>> = [
  new Set<Branch>(['Thân', 'Tý', 'Thìn']),
  new Set<Branch>(['Dần', 'Ngọ', 'Tuất']),
  new Set<Branch>(['Tỵ', 'Dậu', 'Sửu']),
  new Set<Branch>(['Hợi', 'Mão', 'Mùi']),
]

export const TU_HANH_XUNG: ReadonlyArray<ReadonlySet<Branch>> = [
  new Set<Branch>(['Tý', 'Ngọ', 'Mão', 'Dậu']),
  new Set<Branch>(['Dần', 'Thân', 'Tỵ', 'Hợi']),
  new Set<Branch>(['Thìn', 'Tuất', 'Sửu', 'Mùi']),
]

/** Tam hình: pairs drawn from these triples punish each other. */
export const TAM_HINH: ReadonlyArray<ReadonlySet<Branch>> = [
  new Set<Branch>(['Dần', 'Tỵ', 'Thân']),
  new Set<Branch>(['Sửu', 'Tuất', 'Mùi']),
  new Set<Branch>(['Tý', 'Mão']),
]

/** Tự hình: the same branch in both charts. */
export const TU_HINH: ReadonlySet<Branch> = new Set<Branch>(['Thìn', 'Ngọ', 'Dậu', 'Hợi'])

export function inSameSet(sets: ReadonlyArray<ReadonlySet<Branch>>, a: Branch, b: Branch): boolean {
  return sets.some((set) => set.has(a) && set.has(b))
}

export function elementRelation(a: Element, b: Element): 'same' | 'sinh' | 'khac' | 'none' {
  if (a === b) return 'same'
  if (PRODUCES[a] === b || PRODUCES[b] === a) return 'sinh'
  if (CONTROLS[a] === b || CONTROLS[b] === a) return 'khac'
  return 'none'
}
