# SGS-117: Fix unit tests that cannot fail, reuse settledFields, correct the knight-longbow README

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M8 / M8.6, M8.7, M8.8
- **Priority**: medium
- **Risk**: low
- **Invariants**: none
- **LOC estimate**: 40 (business logic: `settledFields` and `initialAutoRunState` exports in `components/apps/aoe4-build-order/auto-run.ts` and their reuse in `use-auto-run.ts`; the rest is tests, `vitest.config.mts` and one README paragraph)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M8.md Criteria map M8.6 (README), M8.7 (unit-test rows of the M8.7 detail table), M8.8 (`settledFields`); plan M8-20261110 outline F

## Context

Several unit tests pass whatever the code does: they assert a state that holds by construction, or a stub that
rejects regardless of the thing under test, or a CSS-module class that Vitest invents for any key. Fixing them
makes them able to fail. `firstPaintState` in `use-auto-run.ts` repeats the controller's settled-field
computation, and the README's knight-longbow paragraph describes a rally the build does not have.

## Scope

All paths are under `components/apps/aoe4-build-order/` unless given in full. Read at `origin/main`.

**Vitest CSS setting.** `vitest.config.mts` gets `test.css: { include: [/\.module\.css$/], modules: { classNameStrategy: 'non-scoped' } }`,
so a CSS-module import resolves to the real class map and a missing key is `undefined`. Turning it on may break other unit
tests that relied on the proxy (every test that renders a component importing a `.module.css`, for example through
`StepTable` in `step-annotation.test.ts`); fix each in this ticket and list every test edited in the report.
`step-annotation.test.ts`'s `annotationToneClass` "keys the two tones to different class names" case then asserts
the two tone keys are defined and differ (it cannot pass for a key missing from `step-annotation.module.css`).

**Auto-run equal input** (`auto-run.test.ts`, case "an equal input restarts the timer, and its fire posts nothing").
`setup()` already returns `history`, the `onChange` calls. The case records `history.length` after the answer for
the first `OTHER` post lands and asserts it is unchanged after the final equal `controller.input(live(OTHER))`
fires, besides the existing `post` count and `status` checks.

**Loader abort** (`saved-build-loader.test.ts`, case "fails when the signal is already aborted"). The file's
`stubFetch` helper takes a `respond` with no arguments today; it changes to pass the fetch call's `init` to `respond`
(`respond: (init?: RequestInit) => Promise<Response>`), and the other cases that use it keep working unchanged. The fetch stub
rejects with an `AbortError` only when `init.signal.aborted` is true and otherwise resolves with a valid saved
build. The case aborts the signal and expects `{ status: 'failed' }`. A companion check in the same case (or the
existing "requests the build with the given signal" case) shows the same stub with a live signal gives
`{ status: 'ok', ... }`, so the stub is not rejecting unconditionally.

**Identity branch** (`step-annotations.test.ts`, `describe('buildAnnotations')`). A new case: `live.text`
equals `shown.text` while `live.selected` differs from `shown.selected`; every step keeps its own run. Give the
three timings distinct `startedAt` values and assert each row's `startedAt`, so a run assigned to the wrong
row also fails. This pins the `input.live.text === shown.text` check coming before the `selected` check in
`alignedRuns` (`step-annotations.ts`).

**House gate** (`lib/aoe4-build-order/simulate-house-gate.test.ts`, from the SGS-111 review).
- `blocks production at supply before the late step when auto-houses are off`: the assertion
  `population(off.result, hold)` equals `population(off.result, 595)` is true by construction of `heldSince`
  (population never decreases, and `hold` is the first sample at the value held at 595). Any assertion that compares
  `off` samples at or after `hold` with each other is true by construction too, since `hold` is recomputed from the
  same series. `populationCapReachedAt` does not help: it records reaching the game's maximum population, and is
  `null` in both runs of this scenario. (respec 1) Replace the assertion with a comparison against the `on` run, a
  quantity `hold` is not derived from: `population(on.result, 595)` is greater than `population(off.result, 595)`.
  Together with the existing `hold < 595 - 60` check, this states the property the test names: with auto-houses
  off, population sits at the supply limit for over 60 s before the late house, below what auto-houses reach.
- Rename the `plans an order without build-house steps as it did with the gate` test so its name states the behavior (an order with no
  build-house steps gets auto-houses at 120, 220 and 320 s and the pinned digest) with no reference to the removed gate.
- `lib/aoe4-build-order/simulate-construction.test.ts`: delete the `expect(done.slice(0, 2))` assertion
  that the following `expect(done).toEqual([20, 50, 320])` already covers.
- `withHouses` in the house-gate test duplicates `housesDone` in `simulate-construction.test.ts` (a `done` array plus an
  `onBuildingComplete` rule that records `house` completions). Move that helper to `lib/aoe4-build-order/test-helpers.ts`
  as one export and use it from both files.

