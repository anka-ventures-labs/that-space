# Session log

## 2026-09-27: W-C service API, relay and outbox

### What changed

- **Routes** (Next.js route handlers, Node runtime, pinned to `sin1`):
  - `app/api/ba-moi/v1/[tool]` for the 12 tools
  - `webhooks/discourse` for the relay
  - `cron/retry-posts` for the outbox retry
- **`lib/service/`:**
  - `dispatch.ts`: the tool envelope. It checks the secret with a hashed,
    timing-safe compare, validates with zod, and resolves the member from the
    tool context only.
  - `handlers/`:
    - onboarding: `status`, `consent`, `profile_update`, `card_preview`,
      `card_confirm`
    - discovery: `box_open`, `search`
    - signals: `interest`, `signals`, `signal_respond`
    - matches: `matches`, `match_action`, and opening a match
  - `pairs.ts`: pair scoring, and the fit facts the persona may see.
  - `cards.ts`: the card under the rule of 5, a template summary, and the leak
    and contact check.
  - `profile.ts`: interview merging and validation.
  - `relay-policy.ts` and `relay.ts`: the webhook relay.
  - `outbox.ts`: database first, Discourse second, with a keyed retry queue.
  - `copy.ts`: every Vietnamese sentence the service writes, including the
    versioned consent text.
  - `deps.ts`: environment and dependencies.
- **`lib/discourse/`:** a two-call API client, and webhook HMAC verification
  over the raw body.
- **`lib/matching/score.ts`:** gained `openAnswerFit` (the spec's keyword
  fallback, since the service never calls a model), `sharedHobbies`,
  `mentionsPhrase` and `foldText`.
- **Docs:**
  - `docs/ba-moi-service-api.md` is the contract for W-E.
  - `.env.example` lists the runtime variables.
  - Spec: privacy rule 5 is updated, and "watch the pool" is marked as not in
    this version.
- **Tests:**
  - `tests/helpers/service.ts`: PGlite through postgres.js, a fake Discourse
    that can fail on demand, a settable clock, and a seeded random source.
  - `tests/fixtures/discourse/`: a `post_created` payload and a tool call, in
    the documented shapes. W-D replaces them with captured ones.
- **`vitest.config.ts`:** 30-second test and hook timeouts, because PGlite
  suites slow down several times when files run in parallel.

### Decisions

- **Only card-visible facts reach the persona.** Scores read private profiles,
  but the fit carries only the other card's contents and relationship labels:
  tier, shared hobbies, astrology labels, and same region when the card shows
  it. Children plans count in the score but are never disclosed (spec privacy
  rules 3 and 4).
- **Searches match only what cards show,** so a search can't reveal a hidden
  region. Her keywords count as her interests while that search is scored.
  Without that, a person matching exactly what she asked for scored below the
  threshold on her usual hobbies (a test caught this).
- **Limits per Vietnam day:**
  - 1 box
  - 6 search results (3 per search, so two full searches for a demo tester)
  - 5 new interests

  Repeating a yes already sent is free.
- **The sender hears only "chưa có duyên"** for a decline or a dismiss, so the
  two can't be told apart.
- **Consent is versioned in code.** `status` returns the exact text for the
  persona to show, so the version recorded is the text shown.
- **The persona's thread is remembered only from private-message tool calls.**
  Otherwise a notice could land in a public topic. If there is no such thread,
  Bà Mối opens a new private message.
- **Revealing:** the first ask notifies the other side once; the second ask
  swaps profile links. Ending or blocking tells the other side only that the
  chat ended.
- **The relay has two loop guards:** the bot-user list and the author check
  (the sender must own the relay topic). Either one alone stops a loop.
- **Watching the pool for a search** is deferred. The spec now says so, and the
  persona must not promise it.

### Found and fixed

- **Nested BBCode quotes left a fragment.** Stripping is now innermost-first,
  and stray tags are removed.
- **An outbox test assumed which relay thread opens first.** That depends on
  UUID order, so the test now finds the side that failed.
- **Timeouts under parallel files.** See the Vitest timeouts above.

### Verification

