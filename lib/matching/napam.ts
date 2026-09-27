import type { Element } from './types'
import { canChiOfLunarYear } from './lunar'

/**
 * Ngũ hành nạp âm: the 60-year cycle groups years in pairs, 30 names in
 * order from Giáp Tý. Standard reference data (Moon has no copy), checked
 * against the tests for 1984, 1988, 1990, 1996 and 2024.
 */
const NAP_AM: ReadonlyArray<readonly [name: string, element: Element]> = [
  ['Hải Trung Kim', 'Kim'],   // Giáp Tý, Ất Sửu
  ['Lư Trung Hỏa', 'Hỏa'],    // Bính Dần, Đinh Mão
  ['Đại Lâm Mộc', 'Mộc'],     // Mậu Thìn, Kỷ Tỵ
  ['Lộ Bàng Thổ', 'Thổ'],     // Canh Ngọ, Tân Mùi
  ['Kiếm Phong Kim', 'Kim'],  // Nhâm Thân, Quý Dậu
  ['Sơn Đầu Hỏa', 'Hỏa'],     // Giáp Tuất, Ất Hợi
  ['Giản Hạ Thủy', 'Thủy'],   // Bính Tý, Đinh Sửu
  ['Thành Đầu Thổ', 'Thổ'],   // Mậu Dần, Kỷ Mão
  ['Bạch Lạp Kim', 'Kim'],    // Canh Thìn, Tân Tỵ
  ['Dương Liễu Mộc', 'Mộc'],  // Nhâm Ngọ, Quý Mùi
  ['Tuyền Trung Thủy', 'Thủy'], // Giáp Thân, Ất Dậu
  ['Ốc Thượng Thổ', 'Thổ'],   // Bính Tuất, Đinh Hợi
  ['Tích Lịch Hỏa', 'Hỏa'],   // Mậu Tý, Kỷ Sửu
  ['Tùng Bách Mộc', 'Mộc'],   // Canh Dần, Tân Mão
  ['Trường Lưu Thủy', 'Thủy'], // Nhâm Thìn, Quý Tỵ
  ['Sa Trung Kim', 'Kim'],    // Giáp Ngọ, Ất Mùi
  ['Sơn Hạ Hỏa', 'Hỏa'],      // Bính Thân, Đinh Dậu
  ['Bình Địa Mộc', 'Mộc'],    // Mậu Tuất, Kỷ Hợi
  ['Bích Thượng Thổ', 'Thổ'], // Canh Tý, Tân Sửu
  ['Kim Bạch Kim', 'Kim'],    // Nhâm Dần, Quý Mão
  ['Phú Đăng Hỏa', 'Hỏa'],    // Giáp Thìn, Ất Tỵ
  ['Thiên Hà Thủy', 'Thủy'],  // Bính Ngọ, Đinh Mùi
  ['Đại Trạch Thổ', 'Thổ'],   // Mậu Thân, Kỷ Dậu
  ['Thoa Xuyến Kim', 'Kim'],  // Canh Tuất, Tân Hợi
  ['Tang Đố Mộc', 'Mộc'],     // Nhâm Tý, Quý Sửu
  ['Đại Khê Thủy', 'Thủy'],   // Giáp Dần, Ất Mão
  ['Sa Trung Thổ', 'Thổ'],    // Bính Thìn, Đinh Tỵ
  ['Thiên Thượng Hỏa', 'Hỏa'], // Mậu Ngọ, Kỷ Mùi
  ['Thạch Lựu Mộc', 'Mộc'],   // Canh Thân, Tân Dậu
  ['Đại Hải Thủy', 'Thủy'],   // Nhâm Tuất, Quý Hợi
]

export interface NapAm {
  name: string
  element: Element
}

export function napAmOfLunarYear(lunarYear: number): NapAm {
  const { cycleIndex } = canChiOfLunarYear(lunarYear)
  const [name, element] = NAP_AM[Math.floor(cycleIndex / 2)]
  return { name, element }
}
