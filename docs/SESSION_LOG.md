# Session log

## 2026-10-01: assembled community build for real Discourse acceptance

Hosted run `36859513094` at `c4ac1de` retained the post error: native
`NewPostManager` reports forbidden category posting. Source inspection also
confirmed that native featured topics prohibit group-restricted categories.
Switched member categories to standard `everyone/full` ACLs inside the required
login/invite/staff-approval site boundary; announcements remain staff-post only.
Reconciliation recognizes core's empty ACL representation for unrestricted
categories, and the manifest refuses disabling those private-site requirements.
Added actual guest topic-read denial plus native group/Guardian diagnostics before
the invitee's post. Read-only investigation route
`24fc1891-6d7d-4ace-8057-92935d8be9d2` completed; prior validator exploration
`2377e5a8-5f1f-4230-9069-cecc7180b7a0` also completed. No arbitrary posting-rule
relaxation was made. The CI browser steps now run after a failed request suite
when frontend/Chromium preparation succeeds, preserving the request failure as a
failed job while collecting independent browser evidence in the same checkpoint.

Hosted run `36858314551` at `a6bf504` passed 22 of 24 native examples. Signup,
first-login role mapping, private answers, real logout/upload denial, following,
events/RSVP and all moderation examples now pass. Corrected the featured-topic
fixture to use Discourse's dedicated `PUT /u/:username/feature-topic.json`
endpoint. The newly invited member's topic returns 422; added its response body
to the failed assertion for concrete validation diagnosis rather than changing
posting policy without evidence. Request acceptance still gates browser tests.

Hosted run `36856879291` at `627e0cf` executed 24 native examples: 15 passed,
including all five review-only AI moderation examples; nine failed. Normalized
manifest permission strings to Discourse enum integers at both category writes,
fixing member posting and repeated application drift. Kept array-shaped signup
requests and compared answer values as arrays because Discourse stores a single
multiselect choice as a scalar. Replaced the native test helper's unmatched
`DELETE /session` route with the actual username logout endpoint; logout now
asserts cleared session/cookies before checking anonymous upload/event denial.
This is a fixture correction, not a relaxed privacy boundary. Native worker
route `d743cdfd-255e-47e5-a814-bf136b88a534` completed for the anonymous fixtures;
coordinator assembled and verified syntax/whitespace. Browser acceptance remains
next after request acceptance passes.

Closed the theme's font-loading gap: the initial CSS named Inter and Playfair
Display but provided no font sources. Added the unchanged Latin, Latin Extended
and Vietnamese WOFF2 subsets from the existing Next.js Google-font build as
local theme assets, with the matching unicode ranges, official SIL licenses and
SHA-256 provenance. Static checks verify asset references and WOFF2 headers;
the native browser acceptance will compile the final theme.

Assembly review `b31ce0d5-03df-4e05-84d3-0fdad462080f` (OpenCode Muse Spark,
route `b22e9e9e-598e-43b0-bc36-bcef98c248c8`) completed and was read before the
ship decision. Exact-owner delivery acknowledged; feedback completed. Retained
result/cursor in `reviews/community-assembly-20261001.md`. No confirmed static
security/takeover/auto-sanction blocker; verdict permits this build checkpoint
for hosted acceptance only. Added native required-field validation, explicit
partial-check drift when themes are missing, takeover-refusal regressions and
native array-shaped multiselect signup fixtures. Other suggested assertion
changes require runtime evidence; current upload denial status and event primary
key are supported by the pinned source, so their precise assertions remain.

Hosted run `36855826009` at `4a271a5` executed 22 native examples. Sixteen failures
shared a concrete group-name validation error: role names exceeded Discourse's
20-character limit. Shortened internal names to `ts-role-*`, preserving Q1 keys
and Vietnamese full names. One moderation fixture used a nonexistent User `bot`
attribute; replaced it with native `Fabricate(:bot)`. Four other moderation
examples passed, including review-only flags, idempotence, read-only drift and
ownership/missing-model refusal. Service checks passed on the same head.

User authorized execution of the community + Bà Mối phase after explicitly
excluding full Tử Vi/charts/readings/PDFs. Refreshed the clean feature branch
from origin before editing. Added the owned 13-category/five-interest-group/
15-field signup manifest, Rails-native idempotent application/drift checking,
first-login Q1 mapping, and branded desktop/mobile member theme. Answers remain
private; interest roles grant no staff/trust privileges; announcements allow
staff posting and member reading.

