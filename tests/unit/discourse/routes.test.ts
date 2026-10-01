import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ deps: { source: 'route-test' }, calls: [] as Array<[string, Request, unknown]> }))

vi.mock('@/lib/service/deps', () => ({
  getDeps: () => state.deps,
}))

vi.mock('@/lib/service/dispatch', () => ({
  handleToolRequest: async (name: string, request: Request, deps: unknown) => {
    state.calls.push([name, request, deps])
    return new Response(JSON.stringify({ name }), { status: name === 'nope' ? 404 : 401 })
  },
}))

import { POST } from '@/app/api/ba-moi/v1/[tool]/route'

beforeEach(() => { state.calls.length = 0 })

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
})
