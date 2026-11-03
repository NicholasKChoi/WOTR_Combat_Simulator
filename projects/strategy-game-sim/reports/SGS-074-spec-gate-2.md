# SGS-074 spec gate 2

Verdict: NEEDS_SPEC (small, mechanical ticket edits; no owner decision needed). Checked against origin/main e6cad35.

## State of the world (verified)

- Stale doc phrases: all five are gone (`survives later runs`, `pinned run draws none`, `keeps the lower tier`, `a build order textarea, a$`, `validateBuildOrder`), plus `exactly one of .text. (paste format`. `git grep -nE` on docs prints nothing. None remain.
- Docs Route and Bounds table are already fixed: the Route section says the request is `{ buildOrder, inputs }`, names the removed-`text` 400 and says no route issue carries `line`; the bounds row reads "paste text (page-side conversion) / steps ... 20,000 chars / 200 steps" and the prose says the cap is not a route bound.
- OpenAPI: `info.version` 2.0.0; `SimulateRequest.properties` has no `text` (a `not: required text` rule and the description name the removal); `BuildOrderIssue.properties.suggestion` present; `SimWarning.oneOf` has 5 variants (node-depleted, idle-arrival, step-stuck, auto-houses-never-start, auto-houses-held), matching `model.ts` SimWarning and the doc list (doc lines 326-424, 748). Tier wording is in the `UnitSeries` descriptions. No example sends `text`. So the whole "expected end state (today in brackets)" is already the current state.
- Page, Route and Issues sections of `docs/aoe4-build-order.md` already describe tabs, run bar, live issues with `did you mean`, gutter marks, the collapsed info list, pin persistence, `pinned-label`, `results-stale` and the 390 px layout. `Custom build` is documented as "when there are no prebuilt builds" and `pin-name.ts` does exactly that (the design M4 lines 415 and 526 say the same), so no contradiction. Empty text is not in the doc; the design says it follows the ordering row, `text-to-build.test.ts` confirms. Not a contradiction.
- design/M2.md lines 76, 210, 222 already carry the M4 C5 tier wording on the state branch.
- Test ids all exist on main: `workbench-tabs`, `tab-build`, `tab-results`, `panel-build`, `panel-results` (workbench-tabs.tsx), `build-order-select`, `duration-seconds`, `run-simulation` (build-input.tsx), `build-order-issues`, `build-order-issue`, `build-order-issue-suggestion` (issue-list.tsx), `build-order-line-number` with `data-error="true"` (build-text-editor.tsx), `simulation-notes-toggle`, `simulation-notes-list`, `simulation-warnings` (message-lists.tsx), `pin-run`, `unpin-run`, `pinned-label` (compare-panel.tsx), `results-stale`. `showTab`, `showView`, `runSimulation`, `runRejected`, `openPage` exist in helpers.ts.
- Overlap: every area is already covered separately.
  - Tabs on load: `aoe4-build-order.spec.ts` ~727 (Build selected, `panel-results` hidden, `tab-results` disabled) and ~744.
  - Inline error with `did you mean knight?` and `data-error` on line 2: `aoe4-build-order-inline-issues.spec.ts` ~71.
  - Knight/Longbow 1800 s gold info list: `inline-issues.spec.ts` ~212-232 and `knight-longbow-page.spec.ts`.
  - Pin survives reload: `pin-compare.spec.ts` ~330-345 (label, enabled states, one POST) and the unpin cases ~364-376.
  - So there is no hole. The new spec is purely the cross-feature journey, which is what the ticket says; it must not copy the per-feature assertion depth (the PR should say it is a journey and no area was a hole).

## Gaps

1. Acceptance (docs paths) - "every backticked `*.ts`/`*.tsx`/`*.json`/`*.md` path ... is a tracked file (0 missing today)" is false as written. The doc uses short names on purpose: `effects.ts`, `depletion.ts`, `gather.ts`, `model.ts`, `simulate.ts`, `rules/base.json`, `rules/english.json` fail a literal `git cat-file` check (7 "missing"; they resolve to `lib/aoe4-build-order/*.ts` and `data/aoe4-build-order/rules/*.json`). An implementer would either "fix" correct prose or invent a rule. Fix: define the check as "the path, or its basename/suffix, matches exactly one tracked file (full repo-relative paths must match exactly)", and say these 7 are expected short names that need no edit.
2. Acceptance (stale phrases and Route) - "(it finds 5 lines on `origin/main` today)", "(1 hit today)", the Scope claim "on `origin/main` each has one hit", the line-number hints (816, 615, 626-652, 55) and the OpenAPI "today in brackets" values are all untrue now (base d5c2549 is stale; main is e6cad35). Fix: rebase the ticket text to e6cad35, state that the greps and jq checks already pass, and scope the audit to the sections not yet re-read. Keep the greps as regression criteria, drop "today" counts.
3. Scope (flow step 4, label) - "`pinned-label` contains `ENG Knight/Longbow (King's Palace)` and `30:00`" passes for `... (edited)` too, so it cannot catch a failed text restore. Fix: assert `toHaveText("Pinned: ENG Knight/Longbow (King's Palace), 30:00")` (exact, as pin-compare does), also in the criterion.
4. Scope (flow step 4, restore) - "restore by choosing it in `build-order-select`": the select already holds that value after the step 3 edit; `selectOption` on the selected option may not give a reliable change (`selectBuild` always sets the text, but this is unverified). Fix: say how (select another build, then Knight/Longbow; or `selectOption` and assert `build-order-text` equals the build text before running), and require an assertion that the text is restored before the run.
5. Scope (flow step 4, unpin) - after `page.reload()` the Build tab is selected and `unpin-run` is inside the hidden Results panel, so the click times out. Fix: `showTab(page, 'results')` before `unpin-run` (the existing `aoe4-build-order.spec.ts` unpin test does this).
6. Scope (flow step 3) - "`tab-results` still shows the charts" and the criterion "with the earlier charts still drawn" need a stated check: charts are in the hidden panel while Build is selected, so `toBeVisible` fails unless the test calls `showTab(page, 'results')` first (a `results-stale` notice also appears). Say: switch to Results, assert a chart test id is visible (and `results-stale` visible), switch back. The "no POST" count must be named in the step too (use a request listener from before the edit; `runRejected` is not usable because no Run is clicked).
7. Scope (timeout) - three simulations at 1800 s plus a reload re-run in one test; the config timeout is 60 s and the sibling specs use `test.describe.configure({ timeout: 90_000 })`. Add it, or the test is flaky.
8. Scope (docs, page section) - the doc says the per-row More control "starts open when the step sets one"; `step-table.tsx` (lines 292-308) keeps open state per row index, resets it when the row count changes, and closes it when the action changes (design M4 line 491 says the same). Add this one sentence fix to Scope as a known audit hit, since nothing else will.

## Checks that passed

- Risk standard is fine: OpenAPI is already at its end state, so the likelihood of a contract-file edit is low; no `criticalPaths` symbol is touched.
- Invariants: A3 adjacency named; no contradiction. No open questions. On merge none is right. No LESSONS entries apply (both LESSONS files are empty). Size: test-only, about 120 lines.
- Mutation criterion: the `issue-list.tsx` suggestion element and the pin restore both exist as stated; keep it. (`pin-compare.spec.ts` would also fail on the pin mutation, which is fine.)

## Notes

- The 390 px test removal is correctly done; `aoe4-narrow-layout.spec.ts` exists and owns it.
- Since the audit finds almost nothing to edit, consider telling the implementer that "an audit that finds nothing says so" is the expected PR outcome for OpenAPI, Route and Bounds, and that the only likely doc edit is gap 8.
