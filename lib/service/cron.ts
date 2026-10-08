/**
 * /api/ba-moi/v1/cron/retry-posts: called every 5 minutes by Supabase pg_cron
 * through pg_net with `Authorization: Bearer CRON_SECRET`. Each call also
 * counts as activity, which keeps the free Supabase project from pausing.
 */
import { bearerMatches } from './dispatch'
import type { ServiceDeps } from './deps'
import { retryDuePosts } from './outbox'

export async function handleRetryRequest(request: Request, deps: ServiceDeps): Promise<Response> {
  if (!deps.config.enabled) {
    deps.log({ event: 'cron_retry', status: 503, outcome: 'service_disabled' })
    return Response.json({ ok: false, error: 'service_disabled' }, { status: 503 })
  }
  if (!bearerMatches(request.headers.get('authorization'), deps.config.cronSecret)) {
    return Response.json({ ok: false }, { status: 401 })
  }
  const result = await retryDuePosts(deps)
  deps.log({ event: 'cron_retry', ...result })
  return Response.json({ ok: true, ...result })
}