- **`npx vitest run`:** 24 files, 272 tests, passing on two runs in a row. The
  service tests cover:
  - the auth matrix: missing, wrong or malformed secret; identity forged in
    args is ignored; the persona thread only from private messages; a generic
    500 when the database is down; log lines carry ids only
  - consent gating and pause
  - interview merging, validation and the default age range
  - card previews, and the leak and contact refusals
  - re-confirmation after key changes
  - deletion, with notices to the other side
  - the box: one per Vietnam day, never the same person, a no-match uses the
    turn, and a failure gives the turn back
  - the search limit and criteria
  - the full signal loop, decline, crossing, expiry, samples and the interest
    limit
  - the relay: signature, ignored events, bots, strangers, both directions,
    holds, stripping, length and rate limits, replays, reveal, end, block
  - the outbox under a Discourse outage, recovered by the cron retry
- **"Done means" 3 (no result ever breaks a hard filter, either way):** covered
  by a seeded 40-member property test that checks against an independent
  oracle. A mutation check confirmed it fails when one direction of the gender
  filter is removed.
- **`tsc`, `next lint` and `npm run build`** are clean. The three API routes are
  dynamic. No Supabase key or password appears in `.next` output.

### Next

- **W-D:** Discourse on the ASUS, once Atum has moved off.
- **W-E:** the persona and tool scripts, from `docs/ba-moi-service-api.md`.
  This needs the OpenRouter key.
- **W-F:**
  - the Vercel preview (local prebuilt)
  - the pg_cron and pg_net retry job, which needs the service URL
  - the Muse Spark code review

## 2026-09-27: Fix: `lib/matching/derive.ts` was missing from 03b257f

The W-B commit `03b257f` imports `lib/matching/derive.ts` but didn't contain it:
the file was left out of an explicit `git add` list. This commit adds the file
unchanged. On its own, `03b257f` doesn't build; this commit does.
- Verified in a clean worktree at this commit: `tsc` is clean, and
  `tests/unit/db` and `tests/unit/matching` pass.

## 2026-09-27: W-B data layer, live on Supabase

### What changed

- **Migrations** (`supabase/migrations/`):
  - `20260927160000_ba_moi_core.sql` creates the 11 tables from the plan. Every
    idempotent write has a unique constraint behind it, and RLS is on
    everywhere with no policies.
  - `20260927170000_revoke_client_roles.sql` revokes all table and sequence
    privileges from `anon` and `authenticated`, including Supabase's default
    grants for future tables.
- **`lib/db/db.ts`:** a two-method `Db` interface over postgres.js. `getDb()`
  reads `DATABASE_URL` (the transaction pooler, port 6543) with prepared
  statements off and one connection.
- **`lib/db/repo.ts`:** the repository. It covers:
  - members and consent
  - profiles, with invalidation on change
  - cards and the pool, including rule-of-5 bucket counts
  - exclusions
  - the daily box
  - discoveries
  - interests and signals, under a pair lock
  - matches and reveal
  - blocks
  - relay topics and messages
  - the pending-post retry queue

  Results come back in camelCase through quoted aliases.
- **`lib/matching/derive.ts`:** derived profile fields. `privacy.ts` gained
  `initialOf`, so bucket counts use the same initial the card shows.
- **Samples:** `lib/db/samples.ts` and `scripts/seed-samples.ts`
  (`npm run seed:samples`) create 30 labelled sample members. They are women,
  men and "Khác", across every intent and all three regions.
- **`.env.example`** was created.
- **Dependencies:** `postgres` was added. Dev dependencies added:
  `@electric-sql/pglite`, `@electric-sql/pglite-socket` and `tsx`.

### Decisions

- **postgres.js through the pooler, not supabase-js.** The service needs
  transactions, advisory locks and `ON CONFLICT`. With postgres.js, tests and
  production also share one driver.
- **No `deleted` member status.** Deleting removes the rows, as the spec says.
- **Two invalidation lists:**
  - A change to any hard-filter input voids open discoveries both ways.
  - A change to anything except the age range also un-confirms the card,
    because its summary may be stale.
- **A pair advisory lock** on `interest` and `signal_respond`. Under READ
  COMMITTED, two crossing yeses could otherwise both miss each other and never
  match.
- **Pending posts: the lease is the backoff.** A claim counts the attempt, so a
  worker that dies mid-send can't loop forever.
- **The samples include men and "Khác".** The spec leaves "where do the men come
  from" to Thảo. Samples are labelled and never answer signals.

