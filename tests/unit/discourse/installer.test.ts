import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { AGENT_NAME, agentPayload, renderToolScript, toolName, toolPayload, type ToolDefinition } from '@/lib/discourse/install'
import { installDiscourseAi, type AdminApi } from '@/lib/discourse/installer'

const template = readFileSync('discourse/tools/tool.js', 'utf8')
const definitions = JSON.parse(readFileSync('discourse/tools/tools.json', 'utf8')) as ToolDefinition[]
const input = {
  template,
  definitions,
  systemPrompt: 'Bà Mối system prompt',
  serviceUrl: 'https://that-space.vercel.app/api/ba-moi/v1',
  toolSecret: 's'.repeat(40),
  llmId: 4,
  allowedGroupIds: [12],
}

function installedApi(options: { mutateTool?: (tool: Record<string, unknown>) => void; mutateAgent?: (agent: Record<string, unknown>) => void } = {}) {
  const calls: Array<{ method: string; path: string; body?: unknown }> = []
  const tools = definitions.map((definition, index) => {
    const tool = { id: index + 10, ...toolPayload(definition, renderToolScript(template, definition, input.serviceUrl), 7).ai_tool }
    options.mutateTool?.(tool)
    return tool
  })
  const agent = {
    id: 99,
    user_id: 501,
    ...agentPayload({ systemPrompt: input.systemPrompt, toolIds: tools.map((tool) => tool.id), llmId: input.llmId, allowedGroupIds: input.allowedGroupIds }).ai_agent,
  }
  options.mutateAgent?.(agent)
  const api: AdminApi = async (method, path, body) => {
    calls.push({ method, path, body })
    if (path.endsWith('/ai-secrets.json')) return { ai_secrets: [{ id: 7, name: 'ba_moi_tool_secret' }] }
    if (path.endsWith('/ai-tools.json')) return { ai_tools: tools.map(({ id, tool_name }) => ({ id, tool_name })) }
    const exported = path.match(/ai-tools\/(\d+)\/edit\.json$/)
    if (exported) return { ai_tool: tools.find((tool) => tool.id === Number(exported[1]))! }
    // The index is only used to find the id.  It may be a summary record;
    // the installer must fetch the verified edit representation before it
    // judges the complete agent contract.
    if (path.endsWith('/ai-agents.json')) return { ai_agents: [{ id: agent.id, name: agent.name }] }
    if (path.endsWith('/ai-agents/99/edit.json')) return { ai_agent: agent }
    throw new Error(`Unexpected ${method} ${path}`)
  }
  return { api, calls }
}

