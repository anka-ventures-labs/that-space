# Controlled public soft launch

Status: superseded on 2026-10-11 by
[public self-service soft launch](2026-10-11-public-self-service-launch.md)

## Product decision

Thật Space is open in principle to **any person aged 18 or older**. It is not a
women-only community. The initial release publishes a truthful public brochure
and operates the actual community as a small, manually admitted pilot.

The admission controls are temporary operational and safety controls, not an
identity or gender test:

- public visitors can read `/`, `/privacy`, `/terms`, and `/contact`;
- anyone aged 18 or older can request an invitation;
- the operator invites and approves at most 20 pilot members;
- applicants self-attest that they are 18 or older; do not collect identity-
  document images;
- Discourse remains login-gated, invite-only, and staff-approved;
- the former static forum, profile, Tử Vi, and matchmaking demos are not
  published;
- Bà Mối remains disabled for the first pilot.

## Release architecture

The Vercel surface is a brochure and service boundary, not a second community
UI. A member-login link appears only when both `DISCOURSE_URL` and
`PUBLIC_COMMUNITY_LINK_ENABLED=true` are configured after external acceptance.
`PUBLIC_SUPPORT_EMAIL` is the only public application/support channel. If it is
missing, every invitation CTA becomes status-only and `/contact` clearly says
intake is closed instead of linking to a nonexistent or circular destination.

Discourse owns member authentication and content. Its versioned manifest
requires invitations, staff approval, login-gated content, and one explicit
18+ attestation followed by the existing 15 private onboarding questions. The
answers are not Bà Mối input and are hidden from other members by default.

`BA_MOI_ENABLED=false` is the default. Tool, webhook, and retry endpoints return
HTTP 503 without loading database or bot credentials while the switch is off.
Discourse must also keep the Bà Mối allowed-groups setting empty and the theme
entry point hidden. Defense in depth matters because a stale agent or webhook
can otherwise reach a deployed API accidentally.

## Operator runbook

1. Configure a staffed `PUBLIC_SUPPORT_EMAIL` and confirm the page displays it.
2. Keep `PUBLIC_COMMUNITY_LINK_ENABLED=false` until the member login path is
   reachable and passes acceptance from outside the operator network.
3. Apply the community manifest with `--check` first, then apply it during an
   announced maintenance window. Verify `login_required`, `invite_only`,
   `must_approve_users`, and the 18+ field in the live UI.
4. Keep `BA_MOI_ENABLED=false`, `BA_MOI_ALLOWED_GROUP_IDS` empty, and the theme's
   Bà Mối username unset.
5. Invite one synthetic adult account, complete all 16 fields, approve it, and
   verify login, member-content privacy, posting, replies, reporting, and logout.
6. Invite real pilot members one at a time, stopping at 20. Record consent to
   the pilot terms and provide the support/reporting channel with each invite.
7. Check the signed-in homepage and create a native test post before each new
   invitation batch. `/srv/status` alone is not sufficient evidence of a
   healthy Discourse worker.
8. Pause invitations on repeated 5xx responses, stalled login/post requests,
   missing backups, an unstaffed support inbox, or an unresolved safety report.

## Verification and release gates

Before the brochure is promoted:

- page tests, service tests, typecheck, lint, and production build pass;
- the production build contains only the four public pages plus explicitly
  documented API endpoints;
- `npm audit --omit=dev` has no unaccepted runtime high/critical finding;
- one cross-family assembly review has no confirmed blocking finding;
- the pull request's required checks pass on the exact head commit;
- a locally prebuilt Vercel preview is inspected in a real browser;
- the operator explicitly approves production promotion.

## Assembly review and verification

The 2026-10-08 cross-family assembly review found no P0 blocker and returned
"ship with changes" for commit/push, not production promotion. Its retained
actions are resolved in this checkpoint: production dependency audit now runs
in CI; community URLs are normalized and require a separate public-link flag;
the placeholder-only environment file keeps Bà Mối off; the superseded plan is
prominently marked; the disabled route and hidden theme entry points have
explicit tests; and the Vietnamese 404 has a home-only escape hatch test.

Final local evidence at this checkpoint: 29 Vitest files / 214 tests passed.
Typecheck, lint, production build, the two-journey local beta suite, Ruby
syntax/manifest validation, and `npm audit --omit=dev --audit-level=high` all
passed. The native Discourse suite remains intentionally delegated to hosted
CI because no local Docker daemon is available.

A 12-second read-only HEAD probe from the release workstation to the documented
Discourse endpoint timed out with no response. Keep
`PUBLIC_COMMUNITY_LINK_ENABLED=false` until the endpoint is reachable and the
live member journey passes from outside the operator network. The currently
deployed Vercel page returned HTTP 200 but still exposed the superseded demo
links, so replacing that build is the brochure launch objective; it is not
evidence that community admission is ready.

Before inviting a real member, additionally require the live Discourse
acceptance path, a recent restorable backup, a named support/moderation owner,
a tested pause/rollback path, and an operator determination with qualified local
counsel on the applicable privacy, platform, and moderation obligations. A
public brochure can ship while invitations remain closed.

## Deliberately deferred

Bà Mối is not a soft-launch dependency. Do not turn it on until a separate
review confirms at least:

- fresh, server-bound confirmations for reveal, delete, block, and end actions;
- rolling contact-leak detection across multiple pre-reveal messages;
- failure-injection coverage for duplicate outbox delivery;
- live provider/tool-call acceptance and an incident owner;
- updated privacy copy naming the active AI/data processors.

This keeps the first slice useful and honest without building speculative
policy machinery around a capability that is not yet available to members.
