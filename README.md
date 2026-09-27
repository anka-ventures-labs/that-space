# Thật Space

A private community for Vietnamese women: a forum, Tử Vi (Vietnamese astrology)
readings, and spiritual matchmaking. This repository holds the **frontend demo**,
a static Next.js site with hardcoded content. There is no backend, authentication,
or database.

Live demo: https://that-space-demo.vercel.app

## Status

- Clickable mockup. Forum threads, replies, matchmaking profiles, readings, and
  testimonials are placeholder copy in `lib/` and the page files.
- The reply box, the Tử Vi form, and the "Generate Reading" and "Download PDF
  Report" buttons are static. Only navigation, the mobile menu, and the
  matchmaking compatibility modal are interactive.
- Testimonial and member names are fictional. Replace them with real, consented
  content before any public launch.
- Next: Bà Mối, an AI matchmaker. See [docs/ba-moi-spec.md](docs/ba-moi-spec.md).

## Getting started

Requires Node.js 20 or later. Vercel builds with Node 24; the recovery was
verified locally on Node 22.

```bash
npm ci
npm run dev        # http://localhost:3000
```

| Command | Purpose |
| --- | --- |
| `npm test` | Jest + Testing Library suite (123 tests) |
| `npx tsc --noEmit` | Typecheck |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run build` | Production build (18 static pages) |

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
src/app/          App Router routes
src/components/   Navbar (client component) and Footer
lib/              Demo data: forum threads, matchmaking profiles
__tests__/        Jest + Testing Library tests
public/logo.jpg   Brand logo, served at /logo.jpg
```

- `@/*` maps to `src/*`. `lib/` sits at the repository root, so routes import it
  with relative paths such as `../../../../lib/forum-data`.
- Brand colors live in `tailwind.config.ts`: `primary` `#5C3D2E`, `secondary`
  `#C4A882`, `cream` `#F5F0E8`. Playfair Display (headings) and Inter (body) are
  exposed as CSS variables by `src/app/layout.tsx`.
- `/forum/[slug]` derives `generateStaticParams()` from `lib/forum-data.ts`, so a
  thread added there gets its own page at build time.
- `next.config.js` sets `images.unoptimized` so the logo renders without the
  image optimization server.
- Tests mock `next/image` and `next/link`. The `console.error` about the
  `priority` prop, caused by the image mock, is expected.
- `progress-7b613403-….txt` is the log of the agent run that built the demo. It
  records the user stories (US-001 to US-009) and codebase patterns.

## Deployment

The demo runs on the Vercel project `that-space-demo` (team "Minh Nguyen's
projects"). It was deployed from the Vercel CLI, and the project is intentionally
**not** connected to this GitHub repository, so pushes and pull requests never
trigger Vercel builds.

Deploy according to the studio's Vercel policy in
`anka-ventures-labs/anka-dev-infra` (`docs/vercel-build-cost-control.md`). Build a
preview first, smoke-test its URL, and promote to production only after a human
approves. Do not connect Git auto-deploy.

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

- `next@14.2.5` has published security advisories. `npm audit --omit=dev`
  reports 1 critical and 2 high findings. The fix is a patch upgrade to
  `next@14.2.35` with a matching `eslint-config-next`. The live demo still runs
  14.2.5.
- `logo.jpg` at the repository root duplicates `public/logo.jpg`. Only the
  `public/` copy is served.
- The footer copyright reads "© 2024".