### Found and fixed

- **Double-encoded jsonb.** The first live seed failed with "cannot extract
  elements from a scalar". The transaction rolled back, so nothing was written.
  - Cause: postgres.js asks the server for parameter types, then JSON-encodes
    jsonb values itself, so the pre-stringified JSON was encoded twice.
    PGlite's own driver passes strings through, so the tests missed it.
  - Fix: parameters are plain values now, and the test database is reached
    through postgres.js over `pglite-socket` with the production options.
  - A mutation check confirmed the harness now reproduces the live error.
- **Supabase's default grants.** A new project gives 154 table privileges to
  `anon` and `authenticated`. RLS blocked them, but the revoke migration now
  removes them. The test database simulates those default grants, and without
  the migration the test sees the same 154.

### Deviation from the plan

The plan calls for a `pg_dump` before each schema change. None was taken:
- the first migration went onto an empty database
- the second changes only privileges, over 30 reproducible sample rows

The next migration that touches member data needs one.

### Verification

- **`npx vitest run`:** 19 files, 224 tests. The data-layer tests cover:
  - RLS, policies and grants
  - the sample and Discourse-account constraint
  - the profile round trip with derived fields
  - invalidation both ways, with signals left untouched
  - one box per Vietnam day across midnight UTC+7 (three concurrent claims,
    one winner)
  - duplicate and crossing interests: one row and one match
  - expired, wrong-recipient and declined signals
  - the reveal state machine
  - the pool and rule-of-5 buckets, and exclusions
  - relay replays
  - the pending-post lease, backoff and dead letter
  - deletion cascades
  - the sample pool
- **Concurrency tests** share one connection. They prove idempotency under
  concurrent calls. Under true parallelism in Postgres, the unique constraints
  and the pair lock are what hold.
- **`tsc` and `next lint`** are clean.
- **Live Supabase:**
  - both migrations applied with `supabase db push`
  - 11 tables with RLS, 0 policies, and 0 grants to the client roles
  - 30 samples
  - The REST API with the publishable key returns 401, "permission denied for
    table members".

### Next

W-C: the service API route handlers, the Discourse client, the webhook relay,
and the pending-post cron route, plus the pg_cron + pg_net job that calls it.
That job is also what keeps the free project from pausing. Until it runs, the
project pauses after 7 idle days.

## 2026-09-27: W-A matching core (ported from Moon), with the day pillar added

### What changed

Added `lib/matching/`, pure TypeScript with no I/O:

- **`lunar.ts`:** Moon's Vietnamese lunar calendar (Hồ Ngọc Đức, UTC+7) and
  can chi.
- **`napam.ts`:** the 30-name nạp âm reference table.
- **`tables.ts`:** Moon's can-chi relationship tables.
- **`tuoi.ts`:** tuổi hợp.
- **`bazi.ts`:** the day pillar, computed as JDN + 49 mod 60. Checked against
  1949-10-01 (Giáp Tý) and 2000-01-01 (Mậu Ngọ). A birth at 23:xx counts as
  the next day.
- **`privacy.ts`:** Moon's card, rule of 5, leak check and chat aliases, plus
  a third gender and ages computed on the Vietnam calendar day.
- **`filters.ts`:** the hard filters, in both directions.
- **`score.ts`:** directional scores, weights and tiers.
- **`pick.ts`:** Moon's weighted pick and daily-turn rule.
- **`contact.ts`:** `libphonenumber-js` and `linkify-it` (fuzzy matching
  enabled, since v6 has it off by default), plus keywords and spelled-out
  Vietnamese digits.

### Decisions

- Minh asked for day-master and day-branch compatibility. It needs only the
  birth date, so everyone gets it, weighted equally with tuổi.
- Moon's full Bát Tự engine (`compute_bazi.js`) needs a birth time and a
  dependency, `bazi-calculator-by-alvamind`. The published 1.0.2 of that
  package ships no `dist/`, so the engine couldn't run as a reference here.
  The full engine stays for A2.
- Cards show the nạp âm element and the day master only. Explanation labels
  never name a stem or branch, because that plus the age band would reveal a
  birth year. A test enforces this.

### Verification

