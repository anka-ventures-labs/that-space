# Thật Space

A private community for Vietnamese women: a forum, Tử Vi (Vietnamese astrology)
readings, and spiritual matchmaking. This repository contains the static Next.js
**frontend demo**, **Discourse community build**, and **Bà Mối beta backend**:
onboarding, member presentation, matching, private Postgres data, Discourse AI
tools, and an anonymous chat relay. Discourse provides the member interface and
authentication. The private community and service are installed; actual AI
conversation, review-only AI moderation and phone acceptance remain pending.

Live demo: https://that-space-demo.vercel.app

Private community: https://ubuntu-asus.tail349cbf.ts.net:8443

Public admission is Google-only: the launcher sets `enable_local_logins=false`
and there is no mailer, so password signup returns 403 rather than creating an
account that could never activate. See [site settings](docs/discourse-setup.md#5-site-settings)
for the exact redirect URI to register.

## Status

- The public homepage, `/privacy`, `/terms` and `/contact` describe real,
  current capabilities in Vietnamese. `/`, `/forum`, `/tuvi`, `/matchmaking` and
  `/profile` remain a demo: threads, replies, matchmaking profiles, readings and
  testimonials are placeholder copy in `lib/` and the page files, and the reply
  box, Tử Vi form and matchmaking modal are the only interactive parts. Set
  `COMMUNITY_PUBLIC_REGISTRATION_ENABLED=true` only once Google sign-in works on
  the live forum; the site then advertises `/signup` instead of `/login`.
- Member-facing features live in the Discourse community, not these demo pages.
- Bà Mối can be verified locally without a server or cloud account. Start with
  [local beta readiness](docs/local-beta-readiness.md); the product contract is
  in [docs/ba-moi-spec.md](docs/ba-moi-spec.md).
- The community build is versioned under `discourse/`, with pinned extensions
  and real Discourse request/browser tests. See [community build](docs/community-build.md)
  for reproduction, application, privacy boundaries and remaining live gates. The
  [whole-app execution plan](docs/plans/2026-10-01-whole-app.md) covers community
  onboarding, profiles, artwork, events, Bà Mối integration and the
  local-development-to-production sequence. Full Tử Vi charts/readings/PDFs
  remain out of scope for this phase; future astrology work should reuse Moon.
- The current [ASUS deployment checkpoint](docs/asus-deployment.md#observed-oct5-live-checkpoint)
  records synthetic member acceptance, private-upload checks, scheduled retry
  recovery and the isolated native restore. No real members have been invited;
  the native AI bot stays disabled until its dedicated model works.

## Getting started

Requires Node.js 20 or later. Vercel builds with Node 24; the recovery was
verified locally on Node 22.

```bash
npm ci
npm run dev        # http://localhost:3000
```

| Command | Purpose |
| --- | --- |
| `npm test` | Vitest: pages, matching core, migrated data layer, service and local acceptance |
| `npm run test:beta` | Two complete member journeys using disposable Postgres and fake Discourse; no external services or secrets |
| `npm run typecheck` | Typecheck |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run build` | Production build (18 static pages) |
| `npm run seed:samples` | Replace the 30 labelled sample members in the Supabase pool (reads `DATABASE_URL` from `.env.local`) |

## Pages

| Route | Content |
| --- | --- |
| `/` | Hero, three feature cards, testimonials, call to action |
| `/forum` | Category sidebar and 10 sample threads from `lib/forum-data.ts` |
| `/forum/[slug]` | Thread with replies, statically generated from `forumThreads` |
| `/tuvi` | Birth-information form and a sample reading |
| `/matchmaking` | Six profiles with a compatibility modal, from `lib/matchmaking-data.ts` |
| `/profile` | Sample member profile with readings and matches |

## Layout and conventions

```text
app/              App Router routes
components/       Navbar (client component) and Footer
lib/              Demo data: forum threads, matchmaking profiles
lib/matching/     Bà Mối matching core: lunar calendar, tuổi, day pillar, filters, scores, privacy
lib/db/           Bà Mối data layer: postgres.js client, repository, sample members
lib/service/      Bà Mối service: tool handlers, relay, outbox, Vietnamese copy
lib/discourse/    Discourse API client and webhook signature check
app/api/ba-moi/   Route handlers: /v1/<tool>, /v1/webhooks/discourse, /v1/cron/retry-posts
supabase/         Supabase CLI config and SQL migrations
scripts/          One-off scripts (seed-samples.ts, run with tsx)
discourse/        Community/onboarding, branded theme, extension pins and Bà Mối agent/tools
tests/discourse/  Native Discourse request and browser acceptance
__tests__/        Vitest + Testing Library page tests (jsdom)
tests/unit/       Vitest unit tests (node); tests/unit/db runs on PGlite
tests/integration/ Local beta acceptance journeys through the real dispatcher
tests/helpers/    Test database: PGlite + migrations, reached through postgres.js
public/logo.jpg   Brand logo, served at /logo.jpg
```

- `@/*` maps to the repository root, as in Moon, so code imports `@/lib/...`,
  `@/components/...` and `@/app/...`.
- Brand colors live in `tailwind.config.ts`: `primary` `#5C3D2E`, `secondary`
  `#C4A882`, `cream` `#F5F0E8`. Playfair Display (headings) and Inter (body) are
  exposed as CSS variables by `app/layout.tsx`.
- `/forum/[slug]` derives `generateStaticParams()` from `lib/forum-data.ts`, so a
  thread added there gets its own page at build time.
- `next.config.js` sets `images.unoptimized` so the logo renders without the
  image optimization server.
- Tests run on Vitest: page tests in `__tests__/` use jsdom, and unit tests in
  `tests/unit/` use node. They mock `next/image` and `next/link`. The
  `console.error` about the `priority` prop, caused by the image mock, is
  expected.
- `progress-7b613403-….txt` is the log of the agent run that built the demo. It
  records the user stories (US-001 to US-009) and codebase patterns.

## Bà Mối data (Supabase)

The service's database is a free Supabase project in its own organization.
Copy `.env.example` to `.env.local` and fill it in; never commit it.

```bash
set -a; . ./.env.local; set +a        # SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD
supabase link --project-ref "$SUPABASE_PROJECT_REF"
supabase db push                       # applies supabase/migrations/*.sql
npm run seed:samples                   # 30 labelled sample members
```

- The service connects through the transaction pooler (`DATABASE_URL`, port
  6543) with postgres.js and prepared statements off. RLS is on everywhere with
  no policies, and the public Data API roles hold no privileges.
- Migrations are additive. Take a `pg_dump` before any change that touches
  member data.
- Tests never touch Supabase: `tests/helpers/pglite-db.ts` gives each suite an
  in-memory PGlite with the same migrations.
- The service API the persona calls is documented in
  [docs/ba-moi-service-api.md](docs/ba-moi-service-api.md). Its environment
  variables are listed in `.env.example`.

## Deployment

The demo runs on the Vercel project `that-space-demo` (team "Minh Nguyen's
projects"). It was deployed from the Vercel CLI, and the project is intentionally
**not** connected to this GitHub repository, so pushes and pull requests never
trigger Vercel builds.

Deploy according to the studio's Vercel policy in
`anka-ventures-labs/anka-dev-infra` (`docs/vercel-build-cost-control.md`). Build a
preview first, smoke-test its URL, and promote to production only after a human
approves. Do not connect Git auto-deploy.

On 2026-10-05 the user approved staging a production-target local prebuilt with
`--skip-domain`, testing it, then manually promoting it because the current CLI
would rebuild a promoted preview remotely. Deployment
`dpl_ENbPZPxbsomoaYwAq9jYvWpvAPPr`, built from `1787b83`, now serves the canonical
alias in `sin1`. The clean archive's mapped-file audit found no native binaries
or operator environment references. See [the session log](docs/SESSION_LOG.md)
for that authorization and evidence; never upload this operator checkout's
`.vercel/output`.

To link a checkout to the existing project without creating a new one:

```bash
vercel link --yes --team minh-nguyens-projects-3a747261 --project that-space-demo
```

## Provenance

This source was never in Git. On 2026-09-27 it was recovered from the production
deployment `dpl_96qbsSc72amjziWADYYJ8UQL72Ts` (deployed 2026-02-23) through the
Vercel API, checked against Vercel's SHA-1 file digests, and imported unchanged.
See [docs/SESSION_LOG.md](docs/SESSION_LOG.md).

## Known issues

- `next@15.5.26`: `npm audit --omit=dev` reports one moderate Next.js advisory,
  fixed only in Next.js 16, and a high advisory in the PostCSS bundled inside
  Next.js. That one is build-time only and concerns processing attacker-supplied
  CSS source maps. The upgrade from 14.2.5 cleared its critical and runtime
  advisories.
- Dev tooling: `npm audit` also reports advisories in Vitest 2.1.9 and its
  Vite and esbuild. They affect the Vitest UI and dev servers, which this repo
  doesn't run (`vitest run` only). The fix is Vitest 5, a major upgrade that
  replaces `environmentMatchGlobs`; it's deferred.
- `logo.jpg` at the repository root duplicates `public/logo.jpg`. Only the
  `public/` copy is served.
- The footer copyright reads "© 2024".
