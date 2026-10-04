# Native installer compatibility follow-up — 2026-10-04

Job: `f969fb16-6fb2-4105-83e5-868456b04967`  
Decision: `833cb1eb-50b2-42c8-a115-b78de9571cfb`  
Provider: OpenCode / Muse Spark, routed alias `default`  
Owner: `codex:that-space-asus-launch-20261004:Native installer compatibility follow-up:Native installer compatibility targeted follow-up`  
Base: `961b4ae529e25bf1b8e3a3e7c9b0e7c580134822`  
Final output cursor: 0; event cursor: 6549.

This is the one targeted follow-up after the Oct4 assembly review. Root inspected the four-file diff, verified native serialization with a live no-drift check, and ran all 307 tests, typecheck and lint. The reviewer reported no blocking findings. The locale-specific key comparator is confined to ASCII schema keys and does not justify broadening this fix. This verdict covers installer compatibility; live model and launch acceptance remain separate.

## Retained result

Targeted compatibility review — scoped diff only (4 files). No edits made.

### Findings (ordered by severity)

**1. No blocker — `normalized()` cannot erase meaningful differences. Introduced code is fail-closed.**
- `lib/discourse/installer.ts:51-71` — `normalized()` sorts object keys recursively via `Object.entries(...).sort(...).map([key, normalized(item)])`, but arrays take the `Array.isArray(value) → value.map(normalized)` branch, preserving order, length, and element position.
- Consequence, verified by inspection:
  - Parameter object key order ignored (`{enum,name,...}` ≡ `{name,...,enum}`), but `parameters[]` order, `enum[]` order/values, `secret_contracts[]`/`secret_bindings[]` order/values, and `tools[]` tuple order/values all remain in the `JSON.stringify` comparison.
  - Primitives untouched: `false` ≠ `null` ≠ `true` ≠ `0` ≠ `""`; missing key ≠ present key. Nested missing keys (e.g. dropped `required`/`enum`) change the key set → drift. Top-level missing fields still hit `compareField`'s `!(field in deployed)` fail-closed branch before `equal()`.
- Evidence it holds: `tests/unit/discourse/installer.test.ts:98-118` mutates `enum: ['pause','opt_in','resume','delete']` and `tools[0]=[id,true,false]` and still expects `tool ba_moi_consent parameters differs` + `agent Bà Mối tools differs`. `tests/unit/discourse/installer.test.ts:80-93` retains wrong-ID `custom-999`, wrong `ai_secret_id:999`, invented param, `allow_chat_direct_messages:true`, `user_id:null` → drift. No over-normalization.

**2. No blocker — native tuple `[custom-N,false,false]` semantics remain exact and fail-closed.**
- `lib/discourse/install.ts:68` — `tools: input.toolIds.map((id) => [`custom-${id}`, false, false])` matches stated pinned serializer. Change is `null → false` in expected payload only; comparison stays strict.
- `false` accepts only `false`: `true` still drifts (covered by new test above), `null` would drift (fail-closed, correct direction), wrong ID `custom-999` still drifts, length/reorder/forced-flag changes still drift because tuples are arrays.
- Apply/check consistency: `tests/unit/discourse/installer.test.ts:148` and `tests/unit/discourse/tools.test.ts:103` updated to `false`; positive test `tests/unit/discourse/installer.test.ts:56-73` reproduces live shape (enum-first + `false` options) → `drift=[]`. No flap between apply and check.

**3. No blocker — security / data-loss guards unchanged.**
- `lib/discourse/installer.ts:compareTool/compareAgent` field lists unchanged: `secret_contracts`, `secret_bindings`, `allow_personal_messages/allow_topic_mentions/allow_chat_direct_messages/allow_chat_channel_mentions`, `allowed_group_ids`, bot `user_id` check retained. Broken-binding and missing-field negatives retained.

**4. Low (pre-existing, not introduced) — `localeCompare` for key sort.**
- `lib/discourse/installer.ts:60` uses `left.localeCompare(right)`. For this schema (ASCII `snake_case` keys) there is no practical collision, and both sides use identical normalization so worst case is false drift, never false pass. Deterministic `<`/`>` would be more canonical, but no change recommended in this scoped diff.

**5. Low (accepted, not a defect) — legacy `null` tuple would now drift.**
- If an unpinned controller ever returned `[custom-N,null,false]`, check would report drift (`null` ≠ `false`). That is fail-closed and consistent with the pinned `[custom-N,false,false]` evidence and `live --check exits zero` claim. No action.

**Missing-test check:** positive key-order/`false` acceptance, changed-enum + `true`-option rejection, wrong-ID/binding/flag/missing-user rejection, missing-field fail-closed, and apply-payload shape are all present. Enum-order-only reversal and `forced=true`/truncated-tuple are not separately tested but exercise the identical array-equality branch already proven by the above negatives; not a ship-blocker.

### Verdict
**SHIP** — scoped normalization + `false` tuple fix is correct, preserves fail-closed drift detection, and is covered by positive + negative tests.