- `npx vitest run`: 16 files, 198 tests. That is the 123 existing tests plus 75
  new matching tests, covering:
  - Tết 1985 in Vietnam versus China, and Tết 1990
  - nạp âm, day pillars, compatibility and label privacy
  - the leak check and the rule of 5
  - an exhaustive filter matrix in both directions
  - the weighted pick with a seeded random source
  - contact-detail detection
- `tsc` and `next lint` are clean.

## 2026-09-27: Plan review (Muse Spark 1.3) folded into the Discourse-native plan

- **The review.** Muse Spark 1.3 (`opencode-go/muse-spark-1.3-contributor`)
  reviewed the plan through OpenCode in ACO: router decision `94ba596c`, job
  `4f6d35a0`. Verdict: "proceed with changes", with 9 blocking findings.
- **Accepted:** the `auth` envelope built only from the tool context; the
  webhook HMAC rules (`sha256=`, raw body, timing-safe compare); the relay
  anonymity policy; contact detection with `libphonenumber-js` and
  `linkify-it`; database constraints and atomic claims; pg_cron retries for
  pending posts, with a dead letter; payload fixtures plus a probe script; the
  latency budget; secret rotation; the consent disclosure.
- **Rejected, with evidence:** the claim that 1985-02-01 is Giáp Tý. Moon's
  Vietnamese lunar algorithm (UTC+7) gives Tết Ất Sửu on 1985-01-21, and the
  Chinese calendar (UTC+8) gives 1985-02-20. Vietnam uses UTC+7, so
  1985-02-01 is Ất Sửu.
- **Verified:**
  - Discourse signs webhooks as `sha256=` plus an HMAC of the raw payload.
  - Free Supabase projects pause after 7 days idle and need a dashboard
    restore.
  - No chat-message webhook events were found; this is re-checked on the
    installed Discourse.
- **Deferred:** A2, Moon's full romantic score, until after the loop works. The
  birth time is still collected.

## 2026-09-27: Research — could Bà Mối live inside Discourse?

Minh's standing principle: lean and clean, reusing and stitching together
mature solutions before writing our own. So, before building sign-in, chat or
admin, we checked:

- **Discourse AI (official)** has native OpenRouter support
  (meta.discourse.org/t/341531).
  - AI personas can be messaged directly, as bots.
  - Custom tools get the member's `username` and `user_id`, can make HTTP
    requests with headers, and can post as the bot. Limits: 2 seconds of
    script time and 20 requests per run (meta.discourse.org/t/314103).
  - OpenRouter models must support tool use.
- **Supabase Auth** can act as an OAuth 2.1 / OpenID Connect provider at no
  extra charge (supabase.com/docs/guides/auth/oauth-server). It isn't needed
  if Discourse's built-in Google login and invites handle sign-in.
- **The Mac mini** has 8 GB of RAM, 13 GB of free disk, and colima stopped. It
  is not a viable Discourse host. The ASUS stays the target, with a temporary
  AWS instance as an option.
- **Proposed: a Discourse-native Bà Mối,** waiting on Minh's decision.
  - Discourse carries the member experience: Google login, invites, the forum,
    the Bà Mối persona in direct messages, anonymous chat through the relay,
    notifications, moderation and admin.
  - This repository becomes a headless API with Supabase: Moon's matching,
    privacy and astrology logic, the pool, signals and the relay webhook.

## 2026-09-27: W1 foundation — Next.js 15.5 and Vitest, Moon's layout

### What changed

- `next` went from 14.2.5 to 15.5.26, with `eslint-config-next` 15.5.26.
- Jest was replaced by Vitest 2.1.9, Moon's version. Page tests in
  `__tests__/` run under jsdom and unit tests in `tests/unit/` under node,
  configured in `vitest.config.ts`. `vitest.setup.ts` adds the jest-dom
  matchers and cleanup between tests.
- The layout now matches Moon: `src/app` moved to `app/`, `src/components` to
  `components/`, and `@/*` maps to the repository root. `.moon-src` is excluded
  from TypeScript.
- `app/forum/[slug]/page.tsx` takes Next.js 15's asynchronous `params`, and
  its test awaits the page.
- Scripts: `test` runs `vitest run`, and a new `typecheck` script was added.
- The Supabase, AI SDK, iztro and zod dependencies were added and then
  removed. Minh asked to keep things lean and to reuse mature solutions before
  writing our own, so dependencies arrive only when code uses them, after
  research on sign-in, chat and admin.

