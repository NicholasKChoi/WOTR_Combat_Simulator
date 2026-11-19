# SGS-212 acceptance-test 11

Verdict: PASS. Branch tip was 582806d; I added one commit, 9a9a464f0ad915c4f6fb9bc5b85ad30df34e538c (test file only).

## Harness run
`acceptance:setup` ran, then `npm run acceptance` on aoe4-rename-build, aoe4-save-status, aoe4-my-builds, aoe4-split-tab-order and aoe4-save-open: 136 passed, 0 failed, before my additions. After them the rename spec's new tests passed (3 of 3 selected). `tsc --noEmit` and `lint:dup` clean (0 clones).

I did not run the split-layout, editor-width, min-width and chart-layout specs, or the other split specs.

## Tests written (acceptance/aoe4-rename-build.spec.ts, `shown and disabled`)
- "is not shown for a build opened from its n link in a browser without its secret": Rename is absent for a shared (`?n=`, no secret) entry. The existing spec only checked templates.
- "is disabled while another of My builds is loading, and enabled once it has loaded": the GET is held on choosing another entry, Rename is disabled, then enabled after release. The existing specs checked the save-in-flight case only.

The implementer's spec already covers the other criteria, and I judged each case against what it claims:
- form states and focus, Enter and Escape, one form at a time
- the success path, including the second rename's revision
- `?n=` reload, an answer arriving after the input changed, and an edited build
- 412 and the other failures, unavailable storage, the stored-name rule, and the other tab's name
- the 1200, 1280 and 1800 row layout

## Mutation checks (all undone with `git checkout -- <file>`; `git diff` on non-test files clean afterwards)
- Test 1: `save-build.tsx:110` changed to `showVersion = entry?.kind === 'mine' || editSecret === null`. The fresh-context test failed on `toHaveCount(0)` (expected 0, received 1). The template test failed too.
- Test 2, disabled assertion: `save-build.tsx:113` with `!busy &&` removed. It failed on `toBeDisabled()` (expected disabled, received enabled).
- Not mutation-checked: the "enabled once it has loaded" assertion in test 2. It follows the disabled check, and a break that keeps Rename disabled would fail it. I did not run that break.
- Spec pass: I did not re-mutate the implementer's existing tests. Their mutation records are in the implementer reports.

## Failures
None.

## Not expressible
- "Entry has no loaded revision disables Rename": not reachable through the UI. It is covered by the unit row in `save-build.test.ts`.
