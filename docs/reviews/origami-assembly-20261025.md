# Origami public launch — Sonnet assembly review

Date: 2026-10-25

Job: `d7a02969-e30d-4499-8f83-772a79296d0a`

Routing decision: `21c0bae9-4c82-4576-abdd-48cf2d72f21d`

Provider/model: Claude Sonnet (`claude-sonnet-5-5`)
Initial verdict: **DO NOT SHIP as-is**

The retained review was read in full and its claims were checked against source,
computed browser styles, and the T3 desktop/mobile evidence. The reviewer did
not find a security or signup-boundary regression. Its blocking concerns were
misleading/indexable sample content and CSS ordering/layout defects.

## Confirmed and fixed

- Added above-fold “Bản xem trước — nội dung minh hoạ” banners to forum,
  thread, and matchmaking views; thread, matchmaking, and profile pages now emit
  `noindex, nofollow`.
- Replaced gendered sample language, removed irrelevant shared replies from nine
  threads, labelled sample authors/scores, and rewrote compatibility prose so it
  never claims to have assessed the visitor.
- Moved paper title/button rules into Tailwind's component layer. Browser
  evidence now shows the intended 12px contact-heading top margin.
- Replaced unsupported `h-13/w-13`; browser evidence shows the thread avatar at
  exactly 52×52 px.
- Returned signup/login/Tử Vi CTAs to the hero. At 1440×768 and 390×844 the
  primary CTA is above the fold, has no overlap with the lotus, and there is no
  horizontal overflow.
- Added modal focus trapping, Escape close, trigger focus return, meaningful star
  semantics, and preservation of the pre-existing body overflow style.
- Paused/cancelled the lotus frame loop while offscreen or document-hidden and
  kept a constant button label with `aria-pressed` state.
- Improved focus contrast, made the Tử Vi result focusable/live, removed its
  artificial unmount delay, and states that input remains browser-local and does
  not compute the sample reading.
- Restored handed-off details identified by review: feature icons, third hero
  crane, moon/base shadows, exact accordion tones/folds, forum boats/zigzag/tabs,
  matchmaking cranes/card scores, Tử Vi cell gaps/shadows/creases, and reply
  dog-ears.

## Verified or retained deliberately

- `metadataBase` falls back to the current production brochure origin. A future
  custom domain should set `NEXT_PUBLIC_SITE_URL`; the fallback is not a broken
  demo artifact today.
- `postcss` remains available through Next in production (`npm ls postcss
  --omit=dev`), and the patched Zod range resolves to 4.6.7.
- Public hostname/infrastructure descriptions pre-date this diff and contain no
  credentials. They are necessary operational documentation for the public
  Funnel; real secrets remain ignored/local.
- The cold Discourse locale-module 503 remains an explicit pre-promotion
  operational gate. It was not introduced by the design implementation.

Final ship status still depends on rerunning the full local suite/build, exact
head hosted CI, a prebuilt preview, and the cold external signup gate.
