import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getMemberByDiscourseId } from '@/lib/db/repo'
import { CONFIRMATION_TTL_MS, consumeConfirmation, issueConfirmation } from '@/lib/service/confirmation'
import type { ToolContext } from '@/lib/service/tool'
import { createHarness, testUser, type Harness } from '../../helpers/service'

describe('consequential action confirmations', () => {
  let h: Harness
  beforeEach(async () => {
    h = await createHarness()
  })
  afterEach(async () => h.close())

  async function context(username: string): Promise<{ user: ReturnType<typeof testUser>; ctx: ToolContext }> {
    const user = testUser(username)
    await h.call('status', user)
    const member = await getMemberByDiscourseId(h.db, user.user_id)
    if (!member) throw new Error('member was not created')
    return {
      user,
      ctx: {
        deps: h.deps,
        member,
        topicId: user.topic_id,
        postId: user.post_id,
        now: h.now,
        requestId: 'confirmation-test',
      },
    }
  }

  it('requires a later human post and consumes a correctly bound token once', async () => {
    const { ctx } = await context('lan')
    const challenge = await issueConfirmation(ctx, 'match:reveal', 'match-a')
    expect(challenge?.confirmation_token).toEqual(expect.any(String))
    const token = challenge!.confirmation_token

    expect(await consumeConfirmation(ctx, token, 'match:reveal', 'match-a')).toBe(false)
    const nextTurn = { ...ctx, postId: ctx.postId! + 1 }
    expect(await consumeConfirmation(nextTurn, token, 'match:reveal', 'match-a')).toBe(true)
    expect(await consumeConfirmation(nextTurn, token, 'match:reveal', 'match-a')).toBe(false)
  })

  it('rejects cross-member, thread, action, resource, tampering, future and expiry use', async () => {
    const { ctx } = await context('mai')
    const { ctx: other } = await context('yen')
    const challenge = await issueConfirmation(ctx, 'delete', 'member-data')
    const token = challenge!.confirmation_token
    const nextTurn = { ...ctx, postId: ctx.postId! + 1 }

    expect(await consumeConfirmation({ ...other, postId: other.postId! + 1 }, token, 'delete', 'member-data')).toBe(false)
    expect(await consumeConfirmation({ ...nextTurn, topicId: ctx.topicId! + 1 }, token, 'delete', 'member-data')).toBe(false)
    expect(await consumeConfirmation(nextTurn, token, 'match:end', 'member-data')).toBe(false)
    expect(await consumeConfirmation(nextTurn, token, 'delete', 'another-resource')).toBe(false)
    const [payload, signature] = token.split('.')
    const tampered = `${payload}.${signature[0] === 'a' ? 'b' : 'a'}${signature.slice(1)}`
    expect(await consumeConfirmation(nextTurn, tampered, 'delete', 'member-data')).toBe(false)
    expect(await consumeConfirmation({ ...nextTurn, now: new Date(ctx.now.getTime() - 30_001) }, token, 'delete', 'member-data')).toBe(false)
    expect(await consumeConfirmation({ ...nextTurn, now: new Date(ctx.now.getTime() + CONFIRMATION_TTL_MS + 1) }, token, 'delete', 'member-data')).toBe(false)

    expect(await consumeConfirmation(nextTurn, token, 'delete', 'member-data')).toBe(true)
  })

  it('does not issue an executable token without Discourse topic and post context', async () => {
    const { ctx } = await context('an')
    expect(await issueConfirmation({ ...ctx, topicId: null }, 'delete', 'member-data')).toBeNull()
    expect(await issueConfirmation({ ...ctx, postId: null }, 'delete', 'member-data')).toBeNull()
  })
})
