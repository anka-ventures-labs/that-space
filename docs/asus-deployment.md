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

The manifest keeps login, invite-only access and staff approval enabled, and
sets the no-email beta mode (`disable_emails: non-staff`) and Vietnamese locale.
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

The only application data path is `/var/discourse/shared/that-space`: it holds
PostgreSQL data, Redis persistence, uploads, logs, backups and the archived
source. Discourse backups are under
`/var/discourse/shared/that-space/backups/default`; uploads are under
`/var/discourse/shared/that-space/uploads`. Configure daily backups, copy them
off the ASUS, and prove a restore into an isolated instance before inviting
members. A backup that has not been restored is not sufficient recovery
evidence.

Before invitations, verify private guest denial, staff-assisted activation and
recovery, upload access through the Funnel, restart recovery, backup/restore,
phone layout, Vietnamese moderation behavior, and the real Bà Mối relay. The
repository's GitHub acceptance checks validate the pinned build; they do not
replace these live checks.

### Observed Oct4 live checkpoint

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
`Ba_Moi_bot` (ID -1201, agent ID 1) exist. The 12 Bà Mối tools and their native
encrypted secret binding are installed; installer check reports no drift.
Persona and relay keys pass own-user access and reject impersonation. All ten
service runtime variable names are present in this project's Vercel preview and
production environments. No provider key or default LLM is configured yet, and
member AI conversations remain disabled.

An initial pre-community backup was copied off-host to ignored
`.backups/discourse/pre-community-20261004-v20261001073226.tar.gz` (2,887,594
bytes, mode 600). This archive predates the community and bot setup; a final
backup and isolated full restore remain required. The current checkpoint does
not claim live model, relay, upload, recovery, restart or phone acceptance.

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
