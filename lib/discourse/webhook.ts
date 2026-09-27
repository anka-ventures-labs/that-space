/**
 * Discourse webhooks: signature check over the raw body, and the part of the
 * post payload the relay reads. Discourse signs with
 * X-Discourse-Event-Signature: sha256=<hex HMAC-SHA256(raw body, secret)>.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

export function verifyWebhookSignature(rawBody: Uint8Array, header: string | null, secret: string): boolean {
  if (!secret || !header || !header.startsWith('sha256=')) return false
  const given = Buffer.from(header.slice('sha256='.length), 'utf8')
  const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('hex'), 'utf8')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/** Regular posts only: post_type 1. Moderator actions, small actions and whispers are ignored. */
export const REGULAR_POST_TYPE = 1

export const PostWebhookSchema = z.object({
  post: z.object({
    id: z.number().int(),
    topic_id: z.number().int(),
    user_id: z.number().int(),
    post_type: z.number().int(),
    raw: z.string().default(''),
    deleted_at: z.string().nullable().optional(),
  }),
})

export type PostWebhook = z.infer<typeof PostWebhookSchema>
