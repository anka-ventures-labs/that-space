# Session log

## 2026-10-11: public self-service launch assembly

Replaced the superseded invite-only pilot contract with a public, Google-only
self-service launch for every adult, regardless of gender. The landing page now
leads with the full Bà Mối journey; direct registration is published only when
both community and public-registration flags are true. Added truthful privacy,
terms and logged-out support routes. The owned Discourse manifest, deployment
example, bootstrap drift check and native acceptance fixtures require open
registration, no staff approval, no local passwords, a completed Google OAuth
handoff, the exact 18+ attestation and all 15 private onboarding fields. Community
content remains login-gated and onboarding answers do not enter matchmaking.

Hardened consequential Bà Mối actions after primary assembly review
`19cad086-d106-4e19-851d-86518764636a` found three launch blockers. Delete,
reveal, block and end now use a DB-backed, HMAC-bound challenge that is single
use, expires after ten minutes and can execute only from a later human Discourse
post in the same topic. Added cross-member/topic/action/resource, tamper, skew,
expiry and replay tests. The pre-reveal relay now evaluates a persisted
256-character per-sender tail to catch contact details split across posts and
deletes both tails immediately on mutual reveal, end or block. Google OAuth is
now part of the manifest/bootstrap contract and enabled in the deployment
example. Paused-registration copy and the no-email support fallback no longer
promise unavailable signup or bounce guests into a login redirect loop.

Focused blocker regression passed 68 tests. The final complete local gate passed
30 test files / 221 tests, TypeScript, lint, production build, zero production npm
vulnerabilities, Ruby and JSON validation, and `git diff --check`. Supabase's
linked dry run lists exactly the two additive migrations for relay contact
windows and one-time confirmation challenges. Primary review delivery was read
and acknowledged; route decision `25d110f3-1f73-4b0e-8ef0-26bb0b5376b9` was
closed. Targeted follow-up review `30994266-c816-4352-8992-33eac6e6ddc2`
(route `8598af11-fcd7-4c7c-b6dc-249d0bc32589`) returned **SHIP** with all five
retained findings resolved and no repair regression. Its delivery was read and
acknowledged and the route was closed. Production migration, exact-head CI,
forum drift application, Google signup acceptance and local-prebuilt Vercel
promotion remain the ordered live-only release steps.

Exact-head CI run `38143565514` passed Service checks at `7dd631f` but the
pinned Discourse job failed before all community fixtures: native validation
correctly refused `enable_google_oauth2_logins=true` because the disposable test
site had no OAuth client id or secret when the shared bootstrap helper ran. The
member-journey fixture set credentials only later, so request and browser suites
that call the shared helper all failed from the same cause. Updated only the
test helper to seed inert fixture credentials before applying the production
manifest; production remains fail-closed and still requires its real secret
values before apply. This is a deterministic fixture correction, not a CI rerun
of unchanged code or a relaxation of the Google-only launch contract.

Replacement run `38143944777` proved that correction: 24/25 native requests and
4/5 browser examples passed. The request failure showed a logged-out OAuth-created
member still had the preceding valid Google handoff in the Redis-backed server
session, so the supposed password-only probe reused that identity and logged the
same member back in. Clear the OAuth fixture before submitting the password
request; this isolates the intended disabled-local-login boundary. The only
browser failure was `net::ERR_NAME_NOT_RESOLVED` for the job's own
`http://localhost:31337/latest` after four real browser examples had passed. It
is a hosted runner/transient local-resolution error, not an application response;
the new code revision provides its permitted single fresh run while correcting
the independent request fixture.

Run `38144468193` showed both issues were deterministic. Clearing the OAuth
server payload did not make the password assertion valid because the request
spec still carried the prior member's authenticated browser cookie; request
session rehydration made the postcondition ambiguous. Replaced that setup with
a fresh fabricated member whose known valid local password is submitted from an
anonymous session, matching pinned Discourse's own controller coverage; the
required result is now an exact 403 with no session. The repeated guest-browser
failure came from Chromium's CI-only `localhost` resolver targeting IPv6 while
the test Rack server used the other loopback family. Set the community job's
existing Capybara server host to `127.0.0.1`; this changes only disposable
hosted acceptance routing and preserves the real anonymous login-required
assertion.

Run `38145133767` narrowed both remaining failures to the acceptance harness.
The password example tried to read Rack's request session before making any
request, so no session object existed; the exact post-request 403 and empty
session remain the meaningful disabled-password assertions. The anonymous
Chromium visit still reported a navigation error with an IPv4 literal while all
four signed-in pages passed. Pinned Discourse source explains the difference:
with a private site, local login disabled and exactly one authenticator, a guest
HTML request redirects directly to `/auth/google_oauth2`; Chromium then follows
that external identity-provider handoff, which the isolated browser job cannot
resolve. The native request suite now asserts that exact production redirect as
well as anonymous posting/review denial. Removed the redundant guest browser
example and ineffective loopback override; signed-in browser coverage continues
to compile and render the real desktop, mobile, portfolio and Bà Mối composer.

The final harness revision is `8dda840c071c5fffa945645ca5daa612c3c3e4a3`.
Exact-head run `38145835706` passed both required jobs: Service checks and
Discourse community acceptance. Before changing live state, a fresh native
Discourse archive with uploads was copied off-host and validated at 8,802,914
bytes with SHA-256
`9638643e9ef8408db8788730c3a454899131fbabde944085c1b743db45b01e72`;
the Supabase pre-launch dump is 373,489 bytes with SHA-256
`dd50412660173ca0d2d7525e9246f9364bef348785d0ea90b4b20c8136624cb8`.
Applied both additive production migrations. Every public table retains RLS,
anon/authenticated retain zero table grants, and the two new tables started
empty.

Google identity is now owned by the dedicated project
`that-space-auth-20261005`, not Atum's project-level consent boundary. Its app
name is `Thật Space`, user type is External, publishing status is In production,
and the dedicated web client uses only the exact Discourse callback
`https://ubuntu-asus.tail349cbf.ts.net:8443/auth/google_oauth2/callback`.
The generated replacement is stored in Infisical **That Space / prod** and the
live launcher; no value is recorded here. A client secret exposed during the
initial launcher attempt was revoked, its local credential JSON was removed,
and production no longer references the Atum-project client. The remaining
Atum client record is unused and its exported secret is disabled; it was not
deleted as part of this release.

