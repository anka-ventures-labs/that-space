import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getMemberByDiscourseId } from '@/lib/db/repo'
import {
  BLOCK_CONFIRMED, HELD_ATTACHMENT, HELD_CONTACT, MATCH_ENDED, RATE_LIMITED, SIGNAL_RECEIVED, TOO_LONG,
  relayedMessage, revealAsked, revealed,
} from '@/lib/service/copy'
import { decideRelay } from '@/lib/service/relay-policy'
import fixture from '../../fixtures/discourse/post_created.json'
import { BOT_USER_IDS, HIM, HIS_SUMMARY, confirmedCall, createHarness, matchedPair, onboard, testUser, type Harness } from '../../helpers/service'

describe('relay policy', () => {
  it('holds contact details before a reveal and relays them after', () => {
    for (const text of ['Số mình 0912 345 678 nhé', 'email: lan@example.com', 'xem fb.com/lan.nguyen', 'add zalo mình đi', 'không chín một hai ba bốn năm sáu bảy tám']) {
      expect(decideRelay(text, false), text).toEqual({ action: 'hold', reason: 'contact' })
      expect(decideRelay(text, true).action, text).toBe('relay')
    }
  })

  it('holds contact details assembled across message boundaries', () => {
    expect(decideRelay('23 45 67', false, '09 01')).toEqual({ action: 'hold', reason: 'contact' })
    expect(decideRelay('gmail.com', false, 'lan@')).toEqual({ action: 'hold', reason: 'contact' })
    expect(decideRelay('lo mình nhé', false, 'add za')).toEqual({ action: 'hold', reason: 'contact' })
    expect(decideRelay('23 45 67', true, '09 01').action).toBe('relay')
  })

  it('never relays attachments, even after a reveal', () => {
    for (const raw of ['![anh|690x388](upload://abc.jpeg)', 'xem nè <img src="x.png">', '[cv.pdf|attachment](upload://f.pdf)']) {
      expect(decideRelay(raw, true)).toEqual({ action: 'hold', reason: 'attachment' })
    }
  })

  it('strips quotes and mentions, and drops what is left empty', () => {
    expect(decideRelay('[quote="lan, post:1, topic:5"]\ncũ\n[/quote]\nChào @nam_nguyen, hôm nay thế nào?', false))
      .toEqual({ action: 'relay', text: 'Chào , hôm nay thế nào?' })
    expect(decideRelay('> trích dẫn\nỪ', false)).toEqual({ action: 'relay', text: 'Ừ' })
    expect(decideRelay('[quote]a [quote]b[/quote] c[/quote]', false)).toEqual({ action: 'drop' })
    expect(decideRelay('[quote]a [quote]b[/quote] c[/quote] còn lại', false)).toEqual({ action: 'relay', text: 'còn lại' })
    expect(decideRelay('[quote="x"]không đóng', false)).toEqual({ action: 'relay', text: 'không đóng' })
    expect(decideRelay('@nam', false)).toEqual({ action: 'drop' })
  })
})

