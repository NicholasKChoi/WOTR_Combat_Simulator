# SGS-091: Behavior-preserving AoE4 cleanups (shared constants, cached schema, short unknown-id messages)

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog triage, 2026-11-03)
- **Priority**: low
- **Risk**: standard
  <!-- Touches the public validation surface (issue message text) in schema.ts; no criticalPaths symbol changes behavior. -->
- **Invariants**: none adjacent (the event loop, payment checks and `depletionResults` outputs after `simulate.ts` sorts them are unchanged)
- **LOC estimate**: ~60 (schema.ts helper, cache and call sites; one-line swaps in gather.ts, result-series.ts, the API handler; one deleted sort in depletion.ts), plus tests and one doc sentence
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md bullets (by current line number) 30, 32, 33, 39, 46, 47. Verified against main at cc9bb04.

## Context

Small cleanups reported by earlier reviews. Nothing the simulator returns changes. The one visible change: an unknown-id issue message quotes at most the first 40 characters of the offending id, so a 900,000-character id no longer yields a 900,000-character message.

## Scope

1. **Truncate quoted ids in schema.ts** (backlog 46). Add a small helper in `lib/aoe4-build-order/schema.ts` (e.g. `shortId(value: unknown): string`) that returns `String(value)` unchanged up to 40 characters, otherwise its first 40 characters followed by `...`. Use it inside the existing double quotes at every place a user-supplied id is echoed:
   - `nodeRefIssue` reasons (`unknown node`, `never runs out`, `is not a node or a numbered deposit`, `only gold has numbered deposits`),
   - `knownId` (`unknown <kind> "..." in <name>`; the `technology "..." is not supported` message echoes a catalog id, leave it),
   - `knownResource`, the `civ` check in `orderObject`, and `unknownNode` / the building check in `simInputsSchema`.
   Text for ids of 40 characters or fewer is byte-for-byte unchanged. Example end state for a 41-character id of `a`: `unknown unit "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa..." in unit` (40 `a`s then `...`). `nearestId` and the `suggestion` are untouched. The paste parser's own `quote()` in `parse-text.ts` (single quotes, same 40 limit) stays as is.
2. **Cache the order schema per catalog** (backlog 47). `orderSchema(catalog)` in `schema.ts` memoizes by catalog object (`WeakMap<BuildOrderCatalog, z.ZodType<BuildOrder>>`) for a defined catalog; `buildOrderSchema` and `checkBuildOrder` both go through it. `buildOrderShape` (catalog `undefined`) is unchanged. A catalog is treated as immutable; say so in a one-line comment on the cache.
3. **Shared constants** (backlog 33, two of its three parts). `lib/aoe4-build-order/gather.ts` `villagerTarget` uses `VILLAGER_ID` from `engine-common.ts` instead of the literal `'villager'`. `components/apps/aoe4-build-order/result-series.ts` drops its local `RESOURCE_ORDER` and iterates `RESOURCE_KINDS` from `lib/aoe4-build-order/model.ts` (same four kinds, same order).
4. **Narrow by `ok`** (backlog 32). `pages/api/aoe4-build-order/simulate.ts` `handler` replaces `'order' in order && 'inputs' in inputs` and the two `'issues' in` tests with the `ok` discriminant both results already carry.
5. **Drop the duplicate sort** (backlog 39). `depletionResults` in `depletion.ts` returns its warnings unsorted; `simulateBuildOrder` already passes the merged list through `sortWarnings`. Tests that assert the order of `depletionResults(...).warnings` itself wrap it in `sortWarnings` (or assert the order at the `simulateBuildOrder` level); the implementer lists each test edited.
6. **Pin the trigger rounding** (backlog 30). `parse-text.ts` `formatTrigger` prints `@m:ss` through `formatMinSec`, which rounds. Add test rows to the nearest `formatBuildStep` table in `parse-text.test.ts` for non-integer trigger seconds. No production change.
7. **Docs.** `docs/aoe4-build-order.md`, the node-reference paragraph that gives `unknown node "iron" in start.rally`: add one sentence that a quoted id longer than 40 characters is cut to its first 40 characters followed by `...` in every unknown-id message. Grep the doc and `docs/api/openapi.json` for other text that says the message repeats the whole id.
8. **Acceptance specs that echo a long id.** `acceptance/aoe4-narrow-layout.spec.ts` (3000-character unknown unit id) asserts `toContainText(id)`; change it to the truncated quote and keep its no-sideways-scroll check. Any other spec or test that asserts a full id longer than 40 characters in a message gets the same treatment; the implementer lists them.