Pinned Discourse and the official test container, Follow, portfolio and thumbnail
extensions. Added presentation application for gallery/profile portfolios, bios/
featured topics, member following/notifications, Host events/RSVP, member-only
navigation and the existing Bà Mối private-message composer. Added native request
and Chromium acceptance for the actual Discourse APIs, not the Next.js mockup.
`docs/community-build.md` records application, ownership, operations, source
ambiguities and remaining live checks.

Both available Macs lack sufficient free disk for a full disposable Discourse
container (5.4 GB and 1.4 GB observed); Docker/Colima is not running. Used a pinned
source checkout for compatibility inspection and a standard GitHub-hosted test
container for planned runtime acceptance. No dependencies, host services, Docker
daemon, AWS resources, production instance or Vercel deployment were created.
The prepared checkout fetched and verified every extension pin successfully.
CI uses `ubuntu-latest` and no local-fleet routing.

Parallel MECE workstreams: community configuration, member theme, native member
acceptance, and coordinator-owned runtime/presentation/assembly. Independent
outputs were assembled here; runtime/API dependencies stayed ordered. Native
workers used routed codex-worker Terra profiles; no worker launched CI/reviews/
PRs. Retained current decisions: configuration runtime fixes
`aeda8c07-db24-474f-8a56-cc5668a39657`, member boundary tests
`7ae364b2-538c-4c09-9739-4e79ba32bd49`; both completed. Extension acceptance
decision `766a084c-06e3-48f5-9a98-aeb7467d48fd` returned direct due to native
capacity and is implemented by the coordinator. Earlier completed foundation
decisions: `e83eaa03-ac16-40c5-9079-84853829ed34`,
`a53da6a6-e65b-4846-ac84-1f4c61534bf5`,
`2821abf0-b839-4013-be89-0c5cb57c708e`.

Checkpoint verification: Ruby syntax/static manifest checks and pinned preparation
passed; all 31 service test files / 302 tests, typecheck, lint and production
build passed (18 static pages plus three API routes). The first sandboxed service test invocation
could not open its loopback Postgres socket (`listen EPERM`), so it was rerun with
the same test command and appropriate loopback permission. Hosted runtime results
will be recorded after completion; the checkpoint is pushed to execute the real
container because the local runtime capacity check rules out this test locally.
The assembly cross-family code review above has completed. This is
a durable build checkpoint, not a production readiness claim.

Remaining live gates: chosen persistent host, email or verified staff-assisted
activation/recovery, proxy/storage upload protection, AI spam/toxicity rules and
LLM, real Bà Mối/webhook/retry/two-member acceptance, phone QA and backup/restore.
Q1 edits require staff to remove a prior interest membership. No Moon/chart work
was added; public demo pages retain their labelled fixed-data behavior.

Runtime checkpoint correction: hosted run `36854761582` at `7a8e515` successfully
initialized the official container, installed dependencies and migrated the test
database; Service checks passed. Discourse request execution stopped on an
unsupported RSpec CLI option before running examples. Replaced it with the
supported `config.fail_if_no_examples` setting and explicit helper loading, rather
than rerunning unchanged code. Added the GJS `on` imports, removed a derived color
variable from palette input, and extended request checks for upload protection,
member ignore/unignore and a moderator's actual flag decision.

Added the required native AI spam/toxicity review configuration with an explicit
existing model ID, no credentials copied, safe ownership/check mode and model
response fixtures. Native SpamDetector auto-hides/silences in the pinned source;
selected native `llm_triage` instead to route both spam and safety detections to
staff review without automatic sanctions. PMs, bots and private onboarding data
are excluded. Enabled native Automation explicitly, including real first-login
interest membership. Moderation decision `4849c0a9-2036-443f-849a-e3b6154e6d86`
completed after assembly inspection; full plugin execution remains CI evidence.

## 2026-10-01: user corrected the phase boundary

The user explicitly reaffirmed that full Tử Vi, charts and related features
remain out of scope this phase, and that Thật Space should not rebuild Moon.
The earlier whole-app plan mistakenly included a reading/history/PDF track.
Removed that track and its worker/dependency/acceptance gates, renumbered
production as Phase 4, and aligned README, the Bà Mối spec and its plan. The current
phase is the complete Discourse community plus Bà Mối, with existing
tuổi/day-pillar compatibility retained. The astrology discussion category
does not imply chart generation. Future astrology work should begin with
Moon reuse rather than a parallel implementation.

