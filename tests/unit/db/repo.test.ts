import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Db } from '@/lib/db/db'
import {
  EMPTY_PROFILE, claimDailyOpening, claimDuePosts, closeMatch, createInterest, deleteMember, enqueuePost,
  finishDailyOpening, getCard, getDiscoveryForViewer, getMember, getProfile, insertBlock, insertDiscovery,
  insertRelayMessage, insertRelayTopic, insertSampleMember, listPendingSignals, listPool, loadExclusions,
  markPostFailed, markPostSent, poolBuckets, respondToSignal, saveCard, saveProfile, setMemberStatus, setReveal,
  setRelayTopicDiscourseId, getRelayTopicByDiscourseId, countRelayMessagesSince, upsertMemberFromDiscourse,
  MAX_POST_ATTEMPTS, type Member, type NewDiscovery, type ProfileDraft,
} from '@/lib/db/repo'
import { deriveProfile } from '@/lib/matching/derive'
import { orderedKey, pairKey } from '@/lib/matching/filters'
import { vnDate } from '@/lib/matching/privacy'
import type { PoolCard } from '@/lib/matching/types'
import { createTestDb } from '../../helpers/pglite-db'

const NOW = new Date('2026-09-27T10:00:00Z')
const DAY = 24 * 60 * 60 * 1000

const CARD: PoolCard = {
  ageBand: '35-39', region: null, initial: null, gender: 'female', seeking: 'male', intent: 'long_term',
  hobbies: ['đọc sách'], element: 'Thổ', dayMaster: 'Giáp Mộc',
}

const BASE: ProfileDraft = {
  ...EMPTY_PROFILE, intent: 'long_term', gender: 'female', seeking: 'male', birthDate: '1990-05-01',
  city: 'Hà Nội', ageMin: 28, ageMax: 45, marital: 'single', children: 'none', wantsChildren: 'yes',
  hobbies: ['đọc sách', 'yoga'],
}

let db: Db
let close: () => Promise<void>
let nextDiscourseId = 1000

beforeAll(async () => {
  ;({ db, close } = await createTestDb())
})
afterAll(async () => close())

async function member(profile: Partial<ProfileDraft> = {}, displayName = 'Lan'): Promise<Member> {
  const id = nextDiscourseId++
  const m = await upsertMemberFromDiscourse(db, { discourseUserId: id, username: `user${id}`, displayName })
  const full = { ...BASE, ...profile }
  await saveProfile(db, m.id, full, deriveProfile(full))
  await saveCard(db, m.id, CARD, null, NOW)
  return m
}

function discovery(viewer: Member, candidate: Member, source: 'box' | 'search' = 'box'): NewDiscovery {
  return {
    viewerId: viewer.id, candidateId: candidate.id, source, aToB: 71.4, bToA: 66.2, mutual: 66.2,
    tier: 'rat_hop', cardSnapshot: CARD, fit: { hobbies: ['yoga'] },
  }
}

async function discoveryStatus(id: string): Promise<string> {
  const [row] = await db.query<{ status: string }>(`select status from discoveries where id = $1`, [id])
  return row.status
}

describe('migration', () => {
  it('turns RLS on for every table and adds no policies', async () => {
    const tables = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'`)
    expect(tables).toHaveLength(13)
    expect(tables.every((t) => t.relrowsecurity)).toBe(true)
    const [policies] = await db.query<{ n: number }>(`select count(*)::int as n from pg_policies`)
    expect(policies.n).toBe(0)
  })

  it('leaves the public API roles no privileges on any table or sequence', async () => {
    const [grants] = await db.query<{ n: number }>(
      `select count(*)::int as n from information_schema.role_table_grants
       where table_schema = 'public' and grantee in ('anon', 'authenticated')`)
    expect(grants.n).toBe(0)
    const [seq] = await db.query<{ n: number }>(
      `select count(*)::int as n from pg_class c where c.relkind = 'S' and c.relnamespace = 'public'::regnamespace
       and (has_sequence_privilege('anon', c.oid, 'usage') or has_sequence_privilege('authenticated', c.oid, 'usage'))`)
    expect(seq.n).toBe(0)
  })

  it('requires a Discourse account for every member except samples', async () => {
    await expect(db.query(`insert into members (display_name) values ('x')`)).rejects.toThrow()
    const sample = await insertSampleMember(db, 'Mẫu', NOW)
    expect(sample).toMatchObject({ isSample: true, discourseUserId: null, consentVersion: 'sample' })
  })
})

