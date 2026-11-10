# SGS-108 acceptance-test 1

Verdict: PASS. Branch sgs-108-step-run-cell, new tip 5bda0f7 (was d964ace). Not pushed.

## Tests written
One added assertion; the implementer's cases already covered every other browser-observable criterion.
- `acceptance/aoe4-step-annotations.spec.ts:243` (inside the layout test): at 1280 px, `panel-build` has computed `overflow-x: visible`, pinning that no panel-wide sideways scroll rule remains. The existing text-view edge check cannot catch a restored `overflow-x: auto`.

## Run
Ran `aoe4-step-annotations`, `aoe4-build-order-pin-compare` and `aoe4-step-table` specs (77 tests): all passed. After the addition the annotations spec ran 10/10. `npx tsc --noEmit` and `lint:dup` clean. Harness ran (Playwright, Chromium, own dev server).

## Mutation checks (all undone, `git diff --exit-code` on components/pages/lib clean after each)
- every row carries kind/timing/legend: `step-annotation.tsx` StepTimes start `+1` -> failed `step-started` Expected "0:00" Received "0:01".
- kind colour vs legend: removed `styles.kindBorder` from the run cell -> failed border-left-color equality (rgb(25,135,84) vs rgb(222,226,230)).
- data-long-wait: `step-table.tsx:328` keyed on `run` existing -> failed `not.toHaveAttribute('data-long-wait')` on a short row.
- not-reached text and tint: warning `background-color` dropped in `step-annotation.module.css` -> failed `background(not-reached) != background(calm)`. (A first break to `transparent` still passed because it differs from Bootstrap's white; replaced by removing the declaration.)
- empty Blocked by: `blockedBy || "x"` -> failed `toHaveText('')`.
- stale case 1 (delete row): `alignedRuns` aligns by index -> failed `data-run-step` Expected "1" Received "0".
- stale case 2 (select another build): removed the `selected` mismatch guard in `alignedRuns` -> failed `[data-status]` count 0, received 1.
- stale case 3 (invalid edit): `annotationToneClass` stale branch disabled -> failed `step-run` opacity 0.5, received 1.
- charts dim on edit: `resultsStale` ignoring text change -> failed poll for 0.5, received 1.
- layout: `.runCell` min-width 14rem -> failed the fit assertions; restoring `overflow-x: auto` on `.workbenchSplit > :first-child` -> failed the new `overflow-x` assertion (received "auto"). Before the new assertion this break passed the test.

## Weak spot (not a defect)
The second half of "the charts dim from the edit ... choosing the selected build does not dim them" cannot fail: re-choosing the same build changes no input, so nothing could dim it. Left in place; the first half is mutation-verified.

## Failures
None.

## Not expressed in this harness
None. The unit-table criteria, docs greps, and `lint:dup` criteria belong to Vitest and git checks, not the browser harness, and I did not rerun `npm test` or the full `npm run acceptance` suite.

No background processes left (the only listener found was the sandbox proxy on 3128).
