# Bà Mối build plan (Discourse-native)

Branch: `feat/ba-moi`. Spec: [docs/ba-moi-spec.md](../ba-moi-spec.md), v3.
Revised 2026-09-27. This replaces the web-app plan. W1, the foundation, is
already done: Next.js 15.5.26 and Vitest, commit `b779f4f`.

## Goal

Thảo's friends can join the private Thật Space Discourse with Google, message
Bà Mối, confirm an anonymous card, open the Duyên box or ask for someone, send
and answer interest signals, and chat anonymously through the relay, all on a
phone.

## System

```
Member (browser or installable app)
  └─ Discourse on the ASUS (Docker; Tailscale Funnel at https://ubuntu-asus.tail349cbf.ts.net)
       ├─ Google login, invites, forum, profiles and portfolio, events
       ├─ Discourse AI persona "Bà Mối" (LLM through OpenRouter)
       │    └─ custom JS tools ──HTTPS + tool secret──▶ Bà Mối service
       └─ webhook post_created ──HTTPS + HMAC──▶ Bà Mối service /webhooks/discourse
Bà Mối service (this repo, Next.js 15 route handlers on Vercel)
  ├─ lib/matching/*  pure TypeScript, ported from Moon
  ├─ lib/db/*        Supabase Postgres, service role only (project vafeunxublsuduefolhw)
  └─ lib/discourse/* API client, posting as the "Bà Mối" persona user or the "Thư Duyên" relay bot
```

## Service API (tool contract)

Every endpoint is `POST /api/ba-moi/v1/<name>`.

- **Auth:** `Authorization: Bearer $BA_MOI_TOOL_SECRET`.
- **Request body:** `{ discourse_user_id, discourse_username, persona_topic_id?, ...args }`,
  where the identity comes from the tool's `context`.
- **Responses:** `{ ok: true, ... }` or
  `{ ok: false, error: <code>, message_vi }`.
- **Speed:** stay under 1 second. The persona writes all the prose, so the
  service never calls an LLM on this path (Discourse tool scripts have a
  2-second script budget).

| Endpoint | Does |
|---|---|
| `status` | Opt-in state, missing profile fields, card status, remaining daily limits |
| `consent` | Records a consent version and age check. `action`: `opt_in`, `pause`, `resume`, `delete` |
| `profile_update` | Validates spec fields and stores them privately. Recomputes derived fields (age band, region, lunar can chi, nạp âm, and the chart when a birth time is given). Voids stale discoveries |
| `card_preview` | Returns the deterministic anonymous card plus a template summary |
| `card_confirm` | Accepts `summary_text`, runs the leak check (returns violations when it fails), stores the card and makes her discoverable |
| `box_open` | Claims the day's turn, then filters, scores and makes the weighted pick. Returns `{ discovery_id, card, fit }`, `no_match` or `cooldown` |
| `search` | Takes structured criteria and returns up to 3 `{ discovery_id, card, fit }`, recorded as discoveries. Daily limit |
| `interest` | Takes `discovery_id`. Creates the interest and a pending signal response, and posts the recipient's view into the recipient's Bà Mối thread. Idempotent |
| `signals` | Lists pending inbound signals, as recipient views |
| `signal_respond` | `accept`, `decline` or `dismiss`. On mutual interest it creates the match and both relay threads |
| `matches` | Lists matches, with alias, state and relay topic URL |
| `match_action` | `end`, `block` or `reveal` |

Webhook: `POST /api/ba-moi/v1/webhooks/discourse`.
- It verifies `X-Discourse-Event-Signature`, an HMAC-SHA256 of the body using
  `DISCOURSE_WEBHOOK_SECRET`.
- It handles only `post_created` in relay topics, and ignores posts by the bots.
- It is idempotent on the source post ID.
- It rate-limits each member to 12 messages a minute and caps messages at
  1,200 characters.
- Before a reveal, it holds contact details: the message is not relayed, and
  the bot tells the sender why.

## Data model (Supabase, `public`, RLS on with no policies)

| Table | Holds |
|---|---|
| `members` | `discourse_user_id`, `discourse_username` (never exposed), `persona_topic_id`, `status` (active, paused, deleted), `consent_version`, `opted_in_at`, `is_sample` |
| `member_profiles` | The spec fields plus derived fields (age band, region, can chi, nạp âm, optional chart JSON) |
| `pool_cards` | The anonymous card JSON, `summary_text`, `confirmed_at`, `discoverable` |
| `daily_openings` | Primary key `(member_id, open_day)`, status (pending, matched, no_match, void) |
| `discoveries` | Unique `(viewer, candidate)`, source (box, search), directional scores, mutual score, tier, card snapshot, status |
| `interests` | Unique `(from, to)`, `recipient_payload` |
| `signal_responses` | Response, `expires_at` (7 days, applied when read) |
| `matches` | Unordered unique pair, state, `reveal_a`, `reveal_b`, `closed_reason` |
| `relay_topics` | `(match_id, member_id)` → Discourse topic, `alias_for_other` |
| `relay_messages` | Unique source post, relayed post, status (relayed, held) |
| `blocks` | Who blocked whom |
| `settings` | Weights, threshold, daily limits, voice |
| `pending_posts` | Discourse posts that failed to send, with the target topic or user, body and attempts; retried later |

## Parallel MECE workstreams

