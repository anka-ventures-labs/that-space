/**
 * Contact-detail detection for the relay, used before both members reveal.
 * Mature libraries do the heavy lifting: libphonenumber-js finds phone numbers
 * (VN default) and linkify-it finds URLs and emails. A small layer adds
 * platform keywords, obfuscated emails and spelled-out Vietnamese digits.
 *
 * The relay supplies a rolling cross-message window so fragments in separate
 * posts are evaluated together before reveal.
 */
import { findPhoneNumbersInText } from 'libphonenumber-js'
import { linkifyit } from 'linkify-it'

export type ContactFinding = 'phone' | 'email' | 'url' | 'handle' | 'spelled_digits'

// Fuzzy matching is off by default in v6; bare domains like fb.com/x must be caught.
const linkify = linkifyit().set({ fuzzyLink: true, fuzzyEmail: true })

const HANDLE_RE = /(?<![\p{L}\p{N}])(?:zalo|zl|tele|telegram|facebook|fb|messenger|insta|instagram|ig|tiktok|viber|whatsapp|sđt|sdt|số\s*điện\s*thoại|so\s*dien\s*thoai|số\s*đt|so\s*dt)(?![\p{L}\p{N}])/iu

const OBFUSCATED_EMAIL_RE = /[\p{L}\p{N}._+-]+\s*(?:\(at\)|\[at\]|\sat\s|a\s*còng|a\s*cong)\s*[\p{L}\p{N}-]+\s*(?:\(dot\)|\[dot\]|\sdot\s|\schấm\s|\scham\s|\.)\s*(?:com|vn|net|org|edu)(?![\p{L}])/iu

/** Runs of digits with separators that add up to at least 9 digits. */
const DIGIT_RUN_RE = /(?:\d[\s.\-_/]*){9,}/

const DIGIT_WORDS = new Set([
  'không', 'khong', 'một', 'mot', 'mốt', 'hai', 'ba', 'bốn', 'bon', 'tư', 'năm',
  'lăm', 'nam', 'sáu', 'sau', 'bảy', 'bẩy', 'bay', 'tám', 'tam', 'chín', 'chin',
  'linh', 'lẻ',
])

function hasSpelledDigits(text: string, minRun = 7): boolean {
  const tokens = text.toLocaleLowerCase('vi-VN').split(/[^\p{L}]+/u).filter(Boolean)
  let run = 0
  for (const token of tokens) {
    run = DIGIT_WORDS.has(token) ? run + 1 : 0
    if (run >= minRun) return true
  }
  return false
}

export function findContactDetails(text: string): ContactFinding[] {
  const findings = new Set<ContactFinding>()
  if (!text) return []

  if (findPhoneNumbersInText(text, 'VN').length > 0 || DIGIT_RUN_RE.test(text)) findings.add('phone')

  for (const match of linkify.match(text) ?? []) {
    findings.add(match.schema === 'mailto:' ? 'email' : 'url')
  }
  if (OBFUSCATED_EMAIL_RE.test(text)) findings.add('email')
  if (HANDLE_RE.test(text)) findings.add('handle')
  if (hasSpelledDigits(text)) findings.add('spelled_digits')

  return [...findings]
}

export function containsContactDetails(text: string): boolean {
  return findContactDetails(text).length > 0
}
