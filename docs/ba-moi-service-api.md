# Bà Mối service API (as built in W-C)

The contract the Discourse AI persona's tools call. The persona writes every
sentence the member reads in conversation. The service returns facts, plus
`message_vi` fallbacks with errors. Source: `lib/service/`.

## Calling convention

The public launch sets `BA_MOI_ENABLED=true`. While the emergency switch is
false, tool, webhook and retry routes return 503 before loading database or bot
credentials.

`POST /api/ba-moi/v1/<tool>`, with header `Authorization: Bearer $BA_MOI_TOOL_SECRET`.

```json
{
  "auth": { "user_id": 101, "username": "lan", "name": "Lan", "topic_id": 4001, "private_message": true, "participants": "lan,ba_moi" },
  "args": { }
}
```

**The `auth` object:**
- The tool script builds `auth` only from Discourse AI's tool `context`, never
  from the model's arguments.
- The member is resolved from `auth.user_id` alone.
- Unknown keys in `args`, such as a model-invented `user_id`, are stripped.
- `topic_id` is remembered as her thread with Bà Mối only when
  `private_message` is true and the two participants are exactly her username
  and the configured Bà Mối bot. With `BA_MOI_NOTICE_TRANSPORT=pm` (default),
  notifications go to that thread; if she has none, Bà Mối opens a new private
  message titled "Bà Mối có tin cho bạn". With `BA_MOI_NOTICE_TRANSPORT=chat`,
  every notification goes to her direct chat with Bà Mối, opened (or reused)
  through Discourse's direct-message upsert as the persona bot. If Discourse
  refuses that chat (4xx other than 429), the notice goes to her private thread
  instead; outages stay queued for retry. Discourse does not refuse a member
  who turned chat off in her preferences, so her notices then sit in a chat she
  has hidden.
- Confirmations bind to the conversation and triggering message: `topic_id`
  and `post_id` in a private message, or `channel_id` and `message_id` in
  chat. Chat channels are stored negated, so a chat never shares a key with a
  topic. A token is consumable only from a later member message in the same
  conversation.

**Status codes:**
- 503: the service launch switch is off (`error: "service_disabled"`).
- 401: a missing or wrong secret.
- 404: an unknown tool.
- 400: a malformed body or envelope.
- 500: an internal failure (`error: "internal"`).
- 200: every tool outcome, including `ok: false`. `invalid_args` carries
  `issues: [{ path, message }]` so the model can correct its call.

Every failure has the shape `{ ok: false, error, message_vi }`.

## Tools

| Tool | Args | Success |
|---|---|---|
| `status` | none | `opted_in`, `consent` (`{ version, text }` until she agrees to this version; show it word for word), `paused`, `missing` (interview fields still needed), `married_friendship_only`, `card` (`none`, `needs_confirmation` or `confirmed`), `box_available`, `next_box_at`, `search_results_left`, `interests_left`, `pending_signals`, `open_matches` |
| `consent` | `action`: `opt_in` (needs `adult_confirmed: true`), `pause`, `resume`, or `delete`; delete requires the service-issued `confirmation_token` from the preceding challenge | `opted_in`, `paused` or `deleted` |
| `profile_update` | Any of: `intent`, `gender`, `seeking`, `birth_date` (YYYY-MM-DD), `birth_time` (HH:MM, or `null` for "không nhớ"), `city`, `age_min`, `age_max`, `marital`, `children`, `wants_children`, `hobbies` (1–8), `open_answer`, `occupation` | `missing`, `card_needs_confirmation`, `age_range` (defaults to her age ±5 once the birth date is known) |
| `card_preview` | none | `card`, `template_summary`, `current_summary`, `confirmed`, `summary_max_length` |
| `card_confirm` | `summary_text` (10–400 characters, written by the persona) | `card`, `in_pool` |
| `box_open` | none | `result`: `match` (with `introduction`), `no_match` or `cooldown`, plus `next_box_at` |
| `search` | Any of: `keywords` (up to 5 phrases, matched against card hobbies and summary), `region`, `age_min`, `age_max`, `element` | `results` (up to 3 introductions, best first) and `search_results_left` |
| `interest` | `discovery_id` | `result`: `sent`, `already_sent`, `matched`, `already_matched` or `sample` |
| `signals` | none | `signals: [{ signal_id, card, fit, expires_at }]`: the sender's card and the fit from her side |
| `signal_respond` | `signal_id`, `response` (`accept`, `decline` or `dismiss`) | `result`: `matched`, `declined` or `dismissed` |
| `matches` | none | `matches: [{ match_id, alias, state, i_asked_to_reveal, they_asked_to_reveal, chat_url }]` |
| `match_action` | `match_id`, `action` (`end`, `block` or `reveal`) and, after a challenge, its service-issued `confirmation_token` | `result`: `ended`, `blocked`, `waiting_for_other` or `revealed` |

**An introduction** is `{ discovery_id, card, fit, is_sample }`.
- **`card`** is the other person's anonymous card:
  - `ageBand`, `gender`, `seeking`, `intent`, `hobbies`
  - `element` (nạp âm)
  - `dayMaster`
  - `summary`
  - `region` and `initial`, only under the rule of 5
  - `isSample`
