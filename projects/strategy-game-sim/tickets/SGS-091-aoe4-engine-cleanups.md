# SGS-091: Behavior-preserving AoE4 cleanups (shared constants, cached schema, short unknown-id messages)

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog triage, 2026-11-03)
- **Priority**: low
- **Risk**: standard
  <!-- Touches the public validation surface (issue message text) in schema.ts; no criticalPaths symbol changes behavior. -->
- **Invariants**: A3 (deterministic timings: Scope 5 moves the only warning sort to `simulateBuildOrder`, so the final `warnings` order must stay a pure function of the build and data); S3 (bounded requests: Scope 1 bounds the size of every issue message built from a user-supplied id, so an oversized id costs no more than the existing 900,000-character API check allows)
- **LOC estimate**: ~70 (schema.ts helper, cache and about a dozen call sites; one-line swaps in gather.ts, result-series.ts, the API handler; one deleted sort in depletion.ts), plus tests and one doc sentence
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md bullets (by current line number) 30, 32, 33, 39, 46, 47. Verified against main at b9481e3.

## Context

Small cleanups reported by earlier reviews. Nothing the simulator returns changes. The one visible change: an issue message that quotes a user-supplied id, action or trigger kind quotes at most the first 40 characters of the offending id, so a 900,000-character id no longer yields a 900,000-character message.

## Scope

1. **Truncate quoted ids in schema.ts** (backlog 46). Add a small helper in `lib/aoe4-build-order/schema.ts` (e.g. `shortId(value: unknown): string`) that returns `String(value)` unchanged up to 40 characters, otherwise its first 40 characters followed by `...`. Use it inside the existing double quotes at every place in `schema.ts` that echoes a user-supplied string in an issue message. On b9481e3 those places are (respec 1):
   - `nodeRefIssue`, every reason that quotes `value`: `unknown node`, `never runs out`, `is not a node or a numbered deposit such as gold#2`, `only gold has numbered deposits`, `deposit 1 is written gold`, `deposit number is outside 2..<MAX_DEPOSITS>`. Two of these (`never runs out`, `deposit 1 is written gold`) can only be reached by a short value (`farm`, `wood`, `gold#1`; `DEPOSIT_NUMBER` forbids leading zeros), but they go through the helper too so every reason quotes the same way;
   - `knownId` (`unknown <kind> "..." in <name>`; the `technology "..." is not supported` message echoes a catalog id, leave it);
   - `knownResource` (`unknown resource "..." in trigger.resource`);
   - `triggerKindCheck` (`unknown trigger kind "..."; the kinds are ...`; the list of kinds and the `suggestion` are untouched);
   - `stepProblem` (`unknown action "..."`);
   - the `civ` check in `orderObject` (`unknown civ "..."`);
   - in `simInputsSchema`, `unknownNode` (`unknown node "..."`, used for `trips` keys and `houseBuilderSource`) and the `influenceCoverage` key check (`unknown building "..."`); `nodeAmounts` keys reach `nodeRefIssue` and are covered there.
   Messages that name only ids already validated against the catalog (`crossFieldProblems`, `crossStepProblems`, `startProblems`) are not echo sites and stay as they are. Text for ids of 40 characters or fewer is byte-for-byte unchanged. Example end state for a 41-character id of `a`: `unknown unit "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa..." in unit` (40 `a`s then `...`). `nearestId` and the `suggestion` are untouched. The paste parser's own `quote()` in `parse-text.ts` (single quotes, same 40 limit) stays as is.
