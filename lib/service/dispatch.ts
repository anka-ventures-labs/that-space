/**
 * POST /api/ba-moi/v1/<tool>: the envelope every Discourse AI tool call uses.
 *
 * Auth: `Authorization: Bearer BA_MOI_TOOL_SECRET`. The body is
 * `{ auth: { user_id, username, topic_id, ... }, args }`, where the tool script
 * builds `auth` only from Discourse's tool context. The member is resolved
 * from `auth` alone; any identity in `args` is stripped by the schemas.
 *
 * Status codes: 401/400/404 for protocol errors, 500 for failures, and 200
 * for every tool outcome, including `ok: false` (such as `invalid_args`), so
 * the model sees the reason and can correct itself.
 */
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { upsertMemberFromDiscourse } from '@/lib/db/repo'
import { ERROR_MESSAGES, type ErrorCode } from './copy'
import type { ServiceDeps } from './deps'
import { boxOpen, search } from './handlers/discovery'
import { matchAction, matches } from './handlers/matches'
import { cardConfirm, cardPreview, consent, profileUpdate, status } from './handlers/onboarding'
import { interest, signalRespond, signals } from './handlers/signals'
import type { AnyTool } from './tool'

export const TOOLS: Record<string, AnyTool> = {
  status, consent, profile_update: profileUpdate, card_preview: cardPreview, card_confirm: cardConfirm,
  box_open: boxOpen, search, interest, signals, signal_respond: signalRespond, matches, match_action: matchAction,
}

const EnvelopeSchema = z.object({
  auth: z.object({
    user_id: z.number().int(),
    username: z.string().trim().min(1).max(60),
    name: z.string().trim().max(120).nullish(),
    topic_id: z.number().int().positive().nullish(),
    /** Whether the conversation is a private message; only then can it be her thread with Bà Mối. */
    private_message: z.boolean().nullish(),
    /** The private message's usernames, comma-separated (Discourse AI's context.participants). */
    participants: z.string().max(2000).nullish(),
  }),
  args: z.record(z.string(), z.unknown()).nullish(),
})

/** Constant-time comparison of `Bearer <secret>`, hashing both sides so lengths can't leak. */
export function bearerMatches(header: string | null, secret: string): boolean {
  if (!secret || !header?.startsWith('Bearer ')) return false
  const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest()
  return timingSafeEqual(digest(header.slice('Bearer '.length)), digest(secret))
}

/**
 * Her own thread with Bà Mối: a private message with just her and the bot.
 * A thread she shares with anyone else never receives her notifications.
 */
export function personaThread(auth: { username: string; topic_id?: number | null; private_message?: boolean | null; participants?: string | null }, personaUsername: string): number | null {
  if (auth.private_message !== true || !auth.topic_id) return null
  const people = (auth.participants ?? '').split(',').map((p) => p.trim().toLowerCase()).filter(Boolean)
  const caller = auth.username.toLowerCase()
  const bot = personaUsername.toLowerCase()
  return people.length === 2 && caller !== bot && people.includes(caller) && people.includes(bot) ? auth.topic_id : null
}

function failure(error: ErrorCode, extra: Record<string, unknown> = {}) {
  return { ok: false, error, message_vi: ERROR_MESSAGES[error], ...extra }
}

export async function handleToolRequest(name: string, request: Request, deps: ServiceDeps): Promise<Response> {
  const started = Date.now()
  const requestId = randomUUID()
  let memberId: string | undefined
  const respond = (status: number, body: { ok: boolean; error?: string }) => {
    deps.log({ event: 'tool', requestId, tool: name, status, outcome: body.ok ? 'ok' : body.error, memberId, ms: Date.now() - started })
    return Response.json(body, { status })
  }

  if (!bearerMatches(request.headers.get('authorization'), deps.config.toolSecret)) return respond(401, failure('unauthorized'))
  const tool = Object.hasOwn(TOOLS, name) ? TOOLS[name] : undefined
  if (!tool) return respond(404, failure('not_found_tool'))

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return respond(400, failure('invalid_request'))
  }
  const envelope = EnvelopeSchema.safeParse(body)
  if (!envelope.success) return respond(400, failure('invalid_request'))
  const args = tool.args.safeParse(envelope.data.args ?? {})
  if (!args.success) {
    const issues = args.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
    return respond(200, failure('invalid_args', { issues }))
  }

  try {
    const { auth } = envelope.data
    const member = await upsertMemberFromDiscourse(deps.db, {
      discourseUserId: auth.user_id,
      username: auth.username,
      displayName: auth.name || auth.username,
      personaTopicId: personaThread(auth, deps.config.personaUsername),
    })
    memberId = member.id
    const result = await tool.run({ deps, member, now: deps.now(), requestId }, args.data as never)
    return respond(200, result)
  } catch (error) {
    deps.log({ event: 'tool_error', requestId, tool: name, memberId, error: error instanceof Error ? error.name : 'Error' })
    return respond(500, failure('internal'))
  }
}
