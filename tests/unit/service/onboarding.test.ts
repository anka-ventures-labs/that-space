import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getCard, getMemberByDiscourseId, getProfile, recordConsent } from '@/lib/db/repo'
import { redactCardForCurrentPool } from '@/lib/service/cards'
import { CONSENT_TEXT, CONSENT_VERSION } from '@/lib/service/copy'
import { PROFILE, createHarness, onboard, testUser, type Harness } from '../../helpers/service'

let h: Harness
beforeAll(async () => {
  h = await createHarness()
})
afterAll(async () => h.close())

async function memberOf(user: { user_id: number }) {
  return (await getMemberByDiscourseId(h.db, user.user_id))!
}

describe('consent', () => {
  it('shows the versioned consent text until she agrees, and gates everything behind it', async () => {
    const user = testUser('lan')
    const before = await h.call('status', user)
    expect(before.body).toMatchObject({ ok: true, opted_in: false, consent: { version: CONSENT_VERSION, text: CONSENT_TEXT } })
    expect(CONSENT_TEXT).toContain('quản trị viên')
    expect((await h.call('profile_update', user, { intent: 'friendship' })).body.error).toBe('consent_required')
    expect((await h.call('box_open', user)).body.error).toBe('consent_required')

    expect((await h.call('consent', user, { action: 'opt_in' })).body.error).toBe('adult_required')
    expect((await h.call('consent', user, { action: 'opt_in', adult_confirmed: true })).body).toMatchObject({ ok: true, opted_in: true })
    const after = await h.call('status', user)
    expect(after.body).toMatchObject({ opted_in: true, consent: null, card: 'none' })
  })

  it('pauses and resumes', async () => {
    const user = testUser('mai')
    await onboard(h, user)
    await h.call('consent', user, { action: 'pause' })
    expect((await h.call('box_open', user)).body.error).toBe('paused')
    expect((await h.call('status', user)).body.paused).toBe(true)
    await h.call('consent', user, { action: 'resume' })
    expect((await h.call('status', user)).body.paused).toBe(false)
  })

  it('requires the current consent version before a member can use the pool again', async () => {
    const user = testUser('van')
    await h.call('consent', user, { action: 'opt_in', adult_confirmed: true })
    const member = await memberOf(user)
    await recordConsent(h.db, member.id, 'beta-old-version', h.now)

    const stale = await h.call('status', user)
    expect(stale.body).toMatchObject({ opted_in: false, consent: { version: CONSENT_VERSION, text: CONSENT_TEXT } })
    expect((await h.call('profile_update', user, { intent: 'friendship' })).body.error).toBe('consent_required')
    expect((await h.call('card_preview', user)).body.error).toBe('consent_required')
    expect((await h.call('box_open', user)).body.error).toBe('consent_required')
  })
})

describe('rule-of-5 presentation', () => {
  const card = {
    ageBand: '30-34', region: 'miền Bắc' as const, initial: 'L.', gender: 'female' as const, seeking: 'male' as const,
    intent: 'long_term' as const, hobbies: ['đọc sách'], element: 'Mộc' as const, dayMaster: 'Giáp Mộc', summary: 'Thích đọc sách.',
  }

  it('redacts identifiers from an old card when a bucket drops below five', () => {
    const low = { regions: new Map([['miền Bắc', 4]]), initials: new Map([['L', 4]]) }
    expect(redactCardForCurrentPool(card, low)).toMatchObject({ region: null, initial: null })

    const sufficient = { regions: new Map([['miền Bắc', 5]]), initials: new Map([['L', 5]]) }
    expect(redactCardForCurrentPool(card, sufficient)).toMatchObject({ region: 'miền Bắc', initial: 'L.' })
  })
})

describe('the interview', () => {
  it('takes answers one at a time and reports what is still missing', async () => {
    const user = testUser('hoa')
    await h.call('consent', user, { action: 'opt_in', adult_confirmed: true })
    const first = await h.call('profile_update', user, { intent: 'marriage' })
    expect(first.body.missing).toEqual(['gender', 'seeking', 'birth_date', 'city', 'age_range', 'marital', 'children', 'wants_children', 'hobbies', 'open_answer'])

    const withBirth = await h.call('profile_update', user, { gender: 'female', seeking: 'male', birth_date: '1992-03-10' })
    expect(withBirth.body.age_range).toEqual({ min: 29, max: 39 }) // her age ±5 by default
    expect(withBirth.body.missing).not.toContain('age_range')

    const friendship = await h.call('profile_update', user, { intent: 'friendship' })
    expect(friendship.body.missing).not.toContain('wants_children') // only asked for serious intents
  })

  it('rejects impossible dates, under-18s and inverted age ranges', async () => {
    const user = testUser('nga')
    await h.call('consent', user, { action: 'opt_in', adult_confirmed: true })
    expect((await h.call('profile_update', user, { birth_date: '1990-02-30' })).body.error).toBe('invalid_birth_date')
    expect((await h.call('profile_update', user, { birth_date: '2010-01-01' })).body.error).toBe('under_18')
    expect((await h.call('profile_update', user, { age_min: 40, age_max: 30 })).body.error).toBe('age_range_invalid')
    expect(await getProfile(h.db, (await memberOf(user)).id)).toBeNull()
  })

  it('clears a birth time when she says she does not remember', async () => {
    const user = testUser('thu')
    await h.call('consent', user, { action: 'opt_in', adult_confirmed: true })
    await h.call('profile_update', user, { birth_date: '1990-05-01', birth_time: '23:30' })
    await h.call('profile_update', user, { birth_time: null })
    expect((await getProfile(h.db, (await memberOf(user)).id))?.birthTime).toBeNull()
  })
})