Recreated only the `that-space` container with launcher output quarantined and
discarded. Local and public `/srv/status` return `ok`. Community and
presentation apply/check both pass with zero drift. Live nonsecret readback
confirms `invite_only=false`, `must_approve_users=false`, Google-only login,
new registration/signup CTA enabled, email disabled, Vietnamese locale and the
dedicated client ID. Registered members can send private messages. Bà Mối is
enabled with a bound model, registered-member access, all 12 tools, bot user
`Ba_Moi_bot`, and a matching theme CTA. Final AI installer check reports no
drift. The post-cutover probe proves both bot keys remain single-user scoped,
the relay webhook targets the canonical service, and an unauthenticated tool
call returns 401. A guest `/latest` request redirects to Google through the
dedicated client and exact callback.

Enabled production `BA_MOI_ENABLED`, `PUBLIC_COMMUNITY_LINK_ENABLED` and
`COMMUNITY_PUBLIC_REGISTRATION_ENABLED`. Built the exact green head from a
private clean archive with `vercel build --prod`; the output has three Node 24
function bundles, zero native binaries and zero environment files, so the Mac
artifact is Linux-runtime safe. Uploaded only that prebuilt output, verified
the actual functions in `sin1`, and staged deployment
`dpl_DmkUUcW8PaGB4SBAnHUHPKYQa6VQ`. Before promotion, the protected deployment
passed the public copy/CTA and legal-page checks, tool/cron/webhook 401 checks,
and a trusted existing-fixture database status call. Promoted that exact
deployment to `https://that-space-demo.vercel.app`; prior rollback deployment
is `dpl_ENbPZPxbsomoaYwAq9jYvWpvAPPr`. Canonical smoke repeats the public-page
and authorization checks. A real-browser readback shows the public 18+,
all-gender, no-invite/no-approval copy and the Bà Mối centerpiece with zero
console errors. Temporary credential/build files were removed; the validated
database and native backups remain in ignored mode-600 storage. PR #1 remains
open and unmerged.

## 2026-10-01: assembled community build for real Discourse acceptance

Hosted run `36863243364` at `3049130` passed **31 service files / 302 tests,
24 native Discourse requests and five Chromium examples**, plus typecheck, lint
and production build. Both PR checks were verified against that exact head.
The real invite-to-moderator-decision path now passes with the production
membership callback restored in its test scope. Inspected retained desktop and
mobile screenshots; the brand/header/fonts, navigation, portfolio and composer
render correctly. Visual inspection exposed white native primary-button text on
pale sand, so changed those actions to the dark brown brand fill while preserving
disabled states and native focus behavior. The follow-up current-head check
verifies this final visual correction. No new acceptance scope or live host was
introduced.

The contrast correction uses pinned Discourse's primary-button CSS variables,
preserving its transparent, disabled, hover and keyboard-focus behavior rather
than replacing button selectors. The original sand/cream accent palette remains.

Hosted run `36861220372` at `d2c204d` passed 23 of 24 native requests and four
of five real Chromium examples. Featured artwork and guest topic-read denial now
pass. The invitee had only her Q1 interest group: pinned core's
`spec/support/suite_setup.rb` explicitly skips the production
`ensure_in_trust_level_group` callback for test performance. Restored that native
callback only around the invite acceptance examples, restoring the harness's
default afterward. No production membership behavior changed. The failed browser
recipient selector was stale; inspected its screenshot (the composer is correctly
addressed to `ba_moi`) and core's `private-message-users` selector, then fixed the
assertion. Desktop/member navigation, guest screen, artist portfolio and mobile
layout passed. Added retained success screenshots and configured core header
logos from the owned theme upload after visually inspecting the real rendering.
The phase/build documents now point to the current PR checks and retained review
as durable evidence rather than stale in-progress review wording.

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

## 2026-10-04: ASUS live-phase preparation and corrected readiness

The user authorized checking every 15 minutes and completing the current community/Bà Mối phase once ASUS was free. They then clarified that the wipe meant removal of the Atum Matrix chat stack; Taylor storage is retained. The thread heartbeat `finish-th-t-space-when-asus-is-ready` was updated accordingly. Full Tử Vi/charts/readings/PDFs remain excluded.

Parallel MECE workstreams: host/runtime readiness in the coordinating session; isolated Discourse launcher configuration/runbook; Bà Mối retry-scheduler installation. Host and application preparations are independent; real bot/model acceptance depends on the assembled Discourse and service deployments. Phone checks, activation/recovery, restart and backup/restore follow those deployments. Workers do not push, launch CI, deploy or review independently.

Read-only host inspection found the Atum tunnel/backup units inactive and disabled, no remaining Docker containers, 350 GiB free disk, 2.4 GiB available RAM and 3.7 GiB swap. Taylor MinIO is active on 9000/9001. The existing 443 Funnel proxies Taylor's Python service on 8787, so it must be preserved; Discourse uses loopback 8080 and a separate public Funnel listener on 8443. Docker was enabled and verified without restoring Atum. The official Discourse launcher was cloned at `8d705a91866c320592ce851f30895ddb4c3e85fe`; its selected base is `discourse/base:2.0.20260915-0028` (digest recorded after pull). The exact green `ae50556` source archive is staged at `/var/discourse/shared/that-space/source`. No public Discourse route has been enabled yet.

The dedicated Supabase project `vafeunxublsuduefolhw` was inactive; restored it, verified both existing migrations, 30 sample cards and zero real members. All eleven public service tables have RLS enabled and neither anon nor authenticated role has table privileges. The advisor's eleven no-policy notices are the intended service-only boundary. An off-host, mode-600 public-schema/migration backup was made before extension changes; `.backups/` is ignored. Vercel's existing `that-space-demo` project is linked, Node 24, and has no configured runtime variables. Its production alias is `https://that-space-demo.vercel.app`; no deployment/promotion has occurred.

The native AI installer creates Bà Mối with a generated username and negative user ID; those exact values must be read back and used for keys, service loop prevention and theme CTA. Its identity cannot be inferred from defaults. The repository lacked an executable retry schedule. Added an explicit apply/check operator script for a single five-minute pg_cron/pg_net job, with CRON_SECRET stored in Supabase Vault and referenced by name in the command. Parameterized writes and TLS prevent credential logging/transit exposure. The extension migration is separate from environment-specific schedule configuration. The AI provider key is still missing; an asynchronous question asks the user to configure it directly in Discourse or identify an existing Thật Space credential. Community deployment continues independently.

Routing session `that-space-asus-launch-20261004`: read-only preparation direct decisions `9e145c89-b05e-4cdb-b80a-1f6b76cc7139` and `36295da6-3f30-4e1c-b44e-d43239a4e76b` are completed. Native template decision `93335769-da39-4ccf-a844-28783a71bd10`, live-contract exploration `7637334e-ed8f-4ca3-b8f3-dece35478491` (completed), and retry installer `ffebe1b0-74b8-4135-8c78-ab446f4e8d95` used the enforced codex-worker/Terra profile. Root assembles, verifies, closes routing feedback and retains one final assembly review before the ship decision.

