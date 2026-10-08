import { createHmac } from 'node:crypto'
import type { DiscourseClient } from '@/lib/discourse/client'
import { DiscourseError } from '@/lib/discourse/client'
import type { ServiceDeps } from '@/lib/service/deps'
import { handleRetryRequest } from '@/lib/service/cron'
import { handleToolRequest } from '@/lib/service/dispatch'
import { handleDiscourseWebhook } from '@/lib/service/relay'
import { createTestDb } from './pglite-db'

export const TOOL_SECRET = 't'.repeat(40)
export const WEBHOOK_SECRET = 'w'.repeat(24)
export const CRON_SECRET = 'c'.repeat(40)
export const BOT_USER_IDS = [-110, 2]

export interface DiscourseCall {
  type: 'pm' | 'post'
  asUsername: string
  recipients?: string[]
  title?: string
  topicId: number
  postId: number
  raw: string
}

/** Records every call; `failNext(n)` makes the next n calls throw like an outage. */
export function createFakeDiscourse() {
  const calls: DiscourseCall[] = []
  let nextTopicId = 5000
  let nextPostId = 90000
  let failures = 0
  const maybeFail = () => {
    if (failures > 0) {
      failures--
      throw new DiscourseError('Discourse 502: Bad Gateway', 502)
    }
  }
  const client: DiscourseClient = {
    async createPrivateMessage({ asUsername, recipients, title, raw }) {
      maybeFail()
      const call = { type: 'pm' as const, asUsername, recipients, title, raw, topicId: ++nextTopicId, postId: ++nextPostId }
      calls.push(call)
      return { topicId: call.topicId, postId: call.postId }
    },
    async createPost({ asUsername, topicId, raw }) {
      maybeFail()
      const call = { type: 'post' as const, asUsername, topicId, raw, postId: ++nextPostId }
      calls.push(call)
      return { postId: call.postId }
    },
  }
  return {
    client,
    calls,
    failNext(n: number) {
      failures = n
    },
    /** Topics started for a member, and every post in a topic. */
    pmsTo: (username: string) => calls.filter((c) => c.type === 'pm' && c.recipients?.includes(username)),
    postsIn: (topicId: number) => calls.filter((c) => c.topicId === topicId).map((c) => c.raw),
    clear() {
      calls.length = 0
    },
  }
}

export type FakeDiscourse = ReturnType<typeof createFakeDiscourse>

/** Mulberry32: a small seeded random source for reproducible picks. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface TestUser {
  user_id: number
  username: string
  /** Her private-message thread with Bà Mối. */
  topic_id: number
}

let nextUser = 100
export function testUser(username: string): TestUser {
  nextUser++
  return { user_id: nextUser, username, topic_id: 4000 + nextUser }
}

