# ASUS deployment assembly review — 2026-10-04

Job: `ce505048-cd49-4f56-821a-cf6eaaa7d7a4`; route: `d98d5e88-c046-4b47-a249-861f56c34958`.
Provider: OpenCode Go / Muse Spark. Reviewed the staged deployment and retry changes against `ae50556`.
Retained event cursor: `10358`; output cursor: `0`. Terminal result read before delivery acknowledgement.

## Verdict: **SHIP checkpoint** — staged scope safe to keep as assembly checkpoint. **Live acceptance unproved** (separate gates below).

This is checkpoint-only. No live route, users, deploy, or credentials proved here.

## Confirmed findings — severity ordered

### M1 — Upgrade overlay can leave stale files [Medium, Correctness/Data, Introduced]
**Evidence:**
* `docs/asus-deployment.md` — staging: `git archive ... | ssh ... 'sudo install -d .../source && sudo tar -xf - -C .../source'` + “replace only that known source tree with an archive”
* `tar -xf` overwrites but never deletes files removed between commits.

First deploy uses empty `source` — safe. Second release would retain deleted files.

**Fix (doc-only, 1 line):** after backup, `sudo rm -rf /var/discourse/shared/that-space/source` then `install -d -m 0755` then `tar -xf`. Record both commit IDs. Do not change first-deploy path.

### M2 — New installer has no automated tests [Medium, Missing tests, Introduced]
**Evidence:**
* `scripts/configure-ba-moi-retry.ts:60-68` `retryUrl()`, `:104-107` `complete()`, `:50-58` `mode()`
* `tests/helpers/pglite-db.ts:24-27` explicitly skips `*_ba_moi_retry_extensions.sql`
* No `tests/**/*retry*` in staged diff.

PGlite skip is correct — no bgworkers/HTTP — but leaves `verifyPrerequisites / expectedCommand / vault.create|update_secret / cron.schedule|alter_job` to live `--check` only.

**Fix:** add pure tests for `retryUrl` — https-only, rejects userinfo, trailing-slash, `/cron/retry-posts` join, query/hash handling — and `complete()`. Keep live `--check` as gate; do not mock Vault/cron for launch.

### M3 — `DISCOURSE_PORT -> base_url:8443` contract unproved in this review [Medium, Correctness, Introduced claim]
**Evidence:**
* `discourse/deployment/that-space.yml.example:47-49` `HOSTNAME` port-free + `PORT: "8443"` + `FORCE_HTTPS: "true"`
* `docs/asus-deployment.md` claims locked core `c237680...` `discourse_defaults.conf` + `copy-env` makes `Discourse.base_url=https://ubuntu-asus.tail349cbf.ts.net:8443`

Plausible and consistent, but pinned core source and `prepare-runtime.py / bootstrap.rb` were not in supplied context and external reads were blocked. Cannot verify `DISCOURSE_PORT` is honored vs ignored.

**Fix:** no change now. Live gate: after `rebuild`, verify `discourse.conf` + `rails runner 'puts Discourse.base_url'` + local/external `curl --fail .../srv/status`. If mismatch, fix via owned manifest, not speculative YAML edit.

### L1 — `retryUrl` silently strips `?query/#hash` [Low, Correctness/Security, Introduced]
**Evidence:** `scripts/configure-ba-moi-retry.ts:60-68` clears `search/hash`.

If operator puts token in query, it is silently dropped, not rejected.

**Fix:** reject when `url.search` or `url.hash` non-empty, or document stripping is intentional. One-line.

### L2 — `cron.alter_job(..., NULL, NULL, true)` positional [Low, Lifecycle/Robustness, Introduced]
**Evidence:** `scripts/configure-ba-moi-retry.ts:127` `SELECT cron.alter_job(${jobId}::bigint, ${SCHEDULE}, ${command}, NULL, NULL, true)`

Order matches `pg_cron(job_id,schedule,command,database,username,active)` and `NULL` preserves per current `pg_cron`, verified by re-`--check` in `main`. Brittle to signature drift.

**Fix (optional):** use named notation: `cron.alter_job(job_id:=..., schedule:=..., command:=..., active:=true)`. Verify live with `--check`.

### L3 — Vault enablement wording [Low, Docs, Introduced]
**Evidence:**
* `supabase/migrations/20261004144144_ba_moi_retry_extensions.sql:4-5` only `pg_cron` + `pg_net`
* `docs/ba-moi-retry.md: Prerequisites` says “enable `pg_cron`, `pg_net`, and Vault”

Vault needs no migration on Supabase — installer checks `vault.decrypted_secrets` — but operator may look for missing vault migration.

**Fix:** one-line clarification: Vault is pre-existing/dashboard, no migration; installer verifies.

## Verified OK — no change

* **Credentials/privacy:** No secrets in diff. `REPLACE_WITH_ADMIN_EMAIL`, `<existing-llm-id>`, `postgresql://...` placeholders only. `COMMAND_TEMPLATE` holds Vault lookup by name only; `CRON_SECRET` bound param, never in `cron.job.command`/output/errors. `console.error` maps codes, never prints DB error. `git archive HEAD` excludes ignored env; `/.backups/` ignored in `.gitignore:16`. `SESSION_LOG` exposes only project ref/hostname, no keys.
* **Host coexistence:** `expose: "127.0.0.1:8080:80"`; Funnel `8443->8080`, Taylor `9000/9001` + `443->8787` preserved; explicit ban on `system/container prune`; `docker_args "--memory=2g --memory-swap=4g --cpus=2"` within `3.2GiB+3.7swap/2.4avail`.
* **Determinism:** launcher `8d705a91...`, base digest `sha256:5028d...`, core `c237680...`, Follow `419abd...` pinned; `before_code` python3 guard minimal; `after_code` as `discourse` user avoids ownership refusal.
* **Data loss/rollback:** backup before extensions/bootstrap/upgrade; single data path `/var/discourse/shared/that-space`; rollback = restore yml+source+`rebuild`; route removal = remove `8443` + `stop that-space` only; never delete data dir.
* **Regression:** `pglite-db.ts` skip is narrow suffix match, core/privilege migrations unaltered; RLS/no-anon grants untouched.

Pre-existing (not introduced): 11 tables RLS true, 30 samples/0 members, `302` tests/typecheck/lint claims, Taylor services, Vercel project with no vars. Preserved, not regressed.

Tool limit: `rg`/external reads blocked; review from staged diff + 5 supplied files. `package.json` zod version (`z.url()` needs v4), pinned core defaults, `prepare-runtime.py`, `bootstrap.rb` not available — treated as live gates, not assumed.

## Live acceptance still unproved — do not infer

Rebuild within `2G/4G/2CPU`; `tailscale funnel status` preserves `443`, adds `8443`; local+external `/srv/status`; `base_url`; admin via `rake admin:create`; community/presentation `--check`; moderation only with real LLM ID; backup copied off-host + restore into isolated instance; guest denial, activation/recovery, upload via Funnel, restart, phone/VI moderation; Bà Mối fail→`pending_posts`→retry delivers in own PM + redacted log; bot keys/webhook/service URL/keys; two-member journey.
