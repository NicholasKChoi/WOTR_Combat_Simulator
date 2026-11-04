# SGS-083 spec gate 1: NEEDS_SPEC (risk low confirmed)

Base checked: origin/main b9481e3 (recharts 3.10.1).

## Gaps
1. Scope 4 / zero-length span (owner-free) - Scope says the ReferenceArea has a stroke "so a zero-length span still shows as a line". In recharts 3.10.1 ReferenceArea renders a Rectangle, and Rectangle returns null when width === 0 (node_modules/recharts/es6/shape/Rectangle.js:143). So a step with completedAt === startedAt (instant economy steps: move, rally, pause) draws no band, which contradicts the Scope claim and the criterion "hovering a row with a span shows exactly one chart-step-band". Fix: say how a zero-length span renders. Either draw a ReferenceLine (x=from) with the same data-testid, or widen the band to a minimum rendered width. State which, and add an acceptance row for a zero-length step (hover shows one band, data-from === data-to).
2. Open questions 1 and 2 (owner) - hover vs select, and band on the charts vs a new time axis on the timeline, decide main-path behavior. The source request says "on the timeline", which Scope cannot literally do. The defaults are reasonable, but the gate rule says the ticket is not ready until the owner confirms. Fix: the owner records the answer in CONTEXT.md Decisions or the ticket, and the questions are removed from Open questions.
3. Open question 3 (owner) - in-progress span (start to run end vs no band). It affects the stepSpan contract and a test row. Same fix. The default is fine as an edge case if the ticket keeps "meanwhile: start to end".

## Checks that pass
- Grounded: all named files and symbols exist (TimelineRow, timelineRows, StepTimeline, SeriesChart, Results, results.module.css, docs paragraph at docs/aoe4-build-order.md ~line 910). Acceptance spec and test files are new and say so.
- Contracts: StepTiming status and startedAt/completedAt nullability match model.ts; the helper handles startedAt null.
- Invariants: S1 holds, no A1-A3 contact. Dependencies: none needed (SGS-082 only deletes a different spec file). Size ~60 lines.
- Docs: only the timeline paragraph (and nothing else contradicting) needs the edit; scoped. Diagrams: not triggered.
- Lessons: single page.evaluate rule is cited.
- Risk: low is correct. No strongModelTriggers (UI only, optional prop, no API/schema/engine change, under 250 lines), no criticalPaths symbol touched.
- Input validation: no trust-boundary input.

## Notes (non-blocking)
- Depends-on text says "explored on main cc9bb04"; main is now b9481e3. Update.
- Scope 3 offers two options for sharing rows ("pass the rows down, or lift a memo"). Pick one; passing rows changes the StepTimeline props, so existing StepTimeline callers and tests need updating.
- The active-row highlight must beat Bootstrap `table-warning` cell shading on flagged rows; say the style targets the cells (td) or uses an outline/inset shadow so it is visible on flagged rows.
- ReferenceArea passes data-* through svgPropertiesAndEvents in 3.10.1 only if the allowlist includes data-*; confirm in the implementer's first run (the existing ReferenceLine markers do this, so likely fine).
- The "different computed background or outline" criterion should name the property compared (e.g. outline-style/box-shadow on the row or its cells) so it is testable.
- Reset-on-result-change: name the mechanism (key on Results by result, or reset in an effect) since the pointer may stay over a row without firing leave.
