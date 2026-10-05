# Thật Space self-service public soft launch

The user explicitly requested self-service public admission and branded OAuth
on Oct5, superseding the invitation/staff-activation admission model. Keep
existing forum posts, uploads, signup answers and Bà Mối private behind login.
Open registration without requiring an invitation or staff approval; require
verified identity/email and all 15 onboarding answers. Google is the only
admission path; see the superseded decisions below.

## Parallel MECE workstreams

- Cloud account/credentials: coordinator owns the dedicated Google Auth Platform
  project, consent branding, web client, domain verification and project-specific
  Infisical storage. No Gmail integration project/client or credentials are reused.
- Repository launch contract: inspect and update the canonical admission/launcher
  configuration, bootstrap validation and meaningful signup/privacy acceptance.
  This scope owns no Cloud-account mutation or real credential values.
- Public brand information: prepare truthful Vietnamese app/homepage, privacy and
  terms links using the existing 150×150 logo and current product capabilities.
  Final URLs/support contact depend on the user's domain/contact choice.

Preserve dependencies: final domain/TLS → exact redirect URI and canonical
service URLs; Google/SMTP credentials → live auth/email tests; approved repository
assembly + backups + current-head CI → deployment and public registration.
Do not expose existing content by disabling login_required. Do not enable broad
Google API scopes. Public credentials use only openid/email/profile, a web
client and native Discourse `/auth/google_oauth2/callback`.

## Observed starting state

- Existing PR #1, head e12a62e, has both required hosted checks passed.
- Forum uses `https://ubuntu-asus.tail349cbf.ts.net:8443` with environment-enforced
  login_required/invite_only/must_approve_users=true and disable_emails=non-staff.
- Native local login works; SMTP is absent and social logins are disabled.
- The canonical community bootstrap rejects any non-private admission profile;
  changing the admin UI alone cannot override launcher values or survive reapply.
- The Next homepage is still a demo with unimplemented Tử Vi claims and sample
  testimonials; it cannot represent the actual public app for Google verification.
- Google CLI was refreshed using minhnkn22@gmail.com. The account can list six
  projects, none named for Thật Space. Its unrelated default claude-gmail-work
  project is preserved and is not used for this client.
- Infisical That Space/prod currently contains only OPENROUTER_API_KEY.
- Public domain/support email are pending user input. No production admission,
  endpoint, email or social-login setting has changed yet.

## Planning consultation and routing

Routing session: `that-space-public-launch-20261005`.
Direct exploration decision: `9a57b80c-d413-4a7b-b533-ed2fd5bced7b`.
Planning decision: `2fab0ef1-e056-47ac-87e1-b6ada6051d91`, enforced OpenCode/default.
Durable planning job: `d8b3408a-4478-48b4-ac0e-16180d05436f`.
Exact owner:
`codex:that-space-public-launch-20261005:launch-plan:Thật Space self-service launch dependencies`.
Output cursor 0; event cursor 154. Read and retain its result before assembly.
One final cross-family code review follows coherent implementation and focused
verification; no worker opens a separate PR, pushes or triggers CI.

## Superseded decisions, Oct5

The user chose **Google-only** admission and a **Vercel URL** for the public
site, superseding the email-activation and custom-domain assumptions below.

- **No SMTP.** Supabase's built-in SMTP cannot serve this: it is capped at 2
  messages/hour and only delivers to pre-authorized org addresses, and it is
  wired to Supabase Auth rather than to Discourse, which owns authentication
  here. Moon's `CLAUDE.md` records that Moon uses Resend SMTP with domain
  `atumplatform.com`; that account's key is not available to this repository.
  No launch-critical credential exists in Infisical for it.
- **Consequence:** with no mailer, `enable_smtp=false` and
  `disable_emails=yes`. Its valid choices are `no`, `yes` and `non-staff`; `all`
  fails validation at boot. Members are notified in-app. Bà Mối relay notices,
  match reveals and closure messages ride on personal messages, so members who
  never open the bell may miss them; adding transactional email is the highest
  value follow-up.
- **`enable_local_logins=false`** makes the no-activation trap structurally
  impossible. Verified against the pinned Discourse SHA `c237680`:
  `UsersController#create` returns 403 only when both `has_authenticator?` is
  false *and* `enable_local_logins` is false, so a completed OAuth handoff still
  creates the account while a password signup is refused.
- **Atum-branded OAuth consent screen is intended**, not a compromise. Reuse
  follows the Moon/Andy pattern: add one redirect URI, rename no shared brand,
  remove no existing URI. If Atum's consent screen is already verified, members
  avoid the unverified-app warning that a `vercel.app` host would otherwise show.
- **Access recovery is a known gap:** a member who loses their Google account has
  no self-service recovery and needs staff help.

## Two failures the real Discourse suite caught

Both were invisible to typecheck, lint, the 289 local Vitest tests and the
production build. Only the real Discourse suite exercises these values, which is
the argument for keeping it a required check.

1. **`disable_emails: "all"` does not exist.** The setting is an enum whose only
   choices are `no`, `yes` and `non-staff` in the pinned SHA `c237680`. The bad
   value raised `Discourse::InvalidParameters` from `SiteSetting#set` during
   reconciliation, aborting the boot and failing all 19 member/community
   examples before any member flow ran. The correct value for a deployment with
   no mailer is `yes`.
2. **The OAuth handoff must be seeded in the server session, not the Rack
   session.** `UsersController#create` passes `server_session` to
   `UserAuthenticator`, which reads `:authentication` from the Redis-backed
   `ServerSession`. Seeding the Rack `session` leaves `has_authenticator?` false,
   and with local logins disabled that is a **403 at account creation** — the
   account is never made, so there is nothing to log in as. Fixed by seeding via
   Discourse's own `server_session` helper.

   This took two CI rounds to find, and the first attempt was wrong in an
   instructive way: priming `get "/session/hp.json"` fixed the nil `session`
   error but left the 403, because it created the server session while seeding
   the wrong store. Reading the call chain to the end was what settled it.

3. **`User.find_by_email!` does not exist.** Only `find_by_email(email,
   primary: false)` is defined, and it returns nil rather than raising. The
   specs now assert the result explicitly.
- **The redirect URI must include the port**, with no trailing slash:

  ```text
  https://ubuntu-asus.tail349cbf.ts.net:8443/auth/google_oauth2/callback
  ```

  `docs/plans/2026-09-27-ba-moi-build.md` records this URI without `:8443`;
  Google matches redirect URIs exactly, so that string yields
  `redirect_uri_mismatch`.

## Acceptance before opening registration

- `ENABLE_GOOGLE_OAUTH2_LOGINS=true` with real credentials and a fresh Google
  callback creates a non-staff account, completes all 15 fields and enters member
  content; a password signup returns 403 and creates no account.
- Real Google callback succeeds with a non-staff identity, respects onboarding,
  links an existing verified account safely and does not require staff approval.
  Staff recovery for a member who loses Google access is a documented manual
  procedure, not an automated email flow.
- Guest access to existing posts/uploads remains denied; member access works.
- Public homepage/privacy/terms/contact and logo are accessible without login;
  Cloud branding URLs match the verified domain and exact live callback.
- Bà Mối consent, matching/reveal/block/delete and review-only moderation retain
  the already verified behavior. Taylor's services and Funnel443 remain intact.
- Cold-start signed-in/posting readiness passes before registration opens.
