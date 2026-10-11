/** Fresh, service-issued confirmation tokens for consequential Bà Mối actions. */
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { consumeConfirmationChallenge, createConfirmationChallenge } from '@/lib/db/repo'
import type { Db } from '@/lib/db/db'
import type { ToolContext, ToolFailure } from './tool'
import { fail } from './tool'

const VERSION = 1
export const CONFIRMATION_TTL_MS = 10 * 60 * 1000
const FUTURE_CLOCK_SKEW_MS = 30 * 1000

type ConfirmationPayload = {
  v: number
  member: string
  topic: number
  issued_post: number
  action: string
  resource: string
  issued_at: number
  nonce: string
}

function signature(secret: string, encoded: string): Buffer {
  return createHmac('sha256', secret).update(encoded, 'utf8').digest()
}

function encode(payload: ConfirmationPayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `${encoded}.${signature(secret, encoded).toString('base64url')}`
}

function decode(token: string, secret: string): ConfirmationPayload | null {
  const [encoded, supplied, extra] = token.split('.')
  if (!encoded || !supplied || extra) return null
  let suppliedBytes: Buffer
  try {
    suppliedBytes = Buffer.from(supplied, 'base64url')
  } catch {
    return null
  }
  const expected = signature(secret, encoded)
  if (suppliedBytes.length !== expected.length || !timingSafeEqual(suppliedBytes, expected)) return null
  try {
    const value = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<ConfirmationPayload>
    if (value.v !== VERSION || typeof value.member !== 'string' || typeof value.action !== 'string' ||
      typeof value.resource !== 'string' || typeof value.nonce !== 'string' ||
      !Number.isSafeInteger(value.topic) || !Number.isSafeInteger(value.issued_post) ||
      !Number.isSafeInteger(value.issued_at)) return null
    return value as ConfirmationPayload
  } catch {
    return null
  }
}

export async function issueConfirmation(ctx: ToolContext, action: string, resource = '', db: Db = ctx.deps.db) {
  if (!ctx.topicId || !ctx.postId) return null
  const issuedAt = ctx.now.getTime()
  const nonce = randomUUID()
  const payload: ConfirmationPayload = {
    v: VERSION,
    member: ctx.member.id,
    topic: ctx.topicId,
    issued_post: ctx.postId,
    action,
    resource,
    issued_at: issuedAt,
    nonce,
  }
  await createConfirmationChallenge(db, {
    nonce,
    memberId: ctx.member.id,
    topicId: ctx.topicId,
    action,
    resource,
    issuedPostId: ctx.postId,
    issuedAt: ctx.now,
    expiresAt: new Date(issuedAt + CONFIRMATION_TTL_MS),
  })
  return {
    confirmation_token: encode(payload, ctx.deps.config.toolSecret),
    confirmation_action: action,
    confirmation_expires_at: new Date(issuedAt + CONFIRMATION_TTL_MS).toISOString(),
  }
}

export async function consumeConfirmation(
  ctx: ToolContext,
  token: string | undefined,
  action: string,
  resource = '',
  db: Db = ctx.deps.db,
): Promise<boolean> {
  if (!token || !ctx.topicId || !ctx.postId) return false
  const payload = decode(token, ctx.deps.config.toolSecret)
  if (!payload) return false
  if (payload.member !== ctx.member.id || payload.topic !== ctx.topicId) return false
  // Every tool call in one agent response has the triggering user's post_id.
  // A larger id proves that the member sent a subsequent post before execution.
  if (payload.issued_post >= ctx.postId) return false
  if (payload.action !== action || payload.resource !== resource) return false
  const age = ctx.now.getTime() - payload.issued_at
  if (age < -FUTURE_CLOCK_SKEW_MS || age > CONFIRMATION_TTL_MS) return false
  return consumeConfirmationChallenge(db, {
    nonce: payload.nonce,
    memberId: ctx.member.id,
    topicId: ctx.topicId,
    action,
    resource,
    issuedPostId: payload.issued_post,
    currentPostId: ctx.postId,
    now: ctx.now,
  })
}

export async function confirmationRequired(
  ctx: ToolContext,
  action: string,
  resource = '',
  db: Db = ctx.deps.db,
): Promise<ToolFailure> {
  const challenge = await issueConfirmation(ctx, action, resource, db)
  return fail('confirm_required', challenge ?? { confirmation_unavailable: true })
}
