/**
 * Everything a handler touches, passed in explicitly so tests can swap in
 * PGlite, a fake Discourse, a fixed clock and a seeded random source.
 */
import { z } from 'zod'
import { getDb, type Db } from '@/lib/db/db'
import { createDiscourseClient, type DiscourseClient } from '@/lib/discourse/client'
import { ERROR_MESSAGES } from './copy'

const EnvSchema = z.object({
  BA_MOI_ENABLED: z.string().optional().transform((value) => value?.trim().toLowerCase() === 'true'),
  BA_MOI_TOOL_SECRET: z.string().min(32),
  DISCOURSE_WEBHOOK_SECRET: z.string().min(16),
  CRON_SECRET: z.string().min(32),
  DISCOURSE_URL: z.url(),
  /** Single-user API keys: one for Bà Mối's bot user, one for Thư Duyên. */
  DISCOURSE_PERSONA_API_KEY: z.string().min(16),
  DISCOURSE_RELAY_API_KEY: z.string().min(16),
  BA_MOI_PERSONA_USERNAME: z.string().min(1).default('ba_moi'),
  BA_MOI_RELAY_USERNAME: z.string().min(1).default('thu_duyen'),
  /** Discourse user ids of the bot users, comma-separated. Their posts are never relayed. */
  BA_MOI_BOT_USER_IDS: z.string().default(''),
})

export interface ServiceConfig {
  enabled: boolean
  toolSecret: string
  webhookSecret: string
  cronSecret: string
  discourseUrl: string
  personaUsername: string
  relayUsername: string
  botUserIds: number[]
}

export interface ServiceDeps {
  db: Db
  discourse: DiscourseClient
  config: ServiceConfig
  now: () => Date
  random: () => number
  log: (event: Record<string, unknown>) => void
}

/** One JSON line per event. Callers pass internal ids and outcomes only, never member data. */
export function logEvent(event: Record<string, unknown>): void {
  console.log(JSON.stringify({ at: new Date().toISOString(), ...event }))
}

export function baMoiEnabled(value: string | undefined = process.env.BA_MOI_ENABLED): boolean {
  return value?.trim().toLowerCase() === 'true'
}

/** Used by route handlers before loading database or bot credentials. */
export function baMoiDisabledResponse(): Response {
  return Response.json({ ok: false, error: 'service_disabled', message_vi: ERROR_MESSAGES.service_disabled }, { status: 503 })
}

let deps: ServiceDeps | null = null

export function getDeps(): ServiceDeps {
  if (deps) return deps
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    // Names only; values never reach the logs.
    throw new Error(`Invalid service environment: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`)
  }
  const env = parsed.data
  deps = {
    db: getDb(),
    discourse: createDiscourseClient({
      baseUrl: env.DISCOURSE_URL,
      apiKeys: { [env.BA_MOI_PERSONA_USERNAME]: env.DISCOURSE_PERSONA_API_KEY, [env.BA_MOI_RELAY_USERNAME]: env.DISCOURSE_RELAY_API_KEY },
    }),
    config: {
      enabled: env.BA_MOI_ENABLED,
      toolSecret: env.BA_MOI_TOOL_SECRET,
      webhookSecret: env.DISCOURSE_WEBHOOK_SECRET,
      cronSecret: env.CRON_SECRET,
      discourseUrl: env.DISCOURSE_URL.replace(/\/+$/, ''),
      personaUsername: env.BA_MOI_PERSONA_USERNAME,
      relayUsername: env.BA_MOI_RELAY_USERNAME,
      botUserIds: env.BA_MOI_BOT_USER_IDS.split(',').map((s) => s.trim()).filter(Boolean).map(Number).filter(Number.isInteger),
    },
    now: () => new Date(),
    random: Math.random,
    log: logEvent,
  }
  return deps
}
