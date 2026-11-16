# SGS-183 review 1

Verdict: APPROVE. Tip 271f068, base main. Scratch: worktrees/review-sgs-183.

## Blocking findings
None.

## Acceptance criteria
1. Cases pass at stated viewports with no tab step; helpers.ts unchanged: pass for the diff. `git diff origin/main...HEAD -- acceptance/helpers.ts` is empty, and grep of the eleven files finds no `showTab`, `TABS_VIEWPORT`, `workbench-tabs`, `tab-build`, `tab-results` or `PHONE`. Passing at runtime is unverified by me (I ran no acceptance tests); I rely on the implementer's record of 100 passed.
2. Deletions present (390 half, "labelled fields", tabs view-toggle describe, 390 marker describe): pass. The kept WIDE half still asserts the trigger and action share a row (`abs(dy) < 4`) and the rally/count fields are side by side (`count.x > rally.x`) at WIDE_VIEWPORT (step-table.spec.ts:~490-495). Title no longer names two widths or 768 px.
3. m4-flow: pass. It opens with `panel-build` and `panel-results` both visible and has no tab element. Results assertions follow behind `toBeVisible`, `toHaveText`, `expect.poll` or `toHaveCount`.
4. Viewports: pass. The run-errors describe and the collapse/reorder describe use the default viewport. Drag reorder is 1280x2800. No viewport under 1200 px remains in the listed files (grep shows 1280, 1280x900, 1280x800, WIDE 1800 and SPLIT 1280).
5. (respec 2) Arrow-key cases: pass on reading. Before the key, `0 < top < max` is asserted on `results-column`. After the key, `top` and `windowY` are equal. The handle is aligned with `block: 'start'`. The implementer's recorded mutation (removing `preventDefault` at chart-header.tsx:43) made both cases fail at `after.top` (224 vs 184, 1914 vs 1932). I read chart-header.tsx:43 and `preventDefault` is there. I did not rerun the mutation.
6. No unsettled reads after `showTab` removal: pass. gathered-resources gained `toBeVisible` on CHART_IDS[0] before reading the ids. The knight-longbow `toHaveCount(0)` on idle warnings follows step-row data-attribute and legend visibility checks, which require the rendered result. m3-flow reads are behind `toBeVisible`/`toHaveText`.
7. Behavior assertions kept: pass. The diff only removes tab steps and aria-selected/tab asserts, plus the deleted cases. The run-errors titles were reworded.
8. `npx tsc --noEmit` and `npm run lint:dup` ran in the scratch and are clean (0 clones). `npm test` not run (no non-acceptance code changed).
9. Invariants: no `lib/` or `components/` file in the diff, so none touched.

## Existing-test edits
The only assertion changes are the named rewrites (start-row case, m4-flow opening, the two arrow-key cases) and the run-errors reworded titles and tab asserts, all allowed by the ticket.

## Spec gaps
None.

## Bot reconciliation
No reviewBot configured.

## Non-blocking notes
- The run-errors describe is named "on the default viewport". That is acceptable, but it names a viewport the cases do not depend on.
- The arrow-key cases keep `waitForTimeout(500)`; this is pre-existing and a settle wait for a negative assertion.
- UI inspection skipped: the diff changes only acceptance specs, no rendered UI.

## Coverage
All 11 files diffed in full. Acceptance specs not run, per gate rules. The Setup remove step is run after this report.
