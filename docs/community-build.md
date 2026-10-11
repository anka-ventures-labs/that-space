# Community build and acceptance

The member product runs in Discourse. This repository now contains its owned
configuration, onboarding questions, branded theme, extension pins, and real
Discourse request/browser acceptance tests. The Next.js pages remain the public
demonstration. Full charts, readings, reading history, and PDFs are outside this
phase; future astrology work starts from Moon reuse.

## Reproduce the build

`discourse/runtime.lock.json` pins Discourse, the official Linux test image,
Follow, User Portfolio, and Topic List Thumbnails. Calendar & Events, Automation,
and Discourse AI are bundled in that Discourse revision. The portfolio and
thumbnail components are MIT; Follow is GPL-2.0; Discourse is GPL-2.0. The
preparation script fetches exact commits rather than moving branches and refuses
dirty extension checkouts or mismatched repositories.

With an existing checkout at the locked Discourse revision:

```bash
python3 scripts/discourse/prepare-runtime.py --discourse-path /path/to/discourse
```

It installs no dependencies and starts no service. Install Discourse's own
dependencies using its documented runtime, then execute our specs within that
checkout with `THAT_SPACE_REPO` set to this repository's absolute path:

```bash
RAILS_ENV=test LOAD_PLUGINS=1 THAT_SPACE_REPO=/path/to/that-space bundle exec rspec --require ./spec/requests/that_space/spec_helper.rb spec/requests/that_space
RAILS_ENV=test LOAD_PLUGINS=1 THAT_SPACE_REPO=/path/to/that-space bundle exec rspec --require ./spec/system/that_space/spec_helper.rb spec/system/that_space
```