Assembly corrections and verification: pinned the pulled production base digest `sha256:5028d077b061225507e7093fda1ff5bdc64d483b5c0397776f9a52c50008cd9b`; run the preparer as the core-owning discourse user and keep archived nonsecret source readable. The bootstrap runs in host unit `that-space-bootstrap-20261004` with its log under `/var/discourse/shared/that-space/bootstrap.log`. Applied the extension migration after successful dry-run; real Supabase exposes pg_cron/pg_net/Vault functions. `format` required explicit text casts for bound parameters (SQLSTATE 42P18 corrected). The scheduler's read-only check now reports expected drift until its job/secret are applied. Cron/Vault schema USAGE is denied to anon/authenticated; cron's default table SELECT does not bypass that schema boundary. The PGlite fixture omits only the named operational extension migration, with every core table/privilege migration intact; all 302 tests pass, typecheck and lint pass. No live model key or member conversation has been claimed.

One primary assembly review routed through decision `d98d5e88-c046-4b47-a249-861f56c34958` to OpenCode default/Muse Spark. Durable job `ce505048-cd49-4f56-821a-cf6eaaa7d7a4`, exact owner `codex:that-space-asus-launch-20261004:ASUS deployment assembly review:ASUS deployment and retry assembly review`; output/event cursors start at zero. Read the retained result and acknowledge its delivery before the ship decision.

Retained that completed review at `docs/reviews/asus-assembly-20261004.md`, read it and acknowledged the delivery; route feedback is closed. Final event cursor `10358`, output cursor `0`. Verdict approves the source checkpoint with live acceptance still unproved. Corrected the upgrade procedure to retain the old source tree and extract into an empty tree (no stale deleted files), clarified pre-existing Vault, rejected URL queries/fragments, and added pure scheduler drift/URL tests without mocking real cron/Vault. Native fix decision `848691e9-aa7b-4127-8a08-2c94fd11b349` is completed; native admin provisioning exploration `7d289f04-431e-483d-addb-f4f5a6969457` is active. The bootstrap passed pinned-source setup, all migrations and initial plugin compilation within its resource limits; finishing asset generation/image assembly remains separate from starting the service. Taylor MinIO remains active.

The assembled Oct4 checkpoint passes 32 test files / 305 tests, typecheck, lint and diff whitespace verification. The three new tests cover URL acceptance and exact scheduler state; real extension functions were checked separately. Source commit is ready for the existing PR's hosted current-head checks. Live deployment is still in progress, with no claims yet about provider conversations, activation/recovery, uploads or restore.

## 2026-10-04: First live community and native Bà Mối installation

The durable ASUS bootstrap completed with exit zero, including its slow but progressing image commit. Started only `that-space` from image `sha256:e0e89b087eec0bb5847deba8a0d9ae28a549132071328b538afb9ba23ad14e97`. Rails confirmed the exact HTTPS origin with port 8443 and login/invite/approval flags before publication. Native admin `minh` (1) and normal relay `thu_duyen` (2) were created, activated and email-confirmed; installation and relay keys were captured privately in ignored mode-600 storage, never launcher YAML or logs. The prepared remote setup script recreates its named keys, so it must not be rerun on resume.

Created an initial native backup with uploads and copied its 2,887,594-byte archive off-host into ignored `.backups/discourse/` before applying product configuration. Community/presentation apply and check passed with 13 owned categories, 15 user fields, five groups and zero drift. Daily native backups are enabled with uploads, seven retained archives and 20:30 UTC start. Added only Funnel 8443 to loopback 8080; existing Taylor Funnel 443 to 8787 and active MinIO remain intact. External `/srv/status` returned 200/ok; guest `/latest.json` returned 403 without topic data. The backup predates this configuration and has not yet undergone full native restore.

Native AI admin routes returned 404 until `discourse_ai_enabled` was enabled. The pinned site-setting update requires its actual setting name in the JSON body; a generic `value` body is not proof of change. Installed the native tool secret, 12 custom tools and Bà Mối agent 1; read back generated persona `Ba_Moi_bot` (ID -1201). Captured its separate single-user key and proved both bot keys work only as their own user (200) and cannot impersonate system (403). The ten runtime variable names are verified in both Vercel environments; no installation key or admin password is deployed. The provider key and default LLM are absent; `ai_bot_enabled` remains false and the theme CTA remains unset.

Live installer check exposed an object-key-order comparison defect and native false-versus-null tool-option serialization. Corrected these without loosening array order, enum values, required fields, tool IDs or secret bindings. Six installer tests include native serialization and negative drift cases; updated the existing payload assertion. Live `--check` now reports no drift. Full verification passes 32 files / 307 tests, typecheck, lint and whitespace checks. Native fix route `2206303d-d928-45dc-8620-e74b259d05a3` is verified and closed.

The one permitted targeted follow-up is job `f969fb16-6fb2-4105-83e5-868456b04967`, routing decision `833cb1eb-50b2-42c8-a115-b78de9571cfb`, exact owner `codex:that-space-asus-launch-20261004:Native installer compatibility follow-up:Native installer compatibility targeted follow-up`. Completed with SHIP and no blocking findings, retained in `docs/reviews/native-installer-20261004.md`; final output cursor 0/event cursor 6549. Root read and verified the result, acknowledged delivery and closed feedback. It covers only the native installer compatibility fix, following the completed Oct4 primary assembly review. Native read-only restore-initialization exploration is route `5774474e-533a-4491-90d6-c23da69aebfa` in the existing admin-contract worker.

Parallel MECE workstreams at this checkpoint: the primary session owns service prebuilt deployment, webhook/retry integration and live acceptance; the native worker owns only isolated restore initialization facts, independently of service deployment; the targeted reviewer owns only the assembled installer diff. Restore execution depends on the worker's initialization contract and a final native backup. Member AI and moderation acceptance depend on the user's dedicated provider credential. Browser navigation and focus calls currently time out through the in-app browser; native app capture is denied by the tool. No rendered phone evidence is claimed from those failures or from hosted fixture tests.

### Live privacy and recovery acceptance after native startup

At pushed head `8f39290d2dbc5ac0a2f873ea593ed14acf42832e`, both hosted checks passed in run `37215686654`. A clean archive built locally in `/private/tmp/that-space-build-8f39290`; its audit includes 805 physical/mapped files (673 unique source mappings), three Node24 ARM64 functions, no native binary and no operator environment reference. Preview prebuilt deployment `dpl_D2nw5fgh2FrUsQeAqsJFDoYFrpBw` is ready. Preview protection's own 401 was distinguished from service authorization; authenticated Vercel curl reached actual runtime rejection for tools/cron/webhook and a trusted fixture status call resolved Supabase context with HTTP 200. No production promotion yet.