### Verification

- `npm test`: 10 files, 123 tests passed.
- `npx tsc --noEmit`: clean.
- `next lint`: no warnings or errors.
- `npm run build`: 18 static pages.
- `npm audit --omit=dev`: one moderate Next.js advisory, fixed only in 16.x,
  and a high advisory in the PostCSS bundled inside Next.js, which is
  build-time only. Before the upgrade it reported one critical and two high.

## 2026-09-27: Supabase project created, build plan, OpenRouter

### What changed

- **New Supabase organization and project.** Created "Thật Space" (org
  `dtcwiwgptkzsrkowbqfh`, free plan) with the approval Minh gave on
  2026-09-27. In it, project `that-space` (ref `vafeunxublsuduefolhw`,
  `ap-southeast-1`, `ACTIVE_HEALTHY`).
- **Secrets are local only.** The database password was generated locally and
  never printed. It and the project URL and API keys are in `.env.local`
  (mode 600, ignored by git).
- **Build plan.** Added `docs/plans/2026-09-27-ba-moi-build.md`, with the
  parallel MECE workstreams W1 to W8.
- **Model.** The model goes through OpenRouter; Minh will provide a separate
  key. Until then, Moon's template fallbacks keep the full loop working without
  a model.
- **Moon reference copy.** Moon's source from `origin/main` (`8f07a25`,
  1,567 files) is in `.moon-src/`, excluded from git through
  `.git/info/exclude`, as the porting reference.
- **Astrology scope for v1.** Tuổi hợp is computed from the lunar year, using
  Moon's Vietnamese lunar calendar and can-chi tables. Moon's full romantic
  score needs Tử Vi and Bát Tự charts with a birth time, so it is a later
  step.

### Verification

- `supabase projects list` shows the new project as `ACTIVE_HEALTHY`.
- `.env.local` holds the variable names `SUPABASE_PROJECT_REF`,
  `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_DB_PASSWORD`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`.
- `git status` shows no secrets.

## 2026-09-27: Discourse on the ASUS later; Supabase and model-key findings

### Decisions

- **Discourse goes on the ASUS** once Minh moves Atum to AWS. There is no EC2
  instance for Discourse. Bà Mối is built first without Discourse; sign-in and
  the chat relay are wired up when the ASUS is free.
- **The ASUS is already on the tailnet,** so Tailscale needs no new login. Its
  Funnel address will be repointed from Atum to Discourse.
- **Minh will create the Google OAuth client for Thật Space.**

### Findings (read-only)

- **Supabase:** one organization, `minhnkn22@gmail.com's Org`, with six active
  projects: Atum Platform, `moon-dev`, `atum-dev-isolated`, `andy-prod`,
  `atum-prod` and `taylor-prod`.
  - The free plan allows two active projects, so this organization is on a
    paid plan, and a new project there adds about $10 a month.
  - A free Thật Space project needs a separate free-plan organization. That is
    waiting for Minh.
- **Model keys:** Vercel project `moon-app` has only `GEMINI_API_KEY` among its
  model-provider variables.
- **Docker on the ASUS:** the account `minhnkn` has no Docker access there.

### Verification

- Documentation only; no code changed.

## 2026-09-27: Bà Mối becomes the sign-in, reusing Moon's auth

### Decision

- Bà Mối is the identity provider for Thật Space, and Discourse hands sign-in
  to it through DiscourseConnect.
  - Friends sign in with Google, via Supabase Auth ported from Moon.
  - Discourse creates their accounts already active, so nobody activates
    accounts by hand and the beta needs no email.
  - Invite-only is enforced in Bà Mối by an invite code in Thảo's link.
- This replaces the earlier plan of manual activation in Discourse.

### What Moon has (checked read-only on `origin/main` at `8f07a25`)

- **Google sign-in** through Supabase Auth: `lib/auth/google-sign-in.ts`
  (`signInWithOAuth`), plus account linking in `lib/auth/google-link-handler.ts`
  (`linkIdentity`).
- **OTP sign-in** in `lib/otp/*` and `app/api/auth/otp/{send,verify,status}`. It
  tries Zalo, then Telegram, then email, with hashing and rate limits.
  - Email codes use Supabase `signInWithOtp` and `verifyOtp`.
  - Resend is configured as the custom mail server inside Supabase Auth, per
    `lib/otp/send-email.ts`.