describe('the card', () => {
  it('previews the card with a template summary before she confirms', async () => {
    const user = testUser('linh')
    await h.call('consent', user, { action: 'opt_in', adult_confirmed: true })
    expect((await h.call('card_preview', user)).body.error).toBe('profile_incomplete')
    await h.call('profile_update', user, PROFILE)
    const preview = await h.call('card_preview', user)
    expect(preview.body).toMatchObject({
      ok: true, confirmed: false, template_summary: 'Mối quan hệ lâu dài. Lúc rảnh thích đọc sách, leo núi, nấu ăn.',
      card: { ageBand: '35-39', gender: 'female', seeking: 'male', intent: 'long_term', region: null, initial: null },
    })
    expect(preview.body.card.dayMaster).toMatch(/^\S+ (Kim|Mộc|Thủy|Hỏa|Thổ)$/)
    expect(JSON.stringify(preview.body.card)).not.toMatch(/1990|Hà Nội|Canh Ngọ/)
  })

  it('refuses a summary that could identify her, and says why', async () => {
    const user = testUser('uyen')
    await h.call('consent', user, { action: 'opt_in', adult_confirmed: true })
    await h.call('profile_update', user, { ...PROFILE, occupation: 'Bác sĩ nhi' })
    const leaky = await h.call('card_confirm', user, {
      summary_text: 'Mình là uyen, bác sĩ nhi ở Hà Nội, sinh 01/05/1990, zalo 0912 345 678.',
    })
    expect(leaky.body).toMatchObject({ ok: false, error: 'summary_leaks' })
    expect(leaky.body.violations).toEqual(expect.arrayContaining([
      'dob', 'forbidden_term:uyen', 'forbidden_term:Hà Nội', 'forbidden_term:Bác sĩ nhi', 'contact:phone', 'contact:handle',
    ]))
    expect((await getCard(h.db, (await memberOf(user)).id))).toBeNull()

    const clean = await h.call('card_confirm', user, { summary_text: 'Mê leo núi, thích nấu những bữa cơm nhà thật chậm.' })
    expect(clean.body).toMatchObject({ ok: true, in_pool: true, card: { summary: 'Mê leo núi, thích nấu những bữa cơm nhà thật chậm.' } })
    expect((await h.call('status', user)).body.card).toBe('confirmed')
  })

  it('asks for re-confirmation after a key change, but follows hobbies silently', async () => {
    const user = testUser('yen')
    await onboard(h, user)
    const hobbies = await h.call('profile_update', user, { hobbies: ['bơi', 'gốm'] })
    expect(hobbies.body.card_needs_confirmation).toBe(false)
    const card = await getCard(h.db, (await memberOf(user)).id)
    expect(card).toMatchObject({ discoverable: true, card: { hobbies: ['bơi', 'gốm'] } })

    const intent = await h.call('profile_update', user, { intent: 'friendship', seeking: 'female' })
    expect(intent.body.card_needs_confirmation).toBe(true)
    expect((await h.call('status', user)).body.card).toBe('needs_confirmation')
    expect((await h.call('box_open', user)).body.error).toBe('card_unconfirmed')
  })
})

describe('deletion', () => {
  it('needs an explicit confirmation, then removes her matchmaking data', async () => {
    const user = testUser('bich')
    await onboard(h, user)
    expect((await h.call('consent', user, { action: 'delete' })).body.error).toBe('confirm_required')
    expect((await h.call('consent', user, { action: 'delete', confirm: true })).body).toMatchObject({ ok: true, deleted: true })
    expect(await getMemberByDiscourseId(h.db, user.user_id)).toBeNull()
    // Talking to Bà Mối again starts over.
    expect((await h.call('status', user)).body).toMatchObject({ opted_in: false, card: 'none' })
  })
})