| # | Workstream | Scope (disjoint files) | Depends on | Acceptance checks |
|---|---|---|---|---|
| A | Matching core | `lib/matching/**` and `tests/unit/matching/**`. Ports Moon's privacy, matching and daily modules, the Vietnamese lunar calendar and can-chi tables. Adds the hard filters, directional scores and tiers. A2 adds Moon's full romantic score for an optional birth time | none | Table-driven filter tests in both directions; leak check and rule of 5; tuổi for 1985-02-01 (Ất Sửu, Vietnamese calendar), 1990-01-20 (Kỷ Tỵ) and 1990-01-27 (Canh Ngọ); nạp âm for 1984, 1990 and 1996; weighted pick with a seeded random source |
| B | Data layer | `supabase/migrations/**`, `lib/db/**`, `scripts/seed-*.ts` | A (types) | Migrations apply to the Supabase project; repository tests pass against an in-memory fake; seed creates 30 labelled sample members |
| C | Service API and relay | `app/api/ba-moi/**`, `lib/service/**`, `lib/discourse/**` and their tests | A, B | Every endpoint has handler tests using fakes; tests for auth rejection, webhook signature, loop prevention, idempotency, holding contact details, rate limits, and each state transition |
| D | Discourse platform | Runbook `docs/discourse-setup.md` and theme settings. The ASUS install, Funnel, Google login, locale, categories, user fields, automation, plugins and components, theme | The ASUS free, Minh's Google OAuth client | The site loads over Funnel; invite plus Google login works; portfolio tab and tiles show; events work |
| E | Persona and tools | `discourse/persona/*.md` (prompt) and `discourse/tools/*.js` (tool sources, kept in the repo and pasted into Discourse admin); bot users, webhook and API keys | C deployed, D, the OpenRouter key | Two test members complete the full loop in the spec's "Done means" |
| F | Assembly | Security pass, a Vercel preview (local prebuilt after the native-runtime audit), one cross-family code review by Muse Spark through ACO, production promotion with Minh's approval | all | The review's blocking findings are fixed; Minh approves production |

Order: A, then B, then C now, all testable with fakes. D starts when the ASUS
is free (expected in 1–2 days). E follows D and the key. Then F.

## Failure semantics

- **A tool call fails:** the service returns `{ ok: false, error, message_vi }`,
  and the persona prompt tells Bà Mối to apologise and retry once.
- **Everything is idempotent:** daily claims, interests, matches, relay topics
  and relay messages all use unique constraints and upserts, so a retried
  tool call or webhook causes no duplicates.
- **The webhook is retried:** Discourse retries failed deliveries, and relay
  message idempotency on the source post ID absorbs the retries.
- **A Discourse API call fails** (for example, posting a notification): the row
  stays committed, and a `pending_posts` retry is written. v1 retries on the
  next call to the same member; Minh can run a cron route later if needed.
- **Expiry needs no cron:** signals expire when read.

## Security

- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY`, `BA_MOI_TOOL_SECRET`,
  `DISCOURSE_WEBHOOK_SECRET` and `DISCOURSE_API_KEY` live only in Vercel env and
  `.env.local`.
- **Admins see the tool secret:** it sits in Discourse's admin screens, and
  Minh and Thảo are the only admins. It can be rotated.
- **Identity:** the service trusts `discourse_user_id` only alongside the
  secret. Relay topics are looked up by topic ID and post author, never taken
  from the request body.
- **PII:** nothing the service returns contains another member's username,
  exact city, birth date or time, or chart.
- **Database:** RLS is on with no policies, so only the service role can read
  or write.

## Migration and rollback

- **Database:** migrations only add; a destructive change needs its own
  migration and Minh's approval. The free Supabase plan has limited backups, so
  before each schema change we take a `pg_dump` to the local disk.
- **Service:** Vercel instant rollback to the previous deployment. Discourse
  keeps working if the service is down, and Bà Mối says she's unavailable.
- **Discourse:** built-in daily backups, with the backup file copied off the
  ASUS weekly.

## Observability

- **Service:** structured JSON logs in Vercel, one line per tool call, recording
  the endpoint, the member's internal ID, the outcome and latency. No PII.
- **Discourse:** its own logs at `/logs`, plus the Discourse AI usage page for
  LLM spend.

## Testing

- **Unit tests:** A and C with Vitest.
- **Integration:** a script runs the full loop against the Supabase project,
  with a fake Discourse client.
- **End to end:** runs on the real Discourse with three test accounts.
- **No CI:** the org has no minutes. `npm test`, `npm run typecheck`,
  `npm run lint` and `npm run build` run locally before each commit.

## Operational burden

- **Discourse on the ASUS:** Docker upgrades through `./launcher rebuild app`
  about monthly.
- **Vercel and Supabase:** managed. The free Supabase project pauses after 7
  days of inactivity; test traffic keeps it awake, and it wakes on demand.

## External dependencies (Minh)

1. Atum off the ASUS, and sudo or Docker access for the `minhnkn` account.
2. A Google OAuth client for Discourse, with redirect URI
   `https://ubuntu-asus.tail349cbf.ts.net/auth/google_oauth2/callback`.
3. An OpenRouter key, for a model that supports tool calls.
4. Approval for Vercel production promotion.

## Execution and review

- **Engineering:** Claude does it directly in this session, as Minh asked. The
  router's decision was `direct` (`b72236fc`).
- **Plan review:** this plan gets a cross-family review by Muse Spark 1.3 via
  OpenCode in ACO before execution.
- **Code review:** one at assembly.
