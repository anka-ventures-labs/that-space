import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Db } from '@/lib/db/db'
import { claimDuePosts, enqueuePost, getMemberByDiscourseId, MAX_POST_ATTEMPTS } from '@/lib/db/repo'
import { send } from '@/lib/service/outbox'
import { revealAsked, revealed } from '@/lib/service/copy'
import { HIM, HIS_SUMMARY, confirmedCall, createHarness, matchedPair, onboard, testUser, type Harness } from '../../helpers/service'

function failQueue(db: Db): Db {
  return {
    query: (sql, params) => {
      if (/insert into pending_posts/i.test(sql)) throw new Error('outbox unavailable')
      return db.query(sql, params)
    },
    transaction: (fn) => db.transaction((tx) => fn(failQueue(tx))),
  }
}

describe('durable Discourse delivery', () => {
  let h: Harness
  beforeEach(async () => { h = await createHarness() })
  afterEach(async () => h.close())

  it('sends a logical post once when the same key is called concurrently and again later', async () => {
    const item = { kind: 'topic_post' as const, as: 'relay' as const, topicId: 123, raw: 'Chào bạn' }
    await Promise.all([send(h.deps, 'same-post', item), send(h.deps, 'same-post', item)])
    await send(h.deps, 'same-post', item)
    expect(h.discourse.postsIn(123)).toEqual(['Chào bạn'])
  })

  it('does not deliver a queued chat message after the recipient blocks the match', async () => {
    const { a, b, topicA, topicB, matchId } = await matchedPair(h)
    h.discourse.clear()
    h.discourse.failNext(1)
    await h.webhook({ id: 88091, topic_id: topicA, user_id: a.user_id, raw: 'Tin nhắn đang chờ' })
    expect((await confirmedCall(h, 'match_action', b, { match_id: matchId, action: 'block' })).body.result).toBe('blocked')
    h.setNow(new Date(Date.now() + 3600_000))
    await h.cron()
    expect(h.discourse.postsIn(topicB).join('\n')).not.toContain('Tin nhắn đang chờ')
    expect(h.discourse.postsIn(topicA)).toHaveLength(1) // the closing notice still arrives
  })

  it('rolls back relay receipt when its durable outbound post cannot be stored', async () => {
    const { a, topicA, topicB } = await matchedPair(h)
    h.discourse.clear()
    h.discourse.failNext(1)
    const originalDb = h.deps.db
    h.deps.db = failQueue(originalDb)
    const post = { id: 88092, topic_id: topicA, user_id: a.user_id, raw: 'Gửi lại được nhé' }
    expect((await h.webhook(post)).status).toBe(500)
    const receipts = await h.db.query('select id from relay_messages where source_post_id = $1', [post.id])
    expect(receipts).toEqual([])
    h.deps.db = originalDb
    h.discourse.failNext(0)
    expect((await h.webhook(post)).body.outcome).toBe('relayed')
    expect(h.discourse.postsIn(topicB).join('\n')).toContain(post.raw)
  })

  it('keeps a signal pending when the match notifications cannot be stored, then completes on retry', async () => {
    const a = testUser('lan')
    const b = testUser('nam')
    await onboard(h, a)
    await onboard(h, b, HIM, HIS_SUMMARY)
    const box = await h.call('box_open', a)
    await h.call('interest', a, { discovery_id: box.body.introduction.discovery_id })
    const [signal] = (await h.call('signals', b)).body.signals
    const originalDb = h.deps.db
    h.deps.db = failQueue(originalDb)
    expect((await h.call('signal_respond', b, { signal_id: signal.signal_id, response: 'accept' })).status).toBe(500)
    h.deps.db = originalDb
    expect((await h.call('signals', b)).body.signals).toHaveLength(1)
    expect((await h.call('matches', b)).body.matches).toEqual([])
    expect(h.discourse.pmsTo(a.username)).toEqual([])
    expect((await h.call('signal_respond', b, { signal_id: signal.signal_id, response: 'accept' })).body.result).toBe('matched')
    expect(h.discourse.pmsTo(a.username)).toHaveLength(1)
    expect(h.discourse.pmsTo(b.username)).toHaveLength(1)
  })

  it('purges an undelivered private message on deletion while retaining only the generic closing notice', async () => {
    const { a, topicA, topicB } = await matchedPair(h)
    h.discourse.clear()
    h.discourse.failNext(1)
    await h.webhook({ id: 88093, topic_id: topicA, user_id: a.user_id, raw: 'Nội dung riêng tư đang chờ' })
    expect(await h.db.query("select id from pending_posts where status = 'pending'")).toHaveLength(1)
    await confirmedCall(h, 'consent', a, { action: 'delete' })
    expect(JSON.stringify(await h.db.query('select payload from pending_posts'))).not.toContain('Nội dung riêng tư đang chờ')
    h.setNow(new Date(h.now.getTime() + 3600_000))
    await h.cron()
    expect(h.discourse.postsIn(topicB)).toHaveLength(1)
  })

  it('enforces search and interest quotas across concurrent tool calls', async () => {
    const viewer = testUser('lan')
    await onboard(h, viewer)
    for (let i = 0; i < 6; i++) await onboard(h, testUser(`candidate${i}`), HIM, HIS_SUMMARY)
    const searches = await Promise.all(Array.from({ length: 4 }, () => h.call('search', viewer)))
    const shown = searches.flatMap((r) => r.body.results ?? [])
    expect(shown).toHaveLength(6)
    expect(new Set(shown.map((r) => r.discovery_id)).size).toBe(6)
    const interests = await Promise.all(shown.map((r) => h.call('interest', viewer, { discovery_id: r.discovery_id })))
    expect(interests.filter((r) => r.body.result === 'sent')).toHaveLength(5)
    expect(interests.filter((r) => r.body.error === 'daily_limit')).toHaveLength(1)
  })

  it('stops retrying a worker that dies during its final delivery lease', async () => {
    await enqueuePost(h.db, 'crashed', 'topic_post', {})
    let now = new Date(Date.now() + 1000)
    for (let attempt = 1; attempt <= MAX_POST_ATTEMPTS; attempt++) {
      const [post] = await claimDuePosts(h.db, now)
      expect(post.attempts).toBe(attempt)
      now = new Date(now.getTime() + 61 * 60_000)
    }
    expect(await claimDuePosts(h.db, now)).toEqual([])
    expect(await h.db.query('select status from pending_posts where idempotency_key = $1', ['crashed']))
      .toEqual([{ status: 'dead' }])
  })

  it('redacts a historical alias initial in match reads and delayed chat delivery', async () => {
    const { a, b, topicA, topicB, matchId } = await matchedPair(h)
    await h.db.query("update relay_topics set alias_for_other = 'Em ấy L.' where discourse_topic_id = $1", [topicB])
    expect((await h.call('matches', b)).body.matches[0].alias).toBe('Em ấy')
    h.discourse.clear()
    h.discourse.failNext(1)
    await h.webhook({ id: 88094, topic_id: topicA, user_id: a.user_id, raw: 'Một tin nhắn chờ' })
    h.setNow(new Date(h.now.getTime() + 60_000))
    await h.cron()
    expect(h.discourse.postsIn(topicB)).toEqual(['**Em ấy:**\n\nMột tin nhắn chờ'])
    // Reveal is semantic and repeatable even when both requests arrive together.
    const responses = await Promise.all([a, b].map((user) => confirmedCall(h, 'match_action', user, { match_id: matchId, action: 'reveal' })))
    expect(responses.map((r) => r.body.result)).toEqual(expect.arrayContaining(['revealed']))
    expect((await h.call('match_action', a, { match_id: matchId, action: 'reveal' })).body.result).toBe('revealed')
  })

  it('redacts the initial on delayed reveal requests and confirmations', async () => {
    const { a, b, topicB, matchId } = await matchedPair(h)
    await h.db.query("update relay_topics set alias_for_other = 'Em ấy L.' where discourse_topic_id = $1", [topicB])
    h.discourse.clear()
    h.discourse.failNext(1)
    await confirmedCall(h, 'match_action', a, { match_id: matchId, action: 'reveal' })
    h.setNow(new Date(h.now.getTime() + 60_000))
    await h.cron()
    expect(h.discourse.postsIn(topicB)).toEqual([revealAsked('Em ấy')])
    h.discourse.failNext(2)
    await confirmedCall(h, 'match_action', b, { match_id: matchId, action: 'reveal' })
    h.setNow(new Date(h.now.getTime() + 60_000))
    await h.cron()
    expect(h.discourse.postsIn(topicB)).toContain(revealed('Em ấy', a.username, `https://forum.test/u/${a.username}`))
    expect(h.discourse.postsIn(topicB).join('\n')).not.toContain('Em ấy L.')
  })

  it('counts simultaneous relay webhooks under the per-sender rate limit', async () => {
    const { a, topicA, topicB } = await matchedPair(h)
    h.discourse.clear()
    const responses = await Promise.all(Array.from({ length: 13 }, (_, i) => h.webhook({
      id: 88100 + i, topic_id: topicA, user_id: a.user_id, raw: `Tin đồng thời ${i}`,
    })))
    expect(responses.filter((r) => r.body.outcome === 'relayed')).toHaveLength(12)
    expect(responses.filter((r) => r.body.outcome === 'rate_limited')).toHaveLength(1)
    expect(h.discourse.postsIn(topicB)).toHaveLength(12)
  })
})

