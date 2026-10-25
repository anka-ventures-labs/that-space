# Discourse payload fixtures

Built from Discourse's documented formats for W-C; replace them with payloads
captured from the real instance in W-D.

- `post_created.json`: the `post` webhook body (`X-Discourse-Event-Type: post`,
  `X-Discourse-Event: post_created`) for a reply in a private message. Only
  `id`, `topic_id`, `user_id`, `post_type`, `raw` and `deleted_at` are read.
- `tool_call.json`: what a Bà Mối tool script sends: `auth` built from the
  Discourse AI tool `context` only, and the model's `args`.
