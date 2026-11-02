# SGS-057 review 1

- Branch: `sgs-057-aoe4-zod-schema-text-to-build` (local only), tip `c207726ecaed379b2cd77dcdcb2e94adf7c7b172`
- Base: `origin/main` `54d7e90`
- Mode: full review (first gate pass)
- Verdict: **APPROVE**

## Blocking findings

None.

## Spec gaps

None block this ticket. Three spec-wording fixes are below under the manager's questions (2), (4) and (5), plus one design C2 interface amendment (1). They are for the designer or manager to fold in, and they do not change the code.

## Manager's questions: rulings

1. **Catalog extra fields `units` and `inputDefaults` against C2.** Both are needed and both are additive. `units` (every unit baseId) keeps today's split between "unknown unit X" and "X cannot produce Y". `StepOptions.unitsByProducer` only lists producible units, so without `units` a real but unproducible unit would be reported as unknown-id. `inputDefaults` is needed because C2's `checkSimInputs(value, catalog)` takes only the catalog, yet the result must merge the data defaults (`gameData.inputDefaults`). Neither one breaks a C2 consumer. **Direction (designer):** amend the design C2 `BuildOrderCatalog` interface to list `units` and `inputDefaults`. Any later ticket that builds a catalog literal in a test (SGS-068 and others) needs them.
2. **`textToBuildOrder('')`.** The implementation is right. Design row 435 sets the pipeline order (size check, parse, then `checkBuildOrder`), and the Extension points section says the paste path must end in `checkBuildOrder`. Row 436 ("empty text: whatever `parseBuildOrderText('')` returns") contradicts both. Today `''` parses to `{civ:'english', name:'Pasted build order', steps:[]}` and returns `ok:false` with one issue, `start: no start.rally while starting building capital-town-center produces villagers`, plus `lines {steps: []}`. **Direction (designer and ticket owner):** reword the Scope 7 bullet and design row 436 to "`''` is not special-cased: it parses to the empty order and returns that order's `checkBuildOrder` result with `lines {steps: []}` (English: `ok: false`, one start no-rally issue)". This bullet is not an acceptance criterion, so it does not affect ticking.
3. **An unknown action hides that step's trigger issues.** This is true. The zod discriminated union fails on `action` before it looks at `trigger`, while the old validator also reported a bad trigger on the same step. The build is still rejected (the fuzz parity check below found 0 ok/reject disagreements). Non-blocking. SGS-075 should know this when it re-points the old combined-issue specs at `checkBuildOrder`, because any expectation of both issues on one step must change.
4. **`defaultStart` shape.** The villagers field is the civ's nonzero starting split. `rally` is set only when the civ has start producers, and it goes to the most-staffed node (stable sort, so ties keep data order). English gives `{villagers:{sheep:6}, rally:'sheep'}`. The value comes from the data, not an invented constant, and it passes the start check. The design does not specify the rally choice. **Direction (designer):** record the rule in design C2, because SGS-068 (start customize) consumes it. Non-blocking.
5. **Cross-step issues sort after all steps.** `CROSS_STEP_RANK = STEP_RANK + 201 + index` puts every cross-step issue after every step's issues, ordered by the later step's index. The design sentence "then cross-step issues by the later step's index" reads as a trailing group, so this is defensible. The old validator interleaved them. **Direction (designer):** say "after all per-step issues" explicitly. Non-blocking.
6. **Gating against validate.ts.** `failed('start')` and `failed('steps')` only skip rules when a field issue already exists, so the build is rejected anyway. Zod aborts after `steps > 200` or an unknown trigger kind, and the step superRefine is skipped when a field fails (zod abort semantics). No build that validate.ts rejects can pass `checkBuildOrder`. I checked this by reading the code and with a throwaway differential fuzz: 20000 random mutations of the `listBuilds()` builds (step fields, inserted duplicate steps, start shapes, order-level fields). 14024 were rejected by the old `validateBuildOrder`, and old and new disagreed on `ok` 0 times. The fuzz files were deleted and nothing was committed. This matches the design's "field vs cross-field" row, which says it differs from today in which issues are listed, not in accept/reject.

