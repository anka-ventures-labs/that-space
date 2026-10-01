# Community assembly review — 2026-10-01

Retained job: `b31ce0d5-03df-4e05-84d3-0fdad462080f`.
Route: `b22e9e9e-598e-43b0-bc36-bcef98c248c8`; OpenCode Muse Spark.
Owner: `codex:that-space-community-build-20261001:Community assembly code review:Community assembly code review`.
Result read; delivery acknowledged; routing feedback completed.
Event cursor retained: `8233` (terminal event size `8742`).

## Assembly review — community build checkpoint `4a271a5` vs `2683724`

Scope checked: `discourse/community/bootstrap.rb` + `manifest.json`, `discourse/moderation/bootstrap.rb` + `manifest.json` + `community-review-prompt.md`, `discourse/presentation/bootstrap.rb`, `discourse/runtime.lock.json`, `discourse/theme/`, `scripts/discourse/prepare-runtime.py`, `.github/workflows/ci.yml`, `tests/discourse/`, `docs/community-build.md`. Bà Mối service 302-test baseline, Tử Vi/charts/PDF/Moon out-of-scope, Next.js fixed-data demos out-of-scope — not re-flagged.

No confirmed unauthorized-access, private-field leak, destructive-takeover, or auto-sanction defect found statically. All items below have concrete failure paths; hypotheticals excluded.

### P1 — Medium: fix or prove in hosted runtime

**1. Community automation enables without required-field validation**
`discourse/community/bootstrap.rb:reconcile_role_automation` — creates `Automation.new`, `save!`, `upsert_field!("custom_field_name",...)`, `update!(enabled:true)` with no `perform_required_fields_validation=true`.
`discourse/moderation/bootstrap.rb:reconcile_triage_automation` does set it before `update!(enabled:true)`.
Concrete path: if pinned `add_user_to_group_through_custom_field` requires more than `custom_field_name` on this build, apply enables an invalid rule silently. Request spec `tests/discourse/community_bootstrap_spec.rb:uses the installed native Automation...` calls `automation.trigger!` directly, bypassing validation, so it would still pass.
Action: mirror moderation validation flag or add spec asserting `automation` valid after `apply!`.

**2. Presentation `check!` under-reports when themes missing**
`discourse/presentation/bootstrap.rb:run` — `return result unless parent && components.values.all?` after `import_owned`.
Concrete path: fresh DB `check!` reports only `import pinned ...` drift, skips `configure` / translations / `attach` / `default_theme_id` drift. Apply works in one pass because `import_owned(apply:true)` returns new record, but release `check` needs two passes to see full surface.
Action: document two-pass check or continue to settings-drift collection with nil-guards.

**3. No takeover-refusal test for community/presentation ownership**
`discourse/community/bootstrap.rb:reconcile_groups`, `reconcile_user_fields`, `reconcile_categories`, `reconcile_role_automation` correctly `conflict!`/raise on same-named unowned records. `discourse/presentation/bootstrap.rb:import_owned` correctly refuses `Theme.exists?(name:)` without `PluginStore` and mismatched `existing.name`.
Concrete path: regression changing `!= key` to overwrite would silently take over live `gioi-thieu` / `that-space-role-*` / theme. Only moderation has takeover test `tests/discourse/community_moderation_spec.rb:requires an existing model and refuses...`. Community + presentation have idempotence/drift tests but no conflict test.
Action: add unowned slug/group-name/field-question/theme-name conflict specs.

**4. Signup helper sends string for multiselect fields**
`tests/discourse/spec_helper.rb:that_space_signup_fields` — `[field.id.to_s, options.first]` for all 15 fields, including `emotional_expression`, `art_goals`, `community_goals` multiselect.
Concrete path: `tests/discourse/member_journey_spec.rb:create_pending_invited_member` posts this to native `/session/login-code/verify.json`. If native invite validation expects array for multiselect, creation stays `user_fields_required`, member nil, test fails at `expect(member).to be_present`.
Pending CI will decide. Action: if red, send single-element arrays for multiselect.