describe('the Discourse AI installer contract', () => {
  it('checks the full installed tool and agent contract without mutating it', async () => {
    const { api, calls } = installedApi()
    const result = await installDiscourseAi({ ...input, api, check: true })
    expect(result.drift).toEqual([])
    expect(result.unreadable).toEqual(['secret ba_moi_tool_secret plaintext is intentionally not returned by Discourse and was not compared'])
    expect(calls.every((call) => call.method === 'GET')).toBe(true)
  })

  it('accepts native parameter key order and omitted custom-tool options', async () => {
    const { api } = installedApi({
      mutateTool: (tool) => {
        tool.parameters = (tool.parameters as Array<Record<string, unknown>>).map((parameter) => {
          const { enum: values, ...rest } = parameter
          return values === undefined ? rest : { enum: values, ...rest }
        })
      },
      mutateAgent: (agent) => {
        // `permit_tools` stores an omitted options value as false on the
        // pinned native controller, rather than the null sent in older forms.
        agent.tools = (agent.tools as Array<[string, unknown, boolean]>).map(([name, _options, forced]) => [name, false, forced])
      },
    })
    const result = await installDiscourseAi({ ...input, api, check: true })
    expect(result.drift).toEqual([])
  })

  it('detects a broken tool binding and agent configuration that script checksums miss', async () => {
    const { api } = installedApi({
      mutateTool: (tool) => {
        if (tool.tool_name === 'ba_moi_status') {
          tool.parameters = [{ name: 'invented' }]
          tool.secret_bindings = [{ alias: 'ba_moi_tool_secret', ai_secret_id: 999 }]
        }
      },
      mutateAgent: (agent) => {
        agent.tools = [['custom-999', false, false]]
        agent.allow_chat_channel_mentions = true
        agent.user_id = null
      },
    })
    const result = await installDiscourseAi({ ...input, api, check: true })
    expect(result.drift).toEqual(expect.arrayContaining([
      'tool ba_moi_status parameters differs from the repo',
      'tool ba_moi_status secret_bindings differs from the repo',
      'agent Bà Mối tools differs from the repo',
      'agent Bà Mối allow_chat_channel_mentions differs from the repo',
      'agent Bà Mối has no bot user',
    ]))
  })

  it('still detects changed enum values and custom-tool options', async () => {
    const { api } = installedApi({
      mutateTool: (tool) => {
        if (tool.tool_name === 'ba_moi_consent') {
          const parameters = (tool.parameters as Array<Record<string, unknown>>).map((parameter) => ({ ...parameter }))
          parameters[0] = { ...parameters[0], enum: ['pause', 'opt_in', 'resume', 'delete'] }
          tool.parameters = parameters
        }
      },
      mutateAgent: (agent) => {
        const tools = agent.tools as Array<[string, boolean, boolean]>
        tools[0] = [tools[0][0], true, false]
      },
    })
    const result = await installDiscourseAi({ ...input, api, check: true })
    expect(result.drift).toEqual(expect.arrayContaining([
      'tool ba_moi_consent parameters differs from the repo',
      'agent Bà Mối tools differs from the repo',
    ]))
  })

  it('fails closed when an export omits a field needed to verify a tool', async () => {
    const { api } = installedApi({
      mutateTool: (tool) => {
        if (tool.tool_name === 'ba_moi_status') delete tool.secret_contracts
      },
    })
    const result = await installDiscourseAi({ ...input, api, check: true })
    expect(result.drift).toContain('tool ba_moi_status does not expose secret_contracts; cannot verify it')
  })

  it('applies the canonical payloads and creates the agent user when absent', async () => {
    const calls: Array<{ method: string; path: string; body?: unknown }> = []
    let nextToolId = 10
    const api: AdminApi = async (method, path, body) => {
      calls.push({ method, path, body })
      if (method === 'GET' && path.endsWith('/ai-secrets.json')) return { ai_secrets: [] }
      if (method === 'GET' && path.endsWith('/ai-tools.json')) return { ai_tools: [] }
      if (method === 'GET' && path.endsWith('/ai-agents.json')) return { ai_agents: [] }
      if (method === 'POST' && path.endsWith('/ai-secrets.json')) return { ai_secret: { id: 7, name: 'ba_moi_tool_secret' } }
      if (method === 'POST' && path.endsWith('/ai-tools.json')) return { ai_tool: { id: nextToolId++ } }
      if (method === 'POST' && path.endsWith('/ai-agents.json')) return { ai_agent: { id: 99, user_id: null } }
      if (method === 'POST' && path.endsWith('/create-user.json')) return { ok: true }
      throw new Error(`Unexpected ${method} ${path}`)
    }
    const result = await installDiscourseAi({ ...input, api, check: false })
    expect(result.drift).toEqual([])
    expect(result.changes).toHaveLength(definitions.length + 3)
    const agentCall = calls.find((call) => call.path.endsWith('/ai-agents.json') && call.method === 'POST')!
    expect(agentCall.body).toMatchObject({
      ai_agent: { name: AGENT_NAME, tools: definitions.map((_, index) => [`custom-${index + 10}`, false, false]) },
    })
    expect(calls.some((call) => call.path.endsWith('/create-user.json'))).toBe(true)
  })
})