Created two clearly labelled disposable native members `ts_qa_lan` (3) and `ts_qa_nam` (4) with all 15 signup fields through the native admin API. The API intentionally hides returned user IDs; read them back rather than treating that omission as signup failure. Native login denied both inactive and unapproved accounts, then succeeded after separate staff activation and approval; neither account has staff privileges. Lan sees 15 own onboarding fields; Nam sees none of Lan's fields. A trusted native password reset through User#password= revoked auth tokens; live HTTP denied the old password/session and accepted the replacement. Fixture passwords/cookies are kept only in ignored mode-600 operator storage. This proves the staff-assisted mechanics with synthetic accounts, not identity verification of a real member or invite UI completion.

Live testing exposed the stock Nginx static-upload bypass: an original image URL was accessible to guests while its short URL was denied. Added the scoped private-upload server outlet and rebuild hook through native route `0ac0e7dd-05c0-474f-ac41-1b363f45d455`; root inspected the config and syntax-tested/reloaded it on the actual container. Exact public exceptions come only from seven owned theme asset fields (logo/six fonts), never a directory or extension. The unique synthetic PNG original and short URL both give member 200, guest/forged-cookie 403 and private/no-store headers. All seven exact branding assets still return guest 200, and the internal auth URL is inaccessible publicly. Root restored stock no-sendfile proxy semantics for short URLs after a slow first response. An actual optimized member image remains a separate live check. No private member file was exposed: initial test bytes were the already public logo. This newly observed deployment boundary is fixed and verified in the primary session without launching another review beyond the existing primary plus its one targeted follow-up; worker routing feedback is closed.

The restore worker completed and routing feedback `5774474e-533a-4491-90d6-c23da69aebfa` is closed. It verified the actual image's PostgreSQL18 empty-volume initialization, db creation, migrations and system-user seed with CREATE_DB_ON_BOOT/MIGRATE_ON_BOOT. The memory-safe drill uses network-none and no published ports, serialized with only the live forum stopped. This is a verified procedure; the actual full restore still remains to run. A second browser attempt through the documented selected tab API again timed out in focus emulation; no alternative browser surface is available and no live visual evidence is claimed.

### Observed service timeout and region correction

The controlled preview journey completed both members' consent, interviews and private cards, anonymous search and interest. Native bot-authored control PMs (20/23) exist while user-started agent PMs remain disabled until the real model is configured. Signal acceptance committed the match and five durable intents, then the platform killed the response at its configured 15 seconds. Vercel logs confirm the runtime timeout; SQL confirms the saved match, two pending relay rows and pending delivery leases. This was not treated as an unsuccessful match or retried blindly. No member identity/card values were logged.

The local prebuilt Node output did not encode the Next preferredRegion hint, and the preview was deployed in iad1 despite Supabase being in Singapore. Added the explicit project deployment region `sin1` in vercel.json (a supported single-region Hobby setting) and changed the tool route's maximum duration to 60 seconds, matching the existing retry route. A match can perform four sequential native writes with individual five-second timeouts after its durable commit; 15 seconds was insufficient. This change does not remove per-write limits or alter transactions/leases. Verify the generated maxDuration, actual deployed region and a fresh controlled match before claiming the corrected live path. Official region configuration: https://vercel.com/docs/project-configuration/vercel-json#regions. Runtime exploration decision `9abe78cf-ef98-45c3-a019-6e94d5607d84` returned direct; root owns the fix.

## 2026-10-05: Production service and live community acceptance

Both required hosted checks passed for `1787b835ca130d5e79d04fe64f4fe0f325f0390f` in run `37217882407`. Clean preview `dpl_4GegEWJhcsKHuomb5gXauQNELMXv` runs in actual `sin1`; the tool route resolves to a 60-second function. Its audit covers 760 physical/mapped files and 628 mapped sources, with no native binaries or operator environment references. A fresh synthetic match returned `matched` in about eight seconds. Native posting limits left two deliveries queued; retry subsequently sent both. The earlier timeout's durable work was also fully recovered. Relay topics 30/32 give their own member HTTP 200 and the other member 404, with only their owner and relay bot as participants.

Vercel CLI 50.25.6 refused direct preview promotion without a remote production rebuild. Stopped at that prompt. The user explicitly approved a narrow exception to the heartbeat's earlier `--prebuilt --prod` prohibition: upload a locally built production artifact with `--skip-domain`, test, then manually promote. Built the same exact source in `/private/tmp/that-space-production-1787b83` using this project's production environment, audited all mapped files again, and staged `dpl_ENbPZPxbsomoaYwAq9jYvWpvAPPr`. Inspection confirmed actual `sin1` and the existing canonical alias still on the February deployment. Runtime tool/cron/webhook authorization and trusted database smoke passed before manual promotion. The canonical `https://that-space-demo.vercel.app` now serves that exact prebuilt deployment; authenticated direct HTTP smoke passes. Platform assembly used the uploaded prebuilt output, with no remote source compilation. Official workflow: https://vercel.com/docs/deployments/promoting-a-deployment. A local ENOSPC failure was resolved by deleting only three obsolete Thật Space temporary build trees; their audit records were retained. The operator checkout's unsafe output was never uploaded.

Installed native signed webhook 1 with only `post_created` event 201, active and TLS verification enabled. Actual member post 41 was delivered to recipient post 42; native delivery records returned `relayed` and then `ignored_bot` for the bot's event. Its recipient could read the forwarded text. Earlier controlled signed tests on a real synthetic contact post proved bad-signature 401, wrong-author refusal, held contact, and replay handling, with no contact text in the other member's thread. These were distinguished from automatic native webhook evidence. Retry configuration passed apply/check/reapply, with one owned Vault secret and five-minute job; the real scheduled HTTP receipt remains a separate check.

Two synthetic normal members also proved bio/featured artwork/portfolio, member replies and notifications, follow and follow opt-out. Nam's Q1 was changed to Host and staff reconciled the old/new role groups as documented; he remained non-staff and created retreat event 30. Lan RSVP'd, and guest event access returned 403. A normal member's synthetic flag entered the staff queue; member review access returned 403, and staff resolved it with the current reviewable version. Actual optimized artwork now gives member 200, guest and forged-cookie 403, with private/no-store headers, alongside the already verified original and short URLs. No rendered phone or actual LLM conversation is claimed: browser tab binding still times out and a dedicated provider credential is still missing.

Recovery checkpoint `community-checkpoint-20261005-v20261001073226.tar.gz` contains uploads, was copied off-host into ignored mode-600 storage, and matches SHA-256 `c8256a7280633cc9badaddeb4176d2f8b4f63340268cf12c11b36d00d60d2c14` (4,769,089 bytes). A separate 3,541-byte private operations bundle retains the launcher and scoped Nginx/public-branding files, which the native database archive does not include. Native snapshot counts: users 7, categories 17, groups 17, user fields 15, topics 28, posts 41, uploads 21, themes 5, theme fields 297, webhook 1, seeded/owned AI agents 44, owned AI tools 12. These are synthetic/operator configuration counts, not real member adoption.

