# SGS-117 spec gate, round 1

Read at `origin/main` (fetched). No Depends-on. Files spot-checked: `vitest.config.mts`, `auto-run.ts`, `use-auto-run.ts`,
`auto-run.test.ts`, `saved-build-loader.ts` and test, `step-annotations.ts` and test, `step-annotation.test.ts` and `.module.css`,
`simulate-house-gate.test.ts`, `simulate-construction.test.ts`, `test-helpers.ts`, `data/aoe4-build-order/README.md`,
`builds/english-knight-longbow.json`, `.jscpd.json`.

## Verdict: NEEDS_SPEC

## Gaps

1. **House gate scope / acceptance criterion 6 - the suggested replacement assertion is still true by construction - an implementer
   following the ticket's first example would reintroduce the defect and fail the mutation criterion.**
   `hold = heldSince(off.result, 595)` is the first sample whose population equals the population at 595. Population never decreases,
   so "every sampled `spawnedPopulation` from `hold` to 595 is equal" holds for any run, including the run with auto-houses left on
   (hold is recomputed from that run). It cannot fail, and criterion 6 (fails when `off` has auto-houses on) cannot be met by it.
   The second example ("`populationCapReachedAt` is not after `hold`") is unverified: the ticket does not say whether it differs
   between the `off` and `on` runs, and `hold` is again derived from the same population series.
   Fix: state a property tied to a quantity the engine computes independently of `hold`. For example, `off.result.populationCapReachedAt`
   is not null and `population(off.result, 595)` equals `population(off.result, populationCapReachedAt)` (the cap), and
   `population(on.result, 595)` is greater than that cap. Alternatively compare against the `on` run directly:
   `population(on.result, 595) > population(off.result, 595)`. Drop the "every sample equal" example, and require the implementer to run
   the mutation (the `off` run built with `autoHouses` left on) and show this one assertion failing. Not owner-only.

2. **Acceptance criterion 8 vs Scope - "The auto-run controller tests ... pass unchanged" contradicts the Scope edit to `auto-run.test.ts`
   (equal-input case) - an implementer cannot satisfy both literally.**
   Fix: "The auto-run controller tests, apart from the equal-input case edited here, and any hook-level test pass unchanged."

## Notes (non-blocking)

- `settledFields` reuse: the shared cleared-field literal is left to the implementer ("export the shared constant or a builder as needed").
  Naming one builder, for example `initialAutoRunState(settled, catalog)` in `auto-run.ts` used by both `createAutoRunController` and
  `firstPaintState`, would remove the guess. The `CLEARED` constant is already module-private in `auto-run.ts`, so a builder is the
  smaller change. This is not blocking because `lint:dup` and "same first-paint state" are checkable.
- The loader-abort stub needs `stubFetch` to pass `init` to `respond` (today `respond` takes no arguments). Say so in Scope, since the
  helper is shared by the other cases.
- The repo-level factory `LESSONS.md` entry "In Vitest, CSS-module imports are proxies (vitest.config.mts sets no `css` option)" becomes
  untrue when this merges. Reword it once the ticket lands (factory file, not a repo doc, so not a Docs gap).
- Knight-longbow README: confirmed the sentence is false (the JSON has no `rally` to `farm`; only the `move farm depleted sheep`
  reaction sends villagers to farms). The grep target `Town Center rally to farm` sits on one README line, so criterion 9 is checkable.
  `data/aoe4-build-order/builds/README.md` does not exist, as the ticket says. Counts I checked agree with the JSON (three stables, two
  archery ranges, farm groups at 563, 634, 600, 740, 840, 942, 960, 1080).
- Mutations in criteria 2 to 5 hold on reading: removing the `Object.is` guard makes the equal-input fire notify; dropping `signal`
  makes a stub keyed on `init.signal.aborted` resolve `ok`; moving the `selected` check first returns `none` for equal text; renaming
  `.stale` leaves `styles.stale` undefined under `non-scoped`.

## Checklist

1 grounded: pass. 2 testable: gaps 1, 2. 3 open questions: none. 4 invariants: none adjacent, pass. 5 contracts: `settledFields` matches
the M8 design row. 6 size: about 40 lines, pass. 7 diagrams: not triggered. 8 lessons: the CSS-proxy lesson is the reason for this
ticket, pass. 9 decisions: agree. 10 on merge: `none`, pass. 11 risk: low is right (no critical path, test-only plus a pure export).
12 docs: README in Scope; no other doc names `firstPaintState` or the proxy behavior. 13 input validation: not applicable.
