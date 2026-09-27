# Bà Mối spec

Status: draft v3, 2026-09-27. v3 makes the design Discourse-native, replacing
the v2 plan for a separate Bà Mối web app. Matchmaking is anonymous by design
and follows the flow and rules of Moon's Nhân Duyên (`moon-ai-vn/moon2-app`,
`lib/nhan-duyen`). Minh built Moon entirely, so we reuse its code as well as
its design.

## The product in one paragraph

Thật Space is a private community for Vietnamese women, running on Discourse.
Each member has her own AI matchmaker, Bà Mối, whom she messages directly
inside the forum. Bà Mối learns about her and puts an anonymous card, with
nothing that identifies her, into a shared pool. She can ask Bà Mối to open the
daily Duyên box and bring back someone highly compatible, or ask "find me
someone who…". Bà Mối describes that person without revealing who they are. If
she sends an interest signal, the other person's Bà Mối tells them about her
and how the two might fit. If both say yes, an anonymous chat opens, relayed by
a bot. Nobody's identity is revealed unless both choose to reveal it.

## Architecture

Minh's principle: stay lean and stitch together mature solutions. Only the
matchmaking logic and thin glue are ours.

- **Discourse (self-hosted, official Docker install) is the whole member
  experience:**
  - Invite-only membership with email and password login. Google login can
    be added at the end.
  - The forum.
  - Members' profile pages with a portfolio of their work.
  - Events for retreats and workshops.
  - Direct messages with Bà Mối.
  - The anonymous chats.
  - Notifications, moderation, and Thảo's admin.
- **Bà Mối is a Discourse AI persona** using Discourse AI's official OpenRouter
  support. Her custom tools are official Discourse AI JavaScript tools that
  call the Bà Mối service. The persona writes all the conversation. The service
  returns only facts, never identities.
- **The Bà Mối service is this repository:** Next.js 15 route handlers on
  Vercel, plus a Supabase Postgres database. It holds:
  - the members' private profiles
  - the anonymous pool
  - matching, which is Moon's code ported
  - signals and matches
  - the chat relay
  
  It has no user interface.
- **The anonymous chat is a relay over Discourse private messages.**
  - Each member of a match has a private-message thread with the relay bot.
  - Discourse's `post_created` webhook sends each new post to the service.
  - The service re-posts it into the other member's thread under the sender's
    alias.
  - Discourse chat has no webhooks, which is why the relay uses private
    messages.
- **Rejected options, and why:**
  - A separate Bà Mối web app: more UI, sign-in and notification code, all of
    which Discourse already provides.
  - HumHub: it has profile walls, which Thảo turned out not to need, but no AI
    persona system.
  - Circle (demo only, no users; the subscription renews 2026-10-27): not
    self-hosted and no walls. Cancel it before renewal.
  - Compass, Duolicious and pH7: public directories, not an anonymous pool.

## Privacy rules

1. **Private profile versus pool card.** Everything a member tells Bà Mối is
   stored in the service as her private profile. The pool gets only an
   anonymous card derived from it.
2. **A pool card holds no personal identifiers.**
   - It includes: an age band (18–24, then five-year bands, then 70+), gender
     and who she wants to meet, intent, hobbies, her nạp âm element, her day
     master (for example "Giáp Mộc", as on Moon's card), and a short summary.
   - It never shows her can chi, zodiac animal or full day pillar: combined
     with the age band, those would reveal her birth year.
   - A region (miền Bắc, miền Trung or miền Nam) and a name initial appear only
     when at least 5 pool members share them (the rule of 5).
3. **Every text that describes one member to another passes the leak check**
   (from Moon). It rejects birth dates, birth times, can-chi pairs, and the
   person's name, city or other identifying terms. The persona only ever sees
   pool cards, so it cannot leak what it was never given. The service still
   checks every summary it stores.
4. **Reasoning about another person uses only their pool card**, never their
   private profile.
5. **The service is the only way into the database.** It uses the service
   role, which bypasses row-level security. Protection comes from having no
   anon or authenticated policies and never shipping the anon key to any
   client.
6. **In the beta, Discourse admins can read members' direct messages with Bà
   Mối and the relayed chats.** Minh agreed to this for testing with Thảo's
   friends. The service never exposes private profiles.

## Member journey

1. **Join.** Thảo shares a Discourse invite link. Her friend creates an
   account with email and password and answers Thảo's signup questions (her
   15-question set, as Discourse user fields). With no outgoing email in the
   beta, an admin activates the account with one click.

   She then opens a direct message with Bà Mối, who asks for consent, which is
   versioned. The consent text says that in the beta, admins can read her
   messages with Bà Mối and her relayed chats, and that deleting removes her
   matchmaking data but not those messages. Then Bà Mối asks for 18+ age, birth
   date and gender. She can pause, hide herself from discovery, or delete her
   data at any time by asking Bà Mối.
