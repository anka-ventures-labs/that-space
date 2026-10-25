# Public self-service soft launch

Status: implementation and production launch, 2026-10-11

This plan supersedes the 2026-10-08 invite-only pilot. Thật Space accepts any
person aged 18 or older, regardless of gender. Registration is self-service,
and Bà Mối plus the existing community features are included at launch.

## Product contract

- Visitors see a public Vietnamese landing page with direct registration,
  login, privacy, terms and support links.
- Registration uses Google OAuth. No invitation or staff approval is required.
- Community content remains login-gated. Signup requires an exact 18+
  self-attestation and the 15 private community onboarding questions.
- Bà Mối is available to ordinary members. Community onboarding answers never
  enter matchmaking automatically; Bà Mối has separate consent, interview and
  card-confirmation steps.
- The complete journey includes anonymous discovery, search, interest signals,
  mutual matches, private relay chat, mutual reveal, pause/resume, end, block
  and data deletion.
- The release is soft because promotion starts with a small audience and active
  monitoring. Access itself is public and self-service.

## Parallel MECE workstreams

1. Public product surface: Bà Mối-led copy, direct signup, legal disclosures,
   support and truthful removal of the old fake demo routes.
2. Service boundaries: short-lived, single-use, next-human-post confirmation
   tokens for delete/reveal/block/end and rolling cross-message pre-reveal
   contact checks.
3. Community admission: Google-only self-service settings, 18+ signup field,
   ordinary-member Bà Mối access and public theme entry point.
4. Release operations: forum reliability, additive database migration,
   exact-revision Vercel build/deploy, external acceptance and canary checks.

The first three workstreams assemble before production changes. Database and
forum configuration precede the public-site promotion. Workers do not push,
open pull requests, launch CI or deploy independently.

## Required live configuration

Discourse:

```text
login_required=true
allow_new_registrations=true
enable_signup_cta=true
invite_only=false
must_approve_users=false
enable_local_logins=false
auth_skip_create_confirm=false
enable_google_oauth2_logins=true
disable_emails=yes
```

Service and public site:

```text
BA_MOI_ENABLED=true
BA_MOI_ALLOWED_GROUP_IDS=<live trust_level_0 id>
BA_MOI_PERSONA_USERNAME=Ba_Moi_bot
PUBLIC_COMMUNITY_LINK_ENABLED=true
COMMUNITY_PUBLIC_REGISTRATION_ENABLED=true
PUBLIC_SUPPORT_EMAIL=<staffed public address, when available>
```

The Google Cloud client must register this exact callback:

```text
https://ubuntu-asus.tail349cbf.ts.net:8443/auth/google_oauth2/callback
```

## Acceptance gates

1. A new external visitor can choose Register, complete Google OAuth, submit
   all 16 required fields and reach the member community without staff action.
2. The same non-staff member can use posts, replies, profiles, portfolio,
   private uploads, events/RSVP, follow, reporting and private messages.
3. Two fresh non-staff members complete Bà Mối consent, interview, card,
   discovery, interest, acceptance, relay, two-step mutual reveal, block and
   deletion on the intended release.
4. Contact fragments split across messages remain private before reveal.
   Confirmation tokens cannot execute in the issuing model turn, be reused, or
   cross a member, thread, match, action or expiry boundary. Temporary contact
   tails are empty immediately after reveal, end or block.
5. Cold and warm forum checks return without 5xx responses. A real signed-in
   page and post are required; `/srv/status` alone is insufficient.
6. Focused tests, the full suite, typecheck, lint, production build, dependency
   audit and the pinned Discourse acceptance suite pass.
7. One retained cross-family assembly review has no confirmed blocking finding,
   and required GitHub checks pass on the exact commit deployed.
8. The local-prebuilt Vercel artifact is audited, deployed to preview, exercised
   in a browser, and only that artifact is promoted.

## Operations and rollback

- Begin with a small announcement and watch signup completion, forum latency,
  tool/webhook outcomes, retry backlog and support reports.
- A public registration pause is an operational rollback: set
  `COMMUNITY_PUBLIC_REGISTRATION_ENABLED=false` on the brochure and temporarily
  disable new Discourse registrations. Existing members retain access.
- A Bà Mối-only rollback sets `BA_MOI_ENABLED=false` and removes ordinary
  groups from the agent while preserving community access and data for repair.
- Restore the previous Vercel alias for a brochure/API regression. Database
  migrations are additive; take a verified backup before applying them.
- Repeated 5xx responses, failed Google callbacks, growing undelivered outbox
  rows or incorrect identity/contact disclosure stop promotion until corrected.

## Explicitly outside this release

Full Tử Vi chart generation, long-form readings, history and PDF export are not
implemented product capabilities and are not advertised. Bà Mối continues to
use the existing compatibility signals already implemented and tested.
