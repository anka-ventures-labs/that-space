import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getMemberByDiscourseId } from '@/lib/db/repo'
import { bearerMatches, handleToolRequest, personaThread } from '@/lib/service/dispatch'
import toolCall from '../../fixtures/discourse/tool_call.json'
import { TOOL_SECRET, createHarness, testUser, type Harness } from '../../helpers/service'

let h: Harness
beforeAll(async () => {
  h = await createHarness()
})
afterAll(async () => h.close())

describe('tool auth and envelope', () => {
  it('fails closed before touching member data when the service is disabled', async () => {
    const user = testUser('disabled')
    h.deps.config.enabled = false
    try {
      const result = await h.call('status', user)
      expect(result).toMatchObject({ status: 503, body: { ok: false, error: 'service_disabled' } })
      expect(await getMemberByDiscourseId(h.db, user.user_id)).toBeNull()
    } finally {
      h.deps.config.enabled = true
    }
  })

  it('rejects a missing, wrong or malformed secret', async () => {
    const user = testUser('lan')
    expect((await h.call('status', user, {}, { secret: null })).status).toBe(401)
    expect((await h.call('status', user, {}, { secret: 'x'.repeat(40) })).status).toBe(401)
    expect((await h.call('status', user, {}, { secret: ` ${TOOL_SECRET}` })).status).toBe(401) // "Bearer  <secret>"
    expect((await h.call('status', user, {}, { secret: TOOL_SECRET.slice(1) })).status).toBe(401)
    expect(bearerMatches(`bearer ${TOOL_SECRET}`, TOOL_SECRET)).toBe(false)
    expect(bearerMatches(`Bearer ${TOOL_SECRET}`, '')).toBe(false)
    expect(bearerMatches(`Bearer ${TOOL_SECRET}`, TOOL_SECRET)).toBe(true)
  })

  it('rejects unknown tools, bad JSON and envelopes without Discourse identity', async () => {
    const user = testUser('lan')
    expect((await h.call('drop_tables', user)).status).toBe(404)
    expect((await h.call('toString', user)).status).toBe(404) // no prototype lookups
    const badJson = await handleToolRequest('status', new Request('https://svc.test/x', {
      method: 'POST', headers: { Authorization: `Bearer ${TOOL_SECRET}` }, body: '{not json',
    }), h.deps)
    expect(badJson.status).toBe(400)
    expect((await h.call('status', user, {}, { auth: { username: 'lan' } })).status).toBe(400)
  })

  it('accepts the documented tool-call fixture', async () => {
    const response = await handleToolRequest('status', new Request('https://svc.test/x', {
      method: 'POST', headers: { Authorization: `Bearer ${TOOL_SECRET}` }, body: JSON.stringify(toolCall),
    }), h.deps)
    expect(response.status).toBe(200)
    expect((await response.json()).ok).toBe(true)
  })

  it('returns invalid args to the model as a normal result it can correct', async () => {
    const user = testUser('lan')
    await h.call('consent', user, { action: 'opt_in', adult_confirmed: true })
    const result = await h.call('profile_update', user, { birth_date: '01/05/1990', intent: 'forever' })
    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({ ok: false, error: 'invalid_args' })
    expect(result.body.issues.map((i: { path: string }) => i.path).sort()).toEqual(['birth_date', 'intent'])
    expect(JSON.stringify(result.body)).not.toContain('01/05/1990')
  })

  it('takes identity only from auth, ignoring identity in args', async () => {
    const victim = testUser('victim')
    const attacker = testUser('attacker')
    await h.call('consent', victim, { action: 'opt_in', adult_confirmed: true })
    // The attacker names the victim in args; the service acts as the attacker.
    const result = await h.call('consent', attacker, { action: 'pause', user_id: victim.user_id, username: victim.username })
    expect(result.body).toMatchObject({ ok: true, paused: true })
    expect((await getMemberByDiscourseId(h.db, victim.user_id))?.status).toBe('active')
    expect((await getMemberByDiscourseId(h.db, attacker.user_id))?.status).toBe('paused')
  })

  it('remembers her Bà Mối thread only from a private message between her and the bot', async () => {
    const user = testUser('mai')
    const auth = { user_id: user.user_id, username: user.username, topic_id: 777 }
    await h.call('status', user, {}, { auth: { ...auth, private_message: false, participants: null } })
    await h.call('status', user, {}, { auth: { ...auth, private_message: true, participants: 'mai, ba_moi, friend' } })
    expect((await getMemberByDiscourseId(h.db, user.user_id))?.personaTopicId).toBeNull()
    await h.call('status', user)
    expect((await getMemberByDiscourseId(h.db, user.user_id))?.personaTopicId).toBe(user.topic_id)
    expect(personaThread({ username: 'mai', topic_id: 5, private_message: true, participants: 'mai,ba_moi' }, 'ba_moi')).toBe(5)
    expect(personaThread({ username: 'mai', topic_id: 5, private_message: true, participants: 'Mai,BA_MOI' }, 'ba_moi')).toBe(5)
    expect(personaThread({ username: 'mai', topic_id: 5, private_message: true }, 'ba_moi')).toBeNull()
    for (const participants of ['mai,friend', 'friend,ba_moi', 'mai,mai', 'ba_moi,ba_moi']) {
      await h.call('status', user, {}, { auth: { ...auth, topic_id: 888, private_message: true, participants } })
      expect((await getMemberByDiscourseId(h.db, user.user_id))?.personaTopicId).toBe(user.topic_id)
    }
  })

  it('fails closed with a generic message when the database is down', async () => {
    const broken = { ...h.deps, db: { query: async () => { throw new Error('connection refused: secret host') }, transaction: async () => { throw new Error('x') } } }
    const response = await handleToolRequest('status', new Request('https://svc.test/x', {
      method: 'POST', headers: { Authorization: `Bearer ${TOOL_SECRET}` }, body: JSON.stringify(toolCall),
    }), broken)
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body).toMatchObject({ ok: false, error: 'internal' })
    expect(JSON.stringify(body)).not.toContain('secret host')
    expect(JSON.stringify(h.logs)).not.toContain('secret host')
  })

  it('logs one line per call with ids and outcome only', async () => {
    const user = testUser('logcheck')
    h.logs.length = 0
    await h.call('status', user)
    const line = h.logs.find((l) => l.event === 'tool')!
    expect(Object.keys(line).sort()).toEqual(['event', 'memberId', 'ms', 'outcome', 'requestId', 'status', 'tool'])
    expect(JSON.stringify(h.logs)).not.toContain('logcheck')
  })
})