2. **Cache the order schema per catalog** (backlog 47). `orderSchema(catalog)` in `schema.ts` memoizes by catalog object (`WeakMap<BuildOrderCatalog, z.ZodType<BuildOrder>>`) for a defined catalog; `buildOrderSchema` and `checkBuildOrder` both go through it. `buildOrderShape` (catalog `undefined`) is unchanged. A catalog is treated as immutable; say so in a one-line comment on the cache.
3. **Shared constants** (backlog 33, two of its three parts). `lib/aoe4-build-order/gather.ts` `villagerTarget` uses `VILLAGER_ID` from `engine-common.ts` instead of the literal `'villager'`. `components/apps/aoe4-build-order/result-series.ts` drops its local `RESOURCE_ORDER` and iterates `RESOURCE_KINDS` from `lib/aoe4-build-order/model.ts` (same four kinds, same order).
4. **Narrow by `ok`** (backlog 32). `pages/api/aoe4-build-order/simulate.ts` `handler` replaces `'order' in order && 'inputs' in inputs` and the two `'issues' in` tests with the `ok` discriminant both results already carry.
5. **Drop the duplicate sort** (backlog 39). `depletionResults` in `depletion.ts` returns its warnings in the order it builds them (by `FINITE_NODE_REFS`, run-out before idle-arrival per ref) without calling `sortWarnings`. `simulateBuildOrder` in `simulate.ts` already passes the merged list (depletion warnings, step-stuck warnings, `houseWarnings(engine)` and `farmIdleWarnings(engine.farmIdle)`) through `sortWarnings`; that call stays and becomes the only sort (respec 1).
   - Existing tests (respec 1): a test that asserts the time order of `depletionResults(...).warnings` across instants no longer holds and is deleted, not wrapped in `sortWarnings`; its property moves to the new simulate-level test below. On b9481e3 the one such test is `depletion.test.ts` "returns its warnings sorted by at" (it fails once the sort goes; checked by removing the sort in a throwaway worktree, where it was the only failing test under `lib/aoe4-build-order`, `components/apps/aoe4-build-order` and `pages`). The other multi-warning assertions in `depletion.test.ts` ("words run-outs by id and sets warning severity only when villagers are left idle", and the `recordIdleArrival` / `recordRunOut` cases) already list warnings in `FINITE_NODE_REFS` order and keep their expected values. The `sortWarnings` unit tests (`describe('sortWarnings')`) stay as they are; they pin the tie order at one instant. The implementer lists every test it edits or deletes.
   - New test (respec 1): in `lib/aoe4-build-order/simulate-depletion.test.ts`, a case "lists node warnings by time, not by node order" that runs `run([PAUSE], { start: { villagers: { berry: 1, stone: 3 }, rally: 'wood' }, inputs: { autoHouses: false, nodeAmounts: { berry: 300, stone: 10 } } })` (the file's existing `PAUSE` and `run` helpers), so stone, later in `FINITE_NODE_REFS`, runs out before berry.
6. **Pin the trigger rounding** (backlog 30). `parse-text.ts` `formatTrigger` prints `@m:ss` through `formatMinSec`, which rounds. Add test rows to the nearest `formatBuildStep` table in `parse-text.test.ts` for non-integer trigger seconds. No production change.
7. **Docs.** `docs/aoe4-build-order.md`, the node-reference paragraph that gives `unknown node "iron" in start.rally`: add one sentence that a quoted id longer than 40 characters is cut to its first 40 characters followed by `...` in every issue message that quotes it. Grep the doc and `docs/api/openapi.json` for other text that says the message repeats the whole id.
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

- [x] An unknown unit/building/tech id of 41 `a` characters yields the message `steps[0]: unknown unit "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa..." in unit` (40 `a`s then `...`). Test: a table in `schema.test.ts`, one row per message kind, each with a 41-character input and the expected message quoting its first 40 characters then `...`. (respec 1) The rows cover every echo site in Scope 1 that a long value can reach: `knownId` (unit, building, technology), `nodeRefIssue` unknown node, not-a-node-or-deposit (e.g. `gold#` followed by non-digits), only-gold-has-deposits (e.g. `stone#` followed by digits), deposit-number-outside (`gold#` followed by digits), `knownResource`, `triggerKindCheck` (the message still ends `; the kinds are ` and the kinds list), `stepProblem` unknown action, the `civ` check, `unknownNode` through a `trips` key and through `houseBuilderSource`, and the `influenceCoverage` building key. A row fails if its site still quotes the whole value.
- [x] A 40-character id is quoted whole and a short id's message is unchanged. Test: rows in the same table (catches an off-by-one on the limit; the existing short-id message tests stay as they are). (respec 1) The `never runs out` and `deposit 1 is written gold` reasons get short-value rows only (`wood`, `gold#1`), with their messages unchanged.
- [x] A 900,000-character unknown id gives an issue message under 200 characters and still carries no `suggestion`. Test: `acceptance/aoe4-simulate-api-checks.spec.ts` ("a 900000-character unknown unit id") gains the length assertion.
- [x] `buildOrderSchema(catalog)` returns the same object for the same catalog and a different object for a different catalog; `checkBuildOrder` gives the same issues before and after. Test: `schema.test.ts` (catches a missing or global cache).
- [x] `git grep -n "'villager'" -- lib/aoe4-build-order/gather.ts` finds nothing, and `git grep -n "RESOURCE_ORDER" -- components lib` finds nothing.
- [x] `git grep -nE "'(order|inputs|issues)' in " -- pages/api/aoe4-build-order/simulate.ts` finds nothing, and the handler's status codes and bodies are unchanged (the API acceptance specs pass without edits).
- [x] (respec 1) `git grep -n "sortWarnings" -- lib/aoe4-build-order/depletion.ts` matches only the `export function sortWarnings` definition (today it also matches the `return` in `depletionResults`).
- [x] (respec 1) `simulate-depletion.test.ts` "lists node warnings by time, not by node order" (inputs in Scope 5) asserts that the `node-depleted` warnings of `result.warnings` name `stone` then `berry`, and that `result.warnings` is in non-decreasing `at` order. Mutation: with the `depletionResults` sort already gone, replacing `sortWarnings([...])` in `simulateBuildOrder` with the bare array makes this test fail (checked on b9481e3 with both sorts removed). The tie order at one instant (node, farm-idle, step-stuck, auto-house) stays pinned by the `depletion.test.ts` `sortWarnings` cases, which pass unedited.
- [x] (respec 1) `depletion.test.ts` "returns its warnings sorted by at" is deleted; every other `depletion.test.ts` case passes with its expected values unchanged.
- [x] `formatBuildStep` rounds a non-integer time trigger to the nearest second: rows pin `65.4` -> `@1:05`, `65.5` -> `@1:06`, `59.6` -> `@1:00` (rounds into the next minute). The rows fail if `formatTrigger` floors or truncates.
- [x] `docs/aoe4-build-order.md` states the 40-character cut; no doc says an unknown-id message repeats the whole id.
- [x] `aoe4-narrow-layout.spec.ts` long-id test asserts the truncated quote text and the no-sideways-scroll check still holds.
- [x] Every other test and spec result is unchanged: `npm test`, `npx tsc --noEmit`, `npm run lint:dup`, `npm run acceptance` pass; the report lists each test edited and why.
- [x] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-04

- Underspecified: Scope 1 missed the `nodeRefIssue` deposit reasons, `triggerKindCheck` and `stepProblem`; the ordering criterion leaned on a simulate-level test that does not exist; the depletion test rule named no candidates; Invariants said none; the source note pointed at cc9bb04.
- Changed: Scope 1 lists every `schema.ts` echo site with table rows for each; Scope 5 names `farmIdleWarnings` in the merged list, deletes `depletion.test.ts` "returns its warnings sorted by at", and adds a named `simulate-depletion.test.ts` ordering test with a mutation check; Invariants name A3 and S3; source re-verified at b9481e3.
- Branch work: none yet (no branch).

## Rework 1 - 2026-11-04 (review)

Bounced by review-1 at tip 11a4c0db0525e8fce8937ef64e0e1d300b3c21fb (report: reports/SGS-091-review-1.md). No earlier gate had passed the branch. All acceptance criteria passed on the evidence; this rework touches only the duplicated limit.

Findings:
- `lib/aoe4-build-order/schema.ts:123-129`: the new `ID_QUOTE_CHARS = 40` and `shortId()` copy `MAX_QUOTED_LENGTH = 40` and the truncation in `quote()` at `lib/aoe4-build-order/parse-text.ts:25,29-34`. The REPO.md AoE4 checklist blocks any constant or helper copied between `lib/aoe4-build-order/` modules. `docs/aoe4-build-order.md:524` promises one 40-character cut for every issue message.

Required fixes:
- [x] Export one 40-character limit (or one shared truncation helper) from `lib/aoe4-build-order/model.ts`, which both modules already import. Use it in both `schema.ts` and `parse-text.ts`, and delete the local copies. `quote()` output must stay byte-for-byte the same.
- [x] tsc, lint:dup, unit tests and the existing acceptance specs touched by this ticket stay green.
