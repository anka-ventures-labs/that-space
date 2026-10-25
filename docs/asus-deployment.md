# ASUS deployment: private Thật Space beta

This is the current, narrow deployment procedure for the ASUS after the Atum
Matrix stack has been removed. It creates one new Discourse container named
`that-space`; it does not migrate, stop, reconfigure, or inspect Taylor's
services.

The instance has a single public origin:

```text
https://ubuntu-asus.tail349cbf.ts.net:8443
```

Taylor retains MinIO on ports 9000/9001 and the existing Funnel listener on
443 (including Taylor's service on 8787). Thật Space binds Discourse only to
`127.0.0.1:8080`; a separate Funnel listener on 8443 forwards to that loopback
port. Do not replace or reset the 443 Funnel configuration.

The historical [ASUS setup notes](discourse-setup.md) stay as historical
context. This document and
[`discourse/deployment/that-space.yml.example`](../discourse/deployment/that-space.yml.example)
are the launch procedure for this deployment.

## Before the first build

The ASUS is available after Atum Matrix removal; no OS wipe or reboot is a
prerequisite. Perform these checks before a first build. They are read-only
except where explicitly marked as setup:

```bash
df -h /
free -h
swapon --show
docker --version
docker info --format '{{.Driver}}'
sudo ss -ltnp '( sport = :8080 or sport = :8443 or sport = :9000 or sport = :9001 )'
sudo tailscale funnel status
```

There should be at least 2 GiB of active swap for this 3.2 GiB machine. The
only listener the Discourse launcher will create is `127.0.0.1:8080`. The
expected existing allocations are MinIO 9000/9001 and Funnel 443; stop only an
old Atum process if the preceding migration confirmed it is obsolete. Do not
run `docker system prune`, `docker container prune`, or a generic Docker
cleanup: those would include Taylor's resources.

Record the launcher checkout and base image used for this release before
building. The example file depends on the current launcher templates; its
observed compatibility is with launcher commit `8d705a91866c320592ce851f30895ddb4c3e85fe`.
The operator must record the actual checked-out launcher revision and resolved
`discourse/base` digest in the deployment note. The first pull resolved to
`sha256:5028d077b061225507e7093fda1ff5bdc64d483b5c0397776f9a52c50008cd9b`;
the example now uses this immutable base digest instead of a moving tag.

Install Docker and create the 2 GiB swap file only if these checks show they
are absent. Those are host changes and belong to the deployment operator; do
not make them part of an application rebuild.

## Stage the immutable application source

The Pups hook reads the repository from `/shared/source`, which maps to
`/var/discourse/shared/that-space/source` on the host. Archive the exact Git
commit being deployed, rather than copying a working directory or an ignored
environment file. From an up-to-date checkout of this repository:

```bash
git status --short
git rev-parse HEAD
git archive --format=tar HEAD | ssh <asus-host> \
  'sudo install -d -m 0755 /var/discourse/shared/that-space/source && sudo tar -xf - -C /var/discourse/shared/that-space/source'
```

Use a newly created, empty `source` directory on first deployment. For a later
release, take a Discourse backup first, then move the existing `source` directory
to a sibling named for its recorded commit before creating an empty `source`
directory and extracting the selected archive. Do not extract over the old
tree: tar does not remove files deleted by a newer commit. Retain the previous
tree for rollback and record both commit IDs. The archive
must include `discourse/runtime.lock.json` and
`scripts/discourse/prepare-runtime.py`.

Copy the launcher configuration, replace only the administrator email
placeholder, and retain the filename because it determines the container name:

```bash
scp discourse/deployment/that-space.yml.example <asus-host>:/tmp/that-space.yml
ssh <asus-host> 'sudo install -m 0640 /tmp/that-space.yml /var/discourse/containers/that-space.yml'
```

The configuration locks Discourse at
`c237680d280a34b1025f79bf37b865c5349313a3`. Its `after_code` hook executes
after the launcher has checked out that core revision and before dependency and
asset stages. `prepare-runtime.py` refuses a mismatched core, then clones and
detaches the required Follow plugin at
`419abd56f69c34ce8e94ad8e267c3c556790e683` and stages the locally pinned
portfolio and thumbnail component sources. It does not install dependencies,
read credentials, or start a service.

The selected launcher base image does not promise `python3`, while the pinned
preparer is a Python program. Its narrowly scoped `before_code` hook installs
only `python3` if absent; the following `after_code` hook can then run the
preparer before bundle and asset stages.

The preparer runs as the existing container `discourse` user, which owns the
core checkout. This avoids Git's dubious-ownership refusal and keeps the pinned
plugin/component checkouts under the application user. Archived source contains
no environment files and is readable by that user. The container and bootstrap
are limited to two CPUs and 2 GiB RAM (4 GiB including swap) so Taylor retains
host capacity.

The locked core's `config/discourse_defaults.conf` accepts every
`DISCOURSE_*` environment setting as production configuration. The web template
writes these settings into `config/discourse.conf`; its `copy-env` run step
does this before Unicorn starts. In that core revision, `SiteSetting.port =
8443` and `SiteSetting.force_https = true` make `Discourse.base_url` resolve to
`https://ubuntu-asus.tail349cbf.ts.net:8443`. The hostname itself must remain
port-free.

## Build and route

Only after the source and configuration are in place:

```bash
cd /var/discourse
sudo ./launcher rebuild that-space
sudo ./launcher logs that-space
```

Configure the existing Tailscale installation with a distinct Funnel listener
on **8443** that terminates HTTPS and forwards to `http://127.0.0.1:8080`.
Keep its public URL exactly as shown above. Verify both the local container and
external route without changing Taylor's 443 listener:

```bash
curl --fail http://127.0.0.1:8080/srv/status
tailscale funnel status
curl --fail https://ubuntu-asus.tail349cbf.ts.net:8443/srv/status
```

The first request may need the normal initial administrator setup. Create the
admin only from the container shell and never put passwords or API keys in the
launcher YAML:

```bash
cd /var/discourse
sudo ./launcher enter that-space
cd /var/www/discourse
bundle exec rake admin:create
```

## Apply the owned product configuration

Take and copy an initial backup before the following mutating application
commands. From the container shell, after the admin exists:

```bash
cd /var/www/discourse
THAT_SPACE_COMMUNITY_BOOTSTRAP=1 bundle exec rails runner /shared/source/discourse/community/bootstrap.rb
THAT_SPACE_PRESENTATION_BOOTSTRAP=1 bundle exec rails runner /shared/source/discourse/presentation/bootstrap.rb
THAT_SPACE_COMMUNITY_BOOTSTRAP=1 bundle exec rails runner /shared/source/discourse/community/bootstrap.rb -- --check
THAT_SPACE_PRESENTATION_BOOTSTRAP=1 bundle exec rails runner /shared/source/discourse/presentation/bootstrap.rb -- --check
```

The manifest keeps `login_required` on and sets the no-email mode
(`enable_smtp: false`, `disable_emails: yes`) with the Vietnamese locale.
Therefore a guest cannot see the community during first startup, before these
reconcilers run.

Enable `discourse_ai_enabled` before running the repository AI installer. The
pinned plugin hides its admin API routes while this setting is false, producing
404 responses even though the bundled plugin is installed. When using the native
site-setting API, PUT `/admin/site_settings/discourse_ai_enabled.json` with
`{"discourse_ai_enabled":true}` and read the setting back; a body containing
only `value` does not change it. Keep `ai_bot_enabled` false until an actual
provider credential and model are configured and tested.

Run `npm run discourse:install`, then `npm run discourse:install -- --check`
from the trusted operator checkout. The native agent's generated username and
negative user ID must be read back rather than guessed. Its serialized custom
tool tuples use `["custom-N",false,false]`; object key order in parameter schemas
is insignificant, while array order and values remain part of the drift check.
Issue separate single-user native API keys for that exact persona and the normal
relay user. Capture plaintext keys once to ignored, mode-600 secret storage and
configure only these scoped keys in the service. The all-users installation key
and administrator password do not belong in Vercel. Prove that each runtime key
can act as its own user and receives 403 when trying to act as `system`.

After an actual Discourse AI LLM is configured with its credentials outside the
repository, apply the review-only moderation configuration using that existing
model's numeric ID:

```bash
THAT_SPACE_MODERATION_BOOTSTRAP=1 THAT_SPACE_MODERATION_LLM_MODEL_ID=<existing-llm-id> \
  bundle exec rails runner /shared/source/discourse/moderation/bootstrap.rb
THAT_SPACE_MODERATION_BOOTSTRAP=1 THAT_SPACE_MODERATION_LLM_MODEL_ID=<existing-llm-id> \
  bundle exec rails runner /shared/source/discourse/moderation/bootstrap.rb -- --check
```

Do not configure a model ID or key just to make this command run. The remaining
live Bà Mối work is the existing agent/tool installer, two separate bot keys,
signed `post_created` webhook, retry scheduler, and a two-member acceptance
journey. It remains gated on a deployed service URL and real credentials.

## Durability, checks, and constrained rollback

### Local upload authorization

The stock Nginx configuration serves original and optimized images directly.
`prevent_anons_from_downloading_files` alone protects Rails short URLs but does
not protect those static URLs. The launcher installs the owned
[`private-uploads.conf`](../discourse/deployment/private-uploads.conf) server
outlet to require a native authenticated session before serving `/uploads/`.
Its internal subrequest uses `/session/current.json`; the pinned guest 404 is
translated to 403 for Nginx `auth_request`. It checks the session rather than
accepting the mere presence of a cookie. Upload responses use private/no-store
cache headers, and SVG downloads retain attachment disposition. Short URLs keep
the native Rails response path with sendfile acceleration disabled.

The only public exceptions are exact URLs for the owned theme's logo and six
fonts. Read the seven asset fields' `url` values from the owned theme's native
admin API after import, validate that each is an original upload on this origin,
and write exact `location = /uploads/...` blocks to
`/shared/operations/nginx/public-assets/owned-theme.conf`. Each block uses
`root $public`, `auth_request off`, and `try_files $uri =404`; do not allow whole
directories or extensions. This separate shared file survives rebuilds. A
member upload with the same bytes as the public logo is that public asset after
Discourse deduplication; use a distinct image for privacy acceptance.

For an existing running container, install the repository outlet into
`/etc/nginx/conf.d/outlets/server/that-space-private-uploads.conf`, then run
`nginx -t` before `nginx -s reload`. Test original, short and optimized upload
URLs as a signed-in member, a guest and a forged-cookie guest; verify exact
branding URLs still work on the login page. This is scoped to Thật Space's
container and does not modify the host proxy or Taylor's listener.

The only application data path is `/var/discourse/shared/that-space`: it holds
PostgreSQL data, Redis persistence, uploads, logs, backups and the archived
source. Discourse backups are under
`/var/discourse/shared/that-space/backups/default`; uploads are under
`/var/discourse/shared/that-space/uploads`. Configure daily backups, copy them
off the ASUS, and prove a restore into an isolated instance before inviting
members or opening public registration. A backup that has not been restored is not sufficient recovery
evidence.

Before public registration, verify private guest denial, the required 18+
attestation, a real Google OAuth signup without staff action, staff-assisted
recovery, upload access through the Funnel, restart recovery, backup/restore,
phone layout, Vietnamese moderation behavior and the complete Bà Mối journey. The
repository's GitHub acceptance checks validate the pinned build; they do not
replace these live checks.

### Observed Oct5 initial live checkpoint

The durable `that-space-bootstrap-20261004` unit completed successfully. Its
image is `local_discourse/that-space` with ID
`sha256:e0e89b087eec0bb5847deba8a0d9ae28a549132071328b538afb9ba23ad14e97`.
The container has been started; do not start another bootstrap or recreate
operator keys when resuming this checkpoint. Community and presentation apply
and check both report zero drift: 13 owned categories, 15 user fields and five
owned groups. The canonical base URL and all three private access flags were
verified from Rails before enabling Funnel 8443. External health returns 200;
guest `/latest.json` returns 403. Funnel 443 remains on Taylor's 8787, and MinIO
remains active. Daily backups include uploads, retain seven archives and run at
20:30 UTC.

Administrator `minh` (ID 1), relay `thu_duyen` (ID 2) and native persona
`Ba_Moi_bot` (ID -1201, agent ID 1) exist. The 12 Bà Mối tools and their
native secret binding are installed; installer check reports no drift.
Persona and relay keys pass own-user access and reject impersonation. All ten
service runtime variable names are present in this project's Vercel preview and
production environments. At this initial checkpoint, no provider key or default
LLM was configured and member AI conversations were disabled. This is
historical evidence from before the 2026-10-08 adult-attestation field and
controlled-pilot manifest. Resumed
acceptance below supersedes that state.

An initial pre-community backup was copied off-host to ignored
`.backups/discourse/pre-community-20261004-v20261001073226.tar.gz` (2,887,594
bytes, mode 600). Keep it unchanged. The later
`community-checkpoint-20261005-v20261001073226.tar.gz` includes uploads and was
copied off-host with matching SHA-256
`c8256a7280633cc9badaddeb4176d2f8b4f63340268cf12c11b36d00d60d2c14`
(4,769,089 bytes). The isolated native restore passed: all twelve recorded
table counts match, no original upload is missing, `rake uploads:missing_files`
exits zero without output, and a restored image returns HTTP 200. The disposable
container was removed; the live container restarted with its ID preserved.
Health, private access flags, community/presentation drift, both bot key scopes
and optimized-upload member/guest/forged-cookie access passed after restart.
Retained nonsecret evidence is in
[`verification/discourse-restore-20261005.json`](verification/discourse-restore-20261005.json).

The native archive does not include the launcher or shared Nginx operations
files. Their separate private off-host bundle is
`.backups/discourse/operations-1787b83-20261005.tar.gz`; Git retains source and
private operator storage retains credentials. ASUS source `ae50556` is retained
as `source-ae50556`; the current source was extracted into an empty tree from
`1787b83`, without rebuilding the image or recreating keys.

The canonical Vercel service now runs exact source `1787b83` in `sin1`, with a
60-second tool function. The user approved staging the locally audited
production artifact with `--prebuilt --prod --skip-domain`, testing it, then
manually promoting it. No remote compilation ran. Native signed event201
webhooks deliver member text and ignore bot events. The owned five-minute
retry job passed apply/check/reapply and actual scheduled HTTP receipts. A
reveal notification queued during the intentional forum outage was delivered
automatically after restart and read by its recipient.

The controlled production service journey also passed mutual reveal, native
contact delivery after reveal, bot-loop refusal, blocking and refusal to relay
a later post. Both closure notices arrived. Explicit service deletion removed
the tested member's rows and matching outbound payloads from all eleven tables,
while disclosed native message history remained. The remaining synthetic
profile is paused; 30 labelled sample cards remain and no synthetic profile is
discoverable. See
[`verification/live-service-20261005.json`](verification/live-service-20261005.json).
These controlled calls verify the service and native transport, not actual
LLM conversation or phone rendering.

Two synthetic normal members have verified activation/approval, password and
session recovery, private onboarding fields, artwork/portfolio, following,
Host event/RSVP, human review and private relay isolation. Original, short and
actual optimized member uploads deny guests and forged cookies. At that
checkpoint, actual model conversation, review-only AI moderation and
rendered phone acceptance were still outstanding. Those checks were completed
in the resumed session below.

### Resumed native AI acceptance, Oct5

The original chat's SQLite history is damaged, but its complete archived JSONL
was recovered without modifying the app database. ASUS/source were intact;
no bootstrap, container recreation or new deployment ran. Nonsecret evidence:
[`verification/session-recovery-20261005.json`](verification/session-recovery-20261005.json).

The dedicated provider credential is in Infisical **That Space / prod /
OPENROUTER_API_KEY**. Native secret `that_space_openrouter` (2) binds two
open_router models: `anthropic/claude-sonnet-5` (1), used by the moderation
classifier, and `deepseek/deepseek-v4.1-flash` (2), Bà Mối's model since
2026-10-25 (native tool calling; about $0.02/$1.00 per million input/output
tokens versus $2/$10). To roll Bà Mối back, set `BA_MOI_LLM_ID=1` and rerun
`npm run discourse:install`. Native streaming/non-streaming validation passed. `ai_bot_enabled=true`; persona/global allowed group is
registered members (10); theme `ba_moi_username=Ba_Moi_bot`. Keep
`BA_MOI_LLM_ID=2` and `BA_MOI_ALLOWED_GROUP_IDS=10` in this installation's
private operator configuration for both apply and check. Empty allowed groups
do not grant ordinary member access. Read IDs from a new instance instead of
assuming them. Final installer check reports no drift. No provider value is
in Git or Vercel; native secret binding does not imply encryption at rest.

Actual non-staff conversations exercised all 12 tools, with 56 successful
native provider audit records. Consent, interview/card approval, empty-result
handling, interest/acceptance, private relay rooms, pause/resume and confirmation
before reveal/block/deletion passed. Native cooldowns queued two initial
match deliveries; the existing scheduler sent both on attempt two. Each relay
room denies the other member. Both approvals reached `revealed` and both
native profile links arrived (posts 111/115); Lan's queued notice was sent by
the scheduler at 04:40:01 UTC, before block confirmation at 04:40:54. Both
closure notices were read back (118/124). Native post timestamps, rather than
queue metadata alone, verify these deliveries. Confirmed model-driven deletion
leaves all eleven residual service-data/payload counts zero; the other fixture is paused, no
synthetic profile is discoverable and 30 labelled samples remain. Disclosed
native PM history remains.

Moderation apply/check passed with model 1. Vietnamese scam/abuse entered
pending staff review without hiding, deletion, silencing, suspension or an
automated reply. Benign, private and bot fixtures did not create reviews.
Only three owned public fixture topics were soft-deleted afterward.

Rendered 375×812 checks passed login, latest, 15 profile fields, gallery,
portfolio, event/RSVP and native Bà Mối CTA/composer without horizontal overflow.
A real phone UI pause message was acknowledged. Event layout also passed at
768/1440 pixels. Some upstream editor/event strings remain English. Only the
two API-created fixtures were promoted to TL1, matching the invited-member
default; neither is staff and no site quota was relaxed.

That rendered checkpoint is historical. The public release requires 16 signup
fields (the 18+ attestation plus those 15 questions), Google self-registration
and the visible Bà Mối CTA.

Cold rotational-disk I/O caused worker timeouts and temporary 502/503 responses.
The native supervisor recovered without manual restart or speculative tuning.
Warm signed-in pages, posting and AI succeeded, with no Docker restart or
observed OOM. Before public promotion and after cold starts, check a signed-in page and
native posting as well as `/srv/status`; health alone missed the stalled worker.
This records recovery, not a permanent storage-performance fix. Taylor MinIO
and Funnel 443 remain intact.

A new post-acceptance database/upload checkpoint was copied off-host to ignored
mode-600 storage: `th-t-space-2026-10-05-045818-v20261001073226.tar.gz`,
5,323,203 bytes, SHA-256
`21069e653bd565b6705db6cb9764fa7df6317f6d06fe4003e160dbe92d5f330f`.
Remote/local hashes match; outer archive and database gzip checks passed,
with 16 upload files present. The earlier archive retains the actual restore
drill proof; this fresh archive has not undergone another restore. For this
pinned native API, send `with_uploads: "true"` as a string: JSON boolean `true`
produces a database-only `.sql.gz`. A returned success starts a background
process; wait for the completed archive and inspect its contents.

### Isolated native restore initialization

The assembled image has already consumed and removed `/root/install_postgres`
during its first build. Its PostgreSQL run script cannot initialize an empty
shared root until that initializer is restored. Extract the exact
`/root/install_postgres` file contents from the recorded launcher's
`templates/postgres.template.yml` and install it only in the disposable target
before starting its PostgreSQL service. Do not copy live PostgreSQL data or
initialize the live volume. The initializer creates PostgreSQL 18 data and its
shared socket directory; the run script removes the installer after success.
`CREATE_DB_ON_BOOT=1` then creates the database/role/extensions, and
`MIGRATE_ON_BOOT=1` migrates and seeds the system user needed by the Restorer.
The Oct5 drill found and corrected this consumed-installer behavior; merely
setting the two boot flags produced a missing-socket failure.
No second bootstrap, image build or separate `db:create` is needed. On this
small host, stop only the live `that-space` container before starting the
disposable target so Taylor retains capacity. Use a different container name
and empty shared root, `--network none`, no published ports, restart disabled
and the same memory/CPU limits. Stage the selected native archive under the
target's own `/shared/backups/default/` before restore.

Prove that the target's system user exists and its PostgreSQL/Redis services are
ready. Execute Rails as OS user `discourse`, set `allow_restore` only in the
target, then use `BackupRestore::Restorer` with the archive basename,
`Discourse.system_user.id`, `BackupRestore::Factory` and `disable_emails:true`.
The Oct5 readback reported `disable_emails=non-staff` because the image's
environment overrides the setting; network-none, rather than that argument,
was the proven outbound/email boundary.
Retain success evidence, compare native table counts and run
`rake uploads:missing_files`. Test target loopback health from inside its
network namespace. Keep network isolation throughout so restored hooks and
provider credentials cannot call out. Remove only the disposable target after
the drill; restart only the live forum and verify health, canonical URL,
private flags and upload authorization again. Do not restore into the live
shared root or delete it.

To roll back only this release, first preserve an off-host backup and the
current source commit. Restore the previously recorded
`that-space.yml` and source archive, then run:

```bash
cd /var/discourse
sudo ./launcher rebuild that-space
```

If the route itself must be removed, remove only the Funnel listener on 8443
and stop only this container with `sudo ./launcher stop that-space`. Leave
Taylor's 443 Funnel, MinIO ports 9000/9001, all Taylor containers, and the
`/var/discourse/shared/that-space` data directory intact. Deleting that data
directory is a separate, destructive decision and is never a rollback step.
