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
import {
  AGENT_NAME, TOOL_SECRET_ALIAS, agentPayload, checksum, renderToolScript, toolName, toolPayload, type ToolDefinition,
} from '@/lib/discourse/install'

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
const BASE = '/admin/plugins/discourse-ai'
type Row = { id: number; name?: string; tool_name?: string; script?: string; system_prompt?: string; user_id?: number | null }

async function api<T = Record<string, unknown>>(method: string, pathname: string, body?: unknown): Promise<T> {
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
  return (await response.json()) as T
}

/** Discourse serializers may or may not wrap a record in its root key. */
const unwrap = (body: Record<string, unknown>, root: string) => ((body[root] ?? body) as Row)

async function main() {
  const template = readFileSync('discourse/tools/tool.js', 'utf8')
  const definitions = JSON.parse(readFileSync('discourse/tools/tools.json', 'utf8')) as ToolDefinition[]
  const systemPrompt = readFileSync('discourse/persona/ba-moi.md', 'utf8')
  const drift: string[] = []

  // 1. The tool secret, by name.
  const { ai_secrets: secrets } = await api<{ ai_secrets: Row[] }>('GET', `${BASE}/ai-secrets.json`)
  let secret = secrets.find((s) => s.name === TOOL_SECRET_ALIAS)
  if (CHECK) {
    if (!secret) drift.push(`secret ${TOOL_SECRET_ALIAS} is missing`)
  } else {
    const payload = { ai_secret: { name: TOOL_SECRET_ALIAS, secret: env.BA_MOI_TOOL_SECRET } }
    secret = secret
      ? unwrap(await api('PUT', `${BASE}/ai-secrets/${secret.id}.json`, payload), 'ai_secret')
      : unwrap(await api('POST', `${BASE}/ai-secrets.json`, payload), 'ai_secret')
  }

  // 2. The tools, by tool_name.
  const { ai_tools: tools } = await api<{ ai_tools: Row[] }>('GET', `${BASE}/ai-tools.json`)
  const toolIds: number[] = []
  for (const def of definitions) {
    const script = renderToolScript(template, def, env.BA_MOI_SERVICE_URL)
    const existing = tools.find((t) => t.tool_name === toolName(def.endpoint))
    if (CHECK) {
      if (!existing) {
        drift.push(`tool ${toolName(def.endpoint)} is missing`)
        continue
      }
      const deployed = unwrap(await api('GET', `${BASE}/ai-tools/${existing.id}/export.json`), 'ai_tool')
      if (checksum(deployed.script ?? '') !== checksum(script)) drift.push(`tool ${toolName(def.endpoint)} script differs from the repo`)
      toolIds.push(existing.id)
      continue
    }
    const payload = toolPayload(def, script, secret!.id)
    const saved = existing
      ? unwrap(await api('PUT', `${BASE}/ai-tools/${existing.id}.json`, payload), 'ai_tool')
      : unwrap(await api('POST', `${BASE}/ai-tools.json`, payload), 'ai_tool')
    toolIds.push(saved.id)
    console.log(`tool ${toolName(def.endpoint)}: ${existing ? 'updated' : 'created'} (${checksum(script)})`)
  }

  // 3. The agent, by name, with a bot user of its own.
  const { ai_agents: agents } = await api<{ ai_agents: Row[] }>('GET', `${BASE}/ai-agents.json`)
  let agent = agents.find((a) => a.name === AGENT_NAME)
  if (CHECK) {
    if (!agent) drift.push('agent Bà Mối is missing')
    else if (checksum(agent.system_prompt ?? '') !== checksum(systemPrompt)) drift.push('agent system prompt differs from the repo')
  } else {
    const payload = agentPayload({
      systemPrompt,
      toolIds,
      llmId: env.BA_MOI_LLM_ID,
      allowedGroupIds: env.BA_MOI_ALLOWED_GROUP_IDS.split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && n > 0),
    })
    agent = agent
      ? unwrap(await api('PUT', `${BASE}/ai-agents/${agent.id}.json`, payload), 'ai_agent')
      : unwrap(await api('POST', `${BASE}/ai-agents.json`, payload), 'ai_agent')
    if (!agent.user_id) {
      const created = await api('POST', `${BASE}/ai-agents/${agent.id}/create-user.json`)
      console.log('agent bot user created:', JSON.stringify(created).slice(0, 200))
    }
    console.log(`agent ${AGENT_NAME}: ready (prompt ${checksum(systemPrompt)}, ${toolIds.length} tools)`)
  }

  if (CHECK) {
    console.log(drift.length ? `DRIFT:\n- ${drift.join('\n- ')}` : 'No drift: Discourse matches the repo.')
    process.exit(drift.length ? 1 : 0)
  }
}

main().catch((error) => {
  console.error((error as Error).message)
  process.exit(1)
})