- **Magic links** through Supabase `admin.generateLink`.

### For Thật Space

- **Carries over:** the Google sign-in code.
- **Needs setting up:** a Google OAuth client for Thật Space; Moon's client
  would show "Moon" on Google's consent screen.
- **Waits:** email codes, which need a Thật Space sending domain on Resend.
- **Stays out:** Zalo and Telegram codes, which are tied to Moon's own Zalo
  account and Telegram bot.

### Verification

- Documentation only; no code changed.

## 2026-09-27: Cheapest demo hosting and chat through a Discourse relay

### Decisions

- **Thảo may read member chats during the beta** with her friends. So the
  anonymous chat runs on Discourse private messages through a relay: each
  member messages only the Bà Mối bot, and Bà Mối re-posts under aliases.
  - Discourse's `post_created` webhook fires for private messages.
  - Discourse chat has no webhooks, so the relay can't use chat.
  - This removes the need to port Moon's chat UI and notification delivery.
- **Hosting at the lowest cost:**
  - Bà Mối stays on Vercel at `that-space-demo.vercel.app`, with a free
    Supabase project.
  - Discourse runs on an EC2 `t3.small` in Singapore, about $22 a month, paid
    from the AWS free-plan credit.
  - Discourse is reachable through Tailscale Funnel (free HTTPS, no DNS).
  - The beta has no outgoing email, because recruitment is manual. Thảo
    shares invite links, and an admin activates each account by hand.
    Discourse supports this.
  - Supabase's default email can't serve Discourse: only team addresses, 2 an
    hour, and only Supabase Auth mail. Supabase is only Bà Mối's database;
    sign-in goes through DiscourseConnect.

### Checked (read-only)

- **ASUS (`anka-asus-ci`, 192.168.1.21):**
  - Ubuntu 26.04, 4 cores, 3.2 GiB RAM with about 1.6 GiB free, 370 GB of free
    disk.
  - Funnel already serves `https://ubuntu-asus.tail349cbf.ts.net`, proxying the
    root to `127.0.0.1:8787` (Atum).
  - Too tight for Discourse until Atum moves off.
  - `ubuntu-asus` is reached over Tailscale SSH, and the tailnet policy doesn't
    let this Mac log in as its local user. The LAN alias works.
- **AWS account `486408348462`:**
  - Free plan, $159.64 of credit left, valid until 2027-03-25.
  - Runs `atum-staging`, a `t4g.small`.
  - Free-plan instance types in Singapore include `t3.small` (2 GiB) and
    `c7i-flex.large` (4 GiB).
  - On-demand prices: `t3.small` $0.0264 an hour (about $19 a month),
    `c7i-flex.large` $0.0978 an hour (about $71 a month), `t4g.small` $0.0212 an
    hour.
- **Discourse AI custom tools** get the invoking username and user ID. They can
  make HTTP requests with headers and post as the bot. Limits: 2 seconds of
  script time and 20 requests per run.

### Verification

- Documentation only; no code changed.

## 2026-09-27: Moon code reuse, Discourse messaging, hosting

### Decisions

- **Moon reuse.** Minh built Moon entirely; no co-owner is involved. Bà Mối
  therefore reuses Moon's code, not only its design.
- **What comes over:** `lib/nhan-duyen`, the astrology engine (iztro plus the
  compatibility engine) and the chat harness (Vercel AI SDK with the model
  registry).
- **What stays out:** payments, tarot, Zalo and Telegram, affiliates. Thảo's
  January proposal promised her the full source code.
- **Stack.** This repository moves to Moon's stack: Next.js 15.5, Supabase,
  AI SDK 6.
- **Model.** Bà Mối uses Claude through the model registry, not Gemini, because
  Thảo did not want Google holding member data.
- **Discourse messaging.**
  - Not used for the anonymous stage: anonymous mode is for posting, admins can
    link anonymous accounts to real ones, and admins can read private messages.
  - Used after a mutual reveal.
  - Used as the notification channel, with short notices that carry no details.

### Hosting facts (checked 2026-09-27, read-only)

