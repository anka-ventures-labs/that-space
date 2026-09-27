/**
 * Vietnamese solar -> lunar conversion, ported from Moon
 * (moon2-app lib/astro/vietnamese-lunar.js, Hồ Ngọc Đức's algorithm).
 *
 * Vietnam computes lunar day boundaries in UTC+7, China in UTC+8, so some
 * years differ: in 1985 Tết (Ất Sửu) fell on 1985-01-21 in Vietnam but
 * 1985-02-20 in China. Always use timeZone 7 for members.
 */

const PI = Math.PI

export const STEMS = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const
export const BRANCHES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const

export type Stem = (typeof STEMS)[number]
export type Branch = (typeof BRANCHES)[number]

export interface LunarDate {
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  isLeapMonth: boolean
}

/** Julian day number of a Gregorian date. */
export function jdFromDate(day: number, month: number, year: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
  if (jd < 2299161) {
    jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083
  }
  return jd
}

function getNewMoonDay(k: number, timeZone: number): number {
  const t = k / 1236.85
  const t2 = t * t
  const t3 = t2 * t
  const dr = PI / 180
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * dr)
  const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3
  const mPrime = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3
  const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3
  let c1 = (0.1734 - 0.000393 * t) * Math.sin(m * dr) + 0.0021 * Math.sin(2 * dr * m)
  c1 -= 0.4068 * Math.sin(mPrime * dr)
  c1 += 0.0161 * Math.sin(2 * dr * mPrime)
  c1 -= 0.0004 * Math.sin(3 * dr * mPrime)
  c1 += 0.0104 * Math.sin(2 * dr * f)
  c1 -= 0.0051 * Math.sin((m + mPrime) * dr)
  c1 -= 0.0074 * Math.sin((m - mPrime) * dr)
  c1 += 0.0004 * Math.sin((2 * f + m) * dr)
  c1 -= 0.0004 * Math.sin((2 * f - m) * dr)
  c1 -= 0.0006 * Math.sin((2 * f + mPrime) * dr)
  c1 += 0.001 * Math.sin((2 * f - mPrime) * dr)
  c1 += 0.0005 * Math.sin((2 * mPrime + m) * dr)
  const deltaT = t < -11
    ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
    : -0.000278 + 0.000265 * t + 0.000262 * t2
  return Math.floor(jd1 + c1 - deltaT + 0.5 + timeZone / 24)
}

function getSunLongitude(jdn: number, timeZone: number): number {
  const t = (jdn - 2451545.5 - timeZone / 24) / 36525
  const t2 = t * t
  const dr = PI / 180
  const m = 357.5291 + 35999.0503 * t - 0.0001559 * t2 - 0.00000048 * t * t2
  const l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2
  const dl = (1.9146 - 0.004817 * t - 0.000014 * t2) * Math.sin(dr * m)
    + (0.019993 - 0.000101 * t) * Math.sin(2 * dr * m)
    + 0.00029 * Math.sin(3 * dr * m)
  let l = (l0 + dl) * dr
  l -= PI * 2 * Math.floor(l / (PI * 2))
  return Math.floor((l / PI) * 6)
}

function getLunarMonth11(year: number, timeZone: number): number {
  const off = jdFromDate(31, 12, year) - 2415021
  const k = Math.floor(off / 29.530588853)
  let nm = getNewMoonDay(k, timeZone)
  if (getSunLongitude(nm, timeZone) >= 9) nm = getNewMoonDay(k - 1, timeZone)
  return nm
}

function getLeapMonthOffset(a11: number, timeZone: number): number {
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853)
  let last = 0
  let i = 1
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
  do {
    last = arc
    i += 1
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
  } while (arc !== last && i < 14)
  return i - 1
}

export function convertSolarToLunarParts(day: number, month: number, year: number, timeZone = 7): LunarDate {
  const dayNumber = jdFromDate(day, month, year)
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853)
  let monthStart = getNewMoonDay(k + 1, timeZone)
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone)

  let a11 = getLunarMonth11(year, timeZone)
  let b11 = a11
  let lunarYear: number
  if (a11 >= monthStart) {
    lunarYear = year
    a11 = getLunarMonth11(year - 1, timeZone)
  } else {
    lunarYear = year + 1
    b11 = getLunarMonth11(year + 1, timeZone)
  }

  const lunarDay = dayNumber - monthStart + 1
  const diff = Math.floor((monthStart - a11) / 29)
  let lunarLeap = 0
  let lunarMonth = diff + 11
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone)
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10
      if (diff === leapMonthDiff) lunarLeap = 1
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1

  return { lunarYear, lunarMonth, lunarDay, isLeapMonth: lunarLeap === 1 }
}

/** Solar YYYY-MM-DD -> Vietnamese lunar date (UTC+7 by default). */
export function solarToLunar(date: string, timeZone = 7): LunarDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ''))
  if (!match) throw new Error(`Invalid solar date: ${date}`)
  const [, y, m, d] = match
  return convertSolarToLunarParts(Number(d), Number(m), Number(y), timeZone)
}

export interface CanChi {
  stem: Stem
  branch: Branch
  /** Position in the 60-year cycle, 0 = Giáp Tý. */
  cycleIndex: number
}

/** Can chi of a lunar year, e.g. 1984 -> Giáp Tý. */
export function canChiOfLunarYear(lunarYear: number): CanChi {
  const cycleIndex = (((lunarYear - 4) % 60) + 60) % 60
  return {
    stem: STEMS[cycleIndex % 10],
    branch: BRANCHES[cycleIndex % 12],
    cycleIndex,
  }
}