describe('Bà Mối notices in chat', () => {
  let h: Harness
  beforeEach(async () => { h = await createHarness({ noticeTransport: 'chat' }) })
  afterEach(async () => h.close())

  it("delivers her notices to the member's direct chat, never as a private message", async () => {
    const lan = testUser('lan')
    await onboard(h, lan)
    const member = await getMemberByDiscourseId(h.db, lan.user_id)
    h.discourse.clear()
    await send(h.deps, 'notice-1', { kind: 'persona_notice', memberId: member!.id, raw: 'Bà có tin vui cho bạn' })
    await send(h.deps, 'notice-2', { kind: 'persona_notice', memberId: member!.id, raw: 'Thêm một tin nữa' })
    const chats = h.discourse.chatTo('lan')
    expect(chats.map((c) => c.raw)).toEqual(['Bà có tin vui cho bạn', 'Thêm một tin nữa'])
    expect(new Set(chats.map((c) => c.channelId)).size).toBe(1)
    expect(chats.every((c) => c.asUsername === 'ba_moi')).toBe(true)
    expect(h.discourse.pmsTo('lan')).toEqual([])
  })

  it('keeps a chat notice queued through an outage and delivers it on retry', async () => {
    const lan = testUser('lan')
    await onboard(h, lan)
    const member = await getMemberByDiscourseId(h.db, lan.user_id)
    h.discourse.clear()
    h.discourse.failNext(1)
    expect(await send(h.deps, 'notice-outage', { kind: 'persona_notice', memberId: member!.id, raw: 'Tin chờ gửi' })).toBe('queued')
    h.setNow(new Date(Date.now() + 3600_000))
    await h.cron()
    expect(h.discourse.chatTo('lan').map((c) => c.raw)).toEqual(['Tin chờ gửi'])
  })

  it('keeps a refused chat notice queued instead of silently sending a private message', async () => {
    const lan = testUser('lan')
    await onboard(h, lan)
    const member = await getMemberByDiscourseId(h.db, lan.user_id)
    h.discourse.clear()
    h.discourse.refuseChatWith('lan')
    expect(await send(h.deps, 'notice-refused', { kind: 'persona_notice', memberId: member!.id, raw: 'Bà có tin vui' })).toBe('queued')
    expect(h.discourse.chatTo('lan')).toEqual([])
    expect(h.discourse.postsIn(lan.topic_id)).toEqual([])
    expect(h.discourse.pmsTo('lan')).toEqual([])
  })
})