- **`fit`** is `{ tier, tier_label, shared_hobbies, astrology, same_region }`:
  - `astrology` holds relationship labels only.
  - `same_region` is null when the card hides the region.
  - Nothing else about the other person reaches the persona.
  - The persona says "a good match" (`tier_label`), never a number, and never
    "the best".
- **When `is_sample` is true,** the persona must say it's a sample profile.
  Interest in a sample returns `sample` and notifies no one.

**Error codes:**
- `consent_required`, `adult_required`, `paused`
- `profile_incomplete` (with `missing`), `card_unconfirmed`
- `under_18`, `invalid_birth_date`, `age_range_invalid`
- `summary_leaks` (with `violations`, for example `dob`, `forbidden_term:<her
  term>` or `contact:phone`)
- `not_found`, `stale` (the person changed their profile after being shown),
  `gone`
- `daily_limit`, `expired`, `already_answered`, `closed`, `confirm_required`
- `invalid_args`, `internal`

## Rules the service enforces

- **Current consent:** profile/card work, discovery, interests and signal
  responses require the current consent version. Real candidates with obsolete
  consent are excluded from discovery and anonymity counts. Labelled samples
  remain available without human consent.
- **Current anonymity counts:** stored cards and new chat aliases lose region
  or initial when its discoverable bucket falls below five. Read-time redaction
  never adds a previously hidden field. A hidden region also clears `same_region`.
- **Daily limits** reset at midnight in Vietnam (UTC+7):
  - one box
  - 6 search results
  - 5 new interests
  - A no-match still uses the box.
  - Search and interest count/write decisions are serialized per member so
    simultaneous calls cannot overspend the daily allowance.
- **Relay limit:** policy, the per-sender one-minute count and receipt storage
  share that same transaction lock. Simultaneous webhooks stay within 12 messages
  per minute; excess posts receive a notice in the sender's thread.
- **Consequential confirmation:** delete, reveal, block and end first return
  `confirm_required` with a random HMAC-signed token. The token expires after ten
  minutes and is bound to the member, current Discourse topic, triggering post,
  action and target. Its nonce is stored without message text or raw token. The
  service accepts it once, and only from a later member post in that same topic;
  the persona therefore asks again and resends it only after the member's next
  clear confirmation.
- **Rolling contact detection:** before reveal, the relay keeps at most 256
  characters of already-relayed text per sender and match. It evaluates both
  message boundaries and direct concatenation so a phone, email or social handle
  split across posts is held. Both sides' temporary windows are removed
  immediately after mutual reveal, end or block, and also cascade on member or
  match deletion.
- **What searches can match:** only what cards show, so a search can't reveal
  what a card hides. Her keywords count as her interests while that search is
  scored.
- **Answers to a signal:**
  - A decline is final.
  - The sender hears only "chưa có duyên", for a decline or a dismiss.
  - Two yeses, crossing or answered, open the match once.
- **Changing a hard-filter answer** voids open discoveries both ways. That
  covers birth date or time, intent, gender, who she's seeking, marital status
  and age range. Except for the age range, it also un-confirms her card until
  she confirms it again.
Already sent signals and existing matches remain available after profile
edits; pausing removes discovery visibility and keeps existing conversations.

## Notices the service posts

The wording lives in `lib/service/copy.ts`.

- **Bà Mối, in her thread:**
  - a signal received
  - "chưa có duyên"
  - a match opened
- **Thư Duyên, in the relay threads:**
  - the intro and rules
  - relayed messages, as `**<alias>:**` then the text
  - held-message notices: contact details, attachment, too long, too fast
  - "wants to reveal"
  - revealed, with the other's profile link
  - ended, and the block confirmation

  The other side is only told the chat ended, never that they were blocked.

## Webhook and cron

- **`POST /api/ba-moi/v1/webhooks/discourse`:** the relay. It has one
  subscription, the `post` event. The policy is in the build plan.
- **`GET` or `POST /api/ba-moi/v1/cron/retry-posts`:** needs
  `Authorization: Bearer $CRON_SECRET`. Supabase pg_cron calls it every 5
  minutes through pg_net. It retries queued Discourse posts, and a post is dead
  after 10 attempts. The job is set up in W-F, once the service URL exists.

## Durable delivery

Interest/response, match actions, deletion notices and relay receipts commit
together with their keyed outbound intent. Discourse calls happen after that
transaction. Failure to store intent rolls back the action and returns 500;
Discourse outages preserve the successful action and leave delivery queued.
Retry leases prevent simultaneous sends for the same key and use exponential
backoff (one minute to one hour), with a ten-attempt cap even if a worker crashes.

Queued chat, reveal and match-opening messages are discarded when the match is
closed; generic closing notices can still arrive. Deletion purges queued private
payloads associated with the member or their matches, and successful deliveries
clear the payload while retaining the key. Already stored Discourse posts remain,
as disclosed by the consent text.

Discourse offers no remote idempotency guarantee here. A crash after Discourse
accepts a post but before its delivery receipt is recorded can duplicate that
post. This remaining uncertainty must be exercised during live acceptance; the
service does not promise exactly-once delivery across that boundary.
