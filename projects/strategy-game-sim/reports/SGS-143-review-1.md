# SGS-143 review 1

Verdict: APPROVE
Branch sgs-143-run-bar-focus-ring-height, tip d698acf1, base origin/main (41b3ed3).

## Blocking findings
None.

## Deviation judgement (integer scroll snapping)
Meets the ticket. Criterion 2 asks that the sticky bar reaches the viewport top and the split bottom the viewport bottom "with no sub-pixel shortfall", and that a fractional-height test fails at the base. The implementer shows Chromium snaps the page scroll offset to whole px, so the split bottom can sit up to under 0.5px from the viewport bottom even with exact rounding; that residual is the engine's, not the variable's. The discriminating assertion is `Math.abs(bar.top) < 0.05` at page end: `Math.ceil` leaves the bar off the top (recorded failing at base: `barAtTop: false`), no rounding puts it on top. The 0.5px bottom allowance is not a weakened check of the bug, since the ceil error is up to 1px on the top assertion. Not NEEDS_SPEC: the criterion is attainable for what it names (bar at top); the bottom half is only engine-limited. The test name says "exactly" for the bottom; that is slightly overstated (0.5px tolerance), see notes.

## Acceptance criteria
1. Focus ring inside the capped bar: pass. New test asserts preconditions (bar overflows, select starts above bar top at max scroll), then focuses and checks the ring's top edge (rect.top - box-shadow spread) against the scrollport top including clientTop. Without scroll padding focus leaves the control flush, gap = -spread < 0, so it fails (implementer recorded the failure on `ringTopGap`). `scroll-padding-block: 0.25rem` (4px) exceeds the ring spread. Checks the computed box-shadow, i.e. what is drawn.
2. Fractional height: pass. Test forces height+margin to end in .1, asserts non-integer and that the property tracks the bar, then asserts bar top ~0 and split bottom within 0.5px. Fails at base with ceil (`barAtTop: false`). `use-run-bar-height.ts` now writes the unrounded value.
3. Cap and narrow bar: pass by diff; nothing touches max-height or the below-768 rule, and the existing cap/static tests are unedited.
4. INVARIANTS: none listed for the ticket; the diff is CSS, a hook line, and tests. No regression found.

## Contract and scope
Names, config keys unchanged. Only the three scoped files changed; no pre-existing assertion edited (diff is additions only). The 1px tolerances are left alone, which the ticket allows ("only if it still passes"); the implementer's reasoning (integer scrolling residual) is sound. No docs changed; none of the stated behavior in docs changes. No comments added, no ticket ids in shipped code.

## Lint
`npx tsc --noEmit && npm run lint:dup`: clean, 0 clones. No review bot configured.

## Conventions
New tests sit in the existing describe, reuse `openCappedState`, `SPLIT_VIEWPORT`, `scrollInstantly`, `RUN_BAR_HEIGHT`, and follow the poll style of the neighbouring tests (spec lines 332-360, 279-312).

## Non-blocking notes
- The box-shadow spread parsing (`match(/-?[\d.]+px/g)`) is now written in two places in the spec (`focusRingFits` at line 337 and the new test at line 377). A small `ringSpread` helper would remove it; jscpd does not flag it.
- The fractional test title says "exactly" while the bottom check allows 0.5px; consider "to the bottom" only.
- UI inspection not run: change is a scroll-padding value reachable only in a forced capped state, which the acceptance test measures directly; the preview dev server was not started.

## Coverage
Reviewed the full diff (3 files), the ticket, the implementer report, the neighbouring tests in `acceptance/aoe4-split-scroll.spec.ts`. Did not run acceptance tests (not permitted); relied on the implementer's recorded runs (18 passed, 54/54 repeated).
