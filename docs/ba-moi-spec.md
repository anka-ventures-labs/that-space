# Bà Mối spec

Status: draft v2, 2026-09-27. This version replaces the v1 draft, which had
named introductions and contact exchange. Matchmaking in Thật Space is
anonymous by design and follows the flow and rules of Moon's Nhân Duyên
(`moon-ai-vn/moon2-app`, `lib/nhan-duyen`). Minh built Moon entirely, so Bà
Mối reuses Moon's code as well as its design, ported selectively (see
Architecture).

## The product in one paragraph

Every member has her own AI matchmaker, Bà Mối. She talks with Bà Mối, who
learns about her and puts an anonymous card, with nothing that identifies her,
into a shared pool. She can tap the daily Duyên box to have Bà Mối bring back
someone highly compatible, or ask Bà Mối directly: "find me someone who…". Bà
Mối describes that person without revealing who they are. If she sends an
interest signal, the other person's own Bà Mối tells them about her and how the
two might fit. If both say yes, an anonymous chat opens. Nobody's identity is
revealed unless both choose to reveal it.

## Architecture

- **The community runs on Discourse, self-hosted.** It handles membership
  (invite-only, with approval), categories, chat, events for retreats and
  workshops, moderation, the Vietnamese interface, and mobile. Thảo's
  15-question set (`Bo_cau_hoi_That_Space`) becomes the signup fields. Discourse
  hands sign-in to Bà Mối through DiscourseConnect.
- **Bà Mối is a separate service, this repository, and the sign-in for all of
  Thật Space.** It reuses Moon's sign-in: Google through Supabase Auth now,
  email codes later.
  - Discourse creates a member's account, already active, the first time she
    signs in through Bà Mối. Nobody activates accounts by hand.
  - Invite-only is enforced here. Thảo's invite link carries a code, and Bà Mối
    refuses new accounts without one.
  - Members reach Bà Mối from a link in the Discourse header.
  - It has its own Postgres database (Supabase), with pgvector for trait
    search.
- **Bà Mối is built by porting Moon's matchmaking stack.** Three parts come
  over:
  - `lib/nhan-duyen`: the pool, the box, signals, anonymous chat,
    notifications and privacy guards
  - the astrology engine: iztro charts and the compatibility engine
  - the chat harness: Vercel AI SDK plus the model registry, for the matchmaker
    persona

  The rest of Moon stays out: payments, tarot, Zalo and Telegram, affiliates.
  Thảo's January proposal promised her the full source code, and a whole-app
  fork would hand her Moon. This repository moves to Moon's stack (Next.js 15,
  Supabase, Vercel AI SDK).
- **Claude, not Gemini.** Moon's narratives run on Gemini. Bà Mối points the
  model registry at Claude, because Thảo specifically did not want Google
  holding her members' data.
- **Anonymous chat runs on Discourse private messages, through a relay.**
  Each member messages only the Bà Mối bot, in a private message per match.
  Discourse's `post_created` webhook, which also fires for private messages,
  sends each post to Bà Mối. Bà Mối re-posts it into the other member's thread
  as the bot, under the sender's alias ("Chị L."), holding contact details until
  a reveal. Members get Discourse's notifications, mobile experience and
  unread tracking for free, and we build no chat UI.
  - Discourse chat has no webhooks, so the relay uses private messages.
  - Discourse admins can read the relayed threads. That is acceptable for the
    beta with Thảo's friends. Moon's own anonymous chat can replace the relay
    later if that promise returns.
  - After a mutual reveal, the two are simply members and can message each
    other directly.
  - Bà Mối's bot also sends the notifications, which replace Moon's Zalo and
    Telegram delivery.
- **Why the matchmaker doesn't live inside Discourse:**
  - Discourse admins can read every private message, so conversations with Bà
    Mối held in forum messages would be visible to Thảo.
  - Forum identities (usernames, avatars, post history) must never reach the
    pool.
  - No forum plugin implements an anonymous pool with interest signals.
