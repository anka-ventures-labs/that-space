# Session log

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
  Codex (decision `164863d7`, job `14aceefe`). Its findings will be checked
  against the code and folded into the spec.

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