describe('members and profiles', () => {
  it('upserts by Discourse id and keeps fields the refresh omits', async () => {
    const first = await upsertMemberFromDiscourse(db, { discourseUserId: 1, username: 'lan', displayName: 'Lan', personaTopicId: 55 })
    const again = await upsertMemberFromDiscourse(db, { discourseUserId: 1, username: 'lan2' })
    expect(again.id).toBe(first.id)
    expect(again).toMatchObject({ discourseUsername: 'lan2', displayName: 'Lan', personaTopicId: 55, status: 'active' })
  })

  it('round-trips a profile with its derived fields', async () => {
    const m = await member({ birthDate: '1985-02-01', birthTime: '23:30', hobbies: ['trà đạo', 'vẽ'] })
    const stored = await getProfile(db, m.id)
    expect(stored).toMatchObject({
      birthDate: '1985-02-01', birthTime: '23:30', hobbies: ['trà đạo', 'vẽ'], ageMin: 28, region: 'miền Bắc',
      lunarYear: 1985, yearStem: 'Ất', yearBranch: 'Sửu',
    })
    expect(stored?.dayStem).toBeTruthy()
  })

  it('voids open discoveries both ways when a hard-filter field changes, and nothing else', async () => {
    const [a, b, c, d] = [await member(), await member({ gender: 'male', seeking: 'female' }), await member(), await member()]
    const ab = (await insertDiscovery(db, discovery(a, b)))!
    const ba = (await insertDiscovery(db, discovery(b, a)))!
    const cd = (await insertDiscovery(db, discovery(c, d)))!
    const ac = (await insertDiscovery(db, discovery(a, c)))!
    await createInterest(db, { discoveryId: ac.id, fromId: a.id, toId: c.id, recipientPayload: {}, now: NOW })

    const hobbiesOnly = await saveProfile(db, a.id, { ...BASE, hobbies: ['bơi'] }, deriveProfile(BASE))
    expect(hobbiesOnly).toEqual({ changed: [], cardUnconfirmed: false })
    expect(await discoveryStatus(ab.id)).toBe('active')

    const intent = await saveProfile(db, a.id, { ...BASE, intent: 'friendship' }, deriveProfile(BASE))
    expect(intent).toEqual({ changed: ['intent'], cardUnconfirmed: true })
    expect(await discoveryStatus(ab.id)).toBe('void')
    expect(await discoveryStatus(ba.id)).toBe('void')
    expect(await discoveryStatus(cd.id)).toBe('active')
    expect(await discoveryStatus(ac.id)).toBe('interest_sent') // signals are never voided retroactively
    expect(await getCard(db, a.id)).toMatchObject({ discoverable: false, confirmedAt: null })
  })

  it('keeps the card confirmed when only the age range changes', async () => {
    const [a, b] = [await member(), await member()]
    const ab = (await insertDiscovery(db, discovery(a, b)))!
    const result = await saveProfile(db, a.id, { ...BASE, ageMax: 50 }, deriveProfile(BASE))
    expect(result).toEqual({ changed: ['ageMax'], cardUnconfirmed: false })
    expect(await discoveryStatus(ab.id)).toBe('void')
    expect(await getCard(db, a.id)).toMatchObject({ discoverable: true })
  })
})

describe('daily box', () => {
  it('allows one box per Vietnam day, turning over at midnight UTC+7', async () => {
    const m = await member()
    const lastSecond = new Date('2026-09-27T16:59:59Z')
    const midnight = new Date('2026-09-27T17:00:00Z')
    expect(vnDate(lastSecond)).toBe('2026-09-27')
    expect(vnDate(midnight)).toBe('2026-09-28')

    const claims = await Promise.all([1, 2, 3].map(() => claimDailyOpening(db, m.id, vnDate(lastSecond))))
    expect(claims.filter(Boolean)).toHaveLength(1)
    await finishDailyOpening(db, m.id, vnDate(lastSecond), 'no_match', null)
    expect(await claimDailyOpening(db, m.id, vnDate(lastSecond))).toBe(false) // a no-match uses the turn
    expect(await claimDailyOpening(db, m.id, vnDate(midnight))).toBe(true)
  })

  it('lets a voided opening be claimed again', async () => {
    const m = await member()
    expect(await claimDailyOpening(db, m.id, '2026-09-20')).toBe(true)
    await finishDailyOpening(db, m.id, '2026-09-20', 'void', null)
    expect(await claimDailyOpening(db, m.id, '2026-09-20')).toBe(true)
  })
})

