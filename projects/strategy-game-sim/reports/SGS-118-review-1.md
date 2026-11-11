# SGS-118 review 1

- Branch: `sgs-118-acceptance-test-debt`, tip `4dbf10012a3b039867e91851519c6049a90015e3`, base `main`. Full review (not delta).
- Verdict: **APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | `holdRequests` / `holdNextSimulate` exported with Scope 1 semantics; only gated `page.route` in helpers | pass | `acceptance/helpers.ts:139-153`: one gate promise shared by every matching request, so held ones wait until release and later ones pass at once; method or `matches` miss calls `route.fallback()`; `route.continue().catch(() => {})`; route registered before return. `holdNextSimulate` calls `holdRequests(page, SIMULATE_PATH, 'POST', filter)`, and the filter is undefined when no duration is given. `git grep page.route acceptance/helpers.ts` returns only line 142. |
| 2 | Contract status-line test asserts no simulate response before `release()`; gate-delete mutation fails the test | pass | `aoe4-auto-run-contract.spec.ts:33-41` records responses from before `goto` and runs `expect(answered).toEqual([])` after `running`. The implementer report (mutation 1) records that the test fails under the mutation, at the second hold's `updating` check rather than at the new assertion. See note 1. |
| 3 | Pin-compare "a run that finishes before the restore lands": 600 s run completes while LOAD_DURATION is held; held POST has no response until release; both mutations fail | pass | `aoe4-build-order-pin-compare.spec.ts:647-660`: `heldAnswers` is filtered by `bodyDuration === LOAD_DURATION`, `toEqual([])` after `runOk`, then after `release()` `expect.poll(...length).toBe(1)`. Implementer mutations 2 and 3 are recorded: the test times out in `runOk` and fails in `runOk`. |
| 4 | `function hold*` only in helpers.ts | pass | Ran the grep: it matches only `helpers.ts:139`, `:151`. |
| 5 | `await gate` in specs only in save-open or the pin-compare restore fulfil handler | pass | Ran the grep: `pin-compare.spec.ts:609` (`routeRestore` handler that fulfils 500) plus five `aoe4-save-open.spec.ts` matches. |
| 6 | No `['chart-units-produced'` array in specs; step-band, compact-view, results-split and the auto-run loop use `CHART_IDS` | pass | Ran the grep: no matches. The diff imports `CHART_IDS` in all three specs, and `aoe4-auto-run.spec.ts:195` loops over it. |
| 7 | Invalid-duration test asserts `duration-error` visible; `is-invalid` mutation fails | pass | `aoe4-auto-run.spec.ts:209`. Implementer mutation 4 is recorded: the test fails at `toBeVisible` with `hidden`. |
| 8 | Open-rows test pre-asserts a newly opened row and a kept row; BUILDS[0] mutation fails | pass | `aoe4-auto-run.spec.ts:322-323` runs before `selectOption`, and the predicates match Scope 5. Implementer mutation 5 is recorded. |
| 9 | Every step-annotations `aria-describedby="auto-run-status"` assertion also resolves the id in one `page.evaluate` with the Scope 5 text; `auto-run-statuz` mutation fails each | pass | `expectDescribedByStatus` (`aoe4-step-annotations.spec.ts:34-41`) is used at `:139` ('Updating the results.') and `:189` ('The charts show the last valid build.'). The only remaining positive `aria-describedby` reads are inside the helper; `:146` is the kept `not.toHaveAttribute`. Implementer mutation 6 is recorded: both tests fail at the helper's `toEqual`. |
| 10 | Charts-dim test rewritten: no POST on the same build, opacity 1; held different build shows 0.5 and `updating`, then `current` and 1; title says so; dimmed-class mutation fails | pass | `aoe4-step-annotations.spec.ts:192-205`: `expectNoRun` wraps the same-build select, `holdNextSimulate` holds the `listBuilds()[1]` run, and the dimmed `not.toHaveAttribute` read is gone. The title matches the ticket's suggestion. Implementer mutation 7 is recorded. |
| 11 | Layout test waits for `step-started` before measuring; rects read in one evaluate under poll | pass | `aoe4-step-annotations.spec.ts:217` waits on `step-started`, then each measurement is one `page.evaluate` under `expect.poll` (`:218-232`, `:235+`). |
| 12 | `./helpers` imports code-point sorted and all used, in every edited spec | pass | I checked each list by hand: contract, auto-run (`TABS_VIEWPORT` now after `SIMULATE_PATH`), pin-compare, step-band, compact-view, results-split and step-annotations. I grepped every imported name for a use in its file. `SIMULATE_PATH` was dropped from step-band, compact-view and step-annotations, and is still used in contract, auto-run and pin-compare. |
| 13 | Edited specs pass `npm run acceptance --repeat-each=2`; tsc and lint:dup pass | pass (acceptance unverified by me) | I ran `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones. I did not run acceptance (review runs none). The implementer reports 62 + 130 passed with `--repeat-each=2`. |
| 14 | Report names each mutation and lists the spec files and tests edited | pass | Implementer report 1, "Mutation checks" 1-7 and "Files touched" / "Pre-existing tests edited". |
| 15 | No INVARIANTS.md regressions | pass | The diff is test-only under `acceptance/`, so no invariant applies. |

## Invariants touched

None. No file under `lib/`, `components/`, `pages/` or `data/` changes, so A1-A3, S1-S3, W1-W2 and H1-H3 are not reachable from this diff.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot ran.

## Lint

`npx tsc --noEmit && npm run lint:dup` passes (jscpd: 0 clones). There is no ESLint config in the repo.

## Non-blocking notes

1. `acceptance/aoe4-auto-run-contract.spec.ts:41` - test. `expect(answered).toEqual([])` runs right after the `running` status shows. With the gate removed, the response usually has not arrived yet, so this assertion rarely fails first. The implementer's mutation 1 confirms the test still fails, at the second hold's `updating` check. The ticket prescribed this exact placement and criterion 2's mutation check passes, so this is not blocking. To make the new check the one that catches a missing gate: before reading `answered`, `await page.waitForRequest(isSimulatePost)` (registered before `goto`), then hold briefly with `expect.poll(() => answered.length, { timeout: 1000 })`, or check `answered` after the `toHaveText('Computing the simulation.')` plus a short wait.
2. `acceptance/helpers.ts:135` - convention. `bodyDuration` is an exported arrow `const`, while its neighbours are `export function` declarations (`isSimulatePost` at `:131`, `waitForRun` at `:156`). The ticket said to move the spec's arrow as is, so this is cosmetic.
3. `acceptance/helpers.ts:137-138`. The comment says non-matching requests "go to any route registered earlier". When no earlier route exists they go to the network, which `route.fallback()` does. The comment does not contradict the code; it just leaves that case unstated.

## Coverage

- Reviewed: all eight changed files in full diff context, plus the surrounding test bodies in `aoe4-auto-run-contract.spec.ts`, `aoe4-auto-run.spec.ts` (400, retry, superseded and open-rows tests), `aoe4-build-order-pin-compare.spec.ts` (restore handler `:603-611`, `routeRestore` `:380`), `aoe4-step-annotations.spec.ts` (layout test), and `helpers.ts` (`CHART_IDS`/`RESOURCE_CHARTS` `:87-88`, `expectNoRun` `:164`).
- Scope: product code and save-open, chart-readability and narrow-layout specs are untouched, as the ticket requires. `CHART_IDS` and `RESOURCE_CHARTS` definitions are unchanged.
- Shipped-artifact hygiene: no ticket ids or factory pointers in the diff.
- UI inspection: not run. The diff changes no UI (acceptance specs only).
- REPO.md Review checklist: "Every diff" (next build plus loading touched pages) does not apply because no page or component changed; tsc covers the TypeScript specs. No `Paths:` section matches `acceptance/**`.
- LSP: not used; I grepped the callers of the removed local holds and `bodyDuration` instead (no remaining references).
- Not run by me: acceptance and the mutation checks (common.md, Processes). I relied on the implementer's records for those.
