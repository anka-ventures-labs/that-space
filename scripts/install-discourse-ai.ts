/**
 * Installs or updates Bà Mối in Discourse AI from the repo copies, which are
 * canonical:
 *   discourse/tools/tools.json + tool.js  -> 12 AI tools (ba_moi_*)
 *   discourse/persona/ba-moi.md           -> the "Bà Mối" agent
 * The tool secret goes into Discourse's AI secret store and is bound to each
 * tool by alias, so it never appears in a script.
 *
 *   npm run discourse:install              apply
 *   npm run discourse:install -- --check   report drift by checksum, change nothing
 *
 * Reads .env.local: DISCOURSE_URL, DISCOURSE_ADMIN_API_KEY (an admin key used
 * only here, never by the service), BA_MOI_SERVICE_URL (the deployed
 * .../api/ba-moi/v1), BA_MOI_TOOL_SECRET, and optionally
 * DISCOURSE_ADMIN_USERNAME, BA_MOI_LLM_ID and BA_MOI_ALLOWED_GROUP_IDS.
 */
import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { installDiscourseAi } from '@/lib/discourse/installer'
import type { ToolDefinition } from '@/lib/discourse/install'

const env = z.object({
  DISCOURSE_URL: z.url(),
  DISCOURSE_ADMIN_API_KEY: z.string().min(16),
  DISCOURSE_ADMIN_USERNAME: z.string().default('system'),
  BA_MOI_SERVICE_URL: z.url(),
  BA_MOI_TOOL_SECRET: z.string().min(32),
  BA_MOI_LLM_ID: z.coerce.number().int().positive().optional(),
  BA_MOI_ALLOWED_GROUP_IDS: z.string().default(''),
}).parse(process.env)

const CHECK = process.argv.includes('--check')

async function api(method: 'GET' | 'POST' | 'PUT', pathname: string, body?: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(`${env.DISCOURSE_URL.replace(/\/+$/, '')}${pathname}`, {
    method,
    headers: {
      'Api-Key': env.DISCOURSE_ADMIN_API_KEY,
      'Api-Username': env.DISCOURSE_ADMIN_USERNAME,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`${method} ${pathname}: ${response.status} ${(await response.text()).slice(0, 300)}`)
  return (await response.json()) as Record<string, unknown>
}

async function main() {
  const template = readFileSync('discourse/tools/tool.js', 'utf8')
  const definitions = JSON.parse(readFileSync('discourse/tools/tools.json', 'utf8')) as ToolDefinition[]
  const systemPrompt = readFileSync('discourse/persona/ba-moi.md', 'utf8')
  const result = await installDiscourseAi({
    api,
    template,
    definitions,
    systemPrompt,
    serviceUrl: env.BA_MOI_SERVICE_URL,
    toolSecret: env.BA_MOI_TOOL_SECRET,
    llmId: env.BA_MOI_LLM_ID,
    allowedGroupIds: env.BA_MOI_ALLOWED_GROUP_IDS.split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && n > 0),
    check: CHECK,
  })
  for (const change of result.changes) console.log(change)
  for (const message of result.unreadable) console.log(`NOTE: ${message}`)
  if (CHECK) {
    console.log(result.drift.length ? `DRIFT:\n- ${result.drift.join('\n- ')}` : 'No drift: Discourse matches the repo.')
    process.exit(result.drift.length ? 1 : 0)
  }
}

main().catch((error) => {
  console.error((error as Error).message)
  process.exit(1)
})
