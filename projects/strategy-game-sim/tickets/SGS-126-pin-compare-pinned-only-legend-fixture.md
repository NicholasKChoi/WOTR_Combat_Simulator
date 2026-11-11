# SGS-126: Give the pinned-only legend acceptance test a pinned run that has a series the current run lacks

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone / criteria**: M8 / M8.4
- **Priority**: high
- **Risk**: low
- **Invariants**: none (test-only, no simulation or UI behavior change)
- **LOC estimate**: 10 (one test in `acceptance/aoe4-build-order-pin-compare.spec.ts`; no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: failing acceptance test `acceptance/aoe4-build-order-pin-compare.spec.ts` "a series only the pinned run has gets one dashed legend item that hides its dashed line" (fails on main at its `expect(only.length).toBeGreaterThan(0)`, got 0); evidence in `reports/batch-114-116-118-123-suite-1.md`

## Context

The test was added by SGS-113 (merged) and its acceptance specs were never run before merge. It pins a 300 s run of the default prebuilt build, then runs `start -> sheep` for 600 s. At 300 s the default build has produced only villagers, which the current run also produces, so the units-produced chart has no pinned-only series and the precondition fails. The component is fine: `legendItems` in `components/apps/aoe4-build-order/chart-rows.ts` already emits pinned-only items. M8.4 (a pinned-only series is listed once, dashed, and hides with its item) currently has no passing acceptance coverage.

## Scope

Only `acceptance/aoe4-build-order-pin-compare.spec.ts`, the one test named above.

- Change the pinned run so it produces a unit the current run lacks. `openPage` already loads the default build at the default duration, which is already `1200` (`INPUT_DEFAULTS` in `lib/aoe4-build-order/schema.ts`), so the loaded run is the long default run. (respec 1) Do not call `runOk` for it: `runOk({ duration: 1200 })` changes neither text nor duration, makes no POST, and `waitForRun` times out. After `openPage`, first assert the `build-order-text` field `toHaveValue(DEFAULT_PASTE)` (the spec's existing constant), then `pin(page)` directly, with no preceding `runOk`.
- Then run `runOk(page, { text: NO_MILITARY_PASTE })` as the current run. The text changes, so a POST is made. The default build produces spearmen and longbowmen (its military spend is non-zero by 1200 s, which the compare-table test relies on), and `NO_MILITARY_PASTE` produces only villagers. The implementer confirms the precondition below.
- Keep the `expect(only.length).toBeGreaterThan(0)` precondition assert. The existing `only` computation (legend keys with no non-pinned path) already defines a pinned-only series.
- Everything after the precondition stays: one legend item for `only[0]`, a `dashed` swatch `border-top-style`, swatch colour equal to the `pinned:<key>` line's `stroke`, and clicking the item removes the `pinned:<key>` path.
- Do not use any helper that the pending `sgs-118-acceptance-test-debt` branch adds to `acceptance/helpers.ts`. That branch also edits other tests in this same spec file (it deletes the spec's local `holdSimulate` and `bodyDuration`). Touch only this test's body so the two merge without conflict; `runOk`, `pin` and `path` stay as they are.
- Run only this spec file (`npx playwright test acceptance/aoe4-build-order-pin-compare.spec.ts` through the acceptance command) for the verification below; the ticket changes an acceptance spec, so this one run is allowed. Record the result in the report.

**Out of scope:** any change to `components/`, `lib/`, `docs/`; other tests in the spec; `acceptance/helpers.ts`; running the full acceptance suite.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The test "a series only the pinned run has gets one dashed legend item that hides its dashed line" passes when `acceptance/aoe4-build-order-pin-compare.spec.ts` runs, and the rest of that spec's tests keep their results.
- [ ] (respec 1) The test makes no `runOk` call before `pin`; it asserts the loaded text equals `DEFAULT_PASTE`, pins, then calls `runOk` with `text: NO_MILITARY_PASTE`, and no `runOk` call leaves both text and duration unchanged.
- [ ] The test still asserts `only.length > 0` before using `only[0]`, where `only` is the legend keys with no current-run line.
- [ ] The test fails if a pinned-only series stops getting a dashed legend item. Mutation check: in a throwaway worktree change `legendItems` in `components/apps/aoe4-build-order/chart-rows.ts` so a pinned-only key's `lines` is `'both'` (swatch becomes solid), run the spec, and confirm this test fails at the `border-top-style` `dashed` assertion; the implementer records the result.
- [ ] The test fails if hiding the item leaves the pinned line drawn. Mutation check: in the same kind of worktree make `isLineHidden` in `chart-rows.ts` return false for a `pinned:`-prefixed key, run the spec, and confirm this test fails at the final `toHaveCount(0)`; the implementer records the result.
- [ ] The test fails if the pinned-only legend item is dropped. Mutation check: make `legendItems` skip pinned-only keys; the test fails at the precondition or the item-count assertion. The implementer records the result.
- [ ] Only `acceptance/aoe4-build-order-pin-compare.spec.ts` changes; no business-logic file is edited, and the edit does not touch other tests in the file; every test edited is named in the report.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-10

- Underspecified: pinning the default paste at 1200 via `runOk({ duration: 1200 })` makes no POST (default duration is already 1200) and times out.
- Changed: pin the `openPage`-loaded run directly after asserting its text is `DEFAULT_PASTE`, then `runOk` with `NO_MILITARY_PASTE`.
- Stands: all other Scope, mutation criteria, and out-of-scope lines.
