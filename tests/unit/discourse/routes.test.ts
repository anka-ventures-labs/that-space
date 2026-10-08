import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  enabled: true,
  deps: { source: 'route-test' },
  calls: [] as Array<[string, Request, unknown]>,
  webhookCalls: [] as Array<[Request, unknown]>,
  cronCalls: [] as Array<[Request, unknown]>,
}))

vi.mock('@/lib/service/deps', () => ({
  getDeps: () => state.deps,
  baMoiEnabled: () => state.enabled,
  baMoiDisabledResponse: () => Response.json({ ok: false, error: 'service_disabled' }, { status: 503 }),
}))

vi.mock('@/lib/service/dispatch', () => ({
  handleToolRequest: async (name: string, request: Request, deps: unknown) => {
    state.calls.push([name, request, deps])
    return new Response(JSON.stringify({ name }), { status: name === 'nope' ? 404 : 401 })
  },
}))

vi.mock('@/lib/service/relay', () => ({
  handleDiscourseWebhook: async (request: Request, deps: unknown) => {
    state.webhookCalls.push([request, deps])
    return Response.json({ ok: true })
  },
}))

vi.mock('@/lib/service/cron', () => ({
  handleRetryRequest: async (request: Request, deps: unknown) => {
    state.cronCalls.push([request, deps])
    return Response.json({ ok: true })
  },
}))

import { POST } from '@/app/api/ba-moi/v1/[tool]/route'
import { POST as POST_WEBHOOK } from '@/app/api/ba-moi/v1/webhooks/discourse/route'
import { GET as GET_CRON, POST as POST_CRON } from '@/app/api/ba-moi/v1/cron/retry-posts/route'

beforeEach(() => {
  state.enabled = true
  state.calls.length = 0
  state.webhookCalls.length = 0
  state.cronCalls.length = 0
})

describe('the Bà Mối tool route', () => {
  it('delegates the dynamic tool name, original request, and configured dependencies to dispatch', async () => {
    const unauthenticated = await POST(new Request('https://svc.test/api/ba-moi/v1/status', { method: 'POST', body: '{}' }), {
      params: Promise.resolve({ tool: 'status' }),
    })
    expect(unauthenticated.status).toBe(401)
    const unknown = await POST(new Request('https://svc.test/api/ba-moi/v1/nope', {
      method: 'POST', headers: { Authorization: 'Bearer test-secret' }, body: '{}',
    }), { params: Promise.resolve({ tool: 'nope' }) })
    expect(unknown.status).toBe(404)
    expect(state.calls.map(([name, request, deps]) => [name, request.headers.get('authorization'), deps]))
      .toEqual([['status', null, state.deps], ['nope', 'Bearer test-secret', state.deps]])
  })

  it('fails closed at every route before loading service dependencies', async () => {
    state.enabled = false
    const tool = await POST(new Request('https://svc.test/api/ba-moi/v1/status', { method: 'POST' }), {
      params: Promise.resolve({ tool: 'status' }),
    })
    const webhook = await POST_WEBHOOK(new Request('https://svc.test/api/ba-moi/v1/webhooks/discourse', { method: 'POST' }))
    const cronGet = await GET_CRON(new Request('https://svc.test/api/ba-moi/v1/cron/retry-posts'))
    const cronPost = await POST_CRON(new Request('https://svc.test/api/ba-moi/v1/cron/retry-posts', { method: 'POST' }))

    expect([tool.status, webhook.status, cronGet.status, cronPost.status]).toEqual([503, 503, 503, 503])
    expect(state.calls).toHaveLength(0)
    expect(state.webhookCalls).toHaveLength(0)
    expect(state.cronCalls).toHaveLength(0)
  })
})
