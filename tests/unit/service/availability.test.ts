import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createHarness, testUser, type Harness } from '../../helpers/service'

let h: Harness
beforeAll(async () => {
  h = await createHarness()
  h.deps.config.enabled = false
})
afterAll(async () => h.close())

describe('Bà Mối launch switch', () => {
  it('blocks tool, webhook, and retry ingress while disabled', async () => {
    const tool = await h.call('status', testUser('disabled-member'))
    const webhook = await h.webhook({ id: 99, topic_id: 88, user_id: 77, raw: 'hello' })
    const cron = await h.cron()

    expect(tool.status).toBe(503)
    expect(tool.body).toMatchObject({ ok: false, error: 'service_disabled' })
    expect(webhook.status).toBe(503)
    expect(webhook.body).toMatchObject({ ok: false, outcome: 'service_disabled' })
    expect(cron.status).toBe(503)
    expect(cron.body).toMatchObject({ ok: false })
    expect(h.discourse.calls).toHaveLength(0)
  })
})