**Out of scope:** the issue `path` (a long object key such as `inputs.nodeAmounts.<ref>` still appears in full; new backlog item if wanted); `drawDown` remainder accounting (changes reported amounts); `STEP_NODE_FIELDS` (see Dropped); changing any simulation output, warning, marker or API field.

## Dropped bullets (verified stale or not a cleanup on main)

- Line 28 (research notes use display names): `researchNotes` in `research.ts` builds messages from `entry.baseId` (commit 9f36c50, "name notes by id").
- Line 29 (`GATHER_NODE_ORDER`, `VILLAGER` duplicates): no `GATHER_NODE_ORDER` exists; `parse-text.ts` uses `NODE_REFS` from `model.ts`; `validate.ts` no longer exists and `VILLAGER_ID` is imported from `engine-common.ts` everywhere.
- Line 31 (`effectStateOf` copy in `modified-value.test.ts`): the only definition is in `test-helpers.ts`.
- Line 33, `type Resources` duplicate: declared only in `engine-common.ts`.
- Line 34: `drawDown` remainder would change reported amounts (not behavior-preserving). `STEP_NODE_FIELDS` is pinned field by field by the `runRefs` tests in `depletion.test.ts` (rally, to, from, then) and the per-action table it referenced is now `OPTIONAL_STEP_FIELDS` in `schema.ts` (optional fields only, not a node-field table), so no derivation is available.
- Line 37 (`AGE_NAMES` copy in compare.ts): `compare.ts` imports it from `model.ts`.
- Line 45 (siege-tower under siege-workshop): the `unitsByProducer` output and `names` are already built from the final producer list; the stray entry is in the snapshot data, and removing it is a data change, not a code cleanup.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] An unknown unit/building/tech id of 41 `a` characters yields the message `steps[0]: unknown unit "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa..." in unit` (40 `a`s then `...`), and the same cut applies to an unknown node (`nodeRefIssue` reason), resource, civ, and `influenceCoverage` building. Test: a table in `schema.test.ts`, one row per message kind.
- [ ] A 40-character id is quoted whole and a short id's message is unchanged. Test: rows in the same table (catches an off-by-one on the limit; the existing short-id message tests stay as they are).
- [ ] A 900,000-character unknown id gives an issue message under 200 characters and still carries no `suggestion`. Test: `acceptance/aoe4-simulate-api-checks.spec.ts` ("a 900000-character unknown unit id") gains the length assertion.
- [ ] `buildOrderSchema(catalog)` returns the same object for the same catalog and a different object for a different catalog; `checkBuildOrder` gives the same issues before and after. Test: `schema.test.ts` (catches a missing or global cache).
- [ ] `git grep -n "'villager'" -- lib/aoe4-build-order/gather.ts` finds nothing, and `git grep -n "RESOURCE_ORDER" -- components lib` finds nothing.
- [ ] `git grep -nE "'(order|inputs|issues)' in " -- pages/api/aoe4-build-order/simulate.ts` finds nothing, and the handler's status codes and bodies are unchanged (the API acceptance specs pass without edits).
- [ ] `depletionResults` no longer calls `sortWarnings`; a simulate-level test still pins the final warnings order across node, farm-idle, step-stuck and auto-house warnings at one instant (the existing ordering test in `simulate-depletion.test.ts` or `simulate-house-warnings.test.ts` named in the report).
- [ ] `formatBuildStep` rounds a non-integer time trigger to the nearest second: rows pin `65.4` -> `@1:05`, `65.5` -> `@1:06`, `59.6` -> `@1:00` (rounds into the next minute). The rows fail if `formatTrigger` floors or truncates.
- [ ] `docs/aoe4-build-order.md` states the 40-character cut; no doc says an unknown-id message repeats the whole id.
- [ ] `aoe4-narrow-layout.spec.ts` long-id test asserts the truncated quote text and the no-sideways-scroll check still holds.
- [ ] Every other test and spec result is unchanged: `npm test`, `npx tsc --noEmit`, `npm run lint:dup`, `npm run acceptance` pass; the report lists each test edited and why.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