**`settledFields` reuse** (M8.8). `auto-run.ts` exports `settledFields`. `use-auto-run.ts` `firstPaintState` builds its state
from it instead of repeating the conversion, duration check and request expression; `use-auto-run.ts` then no
longer imports `textToBuildOrder` or `durationError`. (respec 1) To keep the initial-state literal in one place
(`npm run lint:dup` runs with threshold 0), `auto-run.ts` also exports `initialAutoRunState(settled: LiveInput, catalog: BuildOrderCatalog): AutoRunState`,
which returns `settledFields(settled, catalog)` plus `status: 'loading'`, `result: null`, `resultRequestKey: null`,
`shown: null` and the module-private `CLEARED` fields. `createAutoRunController` sets its initial `state` from it, and
`firstPaintState` is replaced by it (the `useMemo` in `useAutoRun` calls `initialAutoRunState`). `CLEARED` stays
module-private. The comment above `useAutoRun` that names `firstPaintState` names `initialAutoRunState` instead. No behavior change: the first paint has the same field values as before (`serverIssues` is an
empty array either way).

**Knight-longbow README** (M8.6). The path is `data/aoe4-build-order/README.md` (the plan and design write `builds/README.md`; that
file does not exist). In the `english-knight-longbow` paragraph, the sentence that places the farm groups "ahead of the
villagers sent to farm by the Town Center rally to farm and by the sheep reaction" is false: the build has no Town Center
rally to farm. Only the `whenever sheep runs out move all sheep to farm` reaction sends villagers to farms. Rewrite
the sentence to match `data/aoe4-build-order/builds/english-knight-longbow.json`. Then check every other
claim in that paragraph against the JSON (rally times, the stable, range and house counts, the farm groups and their
`from`/`then`) and fix any that disagree. The 12:00 rally to wood (`time` 720) repeats the rally after `build kings-palace`; the
paragraph already says so and keeps saying it. The build JSON is not edited.

**Out of scope:** any production-logic change beyond the `settledFields` export and reuse; the other M8.7 items (acceptance specs,
`build-store.test.ts` blob import, SGS-103 route gaps, `holdNextSimulate`, `CHART_IDS`), which belong to other tickets;
editing `english-knight-longbow.json`; `design/M6.md`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `vitest.config.mts` sets `test.css` to include `.module.css` files with the `non-scoped` class name strategy, and `npm test` passes. The report lists every test edited because of it.
- [ ] Renaming the `.stale` class in `step-annotation.module.css` makes the `annotationToneClass` tone-keys case in `step-annotation.test.ts` fail (the key is `undefined`); the report names this mutation and shows the failure, then reverts it.
- [ ] The equal-input case in `auto-run.test.ts` asserts the `onChange` history length is unchanged after the equal input's timer fires. With the `Object.is` guard in `update` of `createAutoRunController` removed, the case fails; the report names this mutation.
- [ ] In `saved-build-loader.test.ts` the abort case's fetch stub rejects only when `signal.aborted` and resolves a valid saved build otherwise, and a check shows a live signal gives `ok`. With `signal` dropped from the `fetch` call in `loadSavedBuild`, the abort case fails; the report names this mutation.
- [ ] `step-annotations.test.ts` has a case where the text is equal and `selected` differs, each row keeps its own `startedAt`. With the `selected` check moved before the text check in `alignedRuns`, the case fails; the report names this mutation.
- [ ] (respec 1) The house-gate case `blocks production at supply before the late step when auto-houses are off` no longer asserts `population(off.result, hold)` equals `population(off.result, 595)`, and asserts `population(on.result, 595)` is greater than `population(off.result, 595)`. Mutation: build the `off` run with `lateHouse()` (auto-houses left on); with the case's other assertions temporarily removed, the new assertion fails on its own. The report names the mutation and shows the failure.
- [ ] No test name in `simulate-house-gate.test.ts` refers to a gate; `simulate-construction.test.ts` has no `done.slice` assertion that a following assertion covers; the house-completion recorder is defined once in `test-helpers.ts` and no other file under `lib/aoe4-build-order/` defines it.
- [ ] (respec 1) `settledFields` and `initialAutoRunState` are exported from `auto-run.ts`; `git grep -n -e "textToBuildOrder" -e "durationError" -e "firstPaintState" -- components/apps/aoe4-build-order/use-auto-run.ts` finds nothing. `npm run lint:dup` reports no clones and `npx tsc --noEmit` passes. The auto-run controller tests, apart from the equal-input case edited here, and any hook-level test pass unchanged.
- [ ] `git grep -n "Town Center rally to farm" -- data` finds nothing, and every statement in the `english-knight-longbow` README paragraph about rallies, building counts, farm groups and techs is true of `english-knight-longbow.json` (the report lists what was compared and any other line changed).
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-10

- Underspecified: the house-gate replacement examples were true by construction (or, for `populationCapReachedAt`, `null` in both runs); the `settledFields` criterion said the auto-run tests pass unchanged though Scope edits one; the shared initial-state literal and the `stubFetch` signature change were left open.
- Changed: the house-gate assertion is now `population(on, 595) > population(off, 595)` with its mutation; `initialAutoRunState` in `auto-run.ts` replaces `firstPaintState`; `stubFetch` passes `init` to `respond`; the controller-tests criterion excepts the equal-input case.
- No branch work exists yet; the rest of Scope stands.
