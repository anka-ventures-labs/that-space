/**
 * The read/write installation contract for Bà Mối's Discourse AI objects.
 *
 * This is kept separate from the command-line entry point so the contract can
 * be exercised against a small fake admin API.  `--check` is deliberately
 * conservative: a response which omits a field needed to validate the
 * installed configuration is reported as unverifiable, rather than passing
 * with a false "no drift" result.
 */
import {
  AGENT_NAME, TOOL_SECRET_ALIAS, agentPayload, checksum, renderToolScript, toolName, toolPayload, type ToolDefinition,
} from './install'

export type AdminApi = (method: 'GET' | 'POST' | 'PUT', pathname: string, body?: unknown) => Promise<Record<string, unknown>>

type Row = Record<string, unknown> & { id?: number; name?: string; tool_name?: string }

export interface InstallerInput {
  api: AdminApi
  template: string
  definitions: ToolDefinition[]
  systemPrompt: string
  serviceUrl: string
  toolSecret: string
  llmId?: number
  allowedGroupIds: number[]
  check: boolean
}

export interface InstallerResult {
  /** Mismatches and missing objects.  A non-empty list means check must fail. */
  drift: string[]
  /** Facts the API intentionally does not return, such as secret plaintext. */
  unreadable: string[]
  changes: string[]
}

const BASE = '/admin/plugins/discourse-ai'

/** Discourse serializers may or may not wrap a record in its root key. */
function unwrap(body: Record<string, unknown>, root: string): Row {
  const value = body[root]
  return (value && typeof value === 'object' ? value : body) as Row
}

function rows(body: Record<string, unknown>, root: string): Row[] {
  const value = body[root]
  return Array.isArray(value) ? value as Row[] : []
}