After that backup, retained ASUS source as `source-ae50556` and extracted the green `1787b83` archive into a new empty source tree; copied the updated launcher manifest with the same native pins and private flags. A refreshed private operations bundle, `operations-1787b83-20261005.tar.gz` (3,700 bytes), retains that manifest. No second bootstrap ran. Only the live forum was stopped for a serialized restore drill. The disposable `that-space-restore` container used a separate shared root, network none, no published ports and no restart policy; Taylor remained active. During the intentional outage, the canonical service accepted Lan's first reveal request as `waiting_for_other` and retained its failed notification as pending with `DiscourseError`. The heartbeat was already PAUSED in the app when inspected; its prompt was refreshed while preserving that status and the existing schedule. No new review or worker reservation was opened; direct artifact-audit route `bfc2b8f2-f24d-41a3-82e2-be0dcf4e1b8b` is completed.

The actual image had consumed `/root/install_postgres` during assembly, so boot flags alone initially failed with a missing PostgreSQL socket in the disposable empty root. Restored only that initializer from the recorded launcher's pinned `templates/postgres.template.yml`, then native PostgreSQL18 initialization, role/db creation, migrations and system-user seed passed. The native Restorer completed with exit zero; all twelve recorded table counts match the archive, zero original uploads are missing, and `rake uploads:missing_files` exits zero with no output. Target health and a restored 67-byte image both return HTTP 200. Although Restorer received `disable_emails:true`, the image environment readback was `non-staff`; network-none was the actual proven outbound/email boundary. The disposable container was removed, with its isolated shared root retained. Evidence is saved in `docs/verification/discourse-restore-20261005.json`.

Restarted the existing live forum container without recreation, preserving its ID and upload guard. After cold warm-up, external health is 200 and guests remain denied. Rails confirms the canonical port-8443 HTTPS URL, login/invite/approval flags and disabled AI bot; community and presentation checks report zero drift. Both bot keys still reject impersonation. Optimized images retain member200, guest/forged-cookie403 and private/no-store. Taylor MinIO is active and Funnel still maps 443 to 8787 and 8443 to 8080.

The real five-minute Cron -> pg_net -> production retry path delivered the outage notification on attempt five with no last error. Its HTTP200 receipt reported claimed1/sent1/retrying0/dead0 without timeout, and Nam read native post43 in his private relay thread. No queue timestamp, payload or sent flag was changed manually. Before mutual approval no profile link was visible. Nam's real production reveal action returned `revealed`; both native notices eventually arrived (posts44/46), one via the next scheduled retry after a native posting limit. Actual member contact post47 was automatically relayed to recipient post48 after reveal; native event responses report `relayed` then `ignored_bot`. Nam's block returned `blocked`, the unique synthetic candidate search returned zero results, and later member post51 produced native HTTP200 `ignored_closed` with no relay record or recipient copy.

Both closure notices reached their intended native recipients (attempts1/2); the other member hears only that the chat ended. Lan's production `consent delete` with explicit confirmation returned `deleted`, and read-only SQL found zero remaining member, profile, card, discovery, daily-opening, interest, match, relay-topic/message, block or matching outbound-payload rows. Native historical messages remain readable as disclosed in consent. Nam's production `consent pause` returned `paused`; the pool retains 30 labelled sample members/cards, zero non-fixture members and zero discoverable synthetic profiles. Native fixture accounts remain for later actual model acceptance. Whitelisted nonsecret evidence is retained in `docs/verification/live-service-20261005.json`; private raw messages, fixture credentials and environment values are not included.

This docs/evidence checkpoint changes no deployed application source. Full source verification remains 307 tests/typecheck/lint and both hosted checks green for `1787b83`; JSON parsing and `git diff --check` validate the new records. The existing PR will retain the docs checkpoint's exact-head hosted status after push. Actual native model conversation, review-only Vietnamese AI moderation and phone layout remain required before invitations. Live native model inventory still contains zero configured models/credentials, the default LLM is null, `ai_bot_enabled=false` and the theme CTA is unset. The pending dedicated-provider question has not received a credential; no other project's key was borrowed. The in-app browser tab binding continues to time out. The phase is not marked complete and the PR is not merged.

## 2026-10-05: Corrupted-chat recovery and native AI acceptance

Recovered **Understand the repository** (`01a0f286-232d-7220-b250-fcc465094fcc`).
App history fails with SQLite code 11, but its archived 30,103,891-byte JSONL
has 6,115 valid records, no malformed lines and SHA-256
`741cf9ec4b3c3b27b90350f0d0e8de59574cc16760c828992245ee8b3e596352`.
The last project tool at Oct4 18:13 UTC investigated member login for phone QA.
No global database repair was attempted while chats were active. ASUS/Git were
intact. Fetched/pulled `feat/ba-moi` fast-forward; both required checks passed
base head `5fc2d64`, run `37223252017`. Continue existing PR #1.

Parallel MECE workstreams: native workers independently inspected ASUS runtime/
deployment traces and local AI acceptance contracts read-only; the coordinator
owns credential binding, real AI/moderation/phone checks, cleanup, evidence and
Git/PR assembly. Preserve runtime/config → model → actual AI/moderation and live
fixture → phone/cleanup → backup dependencies. Workers did not edit, push,
deploy, launch CI or reviews. Native routes/feedback are closed. Earlier primary
and targeted review results were retained/read/acknowledged; no source change
requires a duplicate assembly review for this operational checkpoint.

The user supplied Infisical **That Space / prod / OPENROUTER_API_KEY**, then
refreshed Mac Mini CLI login. Read the dedicated value in memory; configured
native secret `that_space_openrouter` (2) and `anthropic/claude-sonnet-5` model
(1, open_router). Provider tools and native streaming/non-streaming validation
passed. No key value was printed or put in Git, Vercel or launcher. Native secret
binding is verified; this record does not claim encryption at rest. Set ignored
operator model/group IDs to 1/10, enable native AI for registered members and
set theme CTA from `Ba_Moi_bot` readback. Final installer check has no drift.

Non-staff `ts_qa_lan` (3) and `ts_qa_nam` (4) used native persona PMs 33/23.
All 12 tool names appear in successful native audit records: Lan 36/36, Nam 20/20.
Four numbered disclosures, adult/explicit consent, one-field interview, explicit
bundled answers, card approval, no-match handling, real interest/acceptance,
pause/resume and confirmation before reveal/block/deletion passed. This completes
the older model/moderation/phone gates while preserving historical evidence.

