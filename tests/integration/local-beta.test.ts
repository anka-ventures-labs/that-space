/**
 * Local beta acceptance: the real tool dispatcher, PGlite migrations and the
 * fake Discourse boundary exercise the member journey without external state.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getMemberByDiscourseId } from '@/lib/db/repo'
import { HELD_CONTACT, MATCH_ENDED } from '@/lib/service/copy'
import { HIM, HIS_SUMMARY, PROFILE, createHarness, onboard, testUser, type Harness, type TestUser } from '../helpers/service'

let h: Harness | undefined

beforeEach(async () => {
  h = await createHarness()
})

afterEach(async () => {
  await h?.close()
})

function harness(): Harness {
  if (!h) throw new Error('test harness was not created')
  return h
}

async function interviewOneAnswerAtATime(user: TestUser) {
  const service = harness()
  expect((await service.call('status', user)).body).toMatchObject({
    opted_in: false,
    consent: { version: expect.any(String), text: expect.stringContaining('quản trị viên') },
  })
  expect((await service.call('consent', user, { action: 'opt_in', adult_confirmed: true })).body).toMatchObject({ ok: true })

  const answers = [
    { intent: PROFILE.intent },
    { gender: PROFILE.gender },
    { seeking: PROFILE.seeking },
    { birth_date: PROFILE.birth_date },
    { city: PROFILE.city },
    { age_min: PROFILE.age_min },
    { age_max: PROFILE.age_max },
    { marital: PROFILE.marital },
    { children: PROFILE.children },
    { wants_children: PROFILE.wants_children },
    { hobbies: PROFILE.hobbies },
    { open_answer: PROFILE.open_answer },
  ]
  for (const answer of answers) expect((await service.call('profile_update', user, answer)).body.ok).toBe(true)

  const preview = await service.call('card_preview', user)
  expect(preview.body).toMatchObject({ ok: true, confirmed: false, card: { region: null, initial: null } })
  const visible = JSON.stringify(preview.body.card)
  expect(visible).not.toContain(PROFILE.birth_date)
  expect(visible).not.toContain(PROFILE.city)

  expect((await service.call('card_confirm', user, { summary_text: 'Thích leo núi, nấu ăn và những cuộc trò chuyện dài.' })).body)
    .toMatchObject({ ok: true, in_pool: true })
}

describe('local Bà Mối beta acceptance', () => {
  it('keeps the entire anonymous path private until mutual reveal, then blocks future relay and discovery', async () => {
    const service = harness()
    const lan = testUser('lan')
    const nam = testUser('nam')
    await interviewOneAnswerAtATime(lan)
    await onboard(service, nam, HIM, HIS_SUMMARY)

    const opened = await service.call('box_open', lan)
    expect(opened.body).toMatchObject({ ok: true, result: 'match' })
    const intro = opened.body.introduction
    expect(JSON.stringify(intro)).not.toContain(HIM.birth_date)
    expect(JSON.stringify(intro)).not.toContain('nam')

    expect((await service.call('interest', lan, { discovery_id: intro.discovery_id })).body).toMatchObject({ ok: true, result: 'sent' })
    const inbox = await service.call('signals', nam)
    const [signal] = inbox.body.signals
    expect(JSON.stringify(signal)).not.toContain(PROFILE.birth_date)
    expect(JSON.stringify(signal)).not.toContain(PROFILE.city)
    expect((await service.call('signal_respond', nam, { signal_id: signal.signal_id, response: 'accept' })).body)
      .toMatchObject({ ok: true, result: 'matched' })

    const topicsForLan = service.discourse.pmsTo(lan.username)
    const topicsForNam = service.discourse.pmsTo(nam.username)
    expect(topicsForLan).toHaveLength(1)
    expect(topicsForNam).toHaveLength(1)
    const topicLan = topicsForLan[0].topicId
    const topicNam = topicsForNam[0].topicId
    const [match] = (await service.call('matches', lan)).body.matches

    service.discourse.clear()
    const heldPost = { id: 71001, topic_id: topicLan, user_id: lan.user_id, raw: 'Số mình là 0912 345 678.' }
    expect((await service.webhook(heldPost, { secret: 'not-the-webhook-secret' })).status).toBe(401)
    expect((await service.webhook({ ...heldPost, id: 71002, user_id: nam.user_id, raw: 'Giả làm Lan' })).body.outcome).toBe('ignored_author')
    expect((await service.webhook(heldPost)).body.outcome).toBe('held')
    expect(service.discourse.postsIn(topicLan)).toEqual([HELD_CONTACT])
    expect(service.discourse.postsIn(topicNam)).toEqual([])

    expect((await service.call('match_action', lan, { match_id: match.match_id, action: 'reveal' })).body.result).toBe('waiting_for_other')
    expect((await service.call('match_action', nam, { match_id: match.match_id, action: 'reveal' })).body.result).toBe('revealed')
    expect(service.discourse.postsIn(topicLan).join('\n')).toContain('https://forum.test/u/nam')
    expect(service.discourse.postsIn(topicNam).join('\n')).toContain('https://forum.test/u/lan')

    expect((await service.webhook({ ...heldPost, id: 71003 })).body.outcome).toBe('relayed')
    expect(service.discourse.postsIn(topicNam).join('\n')).toContain('0912 345 678')

    expect((await service.call('match_action', nam, { match_id: match.match_id, action: 'block' })).body.result).toBe('blocked')
    expect((await service.webhook({ ...heldPost, id: 71004, raw: 'Còn đó không?' })).body.outcome).toBe('ignored_closed')
    service.setNow(new Date(service.now.getTime() + 24 * 60 * 60 * 1000))
    expect((await service.call('box_open', lan)).body.result).toBe('no_match')
  })

  it('preserves the deletion notice through a Discourse outage and delivers it from the retry queue', async () => {
    const service = harness()
    const lan = testUser('lan')
    const nam = testUser('nam')
    await onboard(service, lan)
    await onboard(service, nam, HIM, HIS_SUMMARY)
    const opened = await service.call('box_open', lan)
    await service.call('interest', lan, { discovery_id: opened.body.introduction.discovery_id })
    const [signal] = (await service.call('signals', nam)).body.signals
    await service.call('signal_respond', nam, { signal_id: signal.signal_id, response: 'accept' })
    const topicNam = service.discourse.pmsTo(nam.username)[0].topicId

    service.discourse.clear()
    service.discourse.failNext(1)
    expect((await service.call('consent', lan, { action: 'delete', confirm: true })).body).toMatchObject({ ok: true, deleted: true })
    expect(await getMemberByDiscourseId(service.db, lan.user_id)).toBeNull()
    expect(service.discourse.postsIn(topicNam)).toEqual([])

    service.setNow(new Date(Date.now() + 60_000))
    expect((await service.cron()).body).toMatchObject({ ok: true, claimed: 1, sent: 1 })
    expect(service.discourse.postsIn(topicNam)).toEqual([MATCH_ENDED])
  })
})
