/**
 * Payloads for installing Bà Mối into Discourse AI through its admin API
 * (plugins/discourse-ai: ai-secrets, ai-tools, ai-agents). The repo copies in
 * discourse/ are canonical; scripts/install-discourse-ai.ts applies them and
 * checks for drift by checksum.
 */
import { createHash } from 'node:crypto'

export const TOOL_SECRET_ALIAS = 'ba_moi_tool_secret'
export const AGENT_NAME = 'Bà Mối'

export interface ToolParameter {
  name: string
  type: 'string' | 'boolean' | 'integer' | 'number' | 'array'
  description: string
  required: boolean
  enum?: string[]
}

export interface ToolDefinition {
  endpoint: string
  summary: string
  description: string
  /** Parameters the model sends as comma-separated text; the script splits them. */
  list_params?: string[]
  parameters: ToolParameter[]
}

export const toolName = (endpoint: string) => `ba_moi_${endpoint}`

export function renderToolScript(template: string, def: ToolDefinition, serviceUrl: string): string {
  const url = new URL(serviceUrl)
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') throw new Error('The service URL must be https')
  const base = serviceUrl.replace(/\/+$/, '')
  if (/["\\\n]/.test(base) || !/^[a-z_]+$/.test(def.endpoint)) throw new Error('Unsafe value for the tool script')
  return template
    .replaceAll('{{ENDPOINT}}', def.endpoint)
    .replaceAll('{{SERVICE_URL}}', base)
    .replaceAll('{{LIST_PARAMS}}', JSON.stringify(def.list_params ?? []))
}

export function checksum(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16)
}

export function toolPayload(def: ToolDefinition, script: string, secretId: number) {
  return {
    ai_tool: {
      name: `Bà Mối · ${def.endpoint}`,
      tool_name: toolName(def.endpoint),
      description: def.description,
      summary: def.summary,
      script,
      parameters: def.parameters,
      secret_contracts: [{ alias: TOOL_SECRET_ALIAS }],
      secret_bindings: [{ alias: TOOL_SECRET_ALIAS, ai_secret_id: secretId }],
    },
  }
}

export function agentPayload(input: { systemPrompt: string; toolIds: number[]; llmId?: number; allowedGroupIds: number[] }) {
  return {
    ai_agent: {
      name: AGENT_NAME,
      description: 'Bà Mối, người mai mối ẩn danh của Thật Space',
      enabled: true,
      system_prompt: input.systemPrompt,
      // The native admin controller stores an omitted custom-tool options
      // value as false: [name, options, forced]. Match its serialized form.
      tools: input.toolIds.map((id) => [`custom-${id}`, false, false]),
      // Only one-to-one: her direct chat with Bà Mối (and existing private
      // threads). Never public topics or chat channels.
      allow_personal_messages: true,
      allow_topic_mentions: false,
      allow_chat_direct_messages: true,
      allow_chat_channel_mentions: false,
      allowed_group_ids: input.allowedGroupIds,
      ...(input.llmId ? { default_llm_id: input.llmId, force_default_llm: true } : {}),
      show_thinking: false,
      // Keep tool selection deterministic. Bà Mối's warmth comes from the
      // persona prompt; randomness here previously caused repeated tool calls.
      temperature: 0.2,
    },
  }
}