**5. Brittle anon-upload and event-ID assertions**
`tests/discourse/community_extensions_spec.rb:serves uploaded artwork...` expects member `200`, anon `404` on `upload.short_path` with `prevent_anons_from_downloading_files=true`. Native could return `403`/redirect while still denying — privacy holds but test red.
Same file `lets a Host create a retreat...` does `Event.find(response.parsed_body.fetch("id"))` assuming event ID == post ID. If native keys differ, `RecordNotFound` though event created.
Action: accept `403/404` for anon deny; resolve event via post/topic lookup if needed. Privacy boundary itself is correct.

### P2 — Low: robustness, not ship-blocking

* No transaction in community/presentation apply vs `ActiveRecord::Base.transaction` in `discourse/moderation/bootstrap.rb:reconcile`. Concrete path: `Category.save!` failure after groups created leaves half-owned state. Idempotent reapply + required backup in `docs/community-build.md:Apply owned configuration` repairs it. No data loss.
* Idempotence relies on exact equality: `SiteSetting.personal_message_enabled_groups` ID-string order `discourse/community/bootstrap.rb:group_list_value`, `AiModerationSetting.data` hash, `AiAgent` `allowed_group_ids/tools/temperature`, automation `metadata {"value"=>id}` integer-vs-string. Second-apply-empty specs will prove; normalize if churn appears.
* Theme hardening is correct: `discourse/theme/.../member-navigation.gjs:safeMemberPath,safeUsername`, `isMember/currentUser` gate, `canMessageBaMoi` delegates to `can_send_private_messages`, `composer.openNewMessage({recipients})`, no bot URL construction. Missing-logo fallback and `recipients` string-vs-array shape unproven until system spec `member_theme_system_spec.rb:opens a private-message composer...` runs. No open-redirect or PM-bypass path found.
* `scripts/discourse/prepare-runtime.py:checkout_pin` + `runtime.lock.json` pinning, dirty/mismatched-repo refusal, `spec_helper` copy by `*_system_spec.rb` suffix, `fail_if_no_examples` in helper + explicit `--require` in `ci.yml` correctly prevent silent empty suite. Prior unsupported CLI failure already corrected.

Verified good, do not change:
ownership via `that_space.community.*` custom fields / `external_type/name` / `PluginStore`; private signup defaults `show_on_profile/card/searchable:false` + profile-leak spec; announcements `trust_level_0:readonly + staff:full` + Guardian spec; interest groups `visibility:staff, mentionable/messageable:nobody, grant_trust_level:nil`; `llm_triage` review-only `flag_type:review`, `include_personal_messages:false`, `restricted_archetype:regular`, unsafe-action rejection, native spam `ai_spam_detection_enabled:false` + `allowed_attachment_types` guard + PM/bot exclusion specs; host-event without staff; follow opt-out `403`; ignore/restore; guest nav exclusion.

### Known live gates — not introduced defects

Per `docs/community-build.md:Acceptance and live boundaries`: persistent host, staff-assisted activation/recovery with `disable_emails:non-staff`, reverse-proxy/storage upload protection beyond Discourse setting, restart/backup/restore, phone QA, Vietnamese LLM accuracy tuning, live Bà Mối agent/webhook/retry/two-member relay, Q1-edit staff reconcile. Passing hosted acceptance does not launch production.

### Pending runtime evidence

Hosted container init + `bundle install` + `db:migrate` + service `npm test/typecheck/lint/build` already succeeded per log; current-head `spec/requests/that_space` + `spec/system/that_space` + Ember compile + Chromium results pending. Coordinator owns fixes. Local 302 tests, typecheck/lint/build, Ruby/JSON/YAML syntax pass noted, not a substitute.

### Verdict

**SHIP this build checkpoint for hosted acceptance only — DO NOT launch production.**
Rationale: meaningful native request/browser coverage for lifecycle, permissions, privacy, uploads, follow/ignore, events, theme, and review-only moderation; no static ship-blocker; remaining risk is CI-provable brittleness above plus explicit live gates.