function equal(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function compareField(
  deployed: Row,
  expected: Row,
  field: string,
  label: string,
  drift: string[],
) {
  if (!(field in deployed)) {
    drift.push(`${label} does not expose ${field}; cannot verify it`)
  } else if (!equal(deployed[field], expected[field])) {
    drift.push(`${label} ${field} differs from the repo`)
  }
}

function compareTool(deployed: Row, expected: Row, label: string, drift: string[]) {
  for (const field of ['name', 'tool_name', 'description', 'summary', 'parameters', 'secret_contracts', 'secret_bindings']) {
    compareField(deployed, expected, field, label, drift)
  }
  if (!('script' in deployed)) {
    drift.push(`${label} does not expose script; cannot verify it`)
  } else if (typeof deployed.script !== 'string' || checksum(deployed.script) !== checksum(expected.script as string)) {
    drift.push(`${label} script differs from the repo`)
  }
}

function compareAgent(deployed: Row, expected: Row, drift: string[]) {
  for (const field of [
    'name', 'description', 'enabled', 'system_prompt', 'tools', 'allow_personal_messages',
    'allow_topic_mentions', 'allow_chat_direct_messages', 'allow_chat_channel_mentions',
    'allowed_group_ids', 'show_thinking', 'temperature',
  ]) {
    compareField(deployed, expected, field, 'agent Bà Mối', drift)
  }
  // LLM configuration is only part of this install when the caller has asked
  // us to pin one.  Omitting it must not claim a current server setting is
  // wrong when the apply payload intentionally leaves it untouched.
  if ('default_llm_id' in expected) {
    compareField(deployed, expected, 'default_llm_id', 'agent Bà Mối', drift)
    compareField(deployed, expected, 'force_default_llm', 'agent Bà Mối', drift)
  }
  if (!deployed.user_id) drift.push('agent Bà Mối has no bot user')
}

export async function installDiscourseAi(input: InstallerInput): Promise<InstallerResult> {
  const { api, check } = input
  const drift: string[] = []
  const unreadable: string[] = []
  const changes: string[] = []

  const secretRows = rows(await api('GET', `${BASE}/ai-secrets.json`), 'ai_secrets')
  let secret = secretRows.find((item) => item.name === TOOL_SECRET_ALIAS)
  if (check) {
    if (!secret?.id) drift.push(`secret ${TOOL_SECRET_ALIAS} is missing`)
    else unreadable.push(`secret ${TOOL_SECRET_ALIAS} plaintext is intentionally not returned by Discourse and was not compared`)
  } else {
    const payload = { ai_secret: { name: TOOL_SECRET_ALIAS, secret: input.toolSecret } }
    secret = secret?.id
      ? unwrap(await api('PUT', `${BASE}/ai-secrets/${secret.id}.json`, payload), 'ai_secret')
      : unwrap(await api('POST', `${BASE}/ai-secrets.json`, payload), 'ai_secret')
    if (!secret.id) throw new Error(`Discourse did not return an id for secret ${TOOL_SECRET_ALIAS}`)
    changes.push(`secret ${TOOL_SECRET_ALIAS}: ${secretRows.some((item) => item.name === TOOL_SECRET_ALIAS) ? 'updated' : 'created'}`)
  }

  const tools = rows(await api('GET', `${BASE}/ai-tools.json`), 'ai_tools')
  const toolIds: number[] = []
  for (const definition of input.definitions) {
    const name = toolName(definition.endpoint)
    const existing = tools.find((tool) => tool.tool_name === name)
    if (check) {
      if (!existing?.id) {
        drift.push(`tool ${name} is missing`)
        continue
      }
      toolIds.push(existing.id)
      // `export` deliberately omits secret bindings.  The verified `edit`
      // action renders the full custom-tool serializer, including them.
      const deployed = unwrap(await api('GET', `${BASE}/ai-tools/${existing.id}/edit.json`), 'ai_tool')
      // A missing secret is already drift.  Do not fabricate an id to make a
      // second, misleading binding comparison.
      if (secret?.id) compareTool(deployed, toolPayload(definition, renderToolScript(input.template, definition, input.serviceUrl), secret.id).ai_tool, `tool ${name}`, drift)
      continue
    }
    if (!secret?.id) throw new Error(`Cannot install ${name}: secret ${TOOL_SECRET_ALIAS} has no id`)
    const script = renderToolScript(input.template, definition, input.serviceUrl)
    const saved = existing?.id
      ? unwrap(await api('PUT', `${BASE}/ai-tools/${existing.id}.json`, toolPayload(definition, script, secret.id)), 'ai_tool')
      : unwrap(await api('POST', `${BASE}/ai-tools.json`, toolPayload(definition, script, secret.id)), 'ai_tool')
    if (!saved.id) throw new Error(`Discourse did not return an id for tool ${name}`)
    toolIds.push(saved.id)
    changes.push(`tool ${name}: ${existing?.id ? 'updated' : 'created'} (${checksum(script)})`)
  }

  const agents = rows(await api('GET', `${BASE}/ai-agents.json`), 'ai_agents')
  let agent = agents.find((item) => item.name === AGENT_NAME)
  if (check) {
    if (!agent?.id) drift.push('agent Bà Mối is missing')
    else {
      // The list endpoint is a summary.  The verified `edit` action renders
      // the complete localized agent serializer used by the admin form.
      const deployed = unwrap(await api('GET', `${BASE}/ai-agents/${agent.id}/edit.json`), 'ai_agent')
      const expected = agentPayload({
        systemPrompt: input.systemPrompt,
        toolIds,
        llmId: input.llmId,
        allowedGroupIds: input.allowedGroupIds,
      }).ai_agent as Row
      compareAgent(deployed, expected, drift)
    }
  } else {
    const payload = agentPayload({
      systemPrompt: input.systemPrompt,
      toolIds,
      llmId: input.llmId,
      allowedGroupIds: input.allowedGroupIds,
    })
    agent = agent?.id
      ? unwrap(await api('PUT', `${BASE}/ai-agents/${agent.id}.json`, payload), 'ai_agent')
      : unwrap(await api('POST', `${BASE}/ai-agents.json`, payload), 'ai_agent')
    if (!agent.id) throw new Error(`Discourse did not return an id for agent ${AGENT_NAME}`)
    if (!agent.user_id) {
      await api('POST', `${BASE}/ai-agents/${agent.id}/create-user.json`)
      changes.push('agent bot user created')
    }
    changes.push(`agent ${AGENT_NAME}: ready (prompt ${checksum(input.systemPrompt)}, ${toolIds.length} tools)`)
  }

  return { drift, unreadable, changes }
}
