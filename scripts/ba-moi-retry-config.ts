export const RETRY_JOB_NAME = 'that-space-ba-moi-retry'
export const RETRY_VAULT_SECRET_NAME = 'that_space_ba_moi_cron_secret'
export const RETRY_SCHEDULE = '*/5 * * * *'

export type RetryJob = {
  jobId: string
  schedule: string
  command: string
  active: boolean
}

export type RetryVaultSecret = {
  id: string
  matches: boolean
}

/**
 * Builds the one fixed endpoint that a pg_cron invocation may call.
 * Query strings and fragments are rejected so credentials cannot be accepted
 * and then silently omitted from the durable cron command.
 */
export function retryUrl(serviceUrl: string): string {
  try {
    const url = new URL(serviceUrl)
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error('invalid_service_url')
    }
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/cron/retry-posts`
    return url.toString()
  } catch {
    throw new Error('invalid_service_url')
  }
}

/** True only for exactly one matching secret and active, exact cron job. */
export function complete(secretRows: RetryVaultSecret[], jobs: RetryJob[], command: string): boolean {
  return secretRows.length === 1 && secretRows[0].matches &&
    jobs.length === 1 && jobs[0].schedule === RETRY_SCHEDULE && jobs[0].active && jobs[0].command === command
}
