# SGS-074 review 1

Verdict: **REQUEST CHANGES**

Reviewed branch `sgs-074-aoe4-m4-docs-audit-playwright` at local tip `6465ca8e5984c1df1e220e1a6667e31e794da1d8` (one commit on `origin/main` `e6cad358`). The branch is not on origin (`git ls-remote` shows no ref), so I reviewed the local ref in a detached worktree. Node v24.22.2.

## Blocking findings

1. `acceptance/aoe4-build-order-m4-flow.spec.ts:73-75` - test - the last step (`unpin-run`, `page.reload()`, `expect(tab-results).toBeDisabled()`) cannot fail. `tab-results` is disabled on first render anyway: `pin` starts as `null`, and the restore POST from `pages/apps/aoe4-build-order.tsx:110-129` only sets it after the response arrives. `toBeDisabled` passes on its first poll, before any restore POST could re-pin. - why it matters: the ticket criterion "after `unpin-run` and a reload, `tab-results` is disabled" is meant to prove that unpin removes the persisted pin, and this check does not prove it. Mutation check: I replaced `if (storage) clearStoredPin(storage)` in `unpin()` (page line 204) with `void storage`, so unpin no longer clears localStorage. The flow spec still **passed** (1 passed, 5.1 s). - direction: make the check wait out the restore window. Options: assert `localStorage.getItem('aoe4-build-order.pinned-run')` is null before the reload (as `pin-compare.spec.ts:465` does); or count POSTs to `SIMULATE_PATH` across the reload and assert 0 once the page is idle, then assert `tab-results` is disabled. Re-run the unpin-keeps-storage mutation to confirm the step now fails.

2. `docs/aoe4-build-order.md:822` - contract (audit miss, wrong behavior stated) - "The view and the tab survive runs but not a reload." The tab does not survive runs. `runSimulation` calls `setTab('results')` on success (page line 176) and `setTab('build')` on a rejected, 400 or failed run (lines 157, 166, 180). The doc's own sentence at lines 817-819 says so too. The design (`design/M4.md:480`) says only "The view survives runs and tab switches, not reloads". This sentence came in with the tabs PR (12639c4). The ticket's audit scope is "Fix every statement the code contradicts" in the Page section, so it belongs here. - direction: e.g. "The editor view survives runs and tab switches but not a reload, and a reload starts on Build." List it in the PR with the `setTab` lines as the code that makes the old text untrue.

## Spec gaps

None.

## Acceptance criteria

| criterion | result | evidence |
|---|---|---|
| m4-flow file count 0 to 1; `npm run acceptance` passes under Node 24 | pass | `git ls-tree origin/main` gives 0 and the branch gives 1. Full suite on port 4201: **690 passed** (1.4 m), exit 0 |
| Flow: tabs on load and after run | pass | spec lines 20-23 and 28-29 |
| Flow: info list | pass | the response is read; collapsed count 0; expanded `node-depleted` gold items equal the response messages in order; none in warnings. Mutation (info messages also rendered in the warnings list) fails it: "Expected: 0 Received: 2" |
| Flow: inline error | pass | one issue, `knigt`, suggestion text exact, gutter line 2 `data-error="true"`, chart and `results-stale` on Results, POST counter 0. Mutations: suggestion threshold set to 0 fails ("did you mean knight?" not found); stale `||` changed to `&&` fails (`results-stale` not found); an effect that POSTs on edit fails (`posted` not empty) |
| Flow: pin | **fail** | the reload, enabled state and exact label hold (restore at 1200 s instead of the stored duration fails with "Received ... 20:00"). The final unpin+reload `toBeDisabled` cannot fail (blocking finding 1) |
| Deterministic, uses webServer | pass | no `waitForTimeout`; waits are on responses and test-id assertions. `pin-run` cannot be clicked before the new run lands because it sits in the hidden Results panel until `setTab('results')`. Stable under load (see Stability) |
| Docs stale-phrase grep (regression) | pass | prints nothing |
| Docs paths | pass | the only non-unique matches are `aoe4world/<civ>.json` (0), `rules/<civ>.json` (0) and `simulate.ts` (3). All are expected |
| Docs Route grep and section | pass | grep prints nothing; doc lines 668-676 state `{ buildOrder, inputs? }` and the removed-`text` 400, which match `pages/api/aoe4-build-order/simulate.ts:20-27` |
| Docs More control | pass | see the More-control check below |
| OpenAPI end state | pass | `2.0.0`, `false`, `true`, `5` |
| Contract spec passes unedited | pass | not in the diff. It passed in the full suite and 10 times under load |
| Every doc/OpenAPI edit listed; empty audit says so | fail | the audit missed doc line 822 (blocking finding 2). The PR is not open yet |
| Mutation (pin restore, suggestion) | pass | the implementer's and mine both fail the spec (see above) |
| No INVARIANTS.md regressions | pass | test and prose only; no path under A1-A3 is changed |

I left every criterion unticked because the verdict is not APPROVE.

## More-control sentence (doc 845-849) against the code

