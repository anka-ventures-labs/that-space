import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { describe, expect, it } from 'vitest'
import type { z } from 'zod'
import { AGENT_NAME, TOOL_SECRET_ALIAS, agentPayload, renderToolScript, toolName, toolPayload, type ToolDefinition } from '@/lib/discourse/install'
import { TOOLS } from '@/lib/service/dispatch'

const template = readFileSync('discourse/tools/tool.js', 'utf8')
const definitions = JSON.parse(readFileSync('discourse/tools/tools.json', 'utf8')) as ToolDefinition[]
const SERVICE = 'https://that-space.vercel.app/api/ba-moi/v1'
const SECRET = 's'.repeat(40)

/** Runs a rendered tool the way Discourse AI does: globals context, http, secrets; then invoke(params). */
function run(endpoint: string, params: Record<string, unknown>, respond: (url: string, body: unknown) => { status: number; body: string }) {
  const def = definitions.find((d) => d.endpoint === endpoint)!
  const calls: Array<{ url: string; headers: Record<string, string>; body: { auth: Record<string, unknown>; args: Record<string, unknown> } }> = []
  const sandbox = {
    context: { user_id: 101, username: 'lan', topic_id: 4001, private_message: true, participants: 'lan, ba_moi', post_id: 9 },
    secrets: { get: (alias: string) => { if (alias !== TOOL_SECRET_ALIAS) throw new Error('alias not declared'); return SECRET } },
    http: {
      post: (url: string, options: { headers: Record<string, string>; body: string }) => {
        const body = JSON.parse(options.body)
        calls.push({ url, headers: options.headers, body })
        return respond(url, body)
      },
    },
  }
  vm.createContext(sandbox)
  vm.runInContext(renderToolScript(template, def, SERVICE), sandbox)
  const result = vm.runInContext(`invoke(${JSON.stringify(params)})`, sandbox)
  return { result, calls, details: vm.runInContext('details()', sandbox) }
}

const ok = () => ({ status: 200, body: JSON.stringify({ ok: true, echoed: true }) })

describe('the Discourse AI tool script', () => {
  it('builds auth from the context only, with the secret from the secret store', () => {
    const { result, calls, details } = run('status', { user_id: 999, username: 'victim' }, ok)
    expect(result).toEqual({ ok: true, echoed: true })
    expect(details).toBe('Bà Mối: status')
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(`${SERVICE}/status`)
    expect(calls[0].headers.Authorization).toBe(`Bearer ${SECRET}`)
    expect(calls[0].body.auth).toEqual({ user_id: 101, username: 'lan', topic_id: 4001, private_message: true, participants: 'lan, ba_moi' })
    // A model's attempt at identity lands in args, where the service strips it.
    expect(calls[0].body.args).toEqual({ user_id: 999, username: 'victim' })
  })

  it('turns comma-separated lists into arrays and "don\'t remember" into null', () => {
    const { calls } = run('profile_update', { hobbies: 'leo núi, nấu ăn , ,vẽ tranh', birth_time: 'Không nhớ', age_min: 30 }, ok)
    expect(calls[0].body.args).toEqual({ hobbies: ['leo núi', 'nấu ăn', 'vẽ tranh'], birth_time: null, age_min: 30 })
    expect(run('search', { keywords: 'thiền' }, ok).calls[0].body.args).toEqual({ keywords: ['thiền'] })
    expect(run('profile_update', { birth_time: '23:30' }, ok).calls[0].body.args).toEqual({ birth_time: '23:30' })
  })

  it('turns failures into a friendly result instead of throwing', () => {
    expect(run('status', {}, () => ({ status: 500, body: '{}' })).result).toMatchObject({ ok: false, error: 'http_500' })
    expect(run('status', {}, () => ({ status: 200, body: '<html>' })).result).toMatchObject({ ok: false, error: 'bad_response' })
    expect(run('status', {}, () => { throw new Error('timeout') }).result).toMatchObject({ ok: false, error: 'unreachable' })
    expect(run('status', {}, () => ({ status: 200, body: '{}' })).result.message_vi).toBeUndefined()
  })

  it('refuses to render with an unsafe service URL', () => {
    const def = definitions[0]
    expect(() => renderToolScript(template, def, 'http://evil.example/api')).toThrow('https')
    expect(() => renderToolScript(template, def, 'https://x.test/a"b')).toThrow()
    expect(() => renderToolScript(template, { ...def, endpoint: 'status"; evil()' }, SERVICE)).toThrow()
  })
})

describe('tools.json matches the service contract', () => {
  const ALLOWED_TYPES = ['string', 'boolean', 'integer', 'number', 'array']

  it('defines exactly the service tools, within Discourse limits', () => {
    expect(definitions.map((d) => d.endpoint).sort()).toEqual(Object.keys(TOOLS).sort())
    for (const def of definitions) {
      expect(toolName(def.endpoint)).toMatch(/^[a-zA-Z0-9_]+$/)
      expect(def.description.length).toBeLessThanOrEqual(1000)
      expect(def.summary.length).toBeLessThanOrEqual(255)
      for (const p of def.parameters) {
        expect(ALLOWED_TYPES).toContain(p.type)
        if (p.enum) expect(new Set(p.enum).size).toBe(p.enum.length)
      }
    }
  })

  it('names only parameters the service accepts, with the same required ones', () => {
    for (const def of definitions) {
      const shape = (TOOLS[def.endpoint].args as unknown as z.ZodObject).shape as Record<string, z.ZodType>
      const names = def.parameters.map((p) => p.name)
      expect(names.filter((n) => !(n in shape)), def.endpoint).toEqual([])
      const required = Object.entries(shape).filter(([, schema]) => !schema.safeParse(undefined).success).map(([name]) => name)
      expect(def.parameters.filter((p) => p.required).map((p) => p.name).sort(), def.endpoint).toEqual(required.sort())
      for (const list of def.list_params ?? []) expect(def.parameters.find((p) => p.name === list)?.type).toBe('string')
    }
  })

  it('builds admin API payloads that bind the secret and stay in private messages', () => {
    const payload = toolPayload(definitions[0], 'script', 7).ai_tool
    expect(payload).toMatchObject({ tool_name: 'ba_moi_status', secret_contracts: [{ alias: TOOL_SECRET_ALIAS }], secret_bindings: [{ alias: TOOL_SECRET_ALIAS, ai_secret_id: 7 }] })
    const agent = agentPayload({ systemPrompt: 'x', toolIds: [3, 4], allowedGroupIds: [41], llmId: 2 }).ai_agent
    expect(agent).toMatchObject({
      name: AGENT_NAME, tools: [['custom-3', false, false], ['custom-4', false, false]], allow_personal_messages: true,
      allow_topic_mentions: false, allow_chat_direct_messages: false, allow_chat_channel_mentions: false, default_llm_id: 2,
    })
    expect(agentPayload({ systemPrompt: 'x', toolIds: [], allowedGroupIds: [] }).ai_agent).not.toHaveProperty('default_llm_id')
  })
})
