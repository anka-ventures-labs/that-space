/**
 * Installs the one durable-delivery retry job used by the Bà Mối service.
 *
 * The cron command holds only a Vault lookup by fixed name. The supplied
 * CRON_SECRET is never put into cron.job, output, or an error message.
 *
 *   npx tsx --env-file=.env.local scripts/configure-ba-moi-retry.ts --check
 *   npx tsx --env-file=.env.local scripts/configure-ba-moi-retry.ts --apply
 */
import postgres from 'postgres'
import { z } from 'zod'
import {
  complete,
  RETRY_JOB_NAME,
  RETRY_SCHEDULE,
  RETRY_VAULT_SECRET_NAME,
  retryUrl,
  type RetryJob,
  type RetryVaultSecret,
} from './ba-moi-retry-config'

const TIMEOUT_MS = 10_000
const SECRET_DESCRIPTION = 'Bearer credential for the Bà Mối retry scheduler'

const EnvSchema = z.object({
  DATABASE_URL: z.url(),
  CRON_SECRET: z.string().min(32),
  BA_MOI_SERVICE_URL: z.url(),
})

/**
 * `%L` is filled by PostgreSQL's format(), with URL and secret name supplied
 * as SQL parameters. Its result is then supplied as the command parameter to
 * cron.schedule/alter_job. Thus the secret itself never appears in the command.
 */
const COMMAND_TEMPLATE = `
SELECT net.http_post(
  url := %L,
  body := '{}'::jsonb,
  headers := jsonb_build_object(
    'Authorization',
    'Bearer ' || (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name = %L
    ),
    'Content-Type', 'application/json'
  ),
  timeout_milliseconds := ${TIMEOUT_MS}
);
`.trim()

function mode(): 'check' | 'apply' {
  const args = process.argv.slice(2)
  if (args.length !== 1 || !['--check', '--apply'].includes(args[0])) {
    throw new Error('usage')
  }
  return args[0] === '--check' ? 'check' : 'apply'
}

async function verifyPrerequisites(sql: postgres.Sql): Promise<void> {
  const [state] = await sql<{ cron: boolean; net: boolean; vault: boolean }[]>`
    SELECT
      to_regclass('cron.job') IS NOT NULL AS cron,
      to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') IS NOT NULL AS net,
      to_regclass('vault.decrypted_secrets') IS NOT NULL AS vault
  `
  if (!state?.cron || !state.net || !state.vault) throw new Error('missing_prerequisites')
}

async function expectedCommand(sql: postgres.Sql, url: string): Promise<string> {
  const [row] = await sql<{ command: string }[]>`
    SELECT format(${COMMAND_TEMPLATE}::text, ${url}::text, ${RETRY_VAULT_SECRET_NAME}::text) AS command
  `
  if (!row?.command) throw new Error('command_generation_failed')
  return row.command
}

async function readSecret(sql: postgres.Sql, secret: string): Promise<RetryVaultSecret[]> {
  return sql<RetryVaultSecret[]>`
    SELECT id::text AS id, decrypted_secret = ${secret} AS matches
    FROM vault.decrypted_secrets
    WHERE name = ${RETRY_VAULT_SECRET_NAME}
  `
}

async function readJobs(sql: postgres.Sql): Promise<RetryJob[]> {
  return sql<RetryJob[]>`
    SELECT jobid::text AS "jobId", schedule, command, active
    FROM cron.job
    WHERE jobname = ${RETRY_JOB_NAME}
  `
}

async function applySecret(sql: postgres.Sql, secretRows: RetryVaultSecret[], secret: string): Promise<void> {
  if (secretRows.length > 1) throw new Error('ambiguous_secret')
  if (secretRows.length === 0) {
    await sql`
      SELECT vault.create_secret(${secret}, ${RETRY_VAULT_SECRET_NAME}, ${SECRET_DESCRIPTION})
    `
  } else if (!secretRows[0].matches) {
    await sql`
      SELECT vault.update_secret(${secretRows[0].id}::uuid, ${secret}, ${RETRY_VAULT_SECRET_NAME}, ${SECRET_DESCRIPTION})
    `
  }
}

async function applyJob(sql: postgres.Sql, jobs: RetryJob[], command: string): Promise<void> {
  if (jobs.length > 1) throw new Error('ambiguous_job')
  if (jobs.length === 0) {
    await sql`
      SELECT cron.schedule(${RETRY_JOB_NAME}, ${RETRY_SCHEDULE}, ${command})
    `
  } else if (jobs[0].schedule !== RETRY_SCHEDULE || !jobs[0].active || jobs[0].command !== command) {
    await sql`
      SELECT cron.alter_job(
        job_id := ${jobs[0].jobId}::bigint,
        schedule := ${RETRY_SCHEDULE},
        command := ${command},
        active := true
      )
    `
  }
}

async function main() {
  const selectedMode = mode()
  const env = EnvSchema.safeParse(process.env)
  if (!env.success) throw new Error('invalid_environment')

  const sql = postgres(env.data.DATABASE_URL, {
    ssl: 'require',
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  try {
    await verifyPrerequisites(sql)
    const command = await expectedCommand(sql, retryUrl(env.data.BA_MOI_SERVICE_URL))
    let secretRows = await readSecret(sql, env.data.CRON_SECRET)
    let jobs = await readJobs(sql)

    if (secretRows.length > 1 || jobs.length > 1) throw new Error(secretRows.length > 1 ? 'ambiguous_secret' : 'ambiguous_job')
    if (selectedMode === 'check') {
      if (!complete(secretRows, jobs, command)) throw new Error('drift')
      console.log('Bà Mối retry schedule is configured.')
      return
    }

    await applySecret(sql, secretRows, env.data.CRON_SECRET)
    await applyJob(sql, jobs, command)
    secretRows = await readSecret(sql, env.data.CRON_SECRET)
    jobs = await readJobs(sql)
    if (!complete(secretRows, jobs, command)) throw new Error('apply_verification_failed')
    console.log('Bà Mối retry schedule configured.')
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((error: unknown) => {
  const code = error instanceof Error ? error.message : 'unknown'
  const messages: Record<string, string> = {
    usage: 'Use exactly one of --check or --apply.',
    invalid_environment: 'Retry scheduler environment is incomplete or invalid.',
    invalid_service_url: 'The retry service URL must be an HTTPS URL without credentials.',
    missing_prerequisites: 'pg_cron, pg_net, and Supabase Vault must be enabled before configuring retries.',
    command_generation_failed: 'Could not prepare the retry command.',
    ambiguous_secret: 'More than one matching Vault secret exists; reconcile it before applying.',
    ambiguous_job: 'More than one matching cron job exists; reconcile it before applying.',
    drift: 'Retry schedule drift detected. Run --apply after reviewing the live configuration.',
    apply_verification_failed: 'Retry schedule could not be verified after apply.',
  }
  // Never print a database error: it can contain a connection URL or SQL text.
  console.error(messages[code] ?? 'Retry scheduler operation failed.')
  process.exit(1)
})
