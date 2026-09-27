/**
 * Anonymity rules for Bà Mối, ported from Moon (lib/nhan-duyen/privacy.ts and
 * the chat alias helpers in lib/nhan-duyen/conversations.ts). Changes from
 * Moon: a third gender ('other'), cards carry intent/hobbies/element, and ages
 * are computed on the Vietnam calendar day.
 */
import type { Element, Gender, Intent, MemberProfile, PoolCard, Region, Seeking } from './types'
import { STEMS, BRANCHES } from './lunar'

/** Initial and region are only shown when at least this many members share them. */
export const MIN_K_ANONYMITY = 5
export const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh'

/** The Vietnam calendar date (YYYY-MM-DD) for an instant. */
export function vnDate(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(at)
  const get = (type: string) => parts.find((p) => p.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function calculateAge(birthDate: string | null | undefined, at: Date = new Date()): number | null {
  const birth = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birthDate || ''))
  if (!birth) return null
  const today = /^(\d{4})-(\d{2})-(\d{2})$/.exec(vnDate(at))!
  const [by, bm, bd] = birth.slice(1).map(Number)
  const [ty, tm, td] = today.slice(1).map(Number)
  let age = ty - by
  if (tm < bm || (tm === bm && td < bd)) age--
  return age
}

export function isAdult(birthDate: string | null | undefined, at: Date = new Date()): boolean {
  const age = calculateAge(birthDate, at)
  return age !== null && age >= 18
}

export function ageBandForAge(age: number | null | undefined): string | null {
  if (age == null || age < 18) return null
  if (age < 25) return '18-24'
  if (age >= 70) return '70+'
  const start = Math.floor(age / 5) * 5
  return `${start}-${start + 4}`
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\b(tinh|thanh pho|tp|province|city)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const NORTH = ['ha noi', 'hai phong', 'quang ninh', 'bac giang', 'bac kan', 'bac ninh', 'cao bang',
  'dien bien', 'ha giang', 'ha nam', 'hai duong', 'hoa binh', 'hung yen', 'lai chau',
  'lang son', 'lao cai', 'nam dinh', 'ninh binh', 'phu tho', 'son la', 'thai binh',
  'thai nguyen', 'tuyen quang', 'vinh phuc', 'yen bai']
const CENTRAL = ['da nang', 'hue', 'thua thien hue', 'thanh hoa', 'nghe an', 'ha tinh', 'quang binh',
  'quang tri', 'quang nam', 'quang ngai', 'binh dinh', 'phu yen', 'khanh hoa',
  'ninh thuan', 'binh thuan', 'kon tum', 'gia lai', 'dak lak', 'dak nong', 'lam dong']
const SOUTH = ['ho chi minh', 'sai gon', 'hcm', 'ba ria', 'vung tau', 'binh duong', 'binh phuoc', 'dong nai',
  'tay ninh', 'long an', 'tien giang', 'ben tre', 'tra vinh', 'vinh long', 'dong thap',
  'an giang', 'kien giang', 'can tho', 'hau giang', 'soc trang', 'bac lieu', 'ca mau']

/** Coarse region for a city. Always computed; exposure is gated by the rule of 5. */
export function regionForCity(city: string | null | undefined): Region | null {
  if (!city) return null
  const normalized = normalizeText(city)
  if (NORTH.some((t) => normalized.includes(t))) return 'miền Bắc'
  if (CENTRAL.some((t) => normalized.includes(t))) return 'miền Trung'
  if (SOUTH.some((t) => normalized.includes(t))) return 'miền Nam'
  return 'Việt Nam'
}

export function nameInitial(name: string | null | undefined, bucketSize: number, minK = MIN_K_ANONYMITY): string | null {
  if (!name || bucketSize < minK) return null
  const first = Array.from(name.trim())[0]
  return first ? `${first.toLocaleUpperCase('vi-VN')}.` : null
}

export interface CardInput {
  profile: Pick<MemberProfile, 'birthDate' | 'city' | 'gender' | 'seeking' | 'intent' | 'hobbies'>
  element: Element | null
  dayMaster?: string | null
  displayName?: string | null
  /** How many discoverable members share this member's region. */
  regionBucketSize: number
  /** How many discoverable members share this member's initial. */
  initialBucketSize: number
  summary?: string | null
  isSample?: boolean
  at?: Date
}

/** The anonymous card. Region and initial appear only under the rule of 5. */
export function buildPoolCard(input: CardInput): PoolCard {
  const region = regionForCity(input.profile.city)
  return {
    ageBand: ageBandForAge(calculateAge(input.profile.birthDate, input.at)),
    region: region && input.regionBucketSize >= MIN_K_ANONYMITY ? region : null,
    initial: nameInitial(input.displayName, input.initialBucketSize),
    gender: input.profile.gender,
    seeking: input.profile.seeking,
    intent: input.profile.intent,
    hobbies: [...input.profile.hobbies].slice(0, 5),
    element: input.element,
    dayMaster: input.dayMaster ?? null,
    summary: input.summary ?? null,
    isSample: input.isSample || undefined,
  }
}

// ── Leak check (Moon) ─────────────────────────────────────────────────────

const CAN_CHI_PAIR_RE = new RegExp(`(?<![\\p{L}])(${STEMS.join('|')})\\s+(${BRANCHES.join('|')})(?![\\p{L}])`, 'iu')
const DOB_RE = /\b(?:(?:19|20)\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])|(?:0?[1-9]|[12]\d|3[01])[-/.](?:0?[1-9]|1[0-2])[-/.](?:19|20)\d{2})\b/u
const TIME_RE = /\b(?:[01]?\d|2[0-3]):[0-5]\d\b/u

