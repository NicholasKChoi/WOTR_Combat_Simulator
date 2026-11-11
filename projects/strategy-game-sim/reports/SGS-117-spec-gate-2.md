# SGS-117 spec gate, round 2

Read at `origin/main` (fetched). No Depends-on. Re-checked: `auto-run.ts`, `use-auto-run.ts`, `vitest.config.mts`,
`saved-build-loader.test.ts` (`stubFetch`), `simulate-house-gate.test.ts`, `simulate-construction.test.ts`
(`housesDone`), `test-helpers.ts`, REPO.md criticalPaths.

## Verdict: READY

Both round-1 gaps are closed.

- Gap 1 (house-gate assertion true by construction): now `population(on.result, 595) > population(off.result, 595)`. `on` is not
  derived from `hold`. The named mutation (`off` built with `lateHouse()`, so equal populations) makes the strict `>` fail alone.
- Gap 2 (criterion vs. equal-input edit): criterion now excepts the equal-input case.
- Round-1 notes also taken: `initialAutoRunState` is named (the `CLEARED` constant stays private; today `settledFields` is a private
  function in `auto-run.ts` at line 80, and the ticket says to export it), and `stubFetch` passing `init` to `respond` is stated.
  `use-auto-run.ts` today imports `textToBuildOrder` and `durationError` and defines `firstPaintState`, so the grep criterion holds
  after the change.

## Notes (non-blocking)

- The `housesDone` helper in `simulate-construction.test.ts` returns `{ done, rules }`, and `withHouses` in the house-gate test
  inlines the same recorder. The ticket says "move that helper ... as one export" without a name. Implementer should move
  `housesDone` as is (name and return shape); `withHouses` then calls it. Low guess risk.
- Risk `low` holds: the edited symbols (`createAutoRunController` initial state, `firstPaintState`) are not in REPO.md criticalPaths.
- Factory LESSONS.md line 4 ("CSS-module imports are proxies ... sets no `css` option") becomes untrue when this merges. Reword
  it after landing (factory file, not a repo doc).
- `lib/aoe4-build-order/test-helpers.ts` will need the `CivRules` type import for the moved helper.

## Checklist

1 grounded: pass. 2 testable: pass (each criterion has a named mutation or grep). 3 open questions: none. 4 invariants: none
adjacent, pass. 5 contracts: pass. 6 size: about 40 lines, pass. 7 diagrams: not triggered. 8 lessons: pass (the CSS-proxy lesson
motivates the ticket). 9 decisions: agree. 10 on merge: `none`, pass. 11 risk: low, pass. 12 docs: README in Scope, comment above
`useAutoRun` in Scope; pass. 13 input validation: not applicable.