describe('discoveries and interests', () => {
  it('shows a person once and only to the viewer', async () => {
    const [a, b] = [await member(), await member()]
    const first = await insertDiscovery(db, discovery(a, b))
    expect(first).toMatchObject({ aToB: 71.4, mutual: 66.2, status: 'active', cardSnapshot: CARD })
    expect(await insertDiscovery(db, discovery(a, b, 'search'))).toBeNull()
    expect(await getDiscoveryForViewer(db, first!.id, b.id)).toBeNull()
  })

  it('creates one interest when the same yes arrives twice at once', async () => {
    const [a, b] = [await member(), await member()]
    const ab = (await insertDiscovery(db, discovery(a, b)))!
    const input = { discoveryId: ab.id, fromId: a.id, toId: b.id, recipientPayload: { summary: 'x' }, now: NOW }
    const results = await Promise.all([createInterest(db, input), createInterest(db, input)])
    expect(results.filter((r) => r.created)).toHaveLength(1)
    expect(results[0].interest.id).toBe(results[1].interest.id)
    const [row] = await db.query<{ n: number }>(`select count(*)::int as n from interests where from_id = $1`, [a.id])
    expect(row.n).toBe(1)
    expect(await discoveryStatus(ab.id)).toBe('interest_sent')
  })

  it('matches at once when two yeses cross', async () => {
    const [a, b] = [await member(), await member()]
    const ab = (await insertDiscovery(db, discovery(a, b)))!
    const ba = (await insertDiscovery(db, discovery(b, a)))!
    const first = await createInterest(db, { discoveryId: ab.id, fromId: a.id, toId: b.id, recipientPayload: {}, now: NOW })
    expect(first.match).toBeNull()
    const second = await createInterest(db, { discoveryId: ba.id, fromId: b.id, toId: a.id, recipientPayload: {}, now: NOW })
    expect(second.match).toMatchObject({ state: 'mutual_interest' })
    expect(second.interest.status).toBe('accepted')
    const statuses = await db.query<{ status: string }>(
      `select status from interests where (from_id = $1 and to_id = $2) or (from_id = $2 and to_id = $1)`, [a.id, b.id])
    expect(statuses.map((s) => s.status)).toEqual(['accepted', 'accepted'])
    expect(await discoveryStatus(ab.id)).toBe('matched')
    expect(await discoveryStatus(ba.id)).toBe('matched')
  })

  it('refuses an expired signal and expires overdue ones on read', async () => {
    const [a, b] = [await member(), await member()]
    const ab = (await insertDiscovery(db, discovery(a, b)))!
    const { interest } = await createInterest(db, { discoveryId: ab.id, fromId: a.id, toId: b.id, recipientPayload: {}, now: NOW })
    const later = new Date(NOW.getTime() + 7 * DAY + 1000)

    expect(await respondToSignal(db, { interestId: interest.id, recipientId: b.id, response: 'accept', now: later }))
      .toEqual({ ok: false, error: 'expired' })
    expect(await listPendingSignals(db, b.id, later)).toEqual([])
    expect(await respondToSignal(db, { interestId: interest.id, recipientId: b.id, response: 'accept', now: later }))
      .toEqual({ ok: false, error: 'not_pending' })
  })

  it('only lets the recipient answer, and a decline excludes the pair both ways', async () => {
    const [a, b] = [await member(), await member()]
    const ab = (await insertDiscovery(db, discovery(a, b)))!
    const { interest } = await createInterest(db, { discoveryId: ab.id, fromId: a.id, toId: b.id, recipientPayload: {}, now: NOW })
    expect(await listPendingSignals(db, b.id, NOW)).toHaveLength(1)

    expect(await respondToSignal(db, { interestId: interest.id, recipientId: a.id, response: 'accept', now: NOW }))
      .toEqual({ ok: false, error: 'not_found' })
    const declined = await respondToSignal(db, { interestId: interest.id, recipientId: b.id, response: 'decline', now: NOW })
    expect(declined).toMatchObject({ ok: true, match: null, interest: { status: 'declined' } })
    expect((await loadExclusions(db, a.id)).declined.has(pairKey(a.id, b.id))).toBe(true)
    expect((await loadExclusions(db, b.id)).declined.has(pairKey(a.id, b.id))).toBe(true)
  })

  it('creates the match on accept and settles a pending yes the other way', async () => {
    const [a, b] = [await member(), await member()]
    const ab = (await insertDiscovery(db, discovery(a, b)))!
    const { interest } = await createInterest(db, { discoveryId: ab.id, fromId: a.id, toId: b.id, recipientPayload: {}, now: NOW })
    const result = await respondToSignal(db, { interestId: interest.id, recipientId: b.id, response: 'accept', now: NOW })
    expect(result).toMatchObject({ ok: true, interest: { status: 'accepted' }, match: { state: 'mutual_interest' } })
    const match = result.ok ? result.match! : null
    expect([match!.memberA, match!.memberB].sort()).toEqual([a.id, b.id].sort())
    expect(match!.memberA < match!.memberB).toBe(true)
  })

  it('reveals only when both sides have, and a closed match stays closed', async () => {
    const [a, b] = [await member(), await member()]
    const ab = (await insertDiscovery(db, discovery(a, b)))!
    const { interest } = await createInterest(db, { discoveryId: ab.id, fromId: a.id, toId: b.id, recipientPayload: {}, now: NOW })
    const accepted = await respondToSignal(db, { interestId: interest.id, recipientId: b.id, response: 'accept', now: NOW })
    const matchId = accepted.ok ? accepted.match!.id : ''

    expect(await setReveal(db, matchId, a.id)).toMatchObject({ state: 'mutual_interest' })
    expect(await setReveal(db, matchId, a.id)).toMatchObject({ state: 'mutual_interest' })
    const outsider = await member()
    expect(await setReveal(db, matchId, outsider.id)).toBeNull()
    expect(await setReveal(db, matchId, b.id)).toMatchObject({ state: 'revealed', revealA: true, revealB: true })
    await closeMatch(db, matchId, 'blocked')
    await closeMatch(db, matchId, 'ended')
    expect(await setReveal(db, matchId, b.id)).toMatchObject({ state: 'closed', closedReason: 'blocked' })
  })
})

