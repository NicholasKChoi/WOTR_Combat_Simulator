# SGS-183 spec gate 2

Verdict: READY

Read at origin/main (6411526) after `git fetch origin`. File reads only; no scratch checkout made, none to remove.

## Gap from gate 1
Closed. The first criterion is now an observable outcome (cases pass at stated viewports with no tab step; `acceptance/helpers.ts` diff empty). The import and call removal stays a Scope instruction.

## Checks
- Grounded scope: all eleven files exist. The start-row case, "labelled fields share a line" (700 and TABS_VIEWPORT), the tabs-layout view-toggle describe, `PHONE` and the 390 marker describe, the 1024x2800 drag describe, and the run-errors "on the tabs layout" describe (6 cases) are all present as described.
- Re-grep of showTab, TABS_VIEWPORT, tab-*, workbench-tabs and PHONE at base: every hit in a non-listed file belongs to a file the ticket names as owned by another step-1 ticket (auto-run, inline-issues, pin-compare, chart-views, editor-width, my-builds, narrow-layout, results-split, save-open, small-screen, split-layout, split-scroll, step-annotations). No unowned file.
- Listed files carry no viewport under 1200 px other than the ones Scope changes or deletes. Step-table `showTab` count is 6 (the "about 7" is prose, harmless).
- Design M10 inventory rows for m4-flow, run-errors, chart-layout, step-table and marker-labels match Scope.
- Quoted names match the base (`unpin-run`, `pinned-label`, run-errors titles, `WIDE_VIEWPORT`, the openResults helper).
- Each dropped `showTab` is followed by a content wait in the cases read (chart-layout `openResults` has `toBeVisible` on UNITS; m4-flow and run-errors reads are behind visibility or poll), and Scope plus a criterion require this.
- Risk low, Invariants none, Unverified assumptions none, On merge none, Open questions none, no dependency overlap with SGS-184 (it removes code, not these specs). Docs: no doc names these cases. No unit test depends on acceptance specs.

## Notes
- Moving the drag-reorder describe to 1280x2800 puts Results in a narrower column; only the required `npm run acceptance` run confirms drops still land.
- The "cases deleted are absent" criterion is diff-shaped, but Scope names each case, so it is unambiguous.
