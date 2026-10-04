# Bà Mối retry schedule

The Bà Mối service records every failed Discourse write in `pending_posts`. A
single Supabase Cron job retries due rows every five minutes by sending an
authenticated `POST` to the deployed service.

The job is named `that-space-ba-moi-retry`. Its bearer credential is stored in
Supabase Vault as `that_space_ba_moi_cron_secret`; the cron command reads that
value from `vault.decrypted_secrets` when it runs. It never stores the secret
in `cron.job.command`.

## Prerequisites

Apply the normal Bà Mối schema migrations and, after a backup, enable
`pg_cron` and `pg_net` in the target project. Supabase Vault is already provided
by this project; the installer verifies its decrypted-secret view, so this
release adds no Vault migration. The running role
must be able to manage its own `cron.job` and the named Vault secret. Do not
grant `anon` or `authenticated` access to Cron, Vault, or their decrypted
views.

The operational extension migration requires Supabase/Postgres background
workers and HTTP support. PGlite applies the core table and privilege migrations;
it omits only this named extension migration. The installer checks the real
Supabase extension functions, job and Vault credential independently.

Set these values only in the trusted operator environment (normally
`.env.local`):

```text
DATABASE_URL=postgresql://...            # Supabase transaction-pooler URL
CRON_SECRET=<32-or-more-random-characters>
BA_MOI_SERVICE_URL=https://<service>/api/ba-moi/v1
```

`BA_MOI_SERVICE_URL` must be HTTPS and must not include credentials, a query,
or a fragment. The script
adds `/cron/retry-posts` itself. It does not read or write Vercel environment
variables, Discourse configuration, bot identities, or AI model credentials.

## Inspect and apply

Check the live configuration without changing it:

```bash
npx tsx --env-file=.env.local scripts/configure-ba-moi-retry.ts --check
```

After reviewing any reported drift, create or update the one named secret and
one named job:

```bash
npx tsx --env-file=.env.local scripts/configure-ba-moi-retry.ts --apply
```

The installer uses `vault.create_secret` or `vault.update_secret` with bound
SQL parameters. It uses the same fixed job name on every apply, so a normal
reapply updates the existing job through `cron.alter_job` rather than creating
another schedule. It refuses ambiguous duplicate Vault secrets or cron jobs.

The installed job has schedule `*/5 * * * *`, an active status, JSON body
`{}`, `Content-Type: application/json`, an Authorization header assembled from
the Vault value, and a 10-second `net.http_post` timeout.

For non-secret inspection, use the Supabase Cron dashboard or query only the
fixed job's name and active status. Do not copy `cron.job.command` or Vault
rows into tickets, logs, or chat because the command identifies the service
route and Vault is sensitive.

## Live acceptance

After a real service and both Discourse bot keys are configured, cause one
safe test delivery to fail, confirm a pending row is retained, then restore the
write path and confirm the next retry delivers it. Verify the result in the
member's own private message and in the service's redacted event log. Do not
use a real member's private text for this test.

To pause retries, set the exact `that-space-ba-moi-retry` job inactive in the
Supabase Cron dashboard or call `cron.alter_job` for that exact job ID with
`active := false`. To remove it, call `cron.unschedule` for that exact job name.
Do not disable or remove unrelated scheduled work.

This does not change the generated negative Discourse AI bot ID or either bot
username. Those remain a separate installation acceptance step.
