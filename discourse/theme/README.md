# Thật Space Brand (Discourse theme component)

This is a Discourse theme **component** layered on core Horizon. Horizon owns
layout, topic cards and spacing; this component adds the self-hosted fonts, the
first-step card, the Bà Mối sidebar link and removes member-facing noise. The
palette is a separate owned color scheme (`discourse/presentation/palette.json`)
because components cannot carry color schemes. Design rationale:
[member happy path](../../docs/design/member-happy-path.md).

Install it with `discourse/presentation/bootstrap.rb`, which imports this
directory, attaches it to Horizon and configures its settings.

## Admin settings

| Setting | Default | Purpose |
| --- | --- | --- |
| `ba_moi_username` | empty | The actual Discourse username for the Bà Mối bot. The sidebar link and first-step aside are omitted until this is a safe username and the signed-in member can send private messages. |
| `introduction_category_id` | `0` | Category for "Viết lời giới thiệu". Set by the bootstrap to Giới thiệu. |

Topic creation uses core's composer (`composer.openNewTopic`). Bà Mối uses the
member's existing private-message thread with the bot (found from their
message list: exactly two participants, one of them the bot) or starts one
with a greeting, and renders that thread as a chat with a pinned message box
that posts ordinary replies (`lib/ba-moi.js`, `components/ba-moi-chat.gjs`).

The first-step card renders only for a signed-in member on the home feed while
core's current-user `any_posts` flag is false (it counts any post, including a
private message to Bà Mối). It hides as soon as the member creates a topic in
that visit. Guests receive nothing from this component.

## Source compatibility target

The source contract was inspected against the pinned Discourse checkout at
commit `c237680d280a34b1025f79bf37b865c5349313a3` (2026.10.0-latest), whose
core Horizon theme it targets. Browser acceptance compiles it against that
instance before any compatibility claim.