- **No open-source matchmaking project fits this model.**
  - Compass (AGPL-3.0, a fork of Manifold Love) is a public, searchable
    directory.
  - Duolicious (AGPL-3.0) matches on a quiz and shows public profiles.
  - pH7 Dating CMS (MIT, PHP) is a classic dating site.

  The AGPL licenses would also force Thảo to publish her modified source. Moon's
  Nhân Duyên is the foundation instead.

## Hosting (demo: as cheap as possible)

- **Bà Mối:** Vercel, on the existing team, at `that-space-demo.vercel.app`. Its
  database is a free Supabase project in Singapore.
- **Discourse:** a `t3.small` on AWS EC2 in Singapore (2 GB of RAM plus swap,
  Discourse's documented minimum), costing about $22 a month with its disk. That
  is paid from account `486408348462`'s free-plan credit ($159.64 left, valid
  until 2027-03-25), which also funds `atum-staging` (a `t4g.small`, about $15 a
  month). Together they run about four months on the credit. The account must
  move to a paid plan before the credit or the plan runs out, or AWS closes it.
- **Discourse's address:** Tailscale Funnel on that instance, at
  `https://<node>.tail349cbf.ts.net`. That means free HTTPS, no DNS and no open
  ports. A real domain can replace it later.
- **No email in the beta.** Thảo shares invite links over Zalo or Messenger,
  and friends sign in with Google through Bà Mối. Neither Discourse nor Bà Mối
  sends email. Notifications arrive in Discourse and as push notifications from
  its installable web app.
  - Google sign-in needs a Google OAuth client for Thật Space, so Google's
    consent screen doesn't say "Moon".
  - Moon's email codes go through Supabase Auth, with Resend as its mail
    server. They wait for a Thật Space sending domain.
  - Moon's Zalo and Telegram codes are tied to Moon's own Zalo account and
    Telegram bot, so they stay out.
  - Supabase's built-in email can't substitute: it sends only to project-team
    addresses, at 2 per hour.
- **Later:**
  - Discourse can move to the ASUS once Atum leaves it. It has 3.2 GB of RAM,
    only about 1.6 GB free today, and Funnel already serves Atum at the root of
    its address.
  - For data in Vietnam, production can use the AWS Hanoi Local Zone
    (`ap-southeast-1-han-1a`, not yet opted in).

## Privacy rules

1. **Private profile versus pool card.** Everything a member tells Bà Mối stays
   in her private profile. Only Bà Mối and the member can use it. The pool gets
   an anonymous card derived from it.
2. **A pool card holds no personal identifiers:**
   - an age band (18–24, then five-year bands, then 70+)
   - a region (miền Bắc, miền Trung or miền Nam), shown only if at least 5 pool
     members share it (k-anonymity)
   - a name initial, under the same rule of 5
   - gender and who she wants to meet
   - intent
   - hobbies and trait tags
   - an astrology element
   - a short summary written by Bà Mối
3. **Every text Bà Mối writes about another person passes a leak check before
   anyone sees it.** The check rejects birth dates, birth times, can-chi pairs,
   and that person's name, city and other identifying terms. The summary
   describes traits, never identifying facts: no employer, no named places, no
   unique life events. After three failed attempts, a template card is used
   instead, as in Moon.
4. **Reasoning about another person uses only their pool card, never their
   private profile.** Bà Mối may use her own member's private profile with that
   member.
5. **Only the server can read the pool, signals and chats.** Members never query
   them directly.
6. **Thảo sees totals and reports, never a member's conversation with Bà Mối.**
   With a report, she sees only the reported messages. In the beta, chats
   between members are relayed through Discourse private messages, which she
   can read as a Discourse admin. That is agreed for testing with her friends.

## Member journey

1. **Join.** She opts in and accepts a versioned consent. She must be 18 or
   older and give a birth date and gender. She can pause, hide herself from
   discovery, or delete everything at any time.
