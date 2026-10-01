# Thật Space Discourse theme

This is a full Discourse theme source directory. Install it from this directory
as a remote Git theme or upload a source archive; it is not a static mock-up.

## Admin settings

| Setting | Default | Purpose |
| --- | --- | --- |
| `ba_moi_username` | empty | The actual Discourse username for the Bà Mối bot. The message controls are omitted until this value is a safe username and the signed-in member can send private messages. |
| `gallery_path` | `/c/trien-lam` | Same-site path for the artwork gallery. Invalid or external values fall back to the default. |
| `events_path` | `/upcoming-events` | Same-site path for Retreat & Workshop. Invalid or external values fall back to the default. |
| `show_member_welcome` | `true` | Shows the member welcome panel on discovery lists. |

The theme intentionally delegates message creation to core Discourse with
`composer.openNewMessage({ recipients })`. It does not construct a bot profile
URL or assume that the bot account, a portfolio component, or Calendar & Events
has already been installed.

Navigation is rendered only for `currentUser`; guests receive no theme-provided
member header or discovery panel. Discourse remains responsible for invitation,
authentication, permissions, profiles, accessibility behavior, and the actual
message permission check.

## Source compatibility target

The source contract was inspected against the locally pinned Discourse checkout
at commit `c237680d280a34b1025f79bf37b865c5349313a3` (2026-10-01). Runtime
installation must compile this theme against the pinned instance before claiming
compatibility.
