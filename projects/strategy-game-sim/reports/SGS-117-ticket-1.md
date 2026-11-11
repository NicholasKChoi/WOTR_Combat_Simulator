# SGS-117 ticket, re-spec 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-117-unit-test-debt-settled-fields-readme.md (edited in place; lint passes)

## Summary

"Fix unit tests that cannot fail, reuse settledFields, correct the knight-longbow README". Component aoe4-build-order, M8.6/M8.7/M8.8, risk low, about 40 business-logic lines, no dependencies. Covers the Vitest CSS-module setting and the tone-class test, the auto-run equal-input case, the loader abort stub, the identity-branch case, the house-gate and construction test cleanup with a shared house recorder, the `settledFields` reuse (now through a named `initialAutoRunState` builder), and the knight-longbow README sentence. The revised design/M8.md changes nothing for this ticket: its edits touch C1, C5, C6, C11 and the acceptance tables, and the M8.7 and M8.8 rows this ticket uses are unchanged.

## Gate findings folded in

1. House gate (blocking): I checked it at origin/main in a throwaway worktree with a probe test, which is now removed. `hold` = 240. `off` population at 595 = 30, `on` at 595 = 65. With auto-houses left on in `off`, `hold` becomes 580. `populationCapReachedAt` is `null` in the `off`, `on` and mutated runs because it tracks the game's maximum population, so I dropped that example. I also dropped the "every sample equal" example. Scope now names the replacement: `population(on.result, 595) > population(off.result, 595)`. Its mutation (the `off` run built with `lateHouse()`) makes 65 > 65 false, so the assertion fails on its own. Criterion 6 is rewritten (respec 1).
2. Criterion 8 vs Scope (blocking): it now excepts the equal-input case edited here (respec 1).
3. Note on `settledFields`: Scope names `initialAutoRunState(settled, catalog): AutoRunState`, exported from `auto-run.ts`. `createAutoRunController` and the `useMemo` in `useAutoRun` use it, `firstPaintState` is deleted, `CLEARED` stays private, and the comment above `useAutoRun` is renamed. The grep criterion now also covers `durationError` and `firstPaintState` in `use-auto-run.ts`. I checked it at origin/main: today it matches lines 4, 5, 15-17, 22, 34 and 64, all of which Scope removes.
4. Note on `stubFetch`: Scope now says it passes `init` to `respond`, and the other cases keep working.
5. Note on README and mutations 2-5: confirmed by the gate. No change.

## Diagrams

None. The change stays in one component and outside the core control loop.

## Open questions

None.

## For the manager

- The factory `LESSONS.md` entry "In Vitest, CSS-module imports are proxies (vitest.config.mts sets no `css` option)" becomes untrue when SGS-117 merges. Reword it then. It is a factory file, so the ticket does not edit it, and the `On merge` field has no slot for it.
- `initialAutoRunState` is a new export that the design does not name. Only this ticket uses it, so it is not marked as a designer question. Add it to CONTEXT.md Key surfaces if wanted.
- Overlap: none found. Other M8.7 items (acceptance, blob import, SGS-103 gaps, `holdNextSimulate`) are out of scope here, as before.