describe('pool and exclusions', () => {
  it('lists discoverable, active members except the viewer, and counts rule-of-5 buckets', async () => {
    const { db: fresh, close: closeFresh } = await createTestDb()
    try {
      const make = async (name: string, city: string) => {
        const m = await upsertMemberFromDiscourse(fresh, { discourseUserId: nextDiscourseId++, username: name, displayName: name })
        const profile = { ...BASE, city }
        await saveProfile(fresh, m.id, profile, deriveProfile(profile))
        await saveCard(fresh, m.id, CARD, null, NOW)
        return m
      }
      const viewer = await make('Lan', 'Hà Nội')
      const other = await make('lụa', 'Đà Nẵng')
      const paused = await make('Mai', 'Hà Nội')
      const hidden = await make('Ngọc', 'Huế')
      await setMemberStatus(fresh, paused.id, 'paused')
      await saveCard(fresh, hidden.id, CARD, null, null)

      const pool = await listPool(fresh, viewer.id)
      expect(pool.map((p) => p.memberId)).toEqual([other.id])
      expect(pool[0]).toMatchObject({ card: CARD, isSample: false, birthDate: '1990-05-01', region: 'miền Trung' })

      const buckets = await poolBuckets(fresh)
      expect(Object.fromEntries(buckets.regions)).toEqual({ 'miền Bắc': 1, 'miền Trung': 1 })
      expect(Object.fromEntries(buckets.initials)).toEqual({ L: 2 })
    } finally {
      await closeFresh()
    }
  })

  it('collects blocks, matches and ordered discoveries', async () => {
    const [a, b, c] = [await member(), await member(), await member()]
    await insertBlock(db, b.id, a.id)
    await insertBlock(db, b.id, a.id)
    await insertDiscovery(db, discovery(c, a))
    const ca = await insertDiscovery(db, discovery(a, c))
    await createInterest(db, { discoveryId: ca!.id, fromId: a.id, toId: c.id, recipientPayload: {}, now: NOW })
    const [signal] = await listPendingSignals(db, c.id, NOW)
    await respondToSignal(db, { interestId: signal.id, recipientId: c.id, response: 'accept', now: NOW })

    const ex = await loadExclusions(db, a.id)
    expect(ex.blocked.has(pairKey(a.id, b.id))).toBe(true)
    expect(ex.matched.has(pairKey(a.id, c.id))).toBe(true)
    expect(ex.discovered.has(orderedKey(a.id, c.id))).toBe(true)
    expect(ex.discovered.has(orderedKey(c.id, a.id))).toBe(false)
  })
})

