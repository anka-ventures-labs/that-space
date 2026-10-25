# Thật Space

Thật Space is a private Vietnamese community for **any person aged 18 or
older**. Membership is not restricted by gender.

This repository contains three deliberately separate surfaces:

- a public Next.js brochure;
- a private Discourse community build;
- the full Bà Mối matchmaking service.

Public site: <https://that-space-demo.vercel.app>

Private community: <https://ubuntu-asus.tail349cbf.ts.net:8443>

## Launch status

The approved soft-launch shape is public self-service membership for any adult,
with the full community and Bà Mối experience available from day one:

- the origami public experience ships `/`, `/forum`, `/forum/[slug]`, `/tuvi`,
  `/matchmaking`, and `/profile`, plus `/privacy`, `/terms`, and `/contact`;
- designed public forum, profile, Tử Vi, and matchmaking screens are explicitly
  labelled previews; account data, posting, messaging, private profiles, and
  Bà Mối remain in the authenticated Discourse community;
- anyone aged 18 or older may register with Google, without an invitation or
  staff approval;
- Discourse requires an explicit 18+ attestation and all 15 private community
  onboarding answers;
- onboarding answers are private by default and are not sent to Bà Mối;
- Bà Mối is available to ordinary registered members, with separate consent,
  a private interview, anonymous discovery, signals, relay chat, mutual reveal,
  pause, block, end and deletion;
- soft-launch capacity is controlled through a small first announcement and
  active monitoring rather than invite-only admission.

The release sequence and acceptance gates are in the
[public self-service launch plan](docs/plans/2026-10-11-public-self-service-launch.md).

## Getting started

Requires Node.js 20 or later. Vercel builds with Node 24.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The public community link requires `DISCOURSE_URL` and
`PUBLIC_COMMUNITY_LINK_ENABLED=true`. Direct signup additionally requires
`COMMUNITY_PUBLIC_REGISTRATION_ENABLED=true`. Production sets
`BA_MOI_ENABLED=true`; changing it to false is the emergency service stop. Do
not add real secrets to tracked files.

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
| `/` | Bà Mối-led product, adult eligibility, public signup, and community features |
| `/forum` | Filterable public preview of the handed-off origami forum; posting opens the authenticated community |
| `/forum/[slug]` | Public sample thread in the handed-off folded-letter treatment |
| `/tuvi` | Interactive 12-palace sample chart with clear cultural/illustrative disclaimer |
| `/matchmaking` | Interactive compatibility-letter preview; real participation opens Bà Mối signup |
| `/profile` | Static public profile artboard; real member profiles remain private |
| `/privacy` | Community/Bà Mối data handling and active processors |
| `/terms` | 18+ eligibility, account rules, and conduct terms |
| `/contact` | Account, data, community, and Bà Mối support |

If `PUBLIC_SUPPORT_EMAIL` is absent, `/contact` directs visitors through the
public Google signup or member login path before they contact staff inside the
community; it does not link guests into a login redirect loop.
`DISCOURSE_URL` never publishes a link by itself:
`PUBLIC_COMMUNITY_LINK_ENABLED=true` is also required. The signup CTA appears
only when the independent public-registration flag is true.

## Repository map

```text
app/              Public pages and Bà Mối route handlers
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

The implementation source of truth is `docs/design/origami/`: Fraunces and Be
Vietnam Pro, paper tokens, sharp folds, grain, shadows, interactive cards, and
the cursor-following 29-petal lotus are ported into the actual Next.js routes.
`next.config.js` keeps the logo unoptimized so the static public surface does not
depend on the image optimization server.

## Public self-service admission

The source of truth is `discourse/community/manifest.json`. The manifest
enforces:

- `login_required=true`;
- `allow_new_registrations=true` and `enable_signup_cta=true`;
- `invite_only=false` and `must_approve_users=false`;
- `enable_local_logins=false` so Google is the only signup/login path;
- `enable_google_oauth2_logins=true`, checked by the owned manifest and
  bootstrap drift command;
- `auth_skip_create_confirm=false` so only a completed OAuth handoff can create
  the account;
- outgoing email disabled; Google verification replaces email activation.

The first required signup field is the exact 18+ self-attestation. The next 15
fields are Thảo's community onboarding questions. Do not collect identity
document images. Apply changes with `--check` first and follow
[community operations](docs/community-operations.md).

## Bà Mối launch contract

Bà Mối is a first-day feature. The live release requires all three controls:

1. `BA_MOI_ENABLED=true` in the service environment;
2. `BA_MOI_ALLOWED_GROUP_IDS` includes the live `trust_level_0` group id;
3. the theme's Bà Mối username is the installed persona account.

Sensitive delete, reveal, block and end operations require a fresh, short-lived,
single-use service token bound to the member, Discourse thread, action, target
and triggering post. The service executes it only from a later member post. The
anonymous relay checks a rolling window so contact details split across several
messages are held before mutual reveal, then deletes that temporary tail on
reveal, end, block or member deletion. Setting `BA_MOI_ENABLED=false` still stops
tool, webhook and retry ingress with HTTP 503.

The complete service journey is verified locally with `npm run test:beta` and
must also pass with two fresh non-staff accounts on the exact deployed release.

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
describe earlier states; the 2026-10-11 public self-service plan is
authoritative for this release.