2. **Talk to Bà Mối.** A conversation of about 5 minutes, in Vietnamese, one
   question at a time, with tap-to-answer options:

   | # | Asks for | Default wording | Answers |
   |---|---|---|---|
   | 1 | Intent | Bạn đang tìm kiếm điều gì? | Kết bạn · Hẹn hò vui vẻ, không ràng buộc · Mối quan hệ lâu dài · Kết hôn |
   | 2 | Own gender | Bạn là… | Nữ · Nam · Khác |
   | 3 | Who she wants to meet | Bạn muốn gặp… | Nam · Nữ · Cả hai |
   | 4 | Birth date | Bạn sinh ngày nào? | Must be 18 or older. Gives her age band and tuổi. |
   | 5 | Region | Bạn đang sống ở đâu? | City; only the region reaches the pool |
   | 6 | Age range | Bạn muốn gặp người trong khoảng tuổi nào? | Default: own age ±5 |
   | 7 | Marital status | Tình trạng hôn nhân của bạn? | Độc thân · Đã ly hôn · Góa · Đã kết hôn |
   | 8 | Children | Bạn đã có con chưa? | Chưa có · Có, đang sống cùng · Có, không sống cùng |
   | 9 | Wants children (long-term and marriage only) | Bạn có muốn có con (thêm) không? | Có · Không · Chưa chắc |
   | 10 | Hobbies | Lúc rảnh bạn thích làm gì? | Up to 5, plus free text |
   | 11 | The open question | Bạn muốn mọi người biết điều gì nhất về bạn? | Free text; Bà Mối may ask one follow-up |

   Bà Mối then shows the member her own anonymous card, exactly as others will
   see it, and asks her to confirm or correct it.
3. **The Duyên box.** One free opening per Vietnamese calendar day, used up
   even when no one qualifies, as in Moon. Bà Mối takes candidates who pass the
   hard filters and clear the mutual threshold, and makes a weighted random
   pick: higher scores are more likely, but it isn't always the top one, so the
   copy says "a good match", never "the best". She then tells the member about
   that person. The same person is never brought twice, and closing the card
   without acting is not a decline.
4. **Ask Bà Mối.** For example: "Tìm cho mình một người thích leo núi, sống ở
   miền Nam, muốn nghiêm túc." Bà Mối turns the request into hard filters plus a
   semantic query over pool cards, ranks results by mutual score, and presents
   one person at a time. If no one fits, she offers to watch the pool and
   notify the member when someone new does. This is new: Moon's chat has no
   pool search. It shares the box's dedupe and a daily limit.
5. **Interest.** She taps "Muốn làm quen" to send an interest signal. The
   recipient's Bà Mối writes, from the recipient's point of view, an anonymous
   summary of the sender and how the two might fit, and notifies them. Moon
   builds this card from a template; here Bà Mối writes it, under the same leak
   check. The recipient accepts, declines, or dismisses. An unanswered signal
   expires after 7 days. A decline is final: that pair can never match. The
   sender is never told "declined"; the answer is simply "chưa có duyên".
6. **Match and anonymous chat.** When both say yes, a match opens a chat.
   Each person appears as a form of address relative to the viewer, plus an
   initial when the rule of 5 allows, such as "Chị L." or "Anh N.". Messages
   are limited to 1,200 characters and 12 per minute per person.
   - Either person can recall a message. It disappears for both but is kept on
     the server as evidence.
   - Either person can mute, clear her own history, end the chat, block or
     report.
   - Blocking also closes the match. Moon has only block; a normal way to end
     a chat is new here.
7. **Reveal, which is optional.** Each person can choose to reveal her Thật
   Space profile. Identities are exchanged only when both have chosen to. Moon
   defines a `revealed` state but never uses it; here it becomes a real step.

## Matching rules

**Hard filters, checked in both directions:**

- Intent. Friendship matches only friendship, and casual only casual.
  Long-term and marriage match each other.
- Gender. Each person is someone the other wants to meet. "Khác" matches only
  people who chose "Cả hai".
- Age. Each is inside the other's range, and both are 18 or older.
- Both are opted in, discoverable, not paused, and not deleted.
- Neither has blocked the other, and this pair hasn't already been shown,
  declined or matched.