describe('the relay webhook', () => {
  let h: Harness
  beforeEach(async () => {
    h = await createHarness()
  })
  afterEach(async () => h.close())

  let postId = 70000
  const post = (topicId: number, userId: number, raw: string, extra: Record<string, unknown> = {}) => ({
    id: ++postId, topic_id: topicId, user_id: userId, raw, ...extra,
  })

  it('verifies the signature over the raw body and ignores other events', async () => {
    const { a, topicA } = await matchedPair(h)
    const body = post(topicA, a.user_id, 'Chào anh')
    expect((await h.webhook(body, { secret: 'wrong-secret-wrong-secret' })).status).toBe(401)
    expect((await h.webhook(body, { signature: 'deadbeef' })).status).toBe(401)
    expect((await h.webhook(body, { signature: '' })).status).toBe(401)
    expect((await h.webhook(body, { event: 'post_edited' })).body.outcome).toBe('ignored_event')
    expect((await h.webhook(body, { type: 'topic', event: 'topic_created' })).body.outcome).toBe('ignored_event')
    expect((await h.webhook(body, { event: 'ping', type: 'ping' })).body.outcome).toBe('ignored_event')
  })

  it('accepts the documented payload shape and ignores posts outside relay threads', async () => {
    const result = await h.webhook(fixture.post)
    expect(result).toEqual({ status: 200, body: { ok: true, outcome: 'ignored_topic' } })
  })

  it('relays both ways under the aliases, and ignores bots, strangers and non-regular posts', async () => {
    const { a, b, topicA, topicB } = await matchedPair(h)
    h.discourse.clear()
    expect((await h.webhook(post(topicA, a.user_id, 'Chào anh, em là người thích leo núi.'))).body.outcome).toBe('relayed')
    expect(h.discourse.calls).toEqual([expect.objectContaining({
      type: 'post', asUsername: 'thu_duyen', topicId: topicB, raw: relayedMessage('Em ấy', 'Chào anh, em là người thích leo núi.'),
    })])
    expect((await h.webhook(post(topicB, b.user_id, 'Chào em!'))).body.outcome).toBe('relayed')
    expect(h.discourse.postsIn(topicA)).toEqual([relayedMessage('Anh ấy', 'Chào em!')])

    expect((await h.webhook(post(topicA, BOT_USER_IDS[0], 'bot echo'))).body.outcome).toBe('ignored_bot')
    expect((await h.webhook(post(topicA, b.user_id, 'wrong thread'))).body.outcome).toBe('ignored_author')
    expect((await h.webhook(post(topicA, a.user_id, 'whisper', { post_type: 4 }))).body.outcome).toBe('ignored_post_type')
    expect(h.discourse.calls).toHaveLength(2)
  })

  it('absorbs a replayed post', async () => {
    const { a, topicA, topicB } = await matchedPair(h)
    h.discourse.clear()
    const once = post(topicA, a.user_id, 'Một lần thôi')
    expect((await h.webhook(once)).body.outcome).toBe('relayed')
    expect((await h.webhook(once)).body.outcome).toBe('replay')
    expect(h.discourse.postsIn(topicB)).toHaveLength(1)
  })

  it('holds contact details and attachments with a notice to the sender only', async () => {
    const { a, topicA, topicB } = await matchedPair(h)
    h.discourse.clear()
    expect((await h.webhook(post(topicA, a.user_id, 'Zalo em 0912345678 nha'))).body.outcome).toBe('held')
    expect((await h.webhook(post(topicA, a.user_id, '![](upload://x.png)'))).body.outcome).toBe('held')
    expect(h.discourse.postsIn(topicA)).toEqual([HELD_CONTACT, HELD_ATTACHMENT])
    expect(h.discourse.postsIn(topicB)).toEqual([])
  })

  it('holds the final fragment of a phone number split across relayed posts', async () => {
    const { a, topicA, topicB } = await matchedPair(h)
    h.discourse.clear()
    expect((await h.webhook(post(topicA, a.user_id, '09 01'))).body.outcome).toBe('relayed')
    expect((await h.webhook(post(topicA, a.user_id, '23 45 67'))).body.outcome).toBe('held')
    expect(h.discourse.postsIn(topicB)).toEqual([relayedMessage('Em ấy', '09 01')])
    expect(h.discourse.postsIn(topicA)).toEqual([HELD_CONTACT])
  })

  it('enforces the length and rate limits', async () => {
    const { a, topicA, topicB } = await matchedPair(h)
    h.discourse.clear()
    expect((await h.webhook(post(topicA, a.user_id, 'a'.repeat(1201)))).body.outcome).toBe('too_long')
    for (let i = 0; i < 11; i++) expect((await h.webhook(post(topicA, a.user_id, `tin ${i}`))).body.outcome).toBe('relayed')
    expect((await h.webhook(post(topicA, a.user_id, 'tin 12'))).body.outcome).toBe('rate_limited')
    expect(h.discourse.postsIn(topicA)).toEqual([TOO_LONG, RATE_LIMITED])
    expect(h.discourse.postsIn(topicB)).toHaveLength(11)
  })

  it('reveals only when both ask, then relays contact details, text only', async () => {
    const { a, b, topicA, topicB, matchId } = await matchedPair(h)
    h.discourse.clear()
    expect((await h.webhook(post(topicA, a.user_id, 'Chào anh'))).body.outcome).toBe('relayed')
    expect((await h.db.query(`select 1 from relay_contact_windows where match_id = $1`, [matchId]))).toHaveLength(1)
    h.discourse.clear()
    expect((await confirmedCall(h, 'match_action', a, { match_id: matchId, action: 'reveal' })).body.result).toBe('waiting_for_other')
    expect(h.discourse.postsIn(topicB)).toEqual([revealAsked('Em ấy')])
    expect((await confirmedCall(h, 'match_action', a, { match_id: matchId, action: 'reveal' })).body.result).toBe('waiting_for_other')
    expect(h.discourse.postsIn(topicB)).toHaveLength(1) // asking twice notifies once
    expect((await h.webhook(post(topicA, a.user_id, 'sđt em 0912345678'))).body.outcome).toBe('held')

    expect((await confirmedCall(h, 'match_action', b, { match_id: matchId, action: 'reveal' })).body.result).toBe('revealed')
    expect((await h.db.query(`select 1 from relay_contact_windows where match_id = $1`, [matchId]))).toHaveLength(0)
    expect(h.discourse.postsIn(topicA)).toContain(revealed('Anh ấy', 'nam', 'https://forum.test/u/nam'))
    expect(h.discourse.postsIn(topicB)).toContain(revealed('Em ấy', 'lan', 'https://forum.test/u/lan'))
    expect((await h.webhook(post(topicA, a.user_id, 'sđt em 0912345678'))).body.outcome).toBe('relayed')
    expect((await h.webhook(post(topicA, a.user_id, '![](upload://x.png)'))).body.outcome).toBe('held')
    expect((await h.call('matches', a)).body.matches[0]).toMatchObject({ state: 'revealed', i_asked_to_reveal: true, they_asked_to_reveal: true })
  })

  it('ends a chat for both, then relays nothing more', async () => {
    const { a, b, topicA, topicB, matchId } = await matchedPair(h)
    h.discourse.clear()
    expect((await h.webhook(post(topicA, a.user_id, 'Chào anh'))).body.outcome).toBe('relayed')
    expect((await h.db.query(`select 1 from relay_contact_windows where match_id = $1`, [matchId]))).toHaveLength(1)
    h.discourse.clear()
    expect((await confirmedCall(h, 'match_action', b, { match_id: matchId, action: 'end' })).body.result).toBe('ended')
    expect((await h.db.query(`select 1 from relay_contact_windows where match_id = $1`, [matchId]))).toHaveLength(0)
    expect(h.discourse.postsIn(topicA)).toEqual([MATCH_ENDED])
    expect(h.discourse.postsIn(topicB)).toEqual([MATCH_ENDED])
    expect((await h.webhook(post(topicA, a.user_id, 'còn đó không?'))).body.outcome).toBe('ignored_closed')
    expect((await h.call('match_action', a, { match_id: matchId, action: 'reveal' })).body.error).toBe('closed')
  })

  it('blocks without telling the other side, and they are never introduced again', async () => {
    const { a, b, topicA, topicB, matchId } = await matchedPair(h)
    h.discourse.clear()
    expect((await confirmedCall(h, 'match_action', a, { match_id: matchId, action: 'block' })).body.result).toBe('blocked')
    expect(h.discourse.postsIn(topicA)).toEqual([BLOCK_CONFIRMED])
    expect(h.discourse.postsIn(topicB)).toEqual([MATCH_ENDED])
    h.setNow(new Date(h.now.getTime() + 24 * 3600 * 1000))
    expect((await h.call('box_open', b)).body.result).toBe('no_match')
    expect((await h.call('match_action', b, { match_id: 'not-a-uuid', action: 'end' })).body.error).toBe('invalid_args')
  })

  it('tells the other side when a member deletes her data', async () => {
    const { a, topicB } = await matchedPair(h)
    h.discourse.clear()
    await confirmedCall(h, 'consent', a, { action: 'delete' })
    expect(h.discourse.postsIn(topicB)).toEqual([MATCH_ENDED])
    expect(await getMemberByDiscourseId(h.db, a.user_id)).toBeNull()
  })
})