Other questions:
- Nothing dead until SGS-075 hides a bug. `checkBuildOrder` and `textToBuildOrder` have no production caller yet but carry 146 and 11 tests, and every `listBuilds()` build passes. After SGS-075 deletes validate.ts, `isKnownId` and `isBoundKey` (and possibly `issue`) in schema.ts have no importer outside schema.ts. SGS-075 should un-export or delete them (see the note below).
- `npm run lint:dup` reports 0 clones (threshold 0, minTokens 70).
- The five shared definitions exist only in schema.ts. The one-copy grep prints 5 lines, all in `lib/aoe4-build-order/schema.ts`.
- Route and validate.ts behaviour are unchanged. `git diff --stat origin/main -- pages/api` is empty. validate.ts only removed the moved code and re-exports `SIM_INPUT_BOUNDS`, `nodeRefIssue`, `resolveSimInputs` and `type NodeRefProblem`. `validate.test.ts` and `validate.acceptance.test.ts` are unedited and pass. Differential check of the moved `resolveSimInputs`: 3000 random `inputs` values (non-objects, null, out-of-range numbers, unknown keys, bad nested trips, influence and nodeAmounts) gave results `toStrictEqual` to `origin/main`'s implementation.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | zod 4.x, `^4.6.7`, no `zod/v3`/`zod/mini` | pass | `npm ls zod` gives zod@4.6.7; `jq` prints `^4.6.7`; the grep is empty |
| 2 | schema.ts export list exact; no helper in both files; text-to-build exports; no value import of data/fs/node | pass | Export list compared name by name with Scope 2; the import grep is empty |
| 3 | One copy of moved names; validate.ts re-exports; validate tests unedited and pass | pass | Grep gives 5 lines, all in schema.ts; `git diff` shows no edits to the validate tests; `npm test` is green |
| 4 | Mutation 3600 to 3601 fails the checkSimInputs bounds case | pass | Ran it: `bounds durationSeconds 59`, `bounds durationSeconds 3601` and `keeps the request bounds` failed; file restored |
| 5 | Knight + longbow paste ok with lines; every `listBuilds()` build ok | pass | schema.test.ts cases pass |
| 6 | `knigt` unknown-id with line, message, suggestion; `soon`/`tme` JSON cases; parse failure has no `lines` | pass | schema.test.ts and text-to-build.test.ts cases pass; `nearestId` threshold `max(1, floor(len/3))` checked by reading |
| 7 | 20000 accepted, 20001 rejected unparsed; route unchanged; API 20001 still 400 | pass | Unit tests pass; the `pages/api` diff is empty; the existing acceptance spec passes |
| 8 | Field issue suppresses that step's cross-field issues and all cross-step issues | pass | schema.test.ts cases pass |
| 9 | checkSimInputs 59/3601 rejected, 60/3600 accepted, defaults; resolveSimInputs parity | pass | schema.test.ts cases pass; differential fuzz exact |
| 10 | Catalog JSON round trip; `names.knight` lowest-age name | pass | Test loops every listed id against the minimum-age entry, not only knight |
| 11 | OpenAPI `suggestion` optional string, version 1.0.0; contract spec passes | pass | openapi diff is +4 lines; the contract spec passed in the full acceptance run |
| 12 | No other test changes its expected values; docs/aoe4-build-order.md unchanged | pass | Only the contract spec's optional-map and record rows (+suggestion) and new tests changed; docs diff is empty |
| 13 | tsc, lint:dup, npm test, acceptance pass (Node 24) | pass, see note | `tsc` exit 0; lint:dup 0 clones; `npm test` 42 files, 1234 passed, 8 skipped; `next build` OK. Full `npm run acceptance`: 550 passed, 1 failed. The failure is `aoe4-build-order-pin-compare.spec.ts:166` (bounding-box width read straight after a re-render). It passed 3 out of 3 in isolation with `--repeat-each=3` (27/27). The test is flaky and unrelated: no page, component or route is touched. |
| 14 | No INVARIANTS.md regressions | pass | See below |

## Invariants touched

