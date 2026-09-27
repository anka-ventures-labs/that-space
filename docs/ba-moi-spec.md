# Bà Mối v1 spec

Status: draft, 2026-09-27. We wrote this ourselves instead of waiting for Thảo:
she reacts to things she can use, so a working prototype comes first and her
feedback shapes v2.

## What it is

Bà Mối is an AI matchmaker for Thật Space. A member chats with her for a few
minutes, on a phone, in Vietnamese. Bà Mối builds a profile from the
conversation, then introduces the member to three people who want the same
kind of relationship. She explains why each pair fits and suggests how to
start talking.

It answers the two complaints Thảo made about Moon AI on the 2026-09-25 call:

- **Matches ignored what people wanted.** Intent is a hard filter here, never a
  score, so someone looking for friends is never offered marriage.
- **Readings were too generic.** Every introduction cites specifics from both
  profiles and comes with opening lines.

Thảo's 15-question set (`Bo_cau_hoi_That_Space`) is for forum onboarding in
phase 2. Bà Mối doesn't use it.

## The conversation

Bà Mối asks one question at a time, with tap-to-answer options where they fit.
Free text is always allowed. A member should finish in under 5 minutes. Bà Mối
rephrases each question in her own voice; the wording below is the neutral
default.

| # | Asks for | Default wording | Answers |
|---|---|---|---|
| 1 | Name to show | Bạn muốn được gọi là gì? | Free text |
| 2 | Intent | Bạn đang tìm kiếm điều gì? | Kết bạn · Hẹn hò vui vẻ, không ràng buộc · Mối quan hệ lâu dài · Kết hôn |
| 3 | Own gender | Bạn là… | Nữ · Nam · Khác |
| 4 | Who they want to meet | Bạn muốn gặp… | Nam · Nữ · Cả hai |
| 5 | Birth date | Bạn sinh ngày nào? | Solar date. Must be 18 or older. Gives age and tuổi. |
| 6 | City | Bạn đang sống ở đâu? | Hà Nội · TP.HCM · Đà Nẵng · Nơi khác (free text) |
| 7 | Age range | Bạn muốn gặp người trong khoảng tuổi nào? | Range; default is own age ±5 |
| 8 | Marital status | Tình trạng hôn nhân của bạn? | Độc thân · Đã ly hôn · Góa · Đã kết hôn |
| 9 | Children | Bạn đã có con chưa? | Chưa có · Có, đang sống cùng · Có, không sống cùng |
| 10 | Wants children (long-term and marriage only) | Bạn có muốn có con (thêm) không? | Có · Không · Chưa chắc |
| 11 | Hobbies | Lúc rảnh bạn thích làm gì? | Up to 5: Du lịch · Đọc sách · Nấu ăn · Cà phê · Âm nhạc · Phim ảnh · Thể thao · Yoga, thiền · Nghệ thuật · Chụp ảnh · Thiên nhiên · Thú cưng · Tâm linh, Tử Vi · Khác |
| 12 | Occupation (optional) | Bạn đang làm công việc gì? | Free text |
| 13 | The open question | Bạn muốn mọi người biết điều gì nhất về bạn? | Free text. Bà Mối may ask one follow-up. |

Bà Mối then sums up the profile in 3–4 sentences and asks whether she got it
right. The member confirms or corrects it before seeing introductions.

## Matching

**Hard filters.** A pair is considered only if all of these hold in both
directions:

1. **Intent.** Friendship matches only friendship, and casual matches only
   casual. Long-term and marriage match each other.
2. **Gender.** Each person is someone the other wants to meet. "Khác" matches
   only people who chose "Cả hai".
3. **Age.** Each is inside the other's range, and both are 18 or older.
4. **Marital status.** Married members get friendship introductions only. This
   is our default; Thảo decides.

**Score.** Pairs that pass get a score out of 100:

| Signal | Default weight | How |
|---|---|---|
| Open answers | 25 | Bà Mối judges how the two people's own words fit, and gives a reason |
| Shared hobbies | 25 | Overlap between the chosen hobbies |
| Tuổi hợp | 20 | Can chi and ngũ hành nạp âm from the lunar birth year, computed by code, not the AI. People born before Tết belong to the previous year. |
| Same city | 15 | |
| Children | 15 | Long-term and marriage only: whether they have or want children. For other intents this weight goes to the other signals. |

Thảo can change the weights.

## Introductions

Each member gets their top 3 matches. An introduction shows:

- Name, age, city, intent, and the person's answer to the open question in
  their own words
- The score, broken down by signal
- **Why you two:** 2–3 reasons, each citing something specific from both
  profiles
- **One thing to be aware of**, said kindly
- **Three opening lines**, each mentioning something concrete about the other
  person
- Buttons: **Muốn làm quen** (I'd like to meet), **Bỏ qua** (skip), **Báo cáo**
  (report)

When both people tap Muốn làm quen, each chooses a contact to share (Zalo,
phone or Instagram) and sees the other's. Nothing is shared until both agree.

## Bà Mối's voice

Warm, witty and discreet, like a matchmaker who has seen everything. Never
preachy, never generic. She calls herself "bà" and the member "con" by default.
A second preset uses "chị" and "em" so Thảo can compare the two.

## Thảo's screen

- Counts: members, finished profiles, introductions, mutual matches
- Breakdown by intent, gender preference and city
- The voice preset and the matching weights
- An inbox for feedback, which comes from a Góp ý button on every screen, and
  for reports

She sees totals and reported profiles, never conversations.

## Privacy and safety

- 18 or older only, checked from the birth date.
- A consent screen before the conversation explains what is collected, why,
  who sees it, and how to delete it.
- Who someone wants to meet can reveal their sexual orientation, which
  Vietnam's data-protection rules treat as sensitive. Profiles therefore appear
  only inside an introduction, never in a list anyone can browse.
- Members can delete their data at any time.
- The demo uses clearly labeled sample profiles. No real member data goes in
  until Thảo approves a pilot.

## Not in v1

- Photos. Illustrated avatars instead, because photos need moderation.
- In-app chat. Contact exchange instead.
- Full Tử Vi chart readings.
- The forum and Thảo's 15-question onboarding (phase 2).
- Payments, notifications, hosting in Vietnam.

## Done means

1. A new member finishes the conversation in under 5 minutes on a phone.
2. Tests show no introduction ever breaks a hard filter.
3. Tuổi (can chi, ngũ hành) matches a trusted reference, including birthdays
   around Tết.
4. Every introduction has at least two reasons citing both profiles and three
   opening lines about the other person.
5. Under-18s can't continue, and no contact is shared without both people
   agreeing.
6. Thảo's screen shows numbers and feedback, not conversations.

## Questions for Thảo, once she has played with it

- Thật Space is a women's community. Where do the men in the pool come from?
- Should married members be limited to friendship?
- Is casual dating right for the Thật Space brand?
- Which voice: bà and con, or chị and em?
- Should profiles have photos, and who moderates them?