Before this correction, read-only capability checks confirmed access to
`moon-ai-vn/moon2-app` and its local source. A standalone Tử Vi engine and
regression test files exist; they were inspected, not executed, ported or
changed. The availability check followed enforced direct route
`b80e87f4-304b-4583-bf17-bb76d3fa8ab3` in the existing whole-app planning
session; terminal feedback completed. No new cross-family review or native
worker was launched. Those findings do not expand the user's current scope.

Refreshed the clean feature branch with fetch/prune and fast-forward-only
pull before editing. This correction changes documentation only. Validation:
local Markdown links and Git whitespace; no code tests needed or repeated.
No hosting, deployment, external settings or feature code changed.
Next: implement community manifests/theme and prove the invite/account/topic/
reply path, then community extensions and live Bà Mối acceptance. Hosting and
credentials are later integration inputs; a full-chart engine is not a gate.

## 2026-10-01: whole-app scope and execution plan

**Scope correction:** the later entry above supersedes this entry's Tử Vi/PDF
implementation and completion assumptions. This section records the historical
planning checkpoint, not the current phase boundary.

The user asked whether a plan exists for the rest of the app after the local
Bà Mối checkpoint. Refreshed `feat/ba-moi` from origin with fetch/prune and
fast-forward-only pull; the tree was clean. Added
`plans/2026-10-01-whole-app.md` and linked it from README and the narrower Bà Mối
plan. No feature code, host provisioning, dependency installation, service
startup, external configuration or deployment was performed.

The plan separates the unfinished community, real Bà Mối integration and full
Tử Vi/PDF track. It preserves Discourse as the member/authentication platform,
starts with a real invite/account/topic/reply slice, names disjoint parallel
workstreams and their dependency edges, and distinguishes beta acceptance from
full-app completion. The static Next.js routes are not counted as completed
member features.

Recovered the original 15-question onboarding template and January forum
proposal read-only using the Google Drive skill. Exact source links are in the
plan. Q4/Q8 share an erroneous mapping name; the plan assigns distinct stable
fields. Q15 maps an Art action without offering Art as an answer; the default
preserves the four offered answers and records the discrepancy. Private answer
visibility and interest groups must not expose sensitive preferences or grant
staff permissions. Historical custom-auth, karma/ranking and email features
remain explicitly tracked rather than silently treated as delivered by v3.

Planning session `that-space-whole-app-plan-20261001` used one retained
agent-jobs consultation, job `e559b64d-7ccc-4640-a45b-017263078d94`, enforced
route `a857a246-4699-49e9-9f69-eb80f79e6786` (OpenCode Muse Spark). The terminal
result was read, its exact-owner delivery acknowledged, and route feedback
completed. A bounded native code exploration verified the Tử Vi/profile
mockup's four inputs and static reading/history/PDF behavior under decision
`b849aaac-8185-4586-91ad-97287c61b8c5`; feedback completed. No nested review or
separate worker PR was opened.

Current read-only runtime checks: Docker/Colima binaries exist; the default
Docker socket is absent; Colima reports not running. Official Discourse guides
confirm local macOS development and warn about the older x86-only Docker image
on Apple Silicon. Thus local development is a planned setup step, not a claimed
running capability. Paid production hosting is unnecessary for the immediate
manifest/theme preparation.

Verification for this documentation-only checkpoint: checked source against
the current spec, mockup inventory and recovered requirements; checked local
Markdown links and Git whitespace. The existing 302-test service checkpoint
remains the code evidence; no tests were added or repeated for prose changes.
Next: implement community manifests/theme and prove the local member flow,
then community extensions and real-account integration; full readings/PDFs
retain their own calculation, private identity/history and export gates.

## 2026-10-01: local Bà Mối beta completion before server provisioning

The user chose to build first after comparing ASUS and AWS. Refreshed
`feat/ba-moi` from its authoritative `anka-ventures-labs/that-space` origin;
the initial working tree was clean. No deployment, provisioning, external
installer run or live database migration was performed. The ASUS read-only
check still found Atum/Taylor traffic and running tunnel/SSH services, so the
host remains occupied. Historical ASUS deployment notes are not execution
authorization for this checkpoint.

### Parallel MECE workstreams and assembly

- Member/pool scope: current consent enforcement and current rule-of-5
  redaction, preserving labelled samples and existing signals/matches.
- Discourse scope: injectable installer, structural drift check against full
  admin edit records, route-wrapper auth tests and malformed probe responses.
