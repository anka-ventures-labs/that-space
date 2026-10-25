// Shared types for Bà Mối's matching core. Field values mirror the spec's
// interview (docs/ba-moi-spec.md). Everything here is pure data: no I/O.

export type Intent = 'friendship' | 'casual' | 'long_term' | 'marriage'
export type Gender = 'female' | 'male' | 'other'
export type Seeking = 'female' | 'male' | 'both'
export type MaritalStatus = 'single' | 'divorced' | 'widowed' | 'married'
export type Children = 'none' | 'yes_live_with' | 'yes_not_live_with'
export type WantsChildren = 'yes' | 'no' | 'unsure'
export type Region = 'miền Bắc' | 'miền Trung' | 'miền Nam' | 'Việt Nam'
export type Element = 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ'

/** A member's private profile. Never leaves the service. */
export interface MemberProfile {
  memberId: string
  intent: Intent
  gender: Gender
  seeking: Seeking
  /** Solar date, YYYY-MM-DD. */
  birthDate: string
  /** Optional HH:MM; used only for astrology, never shown. */
  birthTime?: string | null
  city?: string | null
  ageMin: number
  ageMax: number
  marital: MaritalStatus
  children: Children
  /** Only asked for long-term and marriage intents. */
  wantsChildren?: WantsChildren | null
  hobbies: string[]
  openAnswer?: string | null
  occupation?: string | null
}

/** Pool eligibility state, kept alongside the profile. */
export interface PoolState {
  discoverable: boolean
  paused: boolean
  deleted: boolean
  isSample?: boolean
}

/** The anonymous card other members may see. No personal identifiers. */
export interface PoolCard {
  ageBand: string | null
  region: Region | null
  initial: string | null
  gender: Gender
  seeking: Seeking
  intent: Intent
  hobbies: string[]
  /** Nạp âm element of the birth year. */
  element: Element | null
  /** Day master as Moon shows it, e.g. "Giáp Mộc". Never the full day pillar. */
  dayMaster: string | null
  summary?: string | null
  isSample?: boolean
}