- **S3 (one validator path / route contract):** holds. The route still calls validate.ts. The moved `resolveSimInputs` gives byte-equal output (fuzz), and accept/reject agrees between `validateBuildOrder` and `checkBuildOrder` (fuzz).
- **A1 (API contract and OpenAPI agree):** holds. `suggestion` is added as optional to both the type and the spec, and the contract spec rows are updated. `info.version` is unchanged, which is correct for an additive optional response field.
- **A3 (no Node-only imports in client-reachable modules):** holds. schema.ts and text-to-build.ts take only type imports from data and nothing from fs or `node:`.

## Lint

`npm run lint:dup`: 0 clones. `npx tsc --noEmit`: exit 0. The repo has no other lint command in `commands.lint` beyond these.

## Bot reconciliation

No review bot is configured (`reviewBot.cli` is empty) and no rules file is set. Nothing to reconcile.

## Non-blocking notes

1. **Per-request cost of `resolveSimInputs`.** It now builds `buildOrderCatalog(data)` on every call, and the route calls it on every request (`pages/api/aoe4-build-order/simulate.ts:58`). Measured cost is about 0.34 ms per call against about 0.003 ms before; `checkBuildOrder` is about 0.54 ms against about 0.04 ms for `validateBuildOrder`. This is negligible next to a simulation run. SGS-075 already plans one catalog per process.
2. **Dead exports after SGS-075.** `isKnownId` and `isBoundKey` (and `issue` if nothing else imports it) exist to serve validate.ts. When SGS-075 deletes validate.ts, it should drop them from the export list, and its "exactly" criterion should shrink to match.
3. **Unknown action hides trigger issues** (question 3). SGS-075 must adjust any spec that expects both issues on one step.
4. **Design wording:** C2 should add `units` and `inputDefaults` (1); row 436 and ticket Scope 7 should describe empty text (2); C2 should record the `defaultStart` rally rule (4); the issue-order sentence should say cross-step issues come after all per-step issues (5).
5. **Flaky acceptance test:** `acceptance/aoe4-build-order-pin-compare.spec.ts:183-186` reads `boundingBox()` without waiting for the re-rendered pinned path to settle. Out of scope. Recommend a backlog item to wait for the path's `d` attribute or use `expect.poll`.
6. **Out of scope (from the implementer):** the raw `unitsByProducer` map in step-options includes `siege-tower` under `siege-workshop` even though it is not producible there. Output is unchanged because it is filtered downstream. Backlog candidate.
7. The `byBaseId` ordering claim in the step-options.ts comment ("lists each baseId's entries by age") holds for the shipped data. The `names` test checks it against an explicit minimum-age reduce, so a data change that broke the claim would fail that test.

## Conventions

- validate.ts siblings (2-space TS, single quotes, `issue()`/`outOfRange()` helpers, `where` labels): schema.ts follows them. The moved code is moved, not copied. Issue messages keep the `<path>: <problem>` shape.
- Test files follow the repo's 4-space vitest style and use `ENGLISH` from `test-helpers.ts`, like `validate.test.ts` and `step-options.test.ts`.
- ARCHITECTURE.md: no file under `pages/api` changed. The AoE4 copied-code rule is met (lint:dup 0).
- No ticket ids or factory references in shipped files.

## Coverage

Reviewed in full: `lib/aoe4-build-order/schema.ts`, `schema.test.ts`, `text-to-build.ts`, `text-to-build.test.ts`, `validate.ts` (diff and remaining file), `step-options.ts`, `step-options.test.ts`, `model.ts`, `docs/api/openapi.json`, `acceptance/aoe4-simulate-api-contract.spec.ts`, `package.json`/`package-lock.json` (zod only).

Commands run: tsc, lint:dup, npm test, next build, full acceptance on port 3787, isolated pin-compare repeat, the mutation check, and the throwaway differential fuzz against `origin/main` validate.ts (deleted afterwards).

REPO.md review checklist: the "Every diff" steps (build and acceptance) were run. There is no page to load with `npm run dev` because no page or component is touched. AoE4 section: no copied helper; docs unchanged.

Not covered: no review bot was configured.
