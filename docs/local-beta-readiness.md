# Bà Mối local beta readiness

Checkpoint: 2026-10-01, branch `feat/ba-moi`. The user authorized completing the
existing beta locally before renting a server. No AWS resource, live database
migration, Discourse installation, or deployment is part of this checkpoint.

## What works locally

`npm ci`, then:

```bash
npm run test:beta
npm test
npm run typecheck
npm run lint
npm run build
```

Tests use PGlite with the repository's actual SQL migrations through the same
postgres.js adapter as production. Each suite owns a disposable database; its
loopback socket requires local socket permission. Tests need no `.env.local`,
Supabase, AWS, OpenRouter or Discourse account. The build may load local Next.js
environment configuration; it does not deploy.

The two acceptance journeys cover individual interview answers, adult/current
consent, card preview and confirmation, anonymous discovery, interests and
acceptance, separate private relay threads, HMAC and author checks, contact
holding, mutual reveal, blocking, deletion during an outage and retry recovery.
Focused regression tests also cover concurrent duplicate sends, queue-storage
failure, post-block retries, the final delivery lease, and daily quota races.

Verified on 2026-10-01: **31 files / 300 tests passed**, typecheck and lint passed,
and the production build passed (18 static pages and three API route patterns).

The website's public pages remain the original static demo. The beta member
experience is the Discourse persona; passing service tests does not validate the
language model's conversation quality or Discourse's rendered UI.

## Configuration checks prepared for the live stage

`npm run discourse:install -- --check` is read-only. It checks tool scripts,
parameters, metadata, secret contracts and secret bindings; the agent prompt,
tool IDs, private-message/channel settings, groups, enabled state, configured LLM
and presence of a bot user. Missing fields fail as unverifiable. It cannot compare
secret plaintext because the server intentionally does not return it.

The full records come from the verified admin `edit.json` endpoints. Discourse's
tool export intentionally omits secret bindings. Source evidence:
[tool controller](https://github.com/discourse/discourse/blob/main/plugins/discourse-ai/app/controllers/discourse_ai/admin/ai_tools_controller.rb),
[tool serializer](https://github.com/discourse/discourse/blob/main/plugins/discourse-ai/app/serializers/ai_custom_tool_serializer.rb),
[agent controller](https://github.com/discourse/discourse/blob/main/plugins/discourse-ai/app/controllers/discourse_ai/admin/ai_agents_controller.rb).
Mocked admin-API tests prove drift detection; no live installer check has run.

## Remaining live acceptance

1. Choose a Discourse host and production hostname. The ASUS still serves other
   workloads; confirm a migration separately before reusing it. AWS provisioning
   and billing remain a later action.
2. Install a pinned Discourse revision; configure private invites/accounts,
   groups and moderator access. Verify email or manual activation on real phones.
3. Configure OpenRouter/Discourse AI and both bot identities, with separate
   per-bot API keys. Apply then check the repo's installer contract against that
   exact Discourse version; run the tool-context probe.
4. Verify Supabase schema and private grants, secrets, service URL and scheduled
   retry delivery. Follow the repository's local-prebuilt Vercel workflow and
   required GitHub checks when deployment is authorized.
5. Repeat the full member journey using two real accounts, including outage and
   redelivery, notification privacy, relay participant visibility, mobile layout,
   persona wording, explicit reveal, deletion and moderator boundaries.
6. Verify a backup/restore, restart recovery and the residual remote-send crash
   window before inviting the beta group.

Existing signals/matches deliberately survive profile edits, while pause removes
discovery visibility. Historical Discourse messages survive service deletion.
Contact detection is heuristic; splitting contact details across messages can
bypass it. Outbound delivery has a remote acceptance/receipt crash window and
therefore cannot guarantee exactly once. These limits are carried into live
acceptance, rather than represented as locally solved.