export type ToolResponse = { status: number; body: Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any

export async function createHarness(options: { now?: Date; seed?: number } = {}) {
  const { db, close } = await createTestDb()
  const discourse = createFakeDiscourse()
  const logs: Array<Record<string, unknown>> = []
  let now = options.now ?? new Date('2026-09-27T03:00:00Z') // 10:00 in Vietnam
  const deps: ServiceDeps = {
    db,
    discourse: discourse.client,
    config: {
      enabled: true,
      toolSecret: TOOL_SECRET,
      webhookSecret: WEBHOOK_SECRET,
      cronSecret: CRON_SECRET,
      discourseUrl: 'https://forum.test',
      personaUsername: 'ba_moi',
      relayUsername: 'thu_duyen',
      botUserIds: BOT_USER_IDS,
    },
    now: () => now,
    random: seededRandom(options.seed ?? 7),
    log: (event) => logs.push(event),
  }

  async function call(tool: string, user: TestUser, args: Record<string, unknown> = {}, extra: { secret?: string | null; auth?: Record<string, unknown> } = {}): Promise<ToolResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const secret = extra.secret === undefined ? TOOL_SECRET : extra.secret
    if (secret !== null) headers.Authorization = `Bearer ${secret}`
    const auth = extra.auth ?? {
      user_id: user.user_id, username: user.username, topic_id: user.topic_id, private_message: true, participants: `${user.username}, ba_moi`,
    }
    const response = await handleToolRequest(tool, new Request(`https://svc.test/api/ba-moi/v1/${tool}`, {
      method: 'POST', headers, body: JSON.stringify({ auth, args }),
    }), deps)
    return { status: response.status, body: await response.json() }
  }

  async function webhook(post: Record<string, unknown>, extra: { secret?: string; event?: string; type?: string; signature?: string } = {}) {
    const body = JSON.stringify({ post: { post_type: 1, deleted_at: null, ...post } })
    const signature = extra.signature ?? `sha256=${createHmac('sha256', extra.secret ?? WEBHOOK_SECRET).update(body).digest('hex')}`
    const response = await handleDiscourseWebhook(new Request('https://svc.test/api/ba-moi/v1/webhooks/discourse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Discourse-Event-Type': extra.type ?? 'post',
        'X-Discourse-Event': extra.event ?? 'post_created',
        'X-Discourse-Event-Signature': signature,
      },
      body,
    }), deps)
    return { status: response.status, body: (await response.json()) as { ok: boolean; outcome: string } }
  }

  async function cron(secret: string = CRON_SECRET) {
    const response = await handleRetryRequest(new Request('https://svc.test/api/ba-moi/v1/cron/retry-posts', {
      headers: { Authorization: `Bearer ${secret}` },
    }), deps)
    return { status: response.status, body: (await response.json()) as Record<string, number | boolean> }
  }

  return {
    deps, db, discourse, logs, close, call, webhook, cron,
    get now() {
      return now
    },
    setNow(at: Date) {
      now = at
    },
  }
}

export type Harness = Awaited<ReturnType<typeof createHarness>>

/** A full profile the interview would produce; override per test. */
export const PROFILE = {
  intent: 'long_term', gender: 'female', seeking: 'male', birth_date: '1990-05-01', city: 'Hà Nội',
  age_min: 28, age_max: 45, marital: 'single', children: 'none', wants_children: 'yes',
  hobbies: ['đọc sách', 'leo núi', 'nấu ăn'], open_answer: 'Mình muốn một người cùng leo núi và nấu ăn cuối tuần.',
}

/** Consent, the full interview, and a confirmed card: she is in the pool. */
export async function onboard(h: Harness, user: TestUser, profile: Record<string, unknown> = {}, summary = 'Thích leo núi, nấu ăn và những cuộc trò chuyện dài.') {
  const steps = [
    await h.call('consent', user, { action: 'opt_in', adult_confirmed: true }),
    await h.call('profile_update', user, { ...PROFILE, ...profile }),
    await h.call('card_confirm', user, { summary_text: summary }),
  ]
  for (const step of steps) {
    if (!step.body.ok) throw new Error(`onboarding ${user.username} failed: ${JSON.stringify(step.body)}`)
  }
  return steps[2].body
}

/** A man in his late thirties who fits PROFILE both ways. */
export const HIM = { gender: 'male', seeking: 'female', birth_date: '1988-08-08' }
export const HIS_SUMMARY = 'Điềm đạm, thích leo núi và nấu ăn cho bạn bè.'

/**
 * Two onboarded members who are each other's only candidate, taken through
 * box, interest and acceptance. Returns their relay thread ids.
 */
export async function matchedPair(h: Harness, names: [string, string] = ['lan', 'nam']) {
  const a = testUser(names[0])
  const b = testUser(names[1])
  await onboard(h, a)
  await onboard(h, b, HIM, HIS_SUMMARY)
  const box = await h.call('box_open', a)
  if (box.body.result !== 'match') throw new Error(`expected a match, got ${JSON.stringify(box.body)}`)
  await h.call('interest', a, { discovery_id: box.body.introduction.discovery_id })
  const [signal] = (await h.call('signals', b)).body.signals
  const accepted = await h.call('signal_respond', b, { signal_id: signal.signal_id, response: 'accept' })
  if (accepted.body.result !== 'matched') throw new Error(`expected matched, got ${JSON.stringify(accepted.body)}`)
  const topicA = h.discourse.pmsTo(a.username)[0].topicId
  const topicB = h.discourse.pmsTo(b.username)[0].topicId
  const matchId = (await h.call('matches', a)).body.matches[0].match_id as string
  return { a, b, topicA, topicB, matchId }
}