Model-created match `db8ad502-d7a0-495b-a823-1b37d5d3bf33` has relay rooms 43/41;
own member 200, other member 404, participants owner/thu_duyen only. Four initial
intents completed, Lan's two via scheduled attempt two after native cooldowns.
One-sided reveal withheld identity; both approvals reached `revealed` and
both notices arrived, native posts 111/115. Final native readback establishes
that Lan's scheduled post 115 at 04:40:01.839 UTC preceded confirmed block
post 116 at 04:40:54.667. This supersedes an intermediate assumption that the
queued notice had been withheld after closure; the actual timestamps prove
positive delivery before block. Both closure notices 118/124 were read back.
Do not infer native delivery from queue metadata alone. Model-driven
confirmed deletion leaves all eleven residual counts zero. The other profile
is paused, no synthetic profile is discoverable and 30 labelled samples remain;
disclosed native synthetic PM history remains readable.

Native review-only classifier apply/check passed with model 1. Benign post 59
had no review; Vietnamese scam/abuse post 62 created pending reviewable 4 without
hiding, deletion, silencing, suspension or an extra reply. PM 66 and bot 67 had
no review; member review access 403. Soft-deleted only owned public topics 34/36/40.

The browse skill used owned Chromium while Aside was unavailable. Actual
375×812 rendering passed login, latest, Bà Mối CTA/native composer, all 15 profile
fields, gallery, portfolio and event/RSVP. Real phone pause post 82 was acknowledged.
Event also passed 768/1440; final latest console has no errors. ProseMirror needs
click/type for an application-recognized draft; wait for saved post/backend
acknowledgment before navigating. API-created TL0 fixtures hit the first-day
reply cap; promoted only those two to TL1, matching default_invitee_trust_level=1.
No quotas changed and both remain non-staff. Some upstream labels remain English.

Cold CSS503/page502 coincided with a 32.729-second Pitchfork timeout in PG exec,
rotational-disk pressure some/full avg10 93.56/85.99 and heavy I/O wait. No observed
OOM/Docker restart. The native supervisor recovered workers/Sidekiq by 03:45 UTC;
warm signed-in pages, native AI and posting then passed. No operator restart,
rebuild, Nginx rate-limit adjustment or host tuning. Taylor MinIO/Funnel 443→8787
remain active; forum 8443→8080. Warm recovery does not prove cold-I/O reliability:
check signed-in pages/native posting before invitations, beyond the health URL.

The fresh post-acceptance backup includes database and 16 upload files:
`th-t-space-2026-10-05-045818-v20261001073226.tar.gz`, 5,323,203 bytes,
remote/local SHA-256 `21069e653bd565b6705db6cb9764fa7df6317f6d06fe4003e160dbe92d5f330f`.
Copied off-host to ignored mode-600 storage; outer/database gzip integrity pass.
No second restore drill is claimed; the earlier isolated restore evidence stands.
The pinned backups API compares `with_uploads` to string `"true"`; an initial
JSON boolean produced a database-only archive, then the corrected string request
produced the verified full archive. API success starts a background process,
so an immediate idle status does not prove its child has finished booting.
Owned browser server was stopped; browse learnings/end metadata are recorded.

Nonsecret evidence is in `docs/verification/session-recovery-20261005.json`.
Credentials, raw PMs and backups stay in ignored private operator storage.
Deployed source remains `1787b83`; this checkpoint changes documentation only.
JSON parsing, whitespace and actual credential-value checks passed (19 distinct
private values checked, zero found). Inspect the existing PR's new exact-head
hosted checks after push. No real invitations or merge;
full Tử Vi/charts/readings/PDF remain excluded.
# 2026-10-25 — Origami public launch assembly

Made `anka-ventures-labs/that-space` public and assembled the origami design
handoff onto the existing public self-service launch work on
`feat/origami-public-launch`. The `.dc.html` handoff is implemented as the
actual Next.js presentation: shared paper tokens and type, responsive navigation
and footer, the 29-petal cursor-following/blooming lotus, forum/thread routes,
Tử Vi unfolding chart, matchmaking compatibility letter, profile, and paper
legal/support/404 surfaces. Persistent signup, identity, community posting,
profiles, messaging, and Bà Mối remain on the real Discourse/service boundary;
public sample content is labelled and CTAs use the existing independent gates.

Updated Next.js 15.5.27→15.5.28 and Zod ^4.6.5→^4.6.6 (resolved 4.6.7) for current critical/high
production advisories; the production-only audit is clean and the 21-page build
passes. T3 browser QA found and fixed a deterministic hydration mismatch from
cross-runtime floating-point facet normals. Desktop and 390×844 checks show no
horizontal overflow across the handed-off routes. Public Funnel/TLS/signup and
the exact Google callback work in a clean incognito flow. One cold browser load
received a transient 503 for the Vietnamese locale module and remained on the
Discourse splash; a clean retry succeeded. The existing runbook records the same
cold rotational-disk stall class. Vercel CLI authentication is absent and ASUS
SSH is denied by tailnet policy, so production deployment and host tuning remain
explicit operator gates. Full implementation and release sequence are in
`docs/plans/2026-10-25-origami-public-launch.md`.

Sonnet assembly review `d7a02969-e30d-4499-8f83-772a79296d0a` initially returned
DO NOT SHIP for indexable/misleading sample-member content and CSS ordering that
suppressed intended spacing. The full retained output was read and acknowledged;
routing feedback is closed. Fixed the confirmed blockers plus its concrete
accessibility/performance findings: persistent preview labels and noindex,
neutral/contextual sample data, Tailwind component layering, hero CTA placement,
modal focus trap/return, offscreen lotus-loop suspension, focus contrast and
browser-local Tử Vi disclosure. Restored the major handed-off decorative details
it identified. Resolution evidence is retained in
`docs/reviews/origami-assembly-20261025.md`.

PR #3 merged to `main` as `f1a844fb4dbb32f33c578f78c294fb96b5a693de`.
A fresh workflow-dispatch CI run `40170813082` passed both Service checks and
the complete Discourse community request/frontend/browser acceptance on that
exact merge commit. Vercel device authorization was restored without placing a
token in chat. The first local v65 artifact was rejected before upload because
its root OIDC `.env.local` appeared in the function upload map. A second clean
archive sourced production configuration only into the build process and moved
the environment file outside the source tree before Next tracing. Its audit
found 150 physical files, 637 unique mapped sources, three Node 24 ARM64
functions, zero native binaries, zero packaged environment files, no sensitive
placeholder and no operator path.

