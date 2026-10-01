import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getMemberByDiscourseId, loadExclusions } from '@/lib/db/repo'
import { seedSampleMembers } from '@/lib/db/samples'
import { pairKey } from '@/lib/matching/filters'
import { SIGNAL_CLOSED, SIGNAL_RECEIVED, matchOpened, relayIntro, relayTitle } from '@/lib/service/copy'
import { HIM, HIS_SUMMARY, createHarness, matchedPair, onboard, testUser, type Harness } from '../../helpers/service'

let h: Harness
beforeEach(async () => {
  h = await createHarness()
})
afterEach(async () => h.close())

const idOf = async (user: { user_id: number }) => (await getMemberByDiscourseId(h.db, user.user_id))!.id

describe('interest, signal and match', () => {
  it('runs the loop: interest, her notice and view, acceptance, relay threads and notices', async () => {
    const a = testUser('lan')
    const b = testUser('nam')
    await onboard(h, a)
    await onboard(h, b, HIM, HIS_SUMMARY)

    const box = await h.call('box_open', a)
    expect(box.body.introduction.card.summary).toBe(HIS_SUMMARY)
    const sent = await h.call('interest', a, { discovery_id: box.body.introduction.discovery_id })
    expect(sent.body).toMatchObject({ ok: true, result: 'sent' })
    expect(h.discourse.calls).toEqual([expect.objectContaining({ type: 'post', asUsername: 'ba_moi', topicId: b.topic_id, raw: SIGNAL_RECEIVED })])
    expect((await h.call('interest', a, { discovery_id: box.body.introduction.discovery_id })).body.result).toBe('already_sent')
    expect(h.discourse.calls).toHaveLength(1)

    const inbox = await h.call('signals', b)
    expect(inbox.body.signals).toHaveLength(1)
    const signal = inbox.body.signals[0]
    expect(signal.card.summary).toBe('Thích leo núi, nấu ăn và những cuộc trò chuyện dài.')
    expect(Object.keys(signal.fit).sort()).toEqual(['astrology', 'same_region', 'shared_hobbies', 'tier', 'tier_label'])
    expect(signal.fit.shared_hobbies).toEqual(['đọc sách', 'leo núi', 'nấu ăn'])
    expect(JSON.stringify(signal)).not.toMatch(/1990|lan|Hà Nội/)
    expect((await h.call('status', b)).body.pending_signals).toBe(1)

    h.discourse.clear()
    const accepted = await h.call('signal_respond', b, { signal_id: signal.signal_id, response: 'accept' })
    expect(accepted.body).toMatchObject({ ok: true, result: 'matched' })

    // Each side sees the other relative to herself: he is older, she is younger. No initial under the rule of 5.
    const [pmA] = h.discourse.pmsTo('lan')
    const [pmB] = h.discourse.pmsTo('nam')
    expect(pmA).toMatchObject({ asUsername: 'thu_duyen', title: relayTitle('Anh ấy'), raw: relayIntro('Anh ấy') })
    expect(pmB).toMatchObject({ asUsername: 'thu_duyen', title: relayTitle('Em ấy'), raw: relayIntro('Em ấy') })
    expect(h.discourse.postsIn(a.topic_id)).toEqual([matchOpened('Anh ấy')])
    expect(h.discourse.postsIn(b.topic_id)).toEqual([matchOpened('Em ấy')])

    const list = await h.call('matches', a)
    expect(list.body.matches).toEqual([{
      match_id: expect.any(String), alias: 'Anh ấy', state: 'mutual_interest', i_asked_to_reveal: false,
      they_asked_to_reveal: false, chat_url: `https://forum.test/t/${pmA.topicId}`,
    }])
    expect((await h.call('signal_respond', b, { signal_id: signal.signal_id, response: 'accept' })).body.error).toBe('already_answered')
  })

  it('tells the sender only "chưa có duyên" on a decline, and never pairs them again', async () => {
    const a = testUser('lan')
    const b = testUser('nam')
    await onboard(h, a)
    await onboard(h, b, HIM, HIS_SUMMARY)
    const box = await h.call('box_open', a)
    await h.call('interest', a, { discovery_id: box.body.introduction.discovery_id })
    const [signal] = (await h.call('signals', b)).body.signals
    const declined = await h.call('signal_respond', b, { signal_id: signal.signal_id, response: 'decline' })
    expect(declined.body).toMatchObject({ ok: true, result: 'declined' })
    expect(h.discourse.postsIn(a.topic_id)).toEqual([SIGNAL_CLOSED])
    expect((await loadExclusions(h.db, await idOf(b))).declined.has(pairKey(await idOf(a), await idOf(b)))).toBe(true)
    expect((await h.call('box_open', b)).body.result).toBe('no_match')
  })

  it('matches at once when both say yes independently', async () => {
    const a = testUser('lan')
    const b = testUser('nam')
    await onboard(h, a)
    await onboard(h, b, HIM, HIS_SUMMARY)
    const boxA = await h.call('box_open', a)
    const boxB = await h.call('box_open', b)
    expect((await h.call('interest', a, { discovery_id: boxA.body.introduction.discovery_id })).body.result).toBe('sent')
    expect((await h.call('interest', b, { discovery_id: boxB.body.introduction.discovery_id })).body.result).toBe('matched')
    expect(h.discourse.pmsTo('lan')).toHaveLength(1)
    expect(h.discourse.pmsTo('nam')).toHaveLength(1)
    expect((await h.call('signals', a)).body.signals).toEqual([]) // his pending yes was settled by the match
  })

  it('lets a signal expire after 7 days', async () => {
    const a = testUser('lan')
    const b = testUser('nam')
    await onboard(h, a)
    await onboard(h, b, HIM, HIS_SUMMARY)
    const box = await h.call('box_open', a)
    await h.call('interest', a, { discovery_id: box.body.introduction.discovery_id })
    const [signal] = (await h.call('signals', b)).body.signals
    h.setNow(new Date(h.now.getTime() + 7 * 24 * 3600 * 1000 + 1000))
    expect((await h.call('signal_respond', b, { signal_id: signal.signal_id, response: 'accept' })).body.error).toBe('expired')
    expect((await h.call('signals', b)).body.signals).toEqual([])
  })

  it('never signals a sample, and says so', async () => {
    await seedSampleMembers(h.db, h.now)
    const a = testUser('lan')
    await onboard(h, a)
    const box = await h.call('box_open', a)
    expect(box.body.introduction.is_sample).toBe(true)
    h.discourse.clear()
    expect((await h.call('interest', a, { discovery_id: box.body.introduction.discovery_id })).body).toMatchObject({ ok: true, result: 'sample' })
    expect(h.discourse.calls).toEqual([])
  })

  it('redacts a stored signal card when its region or initial no longer has five members', async () => {
    const a = testUser('lan')
    const b = testUser('nam')
    await onboard(h, a)
    await onboard(h, b, HIM, HIS_SUMMARY)
    const box = await h.call('box_open', a)
    await h.call('interest', a, { discovery_id: box.body.introduction.discovery_id })

    const toId = await idOf(b)
    const [interest] = await h.db.query<{ id: string; recipientPayload: { card: Record<string, unknown>; fit: Record<string, unknown> } }>(
      `select id, recipient_payload as "recipientPayload" from interests where to_id = $1`, [toId],
    )
    const payload = {
      ...interest.recipientPayload,
      card: { ...interest.recipientPayload.card, region: 'miền Bắc', initial: 'L.' },
      fit: { ...interest.recipientPayload.fit, same_region: true },
    }
    await h.db.query(`update interests set recipient_payload = $2::jsonb where id = $1`, [interest.id, payload])

    const [signal] = (await h.call('signals', b)).body.signals
    expect(signal).toMatchObject({ card: { region: null, initial: null }, fit: { same_region: null } })
  })

  it('only acts on her own discoveries, and not after the other side has left', async () => {
    const a = testUser('lan')
    const b = testUser('nam')
    const c = testUser('mai')
    await onboard(h, a)
    await onboard(h, b, HIM, HIS_SUMMARY)
    await onboard(h, c)
    const box = await h.call('box_open', a)
    const discoveryId = box.body.introduction.discovery_id
    expect((await h.call('interest', c, { discovery_id: discoveryId })).body.error).toBe('not_found')
    await h.call('consent', b, { action: 'pause' })
    expect((await h.call('interest', a, { discovery_id: discoveryId })).body.error).toBe('gone')
  })

  it('limits interests per Vietnam day', async () => {
    const a = testUser('lan')
    const b = testUser('nam')
    await onboard(h, a)
    await onboard(h, b, HIM, HIS_SUMMARY)
    const box = await h.call('box_open', a)
    const from = await idOf(a)
    for (let i = 0; i < 5; i++) {
      const [other] = await h.db.query<{ id: string }>(`insert into members (display_name, is_sample) values ('x', true) returning id`)
      const [d] = await h.db.query<{ id: string }>(
        `insert into discoveries (viewer_id, candidate_id, source, a_to_b, b_to_a, mutual, tier, card_snapshot)
         values ($1, $2, 'search', 60, 60, 60, 'hop', '{}') returning id`, [from, other.id])
      await h.db.query(`insert into interests (discovery_id, from_id, to_id, recipient_payload) values ($1, $2, $3, '{}')`, [d.id, from, other.id])
    }
    expect((await h.call('interest', a, { discovery_id: box.body.introduction.discovery_id })).body).toMatchObject({ ok: false, error: 'daily_limit' })
    expect((await h.call('status', a)).body.interests_left).toBe(0)
  })

  it('opens relay threads once even when called again', async () => {
    const { a, b } = await matchedPair(h)
    const before = h.discourse.calls.length
    const [signal] = (await h.call('signals', b)).body.signals ?? []
    expect(signal).toBeUndefined()
    const again = await h.call('interest', a, { discovery_id: (await h.db.query<{ id: string }>(`select id from discoveries limit 1`))[0].id })
    expect(again.body.result).toBe('already_matched')
    expect(h.discourse.calls.length).toBe(before)
  })
})
