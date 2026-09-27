/**
 * What the relay does with one post's text (plan: webhook and relay policy).
 * Text only, always: attachments are never relayed. Quotes and @mentions are
 * always stripped. Before a reveal, text with any contact detail (phone,
 * email, link, social handle, spelled-out digits) is held.
 */
import { findContactDetails } from '@/lib/matching/contact'

export const RELAY_MAX_LENGTH = 1200
export const RELAY_PER_MINUTE = 12

// Discourse uploads (upload://), markdown images, HTML media, attachment links.
const ATTACHMENT_RE = /upload:\/\/|!\[[^\]]*\]\([^)]*\)|<\s*(?:img|video|audio|iframe|source)\b|\|attachment\]/i
// An innermost quote: one whose body holds no other [quote.
const BBCODE_QUOTE_RE = /\[quote(?:=[^\]]*)?\](?:(?!\[quote)[\s\S])*?\[\/quote\]/gi
const STRAY_QUOTE_TAG_RE = /\[\/?quote(?:=[^\]]*)?\]/gi
const MARKDOWN_QUOTE_RE = /^[ \t]*>.*$/gm
const MENTION_RE = /(^|[^\p{L}\p{N}_])@[\p{L}\p{N}_.-]+/gu

export type RelayDecision =
  | { action: 'relay'; text: string }
  | { action: 'hold'; reason: 'contact' | 'attachment' }
  | { action: 'drop' }

export function decideRelay(raw: string, revealed: boolean): RelayDecision {
  if (ATTACHMENT_RE.test(raw)) return { action: 'hold', reason: 'attachment' }
  let text = raw
  for (let previous = ''; previous !== text;) {
    previous = text
    text = text.replace(BBCODE_QUOTE_RE, '') // innermost first, until no quote is left
  }
  text = text.replace(STRAY_QUOTE_TAG_RE, '').replace(MARKDOWN_QUOTE_RE, '').replace(MENTION_RE, '$1').replace(/\n{3,}/g, '\n\n').trim()
  if (!text) return { action: 'drop' }
  if (!revealed && findContactDetails(text).length > 0) return { action: 'hold', reason: 'contact' }
  return { action: 'relay', text }
}