// Common Vietnamese name syllables that are also ordinary words; only flag
// them when they appear as a name ("tên là Thảo", "chị Linh").
const COMMON_WORD_NAMES = new Set([
  'an', 'binh', 'bình', 'duyen', 'duyên', 'hanh', 'hạnh', 'linh', 'minh',
  'phuc', 'phúc', 'thao', 'thảo', 'yen', 'yên', 'mai', 'lan', 'hoa', 'ngoc', 'ngọc',
])

export interface LeakCheck {
  ok: boolean
  violations: string[]
}

function isIdentifierChar(char: string): boolean {
  return !!char && /[\p{L}\p{N}_]/u.test(char)
}

function containsWholeTerm(haystack: string, needle: string): boolean {
  let offset = 0
  while (offset <= haystack.length) {
    const index = haystack.indexOf(needle, offset)
    if (index === -1) return false
    const before = index > 0 ? haystack[index - 1] : ''
    const after = haystack[index + needle.length] || ''
    if (!isIdentifierChar(before) && !isIdentifierChar(after)) return true
    offset = index + needle.length
  }
  return false
}

function containsNameUse(haystack: string, needle: string): boolean {
  let offset = 0
  while (offset < haystack.length) {
    const index = haystack.indexOf(needle, offset)
    if (index === -1) return false
    const before = index > 0 ? haystack[index - 1] : ''
    const after = haystack[index + needle.length] || ''
    if (!isIdentifierChar(before) && !isIdentifierChar(after)) {
      const beforeText = haystack.slice(Math.max(0, index - 64), index).trimEnd()
      const afterText = haystack.slice(index + needle.length, index + needle.length + 64).trimStart()
      if (/(?:^|\s)(?:tên|ten|tên\s+là|ten\s+la|gọi\s+là|goi\s+la|người\s+ấy\s+là|nguoi\s+ay\s+la|lộ\s+là|lo\s+la|anh|chị|chi|em|cô|co)$/u.test(beforeText)) return true
      if (/^(?:là\s+tên|la\s+ten)(?:\s|$)/u.test(afterText)) return true
    }
    offset = index + needle.length
  }
  return false
}

/**
 * Reject text that could identify someone: birth dates, birth times, can-chi
 * pairs (which reveal a birth year), and the person's own identifying terms
 * (name, username, city, occupation).
 */
export function checkTextForLeaks(text: string, forbiddenTerms: Array<string | null | undefined> = []): LeakCheck {
  const violations: string[] = []
  if (DOB_RE.test(text)) violations.push('dob')
  if (TIME_RE.test(text)) violations.push('birth_time')
  if (CAN_CHI_PAIR_RE.test(text)) violations.push('can_chi_pillar')
  const lower = text.toLocaleLowerCase('vi-VN')
  for (const term of forbiddenTerms) {
    const cleaned = term?.trim().toLocaleLowerCase('vi-VN')
    if (!cleaned || cleaned.length < 2) continue
    const single = /^[\p{L}]+$/u.test(cleaned) && COMMON_WORD_NAMES.has(cleaned)
    if (single ? containsNameUse(lower, cleaned) : containsWholeTerm(lower, cleaned)) {
      violations.push(`forbidden_term:${term!.trim()}`)
    }
  }
  return { ok: violations.length === 0, violations }
}

// ── Chat aliases (Moon's conversation labels) ─────────────────────────────

export type AddressLabel = 'Anh' | 'Chị' | 'Em' | 'Bạn'

/** How the viewer addresses the peer: younger is "Em", otherwise by gender. */
export function addressLabel(viewerAge: number | null, peerAge: number | null, peerGender: Gender): AddressLabel {
  if (viewerAge != null && peerAge != null && peerAge < viewerAge) return 'Em'
  if (peerGender === 'male') return 'Anh'
  if (peerGender === 'female') return 'Chị'
  return 'Bạn'
}

/** "Chị L." when the initial passes the rule of 5, otherwise "Chị ấy". */
export function aliasFor(address: AddressLabel, initial: string | null): string {
  return initial ? `${address} ${initial}` : `${address} ấy`
}

export const INTENT_LABELS: Record<Intent, string> = {
  friendship: 'Kết bạn',
  casual: 'Hẹn hò vui vẻ, không ràng buộc',
  long_term: 'Mối quan hệ lâu dài',
  marriage: 'Kết hôn',
}

export const SEEKING_LABELS: Record<Seeking, string> = {
  female: 'Nữ',
  male: 'Nam',
  both: 'Cả hai',
}
