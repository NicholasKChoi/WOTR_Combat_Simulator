# SGS-199 review 5

Verdict: APPROVE. Tip d96b9589d98bb399525f8aa05cfe0fd665a4c588, base origin/main.

## Blocking findings
None.

## Acceptance criteria
- Open (B-H1): pass. Click, Enter and Space tested; focus on Close, inert page, scroll top reset, 0.8 height bound, no simulate request, state before/after equal (spec test 1).
- Close (B-H2): pass. Close, Escape, backdrop point (5,5) close; text click and a point 2 px inside the rect edge on the dialog element stay open. `outsideRect` in page-help.tsx:31 plus the target check; implementer's mutation check shows the edge test fails if dropped.
- Repeat (B-H3): pass. Same text, scrollTop 0 on reopen.
- Keyboard (B-H4): pass. `wrapTab` keeps Tab and Shift+Tab inside; spec asserts containment on each press and the wrap order.
- Availability (B-H5): pass. No result with run held, syntax error, and loading run.
- Sections (B-H6): pass. Seven sections with inner h3, legend in third, colours compared to table run cells.
- Section 4: pass. Swatch uses `annotationStyles.warn`, computed background compared with a still-waiting run cell from an API-confirmed waiting step; terms checked.
- Section 5: pass. Feature table reads each term from the live page; no-caveat regex.
- Absorbed legend (B-H7): pass. Legend removed from both editors; outside-modal count 0 in each state; unit table test asserts no legend.
- Placement (B-H8): pass. Rects read in one evaluate under toPass; sideways scroll; DOM and Tab order.
- Server render (B-H9): pass. Unit and spec assertions.
- page-help.test.ts: pass. Checked against the criterion; the implementer's mutation checks show it fails on open attribute, Close not first, wrong section count.
- Existing tests: pass. Every edit falls under the ticket's rules (diff read for step-annotation.test.ts, compact-view, step-annotations, results-split, knight-longbow); run-cell colour expectations unchanged; split-scroll needed no edit (its h3 query is already scoped to chart-table).
- No INVARIANTS.md regressions: A1 to A3 untouched (UI only).

## Contract, scope, doc claims
- Names match the ticket (`help-open`, `help-modal`, `help-close`, `help-section`, `help-warn-tint`). The extra `help-content` testid is a disclosed addition and does not close off any named seam.
- No docs edited, as the ticket requires. Out of scope items not touched.
- Doc claims checked against code: button labels (Save as copy, Save a new version, Copy link, Pin this run, Unpin, Key results, Series, Markers, Show earlier, Reset zoom, Reorder chart) exist in save-build.tsx, compare-panel.tsx, chart-legend.tsx, chart-zoom-bar.tsx, chart-header.tsx. Shift+drag pans (use-chart-zoom.ts:41), arrow keys reorder (chart-header.tsx:16-17). No claim is contradicted.

## Linter
`npx tsc --noEmit && npm run lint:dup`: clean, 0 clones. No ESLint config, no review bot (reviewBot empty).

## Conventions
page-help.tsx follows the sibling components (4-space indent, `cn`, CSS modules). The spec uses 2-space indent like acceptance/helpers.ts and imports shared helpers; layout reads are in one evaluate under toPass. No repeated-block test finding.

## Non-blocking notes
- UI inspection did not run: the dev server started in one sandboxed command was not reachable from the Playwright command (private per-command network, connection failed). The UI was judged from the code (flex dialog capped at 80dvh with an inner scrolling content region) and from the implementer's passing placement and short-viewport specs.
- The edge-click test's last assertion (`not.toBe('help-open')`) is redundant; the preceding `toBeVisible` carries the check.

## Coverage
All 14 files in the diff read. Unit and acceptance tests not run, per gate rules; the implementer's acceptance and unit results were taken from its report, not reproduced.