- **Vercel:** team `minh-nguyens-projects-3a747261`. Domains `anka.vc` and
  `atumplatform.com`, both with DNS hosted elsewhere; `anka.vc` DNS is at
  GoDaddy (`domaincontrol.com`).
- **AWS:** account `486408348462` (Minh Anka), reachable locally as the IAM
  user `coding-agent`.
  - EC2 reads work in `ap-southeast-1`.
  - SES in `ap-southeast-1` is in sandbox mode: 200 emails a day, no production
    access.
  - The Hanoi Local Zone `ap-southeast-1-han-1a` exists, but the account has
    not opted in.

### Verification

- Documentation only; no code changed.

## 2026-09-27: Bà Mối spec v2 (anonymous matchmaking) and architecture

### What changed

- Rewrote `docs/ba-moi-spec.md` as v2. Minh clarified that matchmaking is
  anonymous by design and should work like Moon's Nhân Duyên:
  - Each member talks to her own AI matchmaker, which puts a card with no
    personal identifiers into a shared pool.
  - A daily box, or a request such as "find me someone who…", brings back a
    candidate described anonymously.
  - An interest signal reaches the recipient through her own matchmaker's
    summary.
  - Mutual acceptance opens an anonymous chat.
- Proposed architecture: self-hosted Discourse for the community (membership,
  forum, events, identity through DiscourseConnect), with Bà Mối as a separate
  service in this repository.

### Research

- **Forum platforms** (GitHub data from 2026-09-27):
  - Discourse: GPL-2.0, 47.9k stars, active. It is the mature choice, with
    invite-only mode, groups, chat, AI personas, and DiscourseConnect as both
    identity provider and client.
  - NodeBB: GPL-3.0, 15.2k stars.
  - Flarum: MIT, 6.8k stars; 2.0 is still a release candidate.
  - Forem: AGPL-3.0.
  - Misago, HumHub and Apache Answer were considered and are a weaker fit.
  - Discourse admins can read all private messages. That rules out running the
    matchmaker inside forum messages.
- **Matchmaking foundations.** None fits the anonymous-pool model:
  - Compass (`CompassConnections/Compass`, AGPL-3.0, a fork of MIT Manifold
    Love) is a public, searchable directory.
  - Duolicious (AGPL-3.0) is quiz-based with public profiles.
  - pH7 Dating CMS (MIT, PHP) is a classic dating site.

  The building blocks come from standard open-source parts, Postgres with
  pgvector, plus Moon's design.
- **Moon's Nhân Duyên.** We studied Moon `main` at `8f07a25`, reusing the
  design, not the code. The following was verified directly from the code:
  - Opt-in profile with versioned consent, pause and delete
    (`database/migration-074-nhan-duyen-foundation.sql`).
  - Discoveries score both directions, and both must pass the threshold. The
    same pair is never shown twice.
  - Interests carry a payload written for the recipient.
  - Signal responses are `pending`, `accepted`, `declined`, `dismissed` or
    `expired` after 7 days (`migration-096`).
  - Matches move from `mutual_interest` to `revealed` to `closed`.
  - Anonymous conversations keep messages sanitized, and reports include
    `contact_exchange` (`migration-094`, `migration-125`).
  - The mutual score is the lower of the two directions. The daily box makes a
    weighted random pick above the threshold (`lib/nhan-duyen/matching.ts`).
  - The anonymous card, the rule of 5, and the leak check live in
    `lib/nhan-duyen/privacy.ts`.
  - Moon's chat assistant has no pool-search tool, so "ask Bà Mối to find
    someone" is new here.
- A deeper read-only study of Moon's flow was routed through agent-jobs to
  Codex (decision `164863d7`, job `14aceefe`, model gpt-5.6-sol). Its claims
  were checked against the code before being folded into the spec:
  - A no-match opening uses up the day's box (`lib/nhan-duyen/daily.ts`,
    `migration-100`).
  - A decline is final (`tests/unit/nhan-duyen-service.test.ts`).
  - The recipient's card is built from a template, with the rule-of-5 bucket
    set to 1 and a leak check (`lib/nhan-duyen/service.ts`).
  - Chat allows 1,200 characters per message and 12 messages a minute
    (`lib/nhan-duyen/conversations.ts`).
  - Sending requires a verified Zalo or Telegram account.
  - Nothing at runtime ever sets `revealed`.
  - AI-written cards get 3 attempts, then fall back to a template.
