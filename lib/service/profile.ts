/**
 * The interview answers: the tool's argument schema, merging one answer at a
 * time into the stored draft, and what is still missing before the pool.
 */
import { z } from 'zod'
import type { ProfileDraft } from '@/lib/db/repo'
import { calculateAge } from '@/lib/matching/privacy'
import type { MemberProfile } from '@/lib/matching/types'

/** Unknown keys (a model adding user_id, say) are stripped, never trusted. */
export const ProfileUpdateArgs = z.object({
  intent: z.enum(['friendship', 'casual', 'long_term', 'marriage']).optional(),
  gender: z.enum(['female', 'male', 'other']).optional(),
  seeking: z.enum(['female', 'male', 'both']).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').optional(),
  /** null means "Không nhớ" and clears a stored time. */
  birth_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM').nullable().optional(),
  city: z.string().trim().min(1).max(80).optional(),
  age_min: z.number().int().min(18).max(100).optional(),
  age_max: z.number().int().min(18).max(100).optional(),
  marital: z.enum(['single', 'divorced', 'widowed', 'married']).optional(),
  children: z.enum(['none', 'yes_live_with', 'yes_not_live_with']).optional(),
  wants_children: z.enum(['yes', 'no', 'unsure']).optional(),
  hobbies: z.array(z.string().trim().min(1).max(40)).min(1).max(8).optional(),
  open_answer: z.string().trim().min(1).max(600).optional(),
  occupation: z.string().trim().max(80).nullable().optional(),
})

export type ProfileUpdate = z.infer<typeof ProfileUpdateArgs>
export type ProfileError = 'invalid_birth_date' | 'under_18' | 'age_range_invalid'

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function uniqueHobbies(hobbies: string[]): string[] {
  const seen = new Set<string>()
  return hobbies.filter((h) => {
    const key = h.toLocaleLowerCase('vi-VN')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function applyProfileUpdate(current: ProfileDraft, update: ProfileUpdate, now: Date): { ok: true; profile: ProfileDraft } | { ok: false; error: ProfileError } {
  const next: ProfileDraft = { ...current }
  if (update.intent !== undefined) next.intent = update.intent
  if (update.gender !== undefined) next.gender = update.gender
  if (update.seeking !== undefined) next.seeking = update.seeking
  if (update.birth_time !== undefined) next.birthTime = update.birth_time
  if (update.city !== undefined) next.city = update.city
  if (update.age_min !== undefined) next.ageMin = update.age_min
  if (update.age_max !== undefined) next.ageMax = update.age_max
  if (update.marital !== undefined) next.marital = update.marital
  if (update.children !== undefined) next.children = update.children
  if (update.wants_children !== undefined) next.wantsChildren = update.wants_children
  if (update.hobbies !== undefined) next.hobbies = uniqueHobbies(update.hobbies)
  if (update.open_answer !== undefined) next.openAnswer = update.open_answer
  if (update.occupation !== undefined) next.occupation = update.occupation || null

  if (update.birth_date !== undefined) {
    const age = isRealDate(update.birth_date) ? calculateAge(update.birth_date, now) : null
    if (age === null || age < 0 || age > 110) return { ok: false, error: 'invalid_birth_date' }
    if (age < 18) return { ok: false, error: 'under_18' }
    next.birthDate = update.birth_date
  }

  // The spec's default age range: her own age ±5.
  if (next.birthDate && (next.ageMin === null || next.ageMax === null)) {
    const age = calculateAge(next.birthDate, now) ?? 18
    next.ageMin ??= Math.max(18, age - 5)
    next.ageMax ??= Math.min(100, age + 5)
  }
  if (next.ageMin !== null && next.ageMax !== null && next.ageMin > next.ageMax) {
    return { ok: false, error: 'age_range_invalid' }
  }
  return { ok: true, profile: next }
}

const serious = (intent: ProfileDraft['intent']) => intent === 'long_term' || intent === 'marriage'

/** Interview answers still needed before the card, in interview order (tool argument names). */
export function missingFields(p: ProfileDraft): string[] {
  const missing: string[] = []
  if (!p.intent) missing.push('intent')
  if (!p.gender) missing.push('gender')
  if (!p.seeking) missing.push('seeking')
  if (!p.birthDate) missing.push('birth_date')
  if (!p.city) missing.push('city')
  if (p.ageMin === null || p.ageMax === null) missing.push('age_range')
  if (!p.marital) missing.push('marital')
  if (!p.children) missing.push('children')
  if (serious(p.intent) && !p.wantsChildren) missing.push('wants_children')
  if (p.hobbies.length === 0) missing.push('hobbies')
  if (!p.openAnswer) missing.push('open_answer')
  return missing
}

/** The matching core's view of a complete profile, or null while answers are missing. */
export function toMemberProfile(memberId: string, p: ProfileDraft): MemberProfile | null {
  if (missingFields(p).length > 0) return null
  return {
    memberId,
    intent: p.intent!,
    gender: p.gender!,
    seeking: p.seeking!,
    birthDate: p.birthDate!,
    birthTime: p.birthTime,
    city: p.city,
    ageMin: p.ageMin!,
    ageMax: p.ageMax!,
    marital: p.marital!,
    children: p.children!,
    wantsChildren: p.wantsChildren,
    hobbies: p.hobbies,
    openAnswer: p.openAnswer,
    occupation: p.occupation,
  }
}
