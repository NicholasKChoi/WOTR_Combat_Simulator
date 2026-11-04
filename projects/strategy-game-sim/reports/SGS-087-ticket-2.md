# SGS-087 ticket author 2 (re-spec)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-087-aoe4-chart-readability.md

Summary: "Make the AoE4 charts readable: uncrowded marker labels and rounded tooltip values", component aoe4-build-order, risk low, ~30 business LOC, depends on SGS-082. Re-explored on origin/main b9481e3.

Folded in
- Owner answers: only age-up markers keep text labels; other kinds are unlabelled solid lines with a `<title>` of `<label> <m:ss>` plus the kind legend. Tooltip values at most 1 decimal on all four charts. Open questions deleted (now "None").
- Gate gap 2: style references are now aoe4-build-order-knight-longbow-page.spec.ts and aoe4-build-order-pin-compare.spec.ts, helpers openPage, showTab, runSimulation. (Note: acceptance/aoe4-gathered-resources.spec.ts does exist on b9481e3; the gate checked ee7ecb9. Swapped anyway as instructed.)
- Gate gap 3: acceptance asserts the marker label text set (svg text.recharts-label minus the Y-axis label, which shares that class) equals the age-up `<label> <m:ss>` texts and 1 <= data-label-rows <= age-up count. `pinnedAgeUpMarkers` is renamed `ageUpMarkers` and feeds both the pinned lines and placeMarkers; its existing unit test is the filter pin.
- Gate gap 4: tooltip check uses the Knight/Longbow prebuilt, hovers the centre of `.recharts-cartesian-grid` in Gather rates and Floating resources, asserts no `/\d+\.\d{2,}/`; implementer runs it once with the formatter removed and records the failure (fallback: a fixed plot-width fraction constant). `formatChartValue` table adds null/undefined pass-through and -0.04 -> '0'.
- Gate note: stale BACKLOG line numbers removed; both bullets are no longer in BACKLOG.md, so the manager follow-up is dropped and On merge is none.

Checks run against b9481e3
- `pinnedAgeUpMarkers` callers: line-chart.tsx and line-chart.test.ts only.
- Docs paragraph to rewrite: docs/aoe4-build-order.md results section ("solid vertical lines labeled `<label> <m:ss>` ... stacked in rows"); data/aoe4-build-order/README.md has no marker-label or tooltip statement.
- Non-age-up `<title>` sits in the line's parent group, as with the pinned lines (pattern from the old spec's pinned-title check).
- The mutation criteria were not run: the new spec does not exist yet.

Diagrams: none (single component, outside the control loop).
Open questions: none.
Overlap: SGS-082 deletes acceptance/aoe4-build-order.spec.ts, the only spec asserting labels on every marker and the pinned-line title; this ticket adds no tests to other specs.