2. **Talk to Bà Mối.** About 5 minutes, in Vietnamese, one question at a time.
   Bà Mối rephrases each question in her own voice; this is the default
   wording:

   | # | Asks for | Default wording | Answers |
   |---|---|---|---|
   | 1 | Intent | Bạn đang tìm kiếm điều gì? | Kết bạn · Hẹn hò vui vẻ, không ràng buộc · Mối quan hệ lâu dài · Kết hôn |
   | 2 | Own gender | Bạn là… | Nữ · Nam · Khác |
   | 3 | Who she wants to meet | Bạn muốn gặp… | Nam · Nữ · Cả hai |
   | 4 | Birth date | Bạn sinh ngày nào? | Must be 18 or older. Gives her age band and tuổi. |
   | 4b | Birth time (optional) | Bạn có biết giờ sinh không? | A time, or "Không nhớ". Used only for astrology. |
   | 5 | Region | Bạn đang sống ở đâu? | City; only the region reaches the pool |
   | 6 | Age range | Bạn muốn gặp người trong khoảng tuổi nào? | Default: own age ±5 |
   | 7 | Marital status | Tình trạng hôn nhân của bạn? | Độc thân · Đã ly hôn · Góa · Đã kết hôn |
   | 8 | Children | Bạn đã có con chưa? | Chưa có · Có, đang sống cùng · Có, không sống cùng |
   | 9 | Wants children (long-term and marriage only) | Bạn có muốn có con (thêm) không? | Có · Không · Chưa chắc |
   | 10 | Hobbies | Lúc rảnh bạn thích làm gì? | Up to 5, plus free text |
   | 11 | The open question | Bạn muốn mọi người biết điều gì nhất về bạn? | Free text; Bà Mối may ask one follow-up |

   Bà Mối then shows her the anonymous card exactly as others will see it, and
   she confirms or corrects it.
3. **The Duyên box.** One opening per Vietnamese calendar day, used up even
   when no one qualifies, as in Moon.
   - The service takes candidates who pass the hard filters and clear the
     mutual threshold, and makes a weighted random pick: higher scores are
     likelier, but it isn't always the top one.
   - Bà Mối presents the candidate as "a good match", never "the best".
   - The same person is never brought twice, and letting a card go by is not a
     decline.
4. **Ask Bà Mối.** For example: "tìm cho mình một người thích leo núi, sống ở
   miền Nam, muốn nghiêm túc".
   - The persona turns the request into structured filters.
   - The service returns up to 3 anonymous cards, ranked by mutual score. They
     count as shown, and a daily limit applies.
   - If none fit, Bà Mối offers to watch the pool and notify her.
5. **Interest.** "Muốn làm quen" sends a signal.
   - The service builds the recipient's view: the sender's anonymous card plus
     how the two fit, seen from the recipient's side. It posts this into the
     recipient's thread with Bà Mối.
   - The recipient accepts, declines or dismisses. A signal left unanswered
     expires after 7 days.
   - A decline is final: that pair can never match. The sender only hears
     "chưa có duyên".
6. **Match and anonymous chat.** When both say yes, a match opens. The relay bot
   starts a private-message thread with each of them. Each sees the other as a
   form of address relative to herself, plus an initial when the rule of 5
   allows ("Chị L.", "Anh N.").
   - Text only. Messages are limited to 1,200 characters and 12 per minute.
     `@mentions` and quotes are stripped. Edits and deletes aren't synced.
   - Before a reveal, a message containing a phone number, email address,
     social handle, link or attachment is not relayed. The sender is told how
     to reveal instead.
   - Either member can end the chat or block through Bà Mối. Blocking also
     closes the match. Members can flag relayed messages with Discourse's own
     flags.
7. **Reveal, which is optional.** Each person can ask Bà Mối to reveal her.
   When both have asked, the relay posts each one's Discourse profile link to
   the other.

## Matching rules

**Hard filters, checked in both directions:**
- Intent. Friendship matches only friendship, and casual only casual.
  Long-term and marriage match each other.
- Gender. Each person is someone the other wants to meet. "Khác" matches only
  people who chose "Cả hai".
- Age. Each is inside the other's range, and both are 18 or older.
- Both are opted in, discoverable, and not paused or deleted.
- Neither has blocked the other, and this pair hasn't already been shown,
  declined or matched.
- Married members get friendship only. This is our default; Thảo decides.

