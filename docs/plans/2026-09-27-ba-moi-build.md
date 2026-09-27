# Bà Mối build plan

Branch: `feat/ba-moi`. Spec: [docs/ba-moi-spec.md](../ba-moi-spec.md).

## Goal

Build the first playable Bà Mối on a Vercel preview. A member signs in with
Google using an invite code, talks to Bà Mối, confirms her anonymous card, opens
the daily box or asks Bà Mối to find someone, sends an interest signal, and the
other person accepts or declines. Discourse, with the chat relay and
DiscourseConnect, joins once the ASUS is free.

Work first: the whole loop must run without an AI model key, using Moon's
template fallbacks, so AI text drops in when Minh's OpenRouter key arrives.

## Environment

- Supabase project `vafeunxublsuduefolhw` (organization "Thật Space", free
  plan, `ap-southeast-1`). Local secrets live in `.env.local`, which git
  ignores. `.env.example` lists the variable names.
- The model goes through OpenRouter using the Vercel AI SDK. The key comes
  later.
- Moon source for porting: `origin/main` of `moon-ai-vn/moon2-app`, copied to
  `.moon-src/`, which is excluded locally through `.git/info/exclude`.
- There is no GitHub CI; the org is out of minutes. Every check runs locally:
  `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build`.

## Parallel MECE workstreams

| # | Workstream | Scope, which touches no other stream's files | Depends on |
|---|---|---|---|
| W1 | Foundation | Move to Moon's stack: Next.js 15.5, Supabase SSR clients, AI SDK 6 with an OpenRouter provider, Vitest (migrating the existing Jest tests), `.env.example`, Supabase migrations setup | none |
| W2 | Sign-in | Google sign-in ported from Moon, the invite-code gate, a `profiles` row on first sign-in, and the DiscourseConnect provider endpoint with tests | W1 |
| W3 | Matching core | Pure TypeScript with tests. Moon's privacy rules (card, rule of 5, leak check) and matching (mutual minimum, weighted pick, daily turn). Tuổi hợp (can chi and ngũ hành nạp âm from the lunar year, with the Tết boundary). Hard filters (intent, gender, age, marital status, exclusions), directional scores, tier labels | none |
| W4 | Data and services | Migrations for private profiles, pool cards, invites, daily openings, discoveries, interests, signal responses, matches, reports, blocks and notifications, with server-only access rules. Services for opt-in, box, search, interest, accept, decline and expire. Seed data of about 30 sample members | W1, W3 (types) |
| W5 | Bà Mối's brain | Persona prompts in two voices; the interview flow, which also runs without a model; the card writer with leak check, retries and template fallback; the candidate and recipient texts; turning "find me someone" into filters plus a model rerank of the filtered cards | W3 (types) |
| W6 | Screens | Mobile-first Vietnamese UI: invite and sign-in, the Bà Mối chat, card confirmation, the box (from Moon's ritual), candidate cards, the signals inbox, the matches list, settings, and Thảo's admin screen | W2, W4, W5 |
| W7 | Discourse | When the ASUS is free: install, point Funnel at it, set up DiscourseConnect as a client, the relay webhook, the bot account, the header link | W2, W4 |
| W8 | Assembly | Merge, full checks, security pass, a Vercel preview (local prebuilt deploy after the native-runtime audit), then one cross-family review | all |

Order:

1. W1.
2. W2 to W5 in parallel, each in its own worktree.
3. W6.
4. W8 for the preview.
5. W7 when the ASUS is ready.

Execution: Minh asked on 2026-09-27 for Claude to do the engineering directly
in this session, with no Codex delegation. The router recorded this as the
`direct` lane, decision `b72236fc`. Workstreams run in the order above in the
main worktree. The one cross-family review is by OpenCode with Muse Spark
1.3 (`opencode-go/muse-spark-1.3-contributor`), through agent-jobs (ACO) at
assembly. A follow-up review happens only if the result requires one.

## Verification per workstream

- **W1:** the existing pages build, and all 123 existing tests pass on Vitest.
- **W3:** tests prove the hard filters in both directions, the leak check, the
  rule of 5, and tuổi around Tết against reference dates.
- **W4:** migrations apply cleanly to the Supabase project, and service tests
  cover every state transition in the spec.
- **W2, W5 and W6:** the loop runs locally between two test members, with
  and without a model key.
- **W8:** the native-runtime audit of the prebuilt output passes before any
  deploy.