- Married members get friendship only. This is our default; Thảo decides.

**Score.** Compatibility is scored in each direction, A→B and B→A, because
preferences differ. The mutual score is the lower of the two, and a pair must
clear the threshold in both directions, as in Moon. The signals are:

- how well each person's open answer fits the other's card
- shared hobbies
- tuổi hợp: can chi and ngũ hành from the lunar birth year, computed by code;
  anyone born before Tết belongs to the previous year
- plans for children (long-term and marriage only)
- region

Weights and the threshold are settings. Members see a tier label, never a
number, and Bà Mối never quotes raw scores; Moon rejects them in its texts
too.

**Changes invalidate stale results.** If a member changes her birth date,
intent, gender or who she wants to meet, her open discoveries are voided and
her scores recomputed.

## States (named as in Moon)

- **Daily opening:** `pending` → `matched` or `no_match`
- **Discovery:** `active` → `interest_sent` → `matched`, or `void`
- **Signal response:** `pending` → `accepted`, `declined`, `dismissed`, or
  `expired` after 7 days
- **Match:** `mutual_interest` → `revealed` → `closed`
- **Conversation:** `active` → `closed` or `blocked`
- **Message:** `sent`, `blocked` (stopped by moderation), or `deleted`
  (recalled)

## Notifications

- `interest_received`, `mutual_match`, `message_received`, a gentle
  `message_reminder`, and `watch_fulfilled`.
- Delivered inside Bà Mối and as private messages from Bà Mối's Discourse bot
  account. Zalo and Telegram come later.
- Each notification is sent exactly once (idempotent) and is tracked as
  delivered, clicked and read.
- Message notifications are grouped into 10-minute windows, and a muted chat
  sends none.

## Safety

- 18 or older only. Consent is versioned; a new version asks again.
- Report reasons: harassment, contact exchange, unsafe, spam, other.
- Block ends the chat for both.
- Limits per day on box openings, searches and interest signals.
- Moon has no automated message moderation. Here, before a reveal, a message
  containing a phone number, email address or social handle is held, and the
  sender is asked to confirm. The recipient can still report it.
- Thật Space membership, approved by Thảo, provides the accountability that
  Moon gets by requiring a verified Zalo or Telegram account before chatting.
- Thảo gets a queue for reviewing reports, which Moon lacks.

## Thảo's view

- Pool size by intent, gender and region, hidden whenever a group has fewer
  than 5 people.
- Signals sent, match rate, and active chats.
- The reports queue.
- Settings: Bà Mối's voice preset, score weights and threshold.
- No access to conversations with Bà Mối. During the beta, chats between
  members run through Discourse private messages, which she can read as a
  Discourse admin.

## Not in v2

- Photos
- Full Tử Vi chart readings
- Payments (Moon's paid boxes are left out)
- Zalo and Telegram delivery
- Hosting in Vietnam, which the design must allow

## Done means

1. A friend with an invite link signs in with Google and lands in Discourse
   with an active account. Without an invite code, sign-in is refused.
2. A new member finishes the conversation in under 5 minutes on a phone.
3. Tests prove no discovery or search result ever breaks a hard filter.
4. Tests prove pool cards and Bà Mối's texts about other people pass the leak
   check, and that the rule of 5 holds.
5. Tuổi matches a trusted reference, including birthdays around Tết.
6. The full loop works between two test members: box or search, interest,
   the recipient's summary, acceptance, and anonymous chat relayed through
   Discourse.
7. Thảo's view in Bà Mối shows totals and reports, not conversations with Bà
   Mối.

## Open questions

For us:

- For after the demo, which domain: a subdomain of `anka.vc`, or Thảo's own?
- Thảo's contract promises her the source code. Are the Moon-derived modules
  transferred to her, or licensed?

For Thảo, once she has played with it:

- Where do the men in the pool come from? Are they invited as members, in a
  group that can't see the women-only categories?
- Should married members be limited to friendship?
- Is casual dating right for the Thật Space brand?
- Which voice: bà and con, or chị and em?
- Should Discourse membership be paid?