- Gaps in Moon that the spec now fills:
  - no way to end a chat except blocking
  - no reveal step
  - no automated message moderation
  - no queue for reviewing reports
  - no search by traits
- Correction: an earlier message to Minh said a no-match opening keeps the
  day's turn. It doesn't, and the spec now follows Moon.

### Verification

- Documentation only; no code changed.

### Next

- Confirm the architecture with Minh.
- Decide where Discourse runs for the demo, on what domain and email service.
- Then build Bà Mối to spec v2.

## 2026-09-27: Bà Mối v1 spec

### What changed

- Added `docs/ba-moi-spec.md`, a short spec for Bà Mối, an AI matchmaker for
  Thật Space, and linked it from the README.

### Why

- On the 2026-09-25 call, Thảo and Minh agreed to build a custom AI matchmaker
  for Thật Space instead of integrating Moon AI. Thảo was to send a spec first.
- Minh decided not to wait. Thảo reacts to things she can use rather than
  writing specs, so a working prototype comes first and her feedback shapes v2.
- Thảo's 15-question set in Drive (`Bo_cau_hoi_That_Space`) is forum onboarding
  (art, healing, retreats), not dating, so it stays with the phase 2 forum.
- The spec starts from intent (friendship, casual, long-term, marriage) and who
  someone wants to meet, then standard dating questions and one open question.
  It answers Thảo's two complaints about Moon AI: matches ignored intent, and
  readings were too generic.

### Background sources (Minh's Google Drive)

- "Thật Space - Forum Development Proposal" and
  "Womens_Forum_Software_Specification.docx" (January 2026)
- Fathom recaps of the calls with Thao Nguyen on 2026-03-23 and 2026-09-25

### Verification

- Documentation only; no code changed.

### Next

- Build to the spec on `feat/ba-moi`. Start with the Next.js security upgrade
  and the tuổi (can chi) engine, which depend on nothing else.

## 2026-09-27: Recover source from Vercel and create the repository

### What changed

- Recovered the complete source of the Thật Space demo from Vercel production
  deployment `dpl_96qbsSc72amjziWADYYJ8UQL72Ts` (project `that-space-demo`,
  deployed from the CLI on 2026-02-23). The project had never been in Git, and
  no local copy remained.
- Imported the files unchanged. Added `.gitignore` (Next.js defaults plus
  `.swc/` and `.env*`), `README.md`, and this log.
- Created the private repository `anka-ventures-labs/that-space` with
  `anka-repo create`.

### How the source was recovered

- `GET /v6/deployments/<id>/files` returned the tree. Its `src/` node is the
  project root; `out/` is build output and was skipped, as was the empty
  `.swc/` cache.
- `GET /v7/deployments/<id>/files/<uid>` returned each file as base64. Vercel
  file uids are SHA-1 digests of the content, and all 36 files matched.
- Two recovered files are generated by Next and are excluded by `.gitignore`:
  `tsconfig.tsbuildinfo` and `next-env.d.ts`.

### Verification

Run on Node 22.23.1 and npm 10.9.8 after `npm ci` from the recovered lockfile:

- `npm test`: 10 suites, 123 tests passed.
- `npx tsc --noEmit`: no errors.
- `npm run lint`: no ESLint warnings or errors.
- `npm run build`: succeeded with 18 static pages, the same routes as the
  deployed build.
- The same four checks passed on a fresh clone of the import commit. The
  typecheck runs before any build there, so it passes without `next-env.d.ts`.

### Decisions

- The repository is named `that-space` to match the local folder. The Vercel
  project keeps the name `that-space-demo`.
- The Vercel project stays disconnected from GitHub, following the studio policy
  of no Git auto-deploy.
- The initial import was pushed directly to `main` because a new repository has
  no base branch for a pull request. Later changes go through pull requests.

### Open items

- Upgrade `next` from 14.2.5 to 14.2.35 together with `eslint-config-next`,
  re-run the checks, then redeploy the demo through the preview-first flow.
  `npm audit --omit=dev` reports 1 critical and 2 high findings.
- Consider a GitHub Actions workflow on `ubuntu-latest` that runs test,
  typecheck, lint, and build on pull requests.