- Coordinating scope: shared SQL access, transactional outbound intent,
  lifecycle/retry fixes, quota concurrency, documentation, integration and Git.
- A second bounded test scope added two local acceptance journeys after the
  shared harness and contract were available. Workers did not commit, push,
  run CI, request reviews or mutate external services.

Planning used `$agent-jobs`, job `103bf72f-e3db-4d15-9ada-ff483029d380`
(OpenCode Muse Spark; enforced route
`539f621d-4643-40b9-a8f5-c1392d5b3bcf`). Its retained advice was read and delivery
acknowledged. It could not inspect source directly; recommendations were
verified against source before implementation. Native worker decisions:
`800cac32-faa6-48de-acd7-99585d1141de`,
`7fd95b2a-195f-4371-913a-16f46c754d65`,
`f3368144-0246-49b1-9e31-05fedac1fc6c`; all completed and fed back.
Stable routing session: `that-space-local-beta-20261001`.

### Behavior and recovery

- Domain changes and outgoing notifications now commit together. Relay
  receipt storage failure rolls back so a redelivery can work. Keyed delivery
  leases prevent simultaneous/repeated calls from duplicating successful sends.
- Closed matches suppress queued chat/opening/reveal messages; generic closure
  notices remain deliverable. Deleted-member private queue payloads are purged;
  successful delivery retains the key and clears the payload.
- Final crashed leases stop at ten attempts. Search/interest quotas serialize
  count/write decisions per member. Repeat reveal returns the revealed state.
- Stored card identifiers and new chat aliases follow current anonymity counts.
  Persona topic IDs require a private message containing exactly the caller and
  the configured bot. Operational errors log classes instead of private bodies.
- Installer checks scripts, parameters, metadata, secret bindings and agent
  wiring/settings, failing on missing unverifiable fields. Secret plaintext
  cannot be read back. Tool export excludes bindings; verified edit records
  expose them. Source links and local/live boundaries are recorded in
  `local-beta-readiness.md` and the service API.

### Verification checkpoint

The clean baseline passed 281 tests, typecheck, lint and production build.
Four added regression tests first reproduced duplicate sends, post-block retry
delivery, an unrecoverable webhook receipt, and an eleventh delivery attempt;
all passed after fixes. The assembled suite passed **31 files / 300 tests**,
including two complete local acceptance journeys. Typecheck and lint passed.
The final production build passed (18 static pages and three API route patterns).
After error-log redaction, the eight dispatcher regressions passed again; the
build also typechecked and linted the final source. Assembly review submitted as
job `faa3fcba-bfa4-42d4-af02-524694be3bb2`, enforced OpenCode route
`a314ca81-6f80-48ab-90d9-e64db9845289`. Its retained result was read and exact-owner
delivery acknowledged; feedback was completed. Verdict: **ship the local
checkpoint**, conditional on the build, with no critical/high findings.

The review's medium delayed-reveal alias issue and low concurrent relay-limit
issue were verified with failing regressions, then fixed: reveal requests and
confirmations render the current alias at delivery; relay policy/count/receipt
share the per-sender quota transaction. Persona participant checks now normalize
case, and closed-during-receipt outcomes report `ignored_closed` rather than
`replay`. The post-review focused suite passed **4 files / 35 tests**, including
both acceptance journeys and two new regressions. The production build passed
again, including its typecheck/lint. No targeted review was required by the
retained approval; these bounded corrections were locally verified.
The complete final suite then passed **31 files / 302 tests** (70.89 seconds).

The review correctly treated existing match/relay access after a consent-version
change as the documented contract; blocking/ending must remain available. Live
policy for a new-version reveal must be decided before launch. No `.github`
workflow exists and the Actions runs API returned an empty list. GitHub's private
repository plan returned 403 for both rulesets and classic branch protection;
that is the observed scope of unavailable metadata, not evidence of a CI billing
failure. Current-head checks will be inspected on the beta pull request.

Known limits: remote acceptance followed by a receipt-write crash can duplicate
a Discourse post; existing Discourse history survives service deletion; contact
heuristics can be bypassed across messages. The fake boundary cannot prove
Discourse UI, model wording, mobile acceptance, moderator visibility, backup or
live cron. Next: choose and provision a host only for the live checklist in
`local-beta-readiness.md`.

## 2026-09-27: W-D and W-E prepared ahead of the ASUS, and per-bot API keys

### Why now

