# Public launch planning consultation, Oct5

Retained job `d8b3408a-4478-48b4-ac0e-16180d05436f`, enforced route
`2fab0ef1-e056-47ac-87e1-b6ada6051d91`, OpenCode/default (Muse Spark).
Final output cursor 0; event cursor 9704. The provider's repository read tools
failed, so it used the typed context supplied by the coordinator. Treat this
as planning advice, not an independent source-code verification.

## Retained advice and coordinator decision

- Keep `login_required=true`: current category permission `everyone:full`
  depends on the global login boundary, and existing member content must not
  become public when registration opens.
- Public domain/support contact and working SMTP are prerequisites for
  branded OAuth, verification email and password-reset recovery.
- Canonical manifest/bootstrap and environment-forced launcher values must
  agree. Admin-UI changes alone cannot survive reapplication or override env.
- Use native Google auth with openid/email/profile, preserve mandatory 15-field
  onboarding, test verified-email linking, wrong-email rejection and recovery.
- Prove guest/forged-cookie upload denial alongside member access, and verify
  signed-in posting after cold starts rather than trusting health alone.
- Keep one assembly and final review; workers do not independently deploy/push.

The consultant recommended keeping manual staff approval. That would conflict
with the user's explicit self-service request, so the planned public profile
uses `must_approve_users=false`, verified identities and mandatory onboarding.
The earlier private admission profile remains the live default until public
authentication/email tests pass. This is a launch gate, not a new policy engine.

The user subsequently authorized reuse of Atum Platform's verified credentials
if needed. Inspect that exact project's existing clients/branding first; do not
rename a shared brand or remove its existing redirect URIs. A separate Thật
Space project was created before that update and contains no OAuth client yet.
The unrelated Gmail-integration project remains outside scope.