**Score.** Compatibility is scored in each direction, A→B and B→A. The mutual
score is the lower of the two, and a pair must clear the threshold both ways.
The signals are:
- how well each person's open answer fits the other's card. The persona judges
  this from the cards; the service falls back to keyword overlap when there's
  no model
- shared hobbies
- astrology, computed by code:
  - tuổi hợp for everyone: can chi and ngũ hành nạp âm from the lunar year,
    using Moon's Vietnamese lunar calendar, so anyone born before Tết belongs to
    the previous year
  - nhật trụ (day pillar) for everyone, from the birth date alone: the day
    master's relationship (stem combination, sinh or khắc) and the day branch,
    Bát Tự's spouse palace (lục hợp, tam hợp, xung, hình), scored with Moon's
    tables. Tuổi and nhật trụ count equally
  - explanations name the relationship ("tam hợp"), never either person's
    animal or stem
  - when both people gave a birth time and the intent is romantic, Moon's full
    Tử Vi and Bát Tự romantic score replaces it
- plans for children (long-term and marriage only)
- region

Weights and the threshold are settings. Members see a tier label, never a
number.

**Changes invalidate stale results.** If a member changes her birth data,
intent, gender or who she wants to meet, her open discoveries are voided and
her scores recomputed.

## States (named as in Moon)

- **Daily opening:** `pending` → `matched` or `no_match`
- **Discovery:** `active` → `interest_sent` → `matched`, or `void`
- **Signal response:** `pending` → `accepted`, `declined`, `dismissed`, or
  `expired` after 7 days (checked when read)
- **Match:** `mutual_interest` → `revealed` → `closed`
- **Relay message:** `relayed` or `held` (contact details before a reveal)

## Notifications

- The service posts into the member's thread with Bà Mối: interest received and
  mutual match.
- Relayed messages arrive as private-message replies.
- Delivery uses Discourse's own notifications: in-app, and push from the
  installable web app.

## Community pieces (all Discourse configuration)

- **Categories:** Giới thiệu, Chữa lành & Trưởng thành, Nghệ thuật & Sáng tạo
  (Vẽ, Viết, Âm nhạc & Chuyển động, Cắm hoa), Tâm linh & Tử Vi, Các mối quan
  hệ, Retreat & Workshop, Triển lãm (the artwork gallery), Góc Artist & Host,
  Thông báo.
- **Profile pages:** bio, header image, signup answers, a featured topic,
  badges and activity.
  - A "Tác phẩm" tab from the User Portfolio component (in the `discourse`
    GitHub org) shows her Triển lãm posts.
  - Topic List Previews (community, by Pavilion) shows them as image tiles.
  - Component versions are pinned.
- **Roles:** her question 1 answer puts each member in a group through the
  official Automation plugin's add-to-group script.
- **Events:** the official Calendar & Events plugin.
- **Following people:** the official Follow plugin.
- **Language and look:** Vietnamese, and a theme with the Thật Space palette,
  Playfair Display and Inter, and her logo.

## Safety

- 18 or older only. Consent is versioned.
- Daily limits on box openings, searches and interest signals.
- Relay rate limits, and contact details held before a reveal.
- Blocking works through Bà Mối. Flags and the review queue come from Discourse.
- Discourse AI spam and toxicity detection covers the forum.

## Not in this version

- Photos in matchmaking
- Images in the relay (text only)
- Syncing edits and deletes in the relay
- Full Tử Vi readings
- Payments
- Outgoing email (recruitment is by invite link)
- Hosting in Vietnam (planned: the AWS Hanoi Local Zone)

## Done means

1. A friend with an invite link creates an account with email and password,
   is activated by an admin, answers the signup questions, and can message Bà
   Mối.
2. The interview finishes in under 5 minutes on a phone, and the card she
   confirms passes the leak check.
3. Tests prove no discovery or search result ever breaks a hard filter, in
   either direction.
4. Tests prove the leak check and the rule of 5.
5. Tuổi matches a trusted reference around Tết, including 1985 and 1990.
6. Two test members complete the loop:
   - box or search
   - interest
   - the recipient's view
   - acceptance
   - relayed chat in both directions
   - contact details held
   - reveal
   - end or block
7. The service rejects any call without the tool secret, and any webhook
   without a valid signature.

## Open questions

For Minh:
- Which OpenRouter model for the persona? It must support tool calls. The
  default is a Claude model.
- Thảo's contract promises her the source code. Are the Moon-derived modules
  transferred to her, or licensed?

For Thảo, once she has played with it:
- Where do the men in the pool come from?
- Should married members be limited to friendship?
- Is casual dating right for the brand?
- Which voice: bà and con, or chị and em?
- Should matchmaking have photos?
