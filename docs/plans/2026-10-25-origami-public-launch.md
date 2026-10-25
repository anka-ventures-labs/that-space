# Origami public launch implementation

Date: 2026-10-25

## Outcome

Ship the design handoff under `docs/design/origami/` as the actual public
Next.js experience while preserving the existing Discourse identity/community
and Bà Mối service boundaries. The GitHub repository is public. The release is
assembled on `feat/origami-public-launch` from the public self-service launch
branch plus the design handoff commit.

## Parallel MECE workstreams

The scopes are collectively exhaustive but were assembled in one Codex session
because routes depend on the shared paper tokens and layout.

1. **Shared visual system:** Fraunces/Be Vietnam Pro, color tokens, paper grain,
   shadows, buttons, folds, responsive navigation/footer, reduced motion.
2. **Designed public routes:** landing/lotus, forum/thread, Tử Vi, matchmaking,
   profile, plus the paper treatment on legal/support/404 pages.
3. **Functional continuity:** environment-gated real signup/login, authenticated
   community posting, separate voluntary Bà Mối flow, and unchanged service/API,
   privacy, consent, relay, block, pause, deletion, and webhook behavior.
4. **Launch controls:** accurate preview disclaimers, accessibility, responsive
   QA, dependency audit, full automated checks, local production build, public
   endpoint/OAuth acceptance, cross-family review, exact-head hosted CI.

Dependencies: workstream 1 precedes route styling; route interactions and signup
links are verified against workstream 3; workstream 4 gates release of all three.

## Implemented product boundary

- The public artboards are real responsive routes, not screenshots or loose
  references.
- The 29-petal lotus follows the pointer and blooms using CSS variables written
  by one animation frame loop; it does not re-render React each frame.
- Forum filtering/sorting, accordion folds, Tử Vi generation/palace switching,
  matchmaking modal/escape handling, and responsive navigation are functional.
- Sample forum/profile/match data and the sample Tử Vi reading are labelled as
  previews. Persistent member actions cross into the real Discourse origin.
- Public registration stays fail-closed when the independent publication flags
  or community URL are absent.

## Verification and observed gates

- `npm audit --omit=dev --audit-level=high`: clean after updating Next.js to
  15.5.28 and Zod to a patched `^4.6.6` release (lockfile: 4.6.7).
- `npm run build`: succeeds; 21 pages generated, including ten thread paths.
- T3 collaborative-browser desktop and 390×844 mobile checks: no horizontal
  overflow on all handed-off routes; navigation and hydration are clean.
- Public DNS, TLS, Funnel health, `/signup`, and Google OAuth redirect are live.
  A clean incognito path reached Google's “continue to Thật Space” screen with
  the exact port-8443 callback.
- A cold browser request observed one transient 503 for the large Vietnamese
  locale module, leaving Discourse on its splash screen. A clean incognito retry
  succeeded. Historical runbooks document the same cold rotational-disk worker
  stalls. This is an operational reliability risk until host access permits log
  inspection/tuning or storage remediation.
- This machine has no Vercel CLI credential and tailnet policy denies SSH to the
  ASUS host. No production deployment or host mutation is claimed from this
  session.

## Release sequence

1. Finish local suite and one Sonnet assembly review; fix confirmed blockers.
2. Push one coherent product branch and open one PR to `main`; require current
   head GitHub-hosted checks.
3. With an authorized Vercel credential, pull production env, locally prebuild
   the exact green revision, inspect Linux-x64 output, deploy the prebuilt preview,
   and repeat route/signup smoke tests.
4. Before production promotion, run cold and warm Discourse signup/login plus a
   signed-in page and native post from an external client. Do not treat
   `/srv/status` alone as acceptance.
5. Promote the exact checked artifact only after the cold-path gate passes, then
   record deployment/revision evidence under `docs/verification/`.