The GitHub `CI` workflow performs these operations on `ubuntu-latest`, inside
the pinned official test container. It creates disposable PostgreSQL/Redis,
loads the real plugins, compiles the actual frontend and runs Chromium system
tests. The separate service job runs tests, typecheck, lint and build. No
production credentials, deployment, paid AWS host, or self-hosted runner are
part of this workflow. Review checks on the PR's current head.
The helper uses RSpec's [fail-if-no-examples configuration](https://rspec.info/features/3-13/rspec-core/configuration/fail-if-no-examples/)
and is required explicitly so an empty/misconfigured suite cannot pass silently.
Current acceptance evidence is recorded on
[PR #1](https://github.com/anka-ventures-labs/that-space/pull/1). Its current-head
service and Discourse checks, together with the retained
[assembly review](reviews/community-assembly-20261001.md), are the build gate.

## Apply owned configuration

After preparing the extensions and taking a backup on an established instance,
run these from the pinned Discourse checkout. Use `RAILS_ENV=production` only
on the selected instance; the commands below are explicit application steps.

```bash
THAT_SPACE_COMMUNITY_BOOTSTRAP=1 bundle exec rails runner /path/to/that-space/discourse/community/bootstrap.rb
THAT_SPACE_PRESENTATION_BOOTSTRAP=1 bundle exec rails runner /path/to/that-space/discourse/presentation/bootstrap.rb
THAT_SPACE_COMMUNITY_BOOTSTRAP=1 bundle exec rails runner /path/to/that-space/discourse/community/bootstrap.rb -- --check
THAT_SPACE_PRESENTATION_BOOTSTRAP=1 bundle exec rails runner /path/to/that-space/discourse/presentation/bootstrap.rb -- --check
```

The community reconciler owns its marked categories/groups, external-ID user
fields and named role automation. Same-named unowned records cause a conflict;
resolve ownership deliberately before reapplying. It creates 13 categories
(including four art subcategories), staff-post/member-read announcements, five
private interest groups, one required 18+ attestation, and all 15 required,
editable community signup questions. Answers are excluded from other members'
profiles/cards/search. They never populate
the matchmaking pool without its separate consent flow. Interest groups grant
neither trust levels nor staff access.

Privacy is enforced at the site boundary by required login. Google is the only
self-service identity path; local passwords are disabled, and signup requires
the 18+ attestation plus all community fields. Category ACLs use Discourse's
standard `everyone` audience inside that private site, with staff-only posting
in announcements. This permits native
profile featured topics; core refuses to feature topics in group-restricted
categories. The reconciler requires this admission contract in its manifest,
and request acceptance denies guest topic reads and uploads.

Q1 membership is assigned by the enabled native first-login Automation script. Editing
Q1 later requires staff to reconcile interest-group membership: the native script
adds membership but does not remove a previous selection. Q4/Q8 have separate
storage keys; Q15 preserves its four offered answers and leaves the unused Art
action unmapped. Source provenance is recorded in the manifest and phase plan.

The presentation reconciler stores theme ownership in `PluginStore`, detects
source/field/settings drift, imports local pinned sources, preserves unrelated
child components, and sets the default member theme. The gallery uses image
tiles; the artist's Tác phẩm tab queries her own topics in Triển lãm. Member
profiles allow bios, headers and featured topics. Follow is enabled for
members with topic notifications and opt-out. Hosts may create their own events;
members can RSVP; Host interest membership does not permit staff administration.

The theme links forum, gallery, events and the member's profile. Set
`ba_moi_username` to the exact installed AI account after running the existing
Bà Mối installer/probe. Its private-message CTA is part of the public launch. It uses
Discourse's composer and private-message permissions. Gallery/event links are
same-site paths. Vietnamese navigation, palette and logo are included for
desktop/mobile. Inter and Playfair Display are self-hosted theme assets with
Latin/Vietnamese subsets; provenance and SIL licenses are retained in
`discourse/theme/assets/`. Browser acceptance verifies the imported theme.
The same owned logo upload configures Discourse's desktop/mobile header.
Successful desktop/mobile/composer screenshots are retained in the CI artifact
alongside failure diagnostics.

## Acceptance and live boundaries

The request/browser specs exercise a completed Google OAuth handoff, rejection
of password signup/login, all 16 required fields, topics/replies, notifications,
moderation flags, private profile answers, member profiles/artwork,
following/opt-out, Host events/RSVP, theme import/drift, guest navigation and the
Bà Mối composer. Test members and events are synthetic. These tests do not
claim outgoing email delivery or an actual AI model response.

The no-email release uses Google verification in place of activation mail and
requires staff-assisted recovery when a member loses their Google account.
Before public promotion, verify the real OAuth callback, actual reverse proxy
upload access, restart, backup/restore and narrow phone behavior. The
configuration denies anonymous upload downloads through Discourse; direct
storage/proxy access must also be tested on the chosen host. Staff workflows are
recorded in [Vietnamese community operations](community-operations.md).

The versioned `discourse/moderation/` configuration uses native `llm_triage` for
both spam and toxicity classification and sends matches to human review. It
excludes private messages, bot posts, tools, images, attachments and onboarding
answers. It deliberately keeps the native SpamDetector scanner off: the pinned
scanner can automatically hide posts and silence users, which exceeds this
beta's review-only behavior. The same required spam/safety detection is performed
by the triage rule. It does not automatically reply, delete, hide or sanction.

Select an existing, configured Discourse AI LLM with attachment support disabled,
then apply/check without copying its credentials into this repository:

```bash
THAT_SPACE_MODERATION_BOOTSTRAP=1 THAT_SPACE_MODERATION_LLM_MODEL_ID=42 bundle exec rails runner /path/to/that-space/discourse/moderation/bootstrap.rb
THAT_SPACE_MODERATION_BOOTSTRAP=1 THAT_SPACE_MODERATION_LLM_MODEL_ID=42 bundle exec rails runner /path/to/that-space/discourse/moderation/bootstrap.rb -- --check
```

The model ID above is a placeholder. Hosted tests supply canned model responses
to prove flag/no-flag and PM/bot exclusion; they do not measure Vietnamese model
accuracy. Live moderation tuning/acceptance remains a gate alongside the existing Bà Mối agent,
signed webhook, retry schedule and two-member relay/reveal/block tests. Use
[the Bà Mối readiness record](local-beta-readiness.md) and
[the phase plan](plans/2026-10-01-whole-app.md) for those gates. Passing hosted
acceptance does not mean a live community has been launched.
