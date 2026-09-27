/**
 * W-D checks, run from any machine outside the tailnet:
 *   npm run discourse:probe
 * 1. The forum answers through Tailscale Funnel (/srv/status).
 * 2. Each bot's single-user key acts as that bot, and only that bot.
 * 3. With DISCOURSE_ADMIN_API_KEY: the relay webhook exists, is active, and
 *    points at the service.
 * 4. With BA_MOI_SERVICE_URL: the service refuses an unauthenticated tool call.
 * Read-only: it creates nothing. Exits 1 if any check fails.
 */
import { z } from 'zod'

const env = z.object({
  DISCOURSE_URL: z.url(),
  DISCOURSE_PERSONA_API_KEY: z.string().min(16),
  DISCOURSE_RELAY_API_KEY: z.string().min(16),
  BA_MOI_PERSONA_USERNAME: z.string().default('ba_moi'),
  BA_MOI_RELAY_USERNAME: z.string().default('thu_duyen'),
  DISCOURSE_ADMIN_API_KEY: z.string().optional(),
  DISCOURSE_ADMIN_USERNAME: z.string().default('system'),
  BA_MOI_SERVICE_URL: z.url().optional(),
}).parse(process.env)

const forum = env.DISCOURSE_URL.replace(/\/+$/, '')
let failed = 0

function report(ok: boolean, label: string, detail = '') {
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? `: ${detail}` : ''}`)
}

async function get(url: string, headers: Record<string, string> = {}) {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(10_000) })
    return { status: response.status, text: await response.text() }
  } catch (error) {
    return { status: 0, text: (error as Error).message }
  }
}

async function main() {
  const health = await get(`${forum}/srv/status`)
  report(health.status === 200 && health.text.trim() === 'ok', 'forum reachable through Funnel', `HTTP ${health.status}`)

  for (const [username, key] of [[env.BA_MOI_PERSONA_USERNAME, env.DISCOURSE_PERSONA_API_KEY], [env.BA_MOI_RELAY_USERNAME, env.DISCOURSE_RELAY_API_KEY]]) {
    const self = await get(`${forum}/session/current.json`, { 'Api-Key': key, 'Api-Username': username })
    const actual = self.status === 200 ? (JSON.parse(self.text).current_user?.username as string | undefined) : undefined
    report(actual === username, `${username}'s key acts as ${username}`, actual ? `as ${actual}` : `HTTP ${self.status}`)
    const other = await get(`${forum}/session/current.json`, { 'Api-Key': key, 'Api-Username': 'system' })
    report(other.status !== 200, `${username}'s key can't act as anyone else`, `as system: HTTP ${other.status}`)
  }

  const webhookUrl = env.BA_MOI_SERVICE_URL ? `${env.BA_MOI_SERVICE_URL.replace(/\/+$/, '')}/webhooks/discourse` : null
  if (env.DISCOURSE_ADMIN_API_KEY && webhookUrl) {
    const hooks = await get(`${forum}/admin/api/web_hooks.json`, { 'Api-Key': env.DISCOURSE_ADMIN_API_KEY, 'Api-Username': env.DISCOURSE_ADMIN_USERNAME })
    const list = hooks.status === 200 ? (JSON.parse(hooks.text).web_hooks ?? []) as Array<{ payload_url: string; active: boolean }> : []
    const hook = list.find((h) => h.payload_url === webhookUrl)
    report(!!hook?.active, 'relay webhook active and pointing at the service', hook ? webhookUrl : `HTTP ${hooks.status}, not found`)
  } else {
    console.log('- webhook check skipped (needs DISCOURSE_ADMIN_API_KEY and BA_MOI_SERVICE_URL)')
  }

  if (env.BA_MOI_SERVICE_URL) {
    try {
      const response = await fetch(`${env.BA_MOI_SERVICE_URL.replace(/\/+$/, '')}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10_000),
      })
      report(response.status === 401, 'service refuses an unauthenticated tool call', `HTTP ${response.status}`)
    } catch (error) {
      report(false, 'service reachable', (error as Error).message)
    }
  } else {
    console.log('- service check skipped (needs BA_MOI_SERVICE_URL)')
  }

  console.log(failed ? `${failed} check(s) failed.` : 'All checks passed.')
  process.exit(failed ? 1 : 0)
}

main()