describe('relay', () => {
  it('absorbs a replayed source post and finds topics by Discourse id', async () => {
    const [a, b] = [await member(), await member()]
    const ab = (await insertDiscovery(db, discovery(a, b)))!
    const { interest } = await createInterest(db, { discoveryId: ab.id, fromId: a.id, toId: b.id, recipientPayload: {}, now: NOW })
    const accepted = await respondToSignal(db, { interestId: interest.id, recipientId: b.id, response: 'accept', now: NOW })
    const matchId = accepted.ok ? accepted.match!.id : ''

    await insertRelayTopic(db, { matchId, memberId: a.id, aliasForOther: 'Chị L.' })
    await insertRelayTopic(db, { matchId, memberId: a.id, aliasForOther: 'ignored' })
    await setRelayTopicDiscourseId(db, matchId, a.id, 9001)
    expect(await getRelayTopicByDiscourseId(db, 9001)).toEqual({ matchId, memberId: a.id, discourseTopicId: 9001, aliasForOther: 'Chị L.' })

    const first = await insertRelayMessage(db, { matchId, fromMember: a.id, sourcePostId: 777, status: 'relayed' })
    const second = await insertRelayMessage(db, { matchId, fromMember: a.id, sourcePostId: 778, status: 'held' })
    expect(typeof first).toBe('number')
    expect(second).toBeGreaterThan(first!)
    expect(await insertRelayMessage(db, { matchId, fromMember: a.id, sourcePostId: 777, status: 'relayed' })).toBeNull()
    expect(await countRelayMessagesSince(db, a.id, new Date(Date.now() - 60_000))).toBe(2)
  })
})

describe('pending posts', () => {
  it('enqueues once, leases due posts, backs off, and dead-letters after the last attempt', async () => {
    const { db: fresh, close: closeFresh } = await createTestDb()
    try {
      await enqueuePost(fresh, 'signal:1', 'signal', { topic: 1 })
      await enqueuePost(fresh, 'signal:1', 'signal', { topic: 2 })
      let now = new Date(Date.now() + 1000)

      const [post] = await claimDuePosts(fresh, now)
      expect(post).toMatchObject({ idempotencyKey: 'signal:1', payload: { topic: 1 }, attempts: 1 })
      expect(await claimDuePosts(fresh, now)).toEqual([]) // leased
      expect(await markPostFailed(fresh, post.id, 'discourse 502')).toBe('pending')

      for (let attempt = 2; attempt <= MAX_POST_ATTEMPTS; attempt++) {
        now = new Date(now.getTime() + 61 * 60 * 1000)
        const [again] = await claimDuePosts(fresh, now)
        expect(again.attempts).toBe(attempt)
        const status = await markPostFailed(fresh, again.id, `fail ${attempt}`)
        expect(status).toBe(attempt === MAX_POST_ATTEMPTS ? 'dead' : 'pending')
      }
      expect(await claimDuePosts(fresh, new Date(now.getTime() + 2 * DAY))).toEqual([])

      await enqueuePost(fresh, 'signal:2', 'signal', {})
      const [ok] = await claimDuePosts(fresh, new Date(Date.now() + 1000))
      await markPostSent(fresh, ok.id)
      const rows = await fresh.query<{ key: string; status: string; err: string | null }>(
        `select idempotency_key as key, status, last_error as err from pending_posts order by idempotency_key`)
      expect(rows).toEqual([
        { key: 'signal:1', status: 'dead', err: `fail ${MAX_POST_ATTEMPTS}` },
        { key: 'signal:2', status: 'sent', err: null },
      ])
    } finally {
      await closeFresh()
    }
  })
})

describe('deletion', () => {
  it('removes every row about the member', async () => {
    const [a, b] = [await member(), await member()]
    const ab = (await insertDiscovery(db, discovery(a, b)))!
    await createInterest(db, { discoveryId: ab.id, fromId: a.id, toId: b.id, recipientPayload: {}, now: NOW })
    await deleteMember(db, a.id)
    expect(await getMember(db, a.id)).toBeNull()
    expect(await getProfile(db, a.id)).toBeNull()
    expect(await getCard(db, a.id)).toBeNull()
    expect(await listPendingSignals(db, b.id, NOW)).toEqual([])
    expect(await getMember(db, b.id)).not.toBeNull()
  })
})