describe('the outbox when Discourse is down', () => {
  let h: Harness
  beforeEach(async () => {
    h = await createHarness()
  })
  afterEach(async () => h.close())

  it('never fails the tool call, and the cron retry delivers later', async () => {
    const a = testUser('lan')
    const b = testUser('nam')
    await onboard(h, a)
    await onboard(h, b, HIM, HIS_SUMMARY)
    const box = await h.call('box_open', a)
    h.discourse.failNext(1)
    expect((await h.call('interest', a, { discovery_id: box.body.introduction.discovery_id })).body.result).toBe('sent')
    expect(h.discourse.postsIn(b.topic_id)).toEqual([])

    expect((await h.cron('x'.repeat(40))).status).toBe(401)
    h.setNow(new Date(Date.now() + 60_000))
    expect((await h.cron()).body).toMatchObject({ ok: true, claimed: 1, sent: 1 })
    expect(h.discourse.postsIn(b.topic_id)).toEqual([SIGNAL_RECEIVED])
    h.setNow(new Date(Date.now() + 3600_000))
    expect((await h.cron()).body).toMatchObject({ claimed: 0 })
  })

  it('holds a relayed message until the thread it goes to exists', async () => {
    const a = testUser('lan')
    const b = testUser('nam')
    await onboard(h, a)
    await onboard(h, b, HIM, HIS_SUMMARY)
    const box = await h.call('box_open', a)
    await h.call('interest', a, { discovery_id: box.body.introduction.discovery_id })
    const [signal] = (await h.call('signals', b)).body.signals
    h.discourse.clear()
    h.discourse.failNext(1) // opening the first relay thread fails; which side is first depends on id order
    await h.call('signal_respond', b, { signal_id: signal.signal_id, response: 'accept' })
    const [waiting, open] = h.discourse.pmsTo('lan').length === 0 ? [a, b] : [b, a]
    expect(h.discourse.pmsTo(waiting.username)).toEqual([])
    const openTopic = h.discourse.pmsTo(open.username)[0].topicId

    expect((await h.webhook({ id: 88001, topic_id: openTopic, user_id: open.user_id, raw: 'Chào nhé' })).body.outcome).toBe('relayed')
    for (let i = 1; i <= 3 && h.discourse.pmsTo(waiting.username).length === 0; i++) {
      h.setNow(new Date(Date.now() + i * 3600_000))
      await h.cron()
    }
    const waitingTopic = h.discourse.pmsTo(waiting.username)[0]?.topicId
    expect(waitingTopic).toBeDefined()
    for (let i = 4; i <= 6 && h.discourse.postsIn(waitingTopic).length < 2; i++) {
      h.setNow(new Date(Date.now() + i * 3600_000))
      await h.cron()
    }
    expect(h.discourse.postsIn(waitingTopic)).toContain(relayedMessage(waiting === a ? 'Anh ấy' : 'Em ấy', 'Chào nhé'))
  })
})
