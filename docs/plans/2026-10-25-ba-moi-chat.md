# Bà Mối and match chats in native Discourse Chat

Status: phase 1 implemented on `feat/ba-moi-chat` (stacked on PR #5), not yet
applied to the live community. Decision: Minh, 2026-10-25.

## Why

Bà Mối felt like writing forum posts: a message editor with a title and
toolbar, and threads rendered as a forum. Members expect a chat: streaming
replies, a typing indicator, quick sending, photos and files, read state.

Native Discourse Chat already provides most of this, and the pinned Discourse
(`c237680`, 2026.10.0-latest) supports what we need. We had chosen private
messages because chat seemed to lack webhooks. That is no longer true:

- Discourse AI agents can answer chat direct messages
  (`allow_chat_direct_messages`). Replies stream in (`ChatStreamer`), and the
  bot shows chat's "replying" indicator while it generates.
- Tools receive `user_id`, `channel_id` and `message_id` in chat context.
- The bot API can open or reuse a direct chat
  (`POST /chat/api/direct-message-channels.json`, `upsert: true`) and post
  into it (`POST /chat/:channel_id.json`).
- Chat emits `chat_message_created/edited/trashed/restored` webhooks.

## Phase 1: Bà Mối in chat (this change)

| Area | Change |
| --- | --- |
| Community settings | Chat on for members, one-to-one only: `enable_public_channels=false`, `chat_max_direct_message_users=1`, chat and direct messages allowed for admins, moderators and trust_level_0, uploads allowed (site upload limits apply). |
| Discourse AI agent | `allow_chat_direct_messages=true`; private messages stay allowed so existing threads keep working. The prompt asks for short chat-style messages and says she reads text only. |
| Theme | The Bà Mối sidebar link and the first-step aside open the member's direct chat with the bot (created on first use, reused after). |
| Service | `BA_MOI_NOTICE_TRANSPORT=chat` sends Bà Mối's own notices (signals, matches) to that chat through the outbox (same retry and lease guarantees). Default stays `pm`. |

Safety-critical actions (delete, block, end, reveal) still need a confirmation
from a later member message. In chat that binds to the direct chat's
`channel_id` and `message_id`, which the tool script now forwards. A failed chat
notice stays queued and retries, then dead-letters visibly; it never silently
becomes a private message.

What members get from core chat: streaming replies, the replying indicator,
Enter to send, photo/file upload within limits, unread badges, notifications
and a full-page chat on desktop and phone.

Not in phase 1:

- No per-message "seen" receipt; core chat does not show one to the sender.
- Bà Mối cannot see photos (DeepSeek V4.1 Flash is text-only). She says so
  and asks the member to describe the photo in words.
- Match chats stay private messages relayed by Thư Duyên.
- A member who turns chat off in her preferences cannot talk to Bà Mối, and
  her notices sit in a chat she has hidden. Discourse does not refuse the bot.
  Phase 2 can check the preference or hide that toggle.

### Rollout order (live)

1. Back up the community. Merge PR #5, then this change, and deploy the
   archived commit to the ASUS (`docs/asus-deployment.md`).
2. Run the community and presentation bootstraps with `--check` first, then
   apply. This turns chat on and attaches the updated theme.
3. Run `npm run discourse:install -- --check`, then `npm run discourse:install`.
   This sets `allow_chat_direct_messages` and the updated prompt.
4. Live check with a QA member: open Bà Mối, send a message, get a streamed,
   tool-using reply.
5. Set Vercel `BA_MOI_NOTICE_TRANSPORT=chat` in production and redeploy the
   service with the local-prebuilt flow. Trigger a QA signal and confirm the
   notice arrives in the chat.

Rollback: set `BA_MOI_NOTICE_TRANSPORT=pm`. Set the agent's
`allow_chat_direct_messages` back to false. Turning chat off hides the chats
but keeps their data.

## Phase 2: match chats in chat (next)

- Thư Duyên opens a direct chat with each member of a match (the same upsert).
  The relay consumes `chat_message_created` webhooks instead of
  `post_created`, keeping the same policy: text limits, rate limit, contact
  details held before reveal.
- Photos and files: held before mutual reveal (a photo can identify someone).
  After reveal, they are relayed by re-uploading as Thư Duyên, within limits.
- "Seen": the relay records when the recipient's chat membership read-state
  passes a relayed message and shows "Đã xem" to the sender. This needs a
  small theme component and a read-state poll or webhook.
- Data: additive columns for relay channel ids. Existing private-message
  relay threads keep working until their matches close.

## Verification in this change

- Vitest: client chat calls (request shape, own bot key, empty responses),
  chat notice delivery (one channel, no private message), retry after an
  outage, installer payload and drift.
- Vitest: chat-context confirmation (same message refused, other chat refused,
  same-numbered topic refused, later message accepted), and a refused chat
  notice stays queued rather than becoming a private message.
- Discourse acceptance: a real Discourse AI agent bot user (negative id) opens
  a member's direct chat and posts into it with its own API key, and reuses it.
  It is not refused for a member who turned chat off; chat settings applied; the sidebar link opens a
  one-to-one chat with the configured bot; a member message and a bot message
  render; reopening from the first-step card returns to the same chat; mobile
  renders the composer.
