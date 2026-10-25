# Bà Mối build plan (Discourse-native)

**2026-10-01 checkpoint:** finish and verify locally before provisioning a host.
The original ASUS deployment choice below is historical and unexecuted; AWS can
be chosen during live integration. Current scope and acceptance evidence:
[local beta readiness](../local-beta-readiness.md).
This is the Bà Mối workstream only. See the
[whole-app execution plan](2026-10-01-whole-app.md) for community work that
remains beyond the locally verified service. Full Tử Vi/chart/reading/PDF
features remain out of scope for this phase.

Branch: `feat/ba-moi`. Spec: [docs/ba-moi-spec.md](../ba-moi-spec.md), v3.
Revised 2026-09-27 after the cross-family plan review (see Review outcome at
the end). W1, the foundation, is done: Next.js 15.5.26 and Vitest, commit
`b779f4f`.

## Goal

Thảo's friends can join the private Thật Space Discourse, message Bà Mối,
confirm an anonymous card, open the Duyên box or ask for someone, send and
answer interest signals, and chat anonymously through the relay, all on a
phone.

## System

```
Member (browser or installable app)
  └─ Discourse on the ASUS (Docker; Tailscale Funnel at https://ubuntu-asus.tail349cbf.ts.net)
       ├─ email and password login, invites, forum, profiles and portfolio, events
       ├─ Discourse AI persona "Bà Mối" (LLM through OpenRouter)
       │    └─ custom JS tools ──HTTPS + tool secret──▶ Bà Mối service
       └─ webhook post_created ──HTTPS + HMAC──▶ Bà Mối service /webhooks/discourse
Bà Mối service (this repo, Next.js 15 route handlers on Vercel, region sin1)
  ├─ lib/matching/*  pure TypeScript, ported from Moon
  ├─ lib/db/*        Supabase Postgres via postgres.js on the transaction pooler (DATABASE_URL)
  └─ lib/discourse/* API client, posting as the "Bà Mối" persona user or the "Thư Duyên" relay bot
Supabase pg_cron + pg_net ──every 5 min──▶ /cron/retry-posts (also keeps the free project awake)
```

## Service API (tool contract)

As built, with every argument, result and error code:
[`docs/ba-moi-service-api.md`](../ba-moi-service-api.md).

Every endpoint is `POST /api/ba-moi/v1/<name>`. Request bodies are validated
with `zod`.

- **Auth:** header `Authorization: Bearer $BA_MOI_TOOL_SECRET`. The body is
  `{ auth: { user_id, username, topic_id }, args: {...} }`. The tool script
  builds `auth` only from Discourse AI's `context`, never from the model's
  arguments. The service trusts only `auth` plus the secret, and ignores any
  identity found in `args`.
- **Responses:** `{ ok: true, ... }` or `{ ok: false, error, message_vi }`.
- **Latency budget:**
  - p95 under 1,200 ms when warm.
  - Functions are pinned to Singapore, next to Supabase `ap-southeast-1`.
  - The persona writes all the prose, so the service never calls an LLM.
  - The tool script turns failures and timeouts into a friendly Vietnamese
    message and doesn't retry blindly.
  - HTTP wait does not count against Discourse's 2-second script budget:
    requests run as attached functions. This was answered from source
    (`lib/agents/tool_runner.rb`), so no probe is needed.
- **Idempotency is semantic, enforced by unique constraints and
  `INSERT … ON CONFLICT`:**
  - one opening per member per Vietnamese day
  - one interest per ordered pair
  - one match per unordered pair
  - one relay topic per match and member
  - one relay message per source post

  So if the model calls a tool twice, nothing is duplicated.
- **Database first, Discourse second:** domain changes and keyed notification
  intent commit together before Discourse calls. A failed remote send stays in
  `pending_posts`; a failure to persist intent rolls back the action. Leases
  prevent concurrent sends. A crash between remote acceptance and recording
  success can still duplicate a post; see the API's durable-delivery contract.

