# Discourse on the ASUS: historical setup notes (W-D)

**Superseded on 2026-10-05:** use the current
[ASUS deployment runbook](asus-deployment.md) and pinned
[`that-space.yml.example`](../discourse/deployment/that-space.yml.example).
The private forum is installed on loopback 8080 and separate Funnel 8443 after
Atum Matrix removal. Preserve Taylor MinIO and Funnel 443 to 8787. Do not execute
the historical unpinned build, generic `app` launcher, swap or default Funnel
commands below against the running host. AWS remains excluded.

These notes were prepared on 2026-09-27 and were not used for the current
installation. A read-only check that day found:
- Ubuntu, 3.2 GB of RAM (1.6 GB available) and 370 GB of free disk.
- Docker not installed.
- `minhnkn` has sudo.
- Atum's services (`atum-chat-backup-sshd`, `atum-chat-tunnel`) still running.

Facts checked against Discourse's source (`discourse/discourse`, main on
2026-09-25) are marked *(source)*. Current pins, host facts and recovery evidence
are recorded in the deployment runbook and session log.

## 1. Host

```bash
# 2 GB of swap: Discourse needs it with 3.2 GB of RAM.
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-discourse.conf && sudo sysctl --system

# Docker from Docker's apt repository (https://docs.docker.com/engine/install/ubuntu/).
sudo git clone https://github.com/discourse/discourse_docker.git /var/discourse
```

## 2. `containers/app.yml`

Start from `samples/standalone.yml`. The forum has no SSL of its own, because
Tailscale Funnel terminates TLS, and it is exposed only on localhost:

```yaml
templates:
  - "templates/postgres.template.yml"
  - "templates/redis.template.yml"
  - "templates/web.template.yml"
  - "templates/web.ratelimited.template.yml"
expose:
  - "127.0.0.1:8080:80"          # only the Funnel reaches it
params:
  db_default_text_search_config: "pg_catalog.simple"   # Vietnamese: no English stemming
  db_shared_buffers: "256MB"
env:
  LC_ALL: en_US.UTF-8
  LANG: en_US.UTF-8
  LANGUAGE: en_US.UTF-8
  UNICORN_WORKERS: 2
  DISCOURSE_HOSTNAME: ubuntu-asus.tail349cbf.ts.net
  DISCOURSE_DEVELOPER_EMAILS: "<Minh's admin email>"
  # No outgoing email in the beta: an admin activates accounts by hand.
  DISCOURSE_SMTP_ADDRESS: localhost
  DISCOURSE_SMTP_PORT: 25
  DISCOURSE_SMTP_ENABLE_START_TLS: false
volumes:
  - volume: { host: /var/discourse/shared/standalone, guest: /shared }
  - volume: { host: /var/discourse/shared/standalone/log/var-log, guest: /var/log }
hooks:
  after_code:
    - exec:
        cd: $home/plugins
        cmd:
          - git clone https://github.com/discourse/docker_manager.git
          # Not bundled in core. Pin the commit you installed and record it here.
          - git clone https://github.com/discourse/discourse-follow.git
```

Then build it and create the first admin, who is active at once:

```bash
cd /var/discourse
sudo ./launcher rebuild app
sudo ./launcher enter app
rake admin:create
```

## 3. Funnel

```bash
sudo tailscale funnel --bg 8080
tailscale funnel status
```

From outside the tailnet, `https://ubuntu-asus.tail349cbf.ts.net/srv/status`
must return `ok`. After that, set `force_https` to true in the admin settings.

## 4. What's bundled, and what isn't *(source)*

- **Bundled in core:**
  - Discourse AI (agents, formerly called personas)
  - Automation
  - Chat
  - Calendar and events, now the `discourse-events` plugin. The old
    `discourse-calendar` repository is archived.
- **Separate:**
  - `discourse/discourse-follow`, an official plugin (see `app.yml`).
  - Theme components, installed from git in Admin > Customize:
    - `https://github.com/discourse/discourse-user-portfolio` for the "Tác phẩm"
      profile tab.
    - `https://github.com/discourse/discourse-topic-thumbnails` for image tiles
      in Triển lãm. It replaces Pavilion's Topic List Previews, whose
      repository is gone.

  Record each component's commit when you install it.

