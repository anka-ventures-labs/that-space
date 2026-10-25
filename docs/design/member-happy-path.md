# Member happy path (Discourse)

Status: implemented on `feat/member-happy-path` (2026-10-25). Owner of the
decision: Minh. Thảo has not reviewed it yet.

## Problem

The first screen a member saw after signing in had everything on it at once:
two logos and two navigations (the Discourse header plus our own bar), chat
links, the default community sidebar, category and tag filters, four list tabs
(Gần đây / Mới / Hot / Chuyên mục), a "Chào mừng" search banner, a hero with
three buttons that repeated the navigation, an "outgoing email is disabled"
staff notice, "Chưa phân loại" and untranslated "Upcoming events". Signup asked
16 required questions before any of that. Most members are not technical; none
of it told them what to do first.

## Principles

1. **One navigation.** Destinations live in the sidebar (the hamburger menu on
   phones). Nothing repeats it.
2. **One feed.** Home is the latest posts as Horizon cards. No tabs or filters
   above it; categories are in the sidebar.
3. **The next action comes from the layout, not from popups.** No user tips,
   no tutorial bot, no welcome modal. A new member sees one card with one
   primary button above the feed. It disappears once they have posted.
4. **Plain Vietnamese verbs.** "Viết bài" instead of "Chủ đề mới"; sidebar
   names say where you go.
5. **Ask only what membership needs.** Signup asks for the 18+ attestation and
   Q1 (role; it assigns the interest group). Thảo's other 14 questions stay
   private and editable on the member's profile, without being required.

## What a member sees

```text
┌ header: logo ···················· search · notifications · avatar ┐
│ sidebar                │ [Viết bài]                               │
│  Bảng tin              │ ┌ Bước đầu tiên ─────────────────────┐   │
│  Bà Mối                │ │ Chào bạn! Hãy để mọi người biết    │   │
│  Sự kiện               │ │ bạn là ai.                         │   │
│  Triển lãm             │ │ [ Viết lời giới thiệu ]            │   │
│  Tin nhắn              │ │ Bạn đến để tìm người hợp duyên?    │   │
│  ─ Chuyên mục          │ │ Trò chuyện riêng với Bà Mối        │   │
│  Giới thiệu            │ └────────────────────────────────────┘   │
│  Chữa lành & …         │ topic card                                │
│  Nghệ thuật & …        │ topic card                                │
│  Tâm linh & Tử Vi      │ …                                         │
│  Các mối quan hệ       │                                           │
└────────────────────────┴───────────────────────────────────────────┘
```

- **Viết lời giới thiệu** opens the composer in Giới thiệu, prefilled with a
  three-line template.
- **Bà Mối** (sidebar and the card's quiet secondary link) opens a private
  message to the configured bot, titled "Trò chuyện cùng Bà Mối". Both are
  hidden until `ba_moi_username` is set.
- Staff additionally see Kiểm duyệt and Quản trị; core hides both from members.
- "Về Thật Space" and "Nội quy" sit in the sidebar's "Thêm" drawer.

## How it is built

| Concern | Mechanism | Source |
| --- | --- | --- |
| Base layout | Core **Horizon** theme (default for new Discourse sites since 3.5) as the site default | `discourse/presentation/bootstrap.rb` |
| Brand | `Thật Space Brand` component attached to Horizon: fonts, first-step card, noise removal | `discourse/theme/` |
| Palette | Owned color scheme "Thật Space Horizon"; Horizon derives tints from `tertiary` (brand brown, 7:1 with white). No dark palette | `discourse/presentation/palette.json` |
| Sidebar | Core community section links reconciled server-side; Bà Mối added by the theme API | bootstrap + `api-initializers/that-space.gjs` |
| Quiet onboarding | `top_menu=latest`, welcome banner, user tips, narrative bot, chat, tags, uncategorized and the events plugin's sidebar link off | bootstrap site settings |
| Wording | vi override `js.topic.create = "Viết bài"` | bootstrap |
| Signup | Manifest field `asked: "later"` → optional and not on the signup form | `discourse/community/manifest.json` |

Apply order: the bootstrap first refuses a community sidebar holding custom
(non-core) links it does not own, then imports and configures Horizon, the
component, palette and pinned components, and only then changes the visible
site settings, sidebar, Horizon attachments and default theme. The welcome
banner is a themeable setting, so it is set on Horizon itself; core preserves
that override when it re-syncs Horizon.

Horizon is a core theme: it cannot be edited and upgrades with the pinned
Discourse revision. Discourse advises caution with components on Horizon; the
browser acceptance suite is the guard for our component, Portfolio and Topic
List Thumbnails on each Discourse pin change.

## Rollback

The previous full theme ("Thật Space", PluginStore key `theme`) stays
installed. To roll back the look, set it as the default theme in Admin →
Themes. Sidebar links can be restored with Admin → Sidebar → Community → reset.
The signup change is reverted by removing `asked: "later"` from the manifest
and reapplying the community bootstrap.

## Open follow-ups

- Outgoing email is disabled site-wide, so members get no email
  notifications. The notice is now hidden from members, but the gap remains.
- Bà Mối opens a new private message each time. Linking straight to an
  existing conversation needs the service to expose its thread.
- Existing members keep their previously seeded sidebar categories; only new
  members get the five-category default.
- Thảo should review the reduced signup before it reaches production.