Uploaded only that clean prebuilt production artifact with `--skip-domain` as
deployment `dpl_8KFk7usXWsEEoh6QGbCXrDfxeL6C`, verified Ready functions in
`sin1`, then promoted the same deployment. The canonical
`https://that-space-demo.vercel.app` resolves to it. All eight public routes
return 200 with the origami copy, unauthenticated tool/cron/webhook boundaries
reject correctly, and an authenticated synthetic status reaches the production
database with 200. Real-browser checks pass at 1440×768 and 390×844 with no
horizontal overflow or console issue; the signup CTA points to the public
community, the lotus blooms, and a fresh incognito signup reaches Google with
the exact port-8443 callback. Rollback deployment
`dpl_DmkUUcW8PaGB4SBAnHUHPKYQa6VQ` remains Ready. Full nonsecret evidence is in
`docs/verification/vercel-prebuilt-f1a844f-production.json`.

# 2026-10-25 — Member happy path on Discourse Horizon

Minh reviewed the live community and found the post-signup screen clunky for
non-technical members: duplicate logo/navigation, chat links, filters, four
tabs, a hero repeating the nav, a staff email notice and untranslated labels,
after a 16-question signup. Decision: stay on Discourse and rebuild the member
layout around one clear path instead of switching platforms.

Members now get core Horizon (pinned revision `c237680`, 2026.10.0-latest) with
an owned `Thật Space Brand` component and "Thật Space Horizon" palette. The old
full theme and our second navigation bar are gone from the member path; the old
theme stays installed as the rollback target. The bootstrap reconciles the
community sidebar to Bảng tin / Sự kiện / Triển lãm / Tin nhắn (+ staff-only
Kiểm duyệt / Quản trị), the theme adds Bà Mối as the second link, and site
settings remove tabs, welcome banner, user tips, the tutorial bot, chat, tags,
uncategorized and the events plugin's English link. Home shows one first-step
card ("Viết lời giới thiệu", opening a prefilled Giới thiệu post) until the
member has posted, with Bà Mối as the quiet secondary action. "Chủ đề mới" is
relabelled "Viết bài". Signup now requires only the 18+ attestation and Q1;
the other 14 questions are optional profile fields (`asked: "later"`).

Skipped: Discourse forks or a headless Next.js member UI (more cost than the
problem needs), and switching platforms (Flarum 2 still RC; others would mean
rebuilding the Google-only, privacy and Bà Mối integration). Known risks:
Discourse discourages components on Horizon, so browser acceptance guards our
component plus Portfolio/Thumbnails; existing members keep their old sidebar
categories; Bà Mối opens a new PM each time; outgoing email remains disabled.
Thảo has not reviewed the reduced signup yet.

Local verification: Ruby/JSON/YAML syntax, gjs template parsing with
content-tag, 31 files / 224 Vitest tests, typecheck and lint pass. The
Discourse request/browser acceptance (Horizon, palette, sidebar, first-step
journey, signup contract) runs only in GitHub CI. Production apply has not
happened. Design: `docs/design/member-happy-path.md`.

First CI run on `bc2f2eb` failed: `enable_welcome_banner` is themeable in this
Discourse revision and must be set per theme, and unanswered optional fields
are stored as nil keys. Codex review `25348bda-faac-4443-8f62-c76a904d2194`
(route `f51d5c8d`) returned do-not-ship with four findings, all accepted:
the sidebar rewrite could delete admin-added links (now refused unless the
section holds only core links or is bootstrap-owned, checked before any write);
visible changes ran before fallible imports (imports/configuration now run
first); the first-step "introduced" flag was shared across accounts on one
browser (now keyed by user id); and tests lacked a legacy-site migration,
custom-sidebar refusal and Q1-only enforcement case (added).

Second CI run (`9f21cae`): request acceptance 28/29 (`top_menu` cannot contain
`unread` under unified new; test fixture corrected). Browser acceptance stalled
after the first-step card stayed visible for a member who had posted: core
serializes `post_count`/`topic_count` only to staff, and a topic's first post
counts as a topic. The card now asks `/user_actions.json` for one topic or reply.

Third CI run (`a077da8`): request acceptance 29/29; browser 4/6. Screenshots
confirm Horizon, the brand palette, the reduced sidebar, the "Viết bài" button
and the first-step card on desktop and full-width on mobile. Remaining: the lone
"Gần đây" tab stayed visible (the page-class selector did not match Horizon) and
the activity-stream lookup returned nothing in system tests. The card now uses
core's serialized `currentUser.any_posts` (no request, no browser storage; this
also retires the per-account storage finding) and the tab rule applies to all
list controls. The "Chưa phân loại" entry in one screenshot comes from
Discourse's `create_post` spec helper enabling uncategorized topics.

Fourth CI run (`3be4953`): request 29/29, browser 5/6. Only the lone tab
remained: core styles `#navigation-bar` by id, which outranks a class rule. The
rule now targets the id, and the home-only category breadcrumb is hidden via
core's `navigation-topics` body class.

Fifth CI run (`0a10f5a`): both required checks pass (request 29/29, browser
6/6). Minh then reported the composer mode switcher still read "Create topic":
core vi lacks `composer_actions.create_topic.label` and siblings. The bootstrap
now owns a small `VI_LABELS` set of vi overrides (missing composer labels, "Đăng
bài" submit, plain placeholder instead of Markdown/BBCode, "bài" instead of
"tút"), asserted in request and browser acceptance. Also confirmed for Minh:
the ASUS community is public through Tailscale Funnel (public DNS resolves to
Funnel relays; guests are redirected to Google sign-in), and none of this
branch is applied there yet.

# 2026-10-25 — Bà Mối model switched to DeepSeek V4.1 Flash

At Minh's request Bà Mối's agent now uses OpenRouter
`deepseek/deepseek-v4.1-flash` (supports tool calling). Added Discourse AI model
2 bound to the existing native secret 2 (the key was not re-entered), passed the
native LLM test, set the private operator `BA_MOI_LLM_ID=2` and ran the installer:
check showed only `default_llm_id` drift; apply then check reported no drift.
Model 1 (Sonnet) stays for the moderation classifier and as the rollback target.
A live QA private message as `ts_qa_nam` got a correct, in-voice reply about
18 seconds later that used the status tool (paused profile, box open); the QA
topic was then soft-deleted.

Incident: the Discourse admin LLM listing returns the provider key in clear,
and one diagnostic readout printed it into the session's tool output (not into
Git, docs or any external service). Recommended rotation of the OpenRouter key
in OpenRouter/Infisical and the Discourse native secret. Later calls redacted it.

# 2026-10-25 — Bà Mối as a chat