- A read-only check of the ASUS found Atum's services still running and no
  Docker, so installing Discourse waits for Minh.
- Everything that doesn't need a live forum was prepared instead.
- The agent-jobs route for this research (decision `5b993044`) was `direct`.
  It was done in this session, and feedback was sent: completed.

### Findings from Discourse's source (`discourse/discourse` main, 2026-09-25)

- **Bundled in core:** Discourse AI (personas are now called agents),
  Automation, Chat, and calendar and events (`discourse-events`). The old
  `discourse-calendar` repository is archived. `discourse-follow` and
  `discourse-user-portfolio` are separate and active.
- **Pavilion's Topic List Previews repository is gone.** The spec now uses
  Discourse's official Topic Thumbnails component.
- **AI tool scripts:**
  - They get 2 seconds of their own time and up to 20 HTTP requests.
  - HTTP wait doesn't count toward the 2 seconds, which answers the plan's
    latency question without a probe.
  - `context` has `user_id`, `username`, `topic_id`, `private_message` and
    `participants`.
  - `secrets.get(alias)` reads Discourse's AI secret store, so the tool secret
    never appears in a script.
- **The admin API covers everything we install:**
  - `ai-secrets`
  - `ai-tools` (with `secret_contracts` and `secret_bindings`)
  - `ai-agents` (with `create-user`)

  So installing needs no pasting into admin screens.
- **Parameter types:** tool parameters can be string, boolean, integer, number
  or array, but the admin API drops `item_type`. So list parameters are sent as
  comma-separated strings and split in the script.
- **The `post_created` webhook fires for private-message posts** (no
  private-message exclusion in `WebHook.enqueue_post_hooks`). This confirms the
  relay design.

### What changed

- **`discourse/tools/`:**
  - `tool.js`: one shared script. Identity comes from `context` only and the
    secret from the secret store. Lists are split, "không nhớ" becomes null,
    and failures become friendly results.
  - `tools.json`: the 12 tool definitions.
- **`discourse/persona/ba-moi.md`:** the Bà Mối system prompt, in Vietnamese so
  Thảo can edit it. It follows the spec's journey and privacy rules and uses the
  neutral "Bà / bạn" voice until Thảo chooses.
- **`lib/discourse/install.ts` and `scripts/install-discourse-ai.ts`**
  (`npm run discourse:install`): idempotent install of the secret, tools and
  agent through the admin API. `--check` reports drift by checksum, which makes
  the repo copy canonical.
- **`docs/discourse-setup.md`:** the W-D runbook. It covers:
  - swap, Docker and `app.yml` with no SSL, localhost-only
  - Funnel
  - bundled and pinned add-ons, and site settings
  - bots, keys, the webhook and agent install
  - probes and operations
- **`scripts/probe-discourse.ts`** (`npm run discourse:probe`): read-only checks
  of the Funnel health, each bot key's identity and scope, the webhook, and
  that the service refuses unauthenticated calls.
- **Security: one single-user API key per bot.** `DISCOURSE_PERSONA_API_KEY`
  and `DISCOURSE_RELAY_API_KEY` replace one `DISCOURSE_API_KEY`. With an
  all-users key in Vercel, a leak could post as any member or admin. Now a
  leaked key posts only as its bot. The client refuses any username it has no
  key for.
- **Security: her Bà Mối thread is remembered only when its participants are
  exactly her and the bot.** A thread she shares with someone else never
  receives her notifications.

### Verification

- **`npx vitest run`:** 26 files, 281 tests. New since W-C:
  - the tool script run in a `node:vm` sandbox with Discourse's globals:
    - identity from context only; forged ids land in `args`, which the
      service strips
    - the secret from the store
    - list splitting
    - failure handling
    - rendering refuses unsafe URLs
  - a contract test that `tools.json` names exactly the service's tools and
    parameters, with the same required ones
  - the admin payloads
  - the per-bot key client, including prototype-name safety
  - the one-on-one thread rule
- **`tsc`, `next lint` and `npm run build`** are clean.
- **Not yet run against a live Discourse:** the installer, the probe and the
  runbook. They're verified in W-D and W-E, and this log gets corrected where
  reality differs.

### Next

1. Minh confirms Atum is off the ASUS. Then W-D, following
   `docs/discourse-setup.md`.
2. W-F's Vercel preview gives `BA_MOI_SERVICE_URL`.
3. Minh's OpenRouter key, then `npm run discourse:install`, then the "Done
   means" loop with two test members.

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