## 5. Site settings

- **Access:**
  - `login_required`, `invite_only` and `must_approve_users` on
  - `enable_local_logins` on
  - Google login stays off until Minh adds OAuth at the end
- **Language:**
  - `default_locale` is `vi`
  - `allow_user_locale` is on
- **Email:** `disable_emails` is `non-staff` or `yes`, since there's no SMTP.
- **AI:**
  - `discourse_ai_enabled` on
  - An LLM for OpenRouter (provider `open_router`, with Minh's key) that
    supports tool calls
- **Members:**
  - `personal_message_enabled_groups` must include the members, so they can
    message Bà Mối.
  - Create the categories and user fields (Thảo's 15 signup questions) from
    the spec.
  - Automation's "user group membership through badge or user field" script
    sets each member's group from question 1.
- **Backups:**
  - `backup_frequency` is 1 (daily)
  - `maximum_backups` is 7
  - Copy one off the ASUS weekly (the plan's backup rule)

## 6. Bots, keys, webhook and agent

1. **Create Thư Duyên, the relay bot:** a normal user named `thu_duyen`, active
   and approved, created through the admin API or the console.
2. **Deploy the service** (W-F) and install Bà Mối with `npm run
   discourse:install`. That creates the AI secret `ba_moi_tool_secret`, the 12
   `ba_moi_*` tools, the "Bà Mối" agent and its bot user.
   - It is idempotent, and `--check` reports drift from the repo by checksum.
   - Configure a dedicated native provider secret/model, then set
     `BA_MOI_LLM_ID` and `BA_MOI_ALLOWED_GROUP_IDS` to the instance's model and
     intended groups for both apply and check. Empty groups leave the persona
     unavailable to ordinary members. Enable native AI for those same groups
     and set the owned theme's `ba_moi_username` from the generated bot readback.
   - It needs an all-users admin key (`DISCOURSE_ADMIN_API_KEY`). Use it only
     from a trusted machine, never put it in Vercel, and revoke it after.
3. **API keys for the service:** two single-user keys, one for Bà Mối's bot user
   and one for `thu_duyen`, with write scope for topics and posts. They go into
   Vercel as `DISCOURSE_PERSONA_API_KEY` and `DISCOURSE_RELAY_API_KEY`. A leaked
   key can post only as its bot.
4. **Bot user ids:** put both into `BA_MOI_BOT_USER_IDS`. The relay's author
   check is a second guard against loops.
5. **The webhook:**
   - payload URL `https://<service>/api/ba-moi/v1/webhooks/discourse`
   - content type `application/json`
   - secret `DISCOURSE_WEBHOOK_SECRET`
   - the Post event only (`post_created`)
   - TLS verification on

   Private-message posts fire `post_created` like any other post
   *(source: `WebHook.enqueue_post_hooks`)*.
6. **Test accounts:** create them active through the admin API (`POST
   /users.json` with `active` and `approved`).

## 7. Checks

```bash
npm run discourse:probe
```

It checks four things:
- the Funnel health endpoint
- that each bot key acts only as its own bot
- that the webhook is configured, when an admin key is present
- that the deployed service refuses an unauthenticated tool call

Then the spec's "Done means" loop runs with two test members.

**Tool-script facts** *(source: `lib/agents/tool_runner.rb`)*:
- A script gets 2 seconds of its own time and up to 20 HTTP requests.
- Time waiting on HTTP isn't counted, because requests run as attached
  functions. So the service's latency budget is about the member's patience,
  not the script limit.
- `context` carries `user_id`, `username`, `topic_id`, `private_message` and
  `participants`.
- `secrets.get(alias)` reads a bound AI secret.

## 8. Operations

- `./launcher rebuild app` about monthly, re-pinning the plugin and component
  commits.
- **Rotating the tool secret:**
  1. Set the new value in Vercel and redeploy.
  2. Run `npm run discourse:install` with the new `BA_MOI_TOOL_SECRET`, which
     updates the AI secret.
  3. Confirm the old secret gets a 401.
- **Rotating a bot key:** create the new single-user key, update Vercel,
  redeploy, then revoke the old key.