| Endpoint | Does |
|---|---|
| `status` | Opt-in state, missing profile fields, card status, remaining daily limits |
| `consent` | `opt_in` (records the consent version and age check), `pause`, `resume`, `delete` (deletes the member's Supabase rows; Discourse direct messages are kept, which the consent text discloses) |
| `profile_update` | Validates and stores spec fields privately; recomputes derived fields (age band, region, lunar can chi, nạp âm) |
| `card_preview` | Returns the deterministic anonymous card plus a template summary |
| `card_confirm` | Runs the leak check on `summary_text` (returning violations when it fails), then stores the card and makes her discoverable |
| `box_open` | Claims the day's turn atomically, then filters, scores and makes the weighted pick. Returns `{ discovery_id, card, fit }`, `no_match` or `cooldown` |
| `search` | Takes structured criteria and returns up to 3 `{ discovery_id, card, fit }`, recorded as discoveries. Daily limit |
| `interest` | Takes `discovery_id`. Creates the interest (its status is the recipient's pending answer), then posts the recipient's view into the recipient's Bà Mối thread |
| `signals` | Lists pending inbound signals, expiring overdue ones as it reads |
| `signal_respond` | `accept`, `decline` or `dismiss`. Rejects signals that have expired. On mutual interest it creates the match, then both relay topics |
| `matches` | Lists matches, with alias, state and relay topic URL |
| `match_action` | `end`, `block` or `reveal` |

## Webhook and relay policy

`POST /api/ba-moi/v1/webhooks/discourse`:

1. Read the raw body before any parsing. Verify
   `X-Discourse-Event-Signature == "sha256=" + hex(HMAC-SHA256(raw, DISCOURSE_WEBHOOK_SECRET))`
   with `crypto.timingSafeEqual`, returning 401 if it doesn't match. Then
   require `X-Discourse-Event-Type: post` and `X-Discourse-Event: post_created`.
   Everything else, including `post_edited` and `post_destroyed`, gets a 200
   and is ignored.
2. Look up the topic ID in `relay_topics`. If it isn't a relay topic, ignore it.
3. If the author is one of the bot users, ignore it (compared by user ID, not
   name).
4. The sender is the member who owns that relay topic, found by topic ID and
   checked against the author's user ID. Nothing in the body is trusted.
5. Each relay topic is a private message whose only participants are the
   member and the relay bot. The other member is never invited.
6. Before a reveal:
   - A post is held (not relayed), and the bot explains and points to the
     reveal step, if it contains any of:
     - an upload, image, video or audio
     - a URL or link
     - a phone number (`libphonenumber-js` `findPhoneNumbersInText`, VN
       default, plus Vietnamese spelled-out digits)
     - an email (`linkify-it`)
     - a handle keyword (zalo, tele, facebook, fb, instagram, tiktok, viber,
       sđt, liên hệ)
   - `@mentions` and quote blocks are stripped.
   - Splitting a number across several messages can bypass this. That is an
     accepted limit, mitigated by the warning and the reveal prompt.
7. After both members reveal, those holds are lifted, but mentions and quotes
   are still stripped and the relay stays text-only.
8. Rate limits: 12 messages a minute and 1,200 characters per message.
9. Edits and deletes aren't synced. This is disclosed in the relay thread's
   first post.
10. Each relayed message gets a per-match `seq` for ordering. Replays are
    absorbed by the uniqueness of `source_post_id`.

## Data model (Supabase; the public Data API roles get nothing)

The service connects as the database owner through Supabase's transaction
pooler (`DATABASE_URL`, port 6543; postgres.js with prepared statements off,
one connection per function instance), which bypasses RLS. The public Data API
gets nothing: RLS is on for every table with no policies, and migration
`20260927170000_revoke_client_roles.sql` revokes every table and sequence
privilege from `anon` and `authenticated`, including Supabase's default grants
for future tables. Checked live: the REST API with the publishable key returns
"permission denied". Constraints:

- `members`: `discourse_user_id` is unique, `status` is checked, and
  `is_sample` flags sample members.
- `member_profiles` and `pool_cards`: primary key and foreign key to
  `member_id`, with `ON DELETE CASCADE`.
- `daily_openings`: primary key `(member_id, open_day)`, where
  `open_day = (now() at time zone 'Asia/Ho_Chi_Minh')::date`, and status is
  checked.
- `discoveries`: unique `(viewer_id, candidate_id)`, `viewer ≠ candidate`, and
  status is checked.
- `interests`: unique `(from_id, to_id)`, and status is checked (`pending`,
  `accepted`, `declined`, `dismissed`, `expired`).
  - A decline is final: the hard filters exclude any pair with a declined
    interest in either direction.
  - Expiry (7 days) is applied when read and enforced again in
    `signal_respond`.
- `matches`: `member_a < member_b` (canonical order), unique `(member_a, member_b)`,
  and state is checked.
- `relay_topics`: primary key `(match_id, member_id)`, with
  `discourse_topic_id` unique.
- `relay_messages`: `source_post_id` unique, plus `seq`.
- `blocks`: unique `(blocker_id, blocked_id)`.
- `pending_posts`: `idempotency_key` unique, with `attempts`, `next_at` and a
  `status` of pending, sent or dead (dead after 10 attempts).
- **Invalidation.** A `profile_update` that changes a hard-filter input (birth
  date or time, intent, gender, who she wants to meet, marital status, or her
  age range) voids `active` discoveries where she is the viewer or the
  candidate. Changing any of these except the age range also takes her card out
  of the pool until she re-confirms it, because its summary may be stale.
  Signals and matches that already exist are not voided retroactively.
- **Signals live in `interests`.** An interest is the sender's yes; its status
  is the recipient's answer. There is no separate signal-response table.
- **Pair lock.** `interest` and `signal_respond` take a transaction-scoped
  advisory lock on the unordered pair, so two crossing yeses always produce
  exactly one match. A yes that meets a live yes the other way matches at once.
- **Retry lease.** Claiming a pending post counts the attempt and sets the next
  try (1, 2, 4 … minutes, capped at an hour) in one statement with
  `FOR UPDATE SKIP LOCKED`, so a worker that dies mid-send neither double-sends
  nor retries forever.
- **Sample members** (`lib/db/samples.ts`, `npm run seed:samples`): 30
  labelled profiles (women, men and "Khác", every intent) with confirmed cards,
  so the first box isn't empty. Reseeding replaces them.
- **Weights, threshold and daily limits** are constants in code for the beta,
  and scores are logged server-side for tuning later.

## Parallel MECE workstreams

| # | Workstream | Scope (disjoint files) | Depends on | Acceptance checks |
|---|---|---|---|---|
| A | Matching core | `lib/matching/**`, `tests/unit/matching/**`. Ports Moon's privacy, matching and daily modules, the Vietnamese lunar calendar and can-chi tables. Adds a nạp âm reference table, the hard filters, directional scores and tiers | none | Filter tests in both directions over every combination of intent, gender and marital status; the leak check and the rule of 5; tuổi for 1985-02-01 (Ất Sửu, since Vietnamese Tết was 1985-01-21), 1990-01-26 (Kỷ Tỵ) and 1990-01-27 (Canh Ngọ); nạp âm for 1984, 1990 and 1996; weighted pick with a seeded random source; contact-detail detection table |
| B | Data layer | `supabase/migrations/**`, `lib/db/**`, `scripts/seed-*.ts` | A (types) | Migrations apply to the Supabase project; concurrency tests show parallel `box_open` or `interest` creates one row; a test around Vietnamese midnight; an expired signal can't be accepted; an intent change voids both directions; the seed creates 30 labelled sample members |
| C | Service API and relay | `app/api/ba-moi/**`, `lib/service/**`, `lib/discourse/**`, `tests/fixtures/discourse/**` | A, B | Handler tests use payload fixtures (tool context, a `post_created` in a private message) built from Discourse's documented formats, replaced by captured ones in W-D. Tests cover: auth matrix (forged `args` identity ignored, missing or old secret rejected); webhook signature (the prefix, wrong secret, raw body); ignored events; bot loops; relay isolation; holds; ordering; retry of pending posts and dead-lettering; every state transition |
| D | Discourse platform | `docs/discourse-setup.md` (runbook), `scripts/probe-discourse.ts` | The ASUS free | The probe script passes (Funnel reachable from Vercel, bot API key scoped); an invite plus local signup and admin activation works; test accounts are created active through the admin API; portfolio tab and tiles; events; chat webhook support is checked on the installed version |
| E | Persona and tools | `discourse/persona/*.md`, `discourse/tools/*.js` (the repo copy is canonical; a checksum is checked after pasting), bot users, webhook, API keys, secret-rotation runbook | C deployed, D, the OpenRouter key | The tool-latency probe; golden Vietnamese requests map to the right filters; two test members complete the spec's "Done means" loop; the secret is rotated once end to end |
| F | Assembly | Security pass; a Vercel preview (local `vercel build`, native-runtime audit of `.vercel/output` for platform-specific `.node` binaries, `vercel deploy --prebuilt`); one cross-family code review by Muse Spark 1.3 through ACO; production promotion with Minh's approval | all | The review's blocking findings are fixed; Minh approves |

Order: A, then B, then C now. D when the ASUS is free (1–2 days). E needs D
and the OpenRouter key. Then F. The full Tử Vi and Bát Tự romantic score for an
optional birth time (A2) is future Moon reuse, outside the current phase as
reaffirmed on 2026-10-01: the birth time is collected and stored now, and used
later. A2 does not gate current community/Bà Mối completion.

## Failure semantics

- **Tool errors:** the service returns `{ ok: false, error, message_vi }`, and
  the persona apologises and offers to try again. No blind retries.
- **Discourse posts:** go through `pending_posts`, retried by pg_cron every 5
  minutes with exponential backoff. A post is dead after 10 attempts and is
  logged for Minh.
- **Webhook replays:** absorbed by `relay_messages.source_post_id`.
- **The service down:** Discourse keeps working, and Bà Mối says she's
  unavailable.

## Security

- **Secrets:** `DATABASE_URL` (holds the database password), `BA_MOI_TOOL_SECRET`,
  `DISCOURSE_WEBHOOK_SECRET`, `DISCOURSE_API_KEY` (scoped to the bot users) and
  `CRON_SECRET` live in Vercel env and `.env.local` only.
- **As built:**
  - The tool secret lives in Discourse's AI secret store and is bound to each
    tool by alias. The scripts read it with `secrets.get`, so it isn't in
    their text.
  - The service posts with one single-user API key per bot
    (`DISCOURSE_PERSONA_API_KEY`, `DISCOURSE_RELAY_API_KEY`). A leaked key
    can't impersonate members.
  - The all-users admin key is used only by `npm run discourse:install`, from
    a trusted machine.
- **The tool secret is visible in the Discourse admin** (superseded by the
  secret store above). For the beta, Minh
  decides who holds admin; the default is Minh as admin and Thảo as moderator
  until she needs admin. The rotation runbook is in W-E: set the new secret in
  Vercel, update the tool, confirm the old one is rejected.
- **No PII in logs:** logs carry a request ID, endpoint, internal member ID,
  outcome and latency, never other members' usernames or birth data.
- **Discourse AI logs:** its prompt logs contain cards, so admin access is kept
  minimal.

## Migration, rollback and backups

- **Migrations:** additive only. A destructive change needs its own migration
  and Minh's approval.
- **Before each schema change:** a local `pg_dump`. There's no off-host copy
  in the beta; that's an accepted risk while the data is sample and test data,
  and it's revisited before real members join.
- **Service:** Vercel instant rollback.
- **Discourse:** built-in daily backups, copied off the ASUS weekly.

## Observability

- **Service:** structured logs, one line per call, with request ID and latency
  measured against the tool budget.
- **Webhooks and cron:** a delivery log for webhooks, and a summary of cron
  retries.
- **Discourse:** `/logs`, plus the Discourse AI usage page for LLM spend.

## Testing

- **Unit:** Vitest for A and C (C with the fixtures). B runs against PGlite,
  an in-memory Postgres with the real migrations and Supabase's client roles
  and default grants, reached through postgres.js over `pglite-socket` with the
  production options. Tests and production therefore share one driver path;
  this caught a jsonb double-encoding bug that PGlite's own driver hid.
- **Integration:** a script runs the full loop against the Supabase project,
  with a fake Discourse client.
- **End to end:** on the real Discourse with three test accounts.
- **No CI (the org has no minutes):** `npm test`, `npm run typecheck`,
  `npm run lint` and `npm run build` run locally before each commit.

## Operational burden

- **Discourse:** `./launcher rebuild app` about monthly.
- **Supabase:** the pg_cron retry job keeps the free project active. If it
  pauses anyway, it has to be restored from the dashboard; the runbook covers
  this.
- **Owners:** Minh owns the OpenRouter billing, the Funnel hostname, Vercel
  promotions and the weekly Discourse backup copy.
- **Hardware:** the ASUS has 3.2 GiB of RAM, which is tight. AWS EC2 is the
  fallback noted in the session log.

## External dependencies (Minh)

1. Atum off the ASUS, and sudo or Docker access for the `minhnkn` account.
2. An OpenRouter key, for a model that supports tool calls. Needed at W-E.
3. Optional, at the end: a Google OAuth client for Discourse, with redirect
   URI `https://ubuntu-asus.tail349cbf.ts.net/auth/google_oauth2/callback`.
4. Approval for Vercel production promotion.

## Execution and review

- **Engineering:** Claude does it directly, as Minh asked. The router's
  decision was `direct` (`b72236fc`).
- **Plan review:** Muse Spark 1.3 through OpenCode in ACO (router decision
  `94ba596c`, job `4f6d35a0`), verdict "proceed with changes".
- **Code review:** one at assembly.

## Review outcome

| Finding | Outcome |
|---|---|
| B1 latency and idempotency | Accepted: latency budget, Singapore region, a timeout path in the tool, database first. Idempotency is semantic through unique constraints rather than a key per call, because a key per call can't dedupe two separate tool calls from the model |
| B2 identity spoofing | Accepted: the `auth` envelope comes only from the tool context |
| B3 tool secret | Accepted: rotation runbook and admin minimisation. Admin roles are Minh's decision |
| B4 webhook verification | Accepted in full, confirmed by Discourse's format (`sha256=` plus an HMAC of the raw body) |
| B5 relay envelope | Accepted in full |
| B6 contact detection | Accepted, using mature libraries (`libphonenumber-js`, `linkify-it`) plus a keyword list; the split-message limit is stated |
| B7 constraints and races | Accepted in full |
| B8 notification retries | Accepted: pg_cron and pg_net on Supabase, with a dead letter after 10 attempts |
| B9 fixtures | Accepted: documented payload shapes now, captured ones plus a probe script in W-D |
| Follow-ups | Accepted: A2 deferred until the loop works; constants instead of a settings table; the admin-read disclosure in the consent text; request IDs; pinned component versions. The rule of 5 with a small pool is noted for Thảo |
| Factual 1 (Tết 1985) | **Rejected, with evidence.** Moon's Vietnamese lunar algorithm at UTC+7 gives Tết Ất Sửu on 1985-01-21, so 1985-02-01 is Ất Sửu in Vietnam. The reviewer used China's UTC+8 date, 1985-02-20. The fixture stays |
| Factual 2 (Supabase wake) | Accepted: paused projects need a dashboard restore; the pg_cron job keeps the project active |
| Factual 4 (chat webhooks) | Accepted: checked on the installed Discourse in W-D |
| Factual 5 (component provenance) | Accepted. User Portfolio lives in the `discourse` GitHub org; Topic List Previews is by Pavilion (community); Follow, Calendar and Automation are official. Versions are pinned |
| Factual 7 (RLS wording) | Accepted and reworded |
| Factual 9 (native-runtime audit) | Kept, because it is Minh's standing deploy policy, and now defined concretely |