Minh found the Bà Mối entry felt like writing a forum post (message editor
with title and toolbar) and that every click started a new thread although the
service keeps one thread per member. The theme now opens the member's existing
two-person thread with the bot (or starts it with "Chào Bà Mối 🌸"), and that
thread renders as a chat: bubbles, no forum chrome, one pinned input where Enter
sends via an ordinary reply. Backend, Discourse AI tools and the relay are
unchanged. Browser acceptance covers first open, bot reply, Enter-to-send, no
second thread on reopen, and a mobile render.

Superseded the private-message chat skin above at Minh's direction: Bà Mối
moves to native Discourse Chat (streaming replies, replying indicator, uploads,
unread badges) in a stacked change. The skin's theme files and tests were
removed from this branch; PR #5 stays the member happy path.

# 2026-10-25 — Bà Mối moves to native Discourse Chat (phase 1)

Minh wanted Bà Mối to feel like a real chat (typing, delivery state, photos).
Source checks on the pinned Discourse showed the original reason for private
messages is gone: chat emits `chat_message_*` webhooks, Discourse AI agents
can answer chat direct messages with streaming and the replying indicator, and
tools get `channel_id`. Branch `feat/ba-moi-chat` (stacked on PR #5): chat
enabled for one-to-one direct messages only, agent `allow_chat_direct_messages`,
chat-style and text-only notes in the prompt, theme entry points open the
member's direct chat, and a `BA_MOI_NOTICE_TRANSPORT` switch (default `pm`)
sends Bà Mối's notices to that chat through the existing outbox. Match chats,
post-reveal attachments and "seen" receipts are phase 2. Plan and rollout
order: `docs/plans/2026-10-25-ba-moi-chat.md`.

First PR #6 CI: request acceptance passed; the desktop browser test expected a
full-page chat URL, but Discourse opens direct chats in the desktop drawer
(mobile was full screen, as expected). Kept the drawer (chat beside the feed)
and asserted on the composer and the one member↔bot channel instead. Also:
vi overrides for the chat placeholder and empty-state title (they rendered in
English), chat search off, and the private-message inbox link renamed "Hộp thư"
so it no longer duplicates chat's "Tin nhắn" section.

Codex review `0831f1f1-f5ca-4c7b-8b10-51ae3c03ffc1` (route `9d5b5f0a`) of
`adc57b1` returned do-not-ship. All three findings were accepted and fixed:
(1, high) in chat, Discourse AI gives tools `channel_id`/`message_id` rather than
topic/post ids, so delete, block, end and reveal could never confirm. The tool
script now forwards both, and confirmations bind to the negated channel id and
message id, with a chat-context test; (2) acceptance now uses a real Discourse
AI agent bot user (negative id) and its own API key against the chat
endpoints. A live read showed the production `Ba_Moi_bot` is in the
trust_level_0–4 groups, so `direct_message_enabled_groups` including
trust_level_0 covers it. Refused chats (member turned chat off) now fall back to
the private thread; (3) the sidebar click interception only handles plain
primary clicks and registers once.

CI on `9270642` proved the real Discourse AI bot path (negative-id bot user,
own key) opens, posts into and reuses a member's direct chat. It also showed
Discourse does not refuse the bot for a member who turned chat off. The test
and docs now state that limitation instead of the assumed fallback.

Targeted follow-up review `16312cd6-1453-44eb-8955-44838b3d1917` confirmed the
three earlier findings resolved and flagged the broad 4xx private-message
fallback as able to hide operational faults. With CI showing Discourse never
refuses the chat-off case it was meant for, the fallback was removed: chat
notices retry and then dead-letter visibly. Envelope ids are now also
required to be safe integers.

# 2026-10-25 — Live rollout of PRs #5 and #6

Minh approved going live without a backup (no real members). Merged #5
(`ea6de42`) and #6 (`5fe1666`). On the ASUS, moved the old source to
`source-pre-5fe1666-20261025` and extracted `5fe1666` into `source`; no
container rebuild was needed (core, plugins and component pins unchanged).
The community and presentation bootstraps were checked, applied and rechecked
with no drift. The first presentation apply failed inside the brand theme import
with no partial cutover (imports run first); the immediate rerun succeeded.
Horizon (−2) is now the default, with the Thật Space Horizon palette and the
brand, Topic List Thumbnails and User Portfolio components. The brand component's
`ba_moi_username` was set to `Ba_Moi_bot` (−1201). The AI installer then applied
the chat-DM permission, prompt and tool scripts, with no drift afterwards.

Host: the 3.2 GiB ASUS was swapping (1.2–1.7 GiB). Theme compilation and the
runner sessions caused about two minutes of 502/503 while the web process
restarted, "can't alloc thread" job errors, and repeated Sidekiq heartbeat
restarts. No OOM kill was recorded.

Live QA as `ts_qa_nam` in direct chat 3 found two issues:
1. In chat, Discourse AI sends tool `participants` as a list, so the service
   returned 400 and Bà Mối said she could not open her records. Fixed in the
   tool script, applied live through the installer, and also made tolerant in
   the service (`fix/ba-moi-chat-live`). The retest used the status tool
   correctly (paused profile, Duyên box).
2. Discourse AI's design for AI direct chats: each top-level member message
   becomes its own forced thread, the reply goes in that thread, and the AI's
   context is only that thread. Within a thread, multi-turn context works. Not
   yet a flat chat; options are being presented to Minh.

The Vercel service is unchanged and `BA_MOI_NOTICE_TRANSPORT` stays `pm`
until the threading decision.

Option A chosen by Minh (ASUS stays until Thảo approves a move to AWS). Branch
`feat/ba-moi-one-thread`: the theme opens or starts the member's current Bà Mối
thread and redirects full-page top-level visits into it; the service posts
notices into that thread. Browser acceptance simulates Discourse AI's forced
thread reply for existing, first-contact and mobile cases.

PR #8 merged (`8896548`). Its screenshots showed the thread conversation working
on desktop and mobile, with core chat labels still in English ("Thread", "Chat
in thread", "See in", "Chat"); vi overrides added in `fix/chat-vi-labels`.

Vercel: added production `BA_MOI_NOTICE_TRANSPORT=chat`, then built main
`8896548` locally from a clean archive. The production environment was loaded
only into the build process, and the output audit found 0 native binaries, 0 env
files and no secret values (the public DISCOURSE_URL is expected). The CLI's
`builds.json` argv path was redacted. Staged `dpl_3KqbA9qbnBEhBWbj5dGjPVkjLpQj`
with `--prebuilt --prod --skip-domain`, smoke-tested through `vercel curl`
(protection bypass), then promoted. All eight canonical routes return 200, the
unauthenticated tool call 401, and an authenticated chat-style status 200. A QA
notice from Bà Mối landed in the QA member's current chat thread. Rollback is
`dpl_8KFk7usXWsEEoh6QGbCXrDfxeL6C`. Evidence:
`docs/verification/vercel-prebuilt-8896548-production.json`.
