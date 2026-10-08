# Thật Space

Thật Space is a private Vietnamese community for **any person aged 18 or
older**. Membership is not restricted by gender.

This repository contains three deliberately separate surfaces:

- a public Next.js brochure;
- a private Discourse community build;
- the Bà Mối matchmaking service, which is disabled for the initial pilot.

Public site: <https://that-space-demo.vercel.app>

Private community: <https://ubuntu-asus.tail349cbf.ts.net:8443>

## Launch status

The approved soft-launch shape is a public brochure plus a controlled private
pilot of at most 20 adults:

- public routes are `/`, `/privacy`, `/terms`, and `/contact`;
- the former static forum, profile, Tử Vi, and matchmaking demo routes have
  been removed;
- anyone aged 18 or older may request an invitation through the configured
  support address;
- Discourse requires an invitation, an explicit 18+ attestation, all 15
  community onboarding answers, and staff approval;
- admission controls manage pilot capacity and safety; they are not a gender or
  identity-document gate;
- onboarding answers are private by default and are not sent to Bà Mối;
- `BA_MOI_ENABLED=false` is the default and all Bà Mối HTTP ingress fails
  closed while disabled.

The complete decision, operator checks, stop conditions, and deferred Bà Mối
work are in the [controlled public soft-launch plan](docs/plans/2026-10-08-controlled-public-soft-launch.md).

## Getting started

Requires Node.js 20 or later. Vercel builds with Node 24.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

`PUBLIC_SUPPORT_EMAIL` opens invitation intake. A community link additionally
requires both `DISCOURSE_URL` and `PUBLIC_COMMUNITY_LINK_ENABLED=true`; keep the
flag false until the member path passes external acceptance. Do not add real
secrets to tracked files.

| Command | Purpose |
| --- | --- |
| `npm test` | Vitest page, matching, data-layer, service, and local journey tests |
| `npm run test:beta` | Two complete Bà Mối journeys against disposable Postgres and fake Discourse |
| `npm run typecheck` | TypeScript validation |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run build` | Production Next.js build |
| GitHub `Discourse community acceptance` | Pinned native Discourse request/browser acceptance suite |
| Manifest `--check` from the runbook | Report drift from the controlled community manifest |

## Public routes

| Route | Content |
| --- | --- |
| `/` | Pilot scope, adult eligibility, community boundary, and feature status |
| `/privacy` | Community data handling and the disabled Bà Mối boundary |
| `/terms` | 18+ eligibility, pilot admission, and conduct terms |
| `/contact` | Invitation, support, and safety-reporting channel |

`PUBLIC_SUPPORT_EMAIL` must be configured before invitation intake opens. If it
is missing, the public CTAs become status-only and `/contact` says intake is
closed instead of creating a broken or circular link. `DISCOURSE_URL` never
publishes a link by itself: `PUBLIC_COMMUNITY_LINK_ENABLED=true` is also
required, and still never creates a public signup link.

## Repository map

```text
app/              Public pages and disabled-by-default Bà Mối route handlers
components/       Shared public navigation and footer
lib/matching/     Bà Mối compatibility, privacy, and filtering core
lib/db/           Bà Mối Postgres data layer and sample members
lib/service/      Tool handlers, relay, outbox, copy, and launch switch
lib/discourse/    Discourse API client and webhook verification
supabase/         Supabase CLI config and additive SQL migrations
scripts/          Install, verification, and maintenance scripts
discourse/        Community manifest, bootstrap, theme, agent, and deployment pin
tests/discourse/  Native Discourse request and browser acceptance
__tests__/        Public-page tests in jsdom
tests/unit/       Node unit tests; database suites use PGlite
tests/integration/Local Bà Mối journeys through the real dispatcher
```

Brand colors live in `tailwind.config.ts`. Playfair Display and Inter are loaded
by `app/layout.tsx`. `next.config.js` keeps the logo unoptimized so the static
public surface does not depend on the image optimization server.

## Controlled community admission

The source of truth is `discourse/community/manifest.json`. The manifest
enforces:

- `login_required=true`;
- `allow_new_registrations=true` only so invitation redemption works;
- `enable_signup_cta=false`;
- `invite_only=true`;
- `must_approve_users=true`;
- `enable_local_logins=true` for the native invitation path;
- outgoing email disabled until a real mailer is configured and tested.

The first required signup field is the exact 18+ self-attestation. The next 15
fields are Thảo's community onboarding questions. Do not collect identity-
document images. Apply changes with `--check` first and follow
[community operations](docs/community-operations.md).

## Bà Mối boundary

Bà Mối is not available to pilot members yet. Keep all three controls in place:

1. `BA_MOI_ENABLED=false` in the service environment;
2. `BA_MOI_ALLOWED_GROUP_IDS` empty in the Discourse installer configuration;
3. the theme's Bà Mối username unset so no member CTA appears.

With the service switch off, tool, webhook, and retry endpoints return HTTP 503
before loading database or bot credentials. The underlying service can still be
verified locally with `npm run test:beta`.

Before enabling Bà Mối, complete the safety gates in the launch plan: fresh
server-bound confirmation for sensitive actions, rolling cross-message contact
protection, outbox failure-injection coverage, live provider acceptance, an
incident owner, and updated processor disclosures.

## Data and secrets

Copy `.env.example` to the ignored `.env.local`; never commit values. The Bà
Mối service uses Supabase's transaction pooler with prepared statements off.
RLS is enabled without client policies, and public Data API roles hold no table
privileges. Tests use an in-memory PGlite database and never contact Supabase.

Migrations are additive. Take a verified backup before a production data
change. The service API contract lives in
[docs/ba-moi-service-api.md](docs/ba-moi-service-api.md).

## Deployment

The Vercel project is intentionally not connected to Git, so a push or pull
request does not deploy. Follow the studio local-first policy:

1. required GitHub checks must pass on the exact intended commit;
2. pull the intended Vercel environment;
3. run `vercel build` locally and inspect the mapped output for Linux-x64 native
   compatibility;
4. deploy that exact output with `vercel deploy --prebuilt` to a preview;
5. smoke-test the preview in a real browser;
6. promote to production only after explicit operator approval.

Do not connect Git auto-deploy and do not upload `.vercel` or environment
values. The previous production evidence points to commit `1787b83` and is not
evidence for the current release. Record the new exact commit and deployment ID
under `docs/verification/` when promotion occurs.

To link a clean checkout to the existing project:

```bash
vercel link --yes --team minh-nguyens-projects-3a747261 --project that-space-demo
```

## Provenance

The original public demo was recovered from a Vercel deployment on 2026-09-27,
verified against Vercel file digests, and imported into Git. See
[the session log](docs/SESSION_LOG.md). Historical plans and verification files
describe earlier states; the 2026-10-08 controlled plan is authoritative for
this release.