The sentence is accurate:
- `step-table.tsx:292` keeps `{ rows, open }` with `open = steps.map(hasOptionalField)`. `hasOptionalField` (`step-table-model.ts:186`) uses `OPTIONAL_STEP_FIELDS`, the same list the doc names.
- Lines 294-297 recompute it when `steps.length` changes.
- Line 308 calls `setOpen(index, false)` when `next.action !== step.action`. `replaceStep` keeps the row count, so that close persists.
- `pages/apps/aoe4-build-order.tsx:233-242` mounts `StepTable` only when `view !== 'text'` and `parsed.ok`, and shows `step-table-unavailable` otherwise.
- `workbench-tabs.tsx:44,52` uses `hidden`, so a tab switch does not remount the table.

## Independent audit (docs and OpenAPI against the code)

Checked and current:
- Removal of the `text` field: the route section, the OpenAPI `SimulateRequest` (`not.required text`, exact message) and the example at openapi:596.
- `suggestion`: doc 591-594, `BuildOrderIssue.suggestion`, `nearestId` threshold `max(1, floor(len/3))` at `schema.ts:222-237`, and the page's `did you mean <id>?` (`issue-list.tsx`).
- Both auto-house warnings: doc 322-334 and 749-761, `simulate.ts:884-897` messages, `model.ts:151-152`, and the OpenAPI variants (`at` const 0; `seconds` exclusiveMinimum 0).
- Sort order: `depletion.ts:153-159`.
- `UnitSeries.counts` after veterancy: doc 703-706 and the OpenAPI `UnitSeries` and `unitsProduced` descriptions.
- `textToBuildOrder` cap, parse, check and lines (`text-to-build.ts`), and live issues: parse issues show at once, check issues only after `checked` (page line 108).
- Pin persistence: key, version, restore, 400 drops, network failure keeps, Pin/Unpin before the re-run wins (`pinTouched`).
- Pin label `Pinned: <name>, <m:ss>` (`compare-panel.tsx:49`), `pinName` with `(edited)` and `Custom build` (`pin-name.ts`).
- Stale notice, info toggle wording, message order and timeline placement (`results.tsx`).
- Narrow layout: SGS-073 specs pass in the full suite.

Stale and wrong: doc 822 (blocking finding 2).

Imprecise, non-blocking:
- Doc 932: "A 400 ... removes any earlier charts and message lists, so only the error list shows". With a pin, Results stays enabled and still shows the compare panel.
- Doc 932: "(each names its line or step)". Route issues never carry a line, and inputs and request issues name neither a line nor a step.

## Bot reconciliation

`reviewBot.cli` is empty and no `rulesFile` is set, so no bot ran.

## Lint and gates

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `npm test`: 1307 passed, 10 skipped.
- `npx next build`: ok.

## Stability

I used a throwaway config with `reuseExistingServer: true` and one `next dev` on port 4201.
- Run 1: flow `--repeat-each=10 --workers=5` gave **10 passed**, while `pin-compare` and `aoe4-build-order.spec.ts` ran at the same time (85 passed).
- Run 2: flow plus contract spec `--repeat-each=10 --workers=5` gave **660 passed**, while `pin-compare --repeat-each=2 --workers=4` ran at the same time (64 passed).

I then deleted the config and stopped the server.

## Duplication

The spec is the journey only: one test with one assertion group per area. Every area also has deeper coverage in its owning spec. It adds no per-feature depth beyond what the ticket lists. `textOf` follows the `listBuilds()` + `formatBuildOrderText` pattern of `aoe4-build-order-from.spec.ts:7-9`.

## Non-blocking notes

- `acceptance/aoe4-build-order-m4-flow.spec.ts:45-48`: the `page.on('request')` listener is never removed, so the later run and both reload POSTs also go into `posted` (nothing reads it afterwards). `runRejected` in `acceptance/helpers.ts` removes its listener with `page.off`. Consider matching that.
- Spec line 60: `expect(posted).toEqual([])` is read right after UI assertions. That works because an edit-triggered POST would fire during render. My mutation caught it.

## Coverage

Files reviewed:
- `acceptance/aoe4-build-order-m4-flow.spec.ts`
- `docs/aoe4-build-order.md`, in full for the Page section, plus the Issues, Route, Houses, Warnings, Severity and Results sections
- `docs/api/openapi.json`: SimulateRequest, BuildOrderIssue, UnitSeries, unitsProduced and SimWarning
- Compared against: `step-table.tsx`, `step-table-model.ts`, `pages/apps/aoe4-build-order.tsx`, `workbench-tabs.tsx`, `results.tsx`, `message-lists.tsx`, `issue-list.tsx`, `pin-name.ts`, `pin-storage.ts`, `compare-panel.tsx`, `build-input.tsx`, `text-to-build.ts`, `schema.ts`, `simulate.ts`, `depletion.ts`, `model.ts`, `pages/api/aoe4-build-order/simulate.ts`, `acceptance/helpers.ts` and `pin-compare.spec.ts`

Not done:
- I did not hand-load the page in a browser (REPO.md "Every diff"). Prose and test only; the full Playwright suite exercised the page.
- REPO.md review checklist: I ran the "Every diff" and "AoE4 build order" sections. The chart item does not apply.
