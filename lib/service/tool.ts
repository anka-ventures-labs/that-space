/** The shape shared by every tool handler. */
import type { z } from 'zod'
import type { Member } from '@/lib/db/repo'
import { ERROR_MESSAGES, type ErrorCode } from './copy'
import type { ServiceDeps } from './deps'

export interface ToolContext {
  deps: ServiceDeps
  /** Resolved from the tool context's Discourse identity, never from args. */
  member: Member
  /** Current Discourse topic, bound into sensitive-action confirmations. */
  topicId: number | null
  /** Human post that triggered this agent turn; changes only after a new reply. */
  postId: number | null
  now: Date
  requestId: string
}

export type ToolSuccess = { ok: true } & Record<string, unknown>
export type ToolFailure = { ok: false; error: ErrorCode; message_vi: string } & Record<string, unknown>
export type ToolResult = ToolSuccess | ToolFailure

export interface Tool<A = unknown> {
  args: z.ZodType<A>
  run(ctx: ToolContext, args: A): Promise<ToolResult>
}

/** A tool with its argument type erased, for the dispatch table; args are validated by `args` first. */
export interface AnyTool {
  args: z.ZodType
  run(ctx: ToolContext, args: never): Promise<ToolResult>
}

export function defineTool<S extends z.ZodType>(args: S, run: (ctx: ToolContext, args: z.output<S>) => Promise<ToolResult>): Tool<z.output<S>> {
  return { args: args as unknown as z.ZodType<z.output<S>>, run }
}

export function fail(error: ErrorCode, extra: Record<string, unknown> = {}): ToolFailure {
  return { ok: false, error, message_vi: ERROR_MESSAGES[error], ...extra }
}
