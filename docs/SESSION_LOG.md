# Session log

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
