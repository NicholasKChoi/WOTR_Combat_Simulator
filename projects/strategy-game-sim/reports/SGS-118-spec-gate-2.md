# SGS-118 spec-readiness gate, round 2

Verdict: READY

Read at origin/main after `git fetch origin`. Checked all 13 points against the re-specced ticket. The three round-1 gaps are closed.

## Round-1 gaps

1. Chart-id grep: now keyed on `\[ *'chart-units-produced'`. On origin/main the only matches are the step-band, compact-view and results-split lists and the auto-run two-id loop, all in Scope 4. The narrow-layout legend list and the chart-readability subset do not match. Closed.
2. Import order: the rule is now default code-point sort, upper-case first. This matches the existing lists (`AOE4_PAGE, SIMULATE_PATH, buildOrderFrom, ...`). The only out-of-order list is auto-run, where `TABS_VIEWPORT` sits between lower-case names, and Scope 6 names that move. Closed.
3. Hold semantics: Scope 1 and criterion 1 now say hold every matching request until release, with `route.fallback()` for the rest. The helper is pinned by two existing tests (contract status line; pin-compare "a run that finishes before the restore lands"), each with a mutation check. Closed.

## Spot checks

- `acceptance/helpers.ts` has `SIMULATE_PATH`, `isSimulatePost`, `CHART_IDS`, `expectNoRun`. It has no `holdRequests` and no `holdNextSimulate`, and the ticket says they are new.
- Local holds exist as described: `holdSimulate` in pin-compare (4 callers), compact-view, step-annotations (2 callers) and step-band (nested, with `hitOnce`); `holdNextSimulate` in the contract spec; inline gate routes in auto-run at "a first invalid load state has no target" and "a superseded request ...".
- The pin-compare line 391 route answers per duration or continues, and line 620 is the restore handler that awaits a gate and fulfils 500. Neither is a hold, and Scope 2 and criterion 5 keep them. `aoe4-save-open.spec.ts` `await gate.opened` is allowed by criterion 5.
- `page.unroute((url) => ...)` in step-band is a function predicate, so it never removed the `page.route(fn, ...)` route registered earlier with a different function. The ticket's reasoning holds.
- The status text, ids and classes used by the mutation checks exist in `build-input.tsx` (`id="auto-run-status"`, the `is-invalid` class, `duration-error`) and `results.tsx` (`dimmed`, `aria-describedby`). The two status strings come from `auto-run-status.ts`.
- Exactly two step-annotations tests assert `aria-describedby="auto-run-status"` (deleting a row; an invalid edit dims). Scope 5 names the right message for each.
- Design M8.7 helpers row (design/M8.md) now states `holdRequests` and `holdNextSimulate` with matching signatures, so contracts match and the designer pass is already reflected. The ticket's Open questions entry can be removed once that pass lands. It is not blocking.
- Risk standard is right for test-only work. No criticalPaths symbol is touched. Invariants none: test-only. On merge none: correct, as the helper is consumed by SGS-125 through the ticket graph, not a factory command. Docs: nothing names the helpers. Size is about 250 test lines. No input validation involved.

## Notes (non-blocking)

- Open-rows test: with `before[i] ?? false`, a row past the end of build 0's list is "before false". The new-row assertion must treat `undefined` as false. `BUILDS[2]` is the knight-longbow build, whose step 0 is a `produce` with no optional field in the JSON, so the kept-row case looks real. The implementer should confirm both assertions pass before the mutation check.
- Contract status-line mutation (gate `await` removed): the existing `toHaveText('Computing the simulation.')` may already fail there, and the new no-response assertion is then redundant. Harmless. The pin-compare mutations are the ones that prove the helper.
- Remove the Open questions entry (or mark it designer-resolved) when the designer pass lands, so the body carries no answered question.

Report path: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/SGS-118-spec-gate-2.md
