# SGS-066 implementer 2 (rework 1)

Branch sgs-066-aoe4-workbench-tabs-editor, new commit fb4ca86b9fc8452b883e52993828e6c994c40f16 on 0d57ba1 (not amended, not rebased, not pushed).
Worktree: $FACTORY_DIR/worktrees/sgs-066-aoe4-workbench-tabs-editor

Files:
- pages/apps/aoe4-build-order.tsx: scroll effect sets the Results panel's scrollMarginTop from the run bar form's measured height, then scrollIntoView; dropped the unused CSS module import.
- components/apps/aoe4-build-order/workbench.module.css: removed the fixed 8rem `.panel` rule.
- components/apps/aoe4-build-order/workbench-tabs.tsx: `cn(...)` for nav-link classes.
- docs/aoe4-build-order.md: "enabled while there is a shown result or a pinned run"; textarea "never scrolls vertically (a line longer than the box scrolls sideways)".
- acceptance/aoe4-build-order.spec.ts: spec 2 now runs at 1280, 768, 390 and asserts the Results heading is below the run bar's bottom; `runThenFail` pins after the 200, and the 400/500 specs assert Build selected AND tab-results enabled.

Checks (Node 24, port 3951): edited workbench specs --repeat-each=3: 39 passed. tsc clean; lint:dup 0 clones; npm test 1225 passed, 8 skipped; full acceptance 631 passed.

Mutations (each undone):
- Fixed 144px margin instead of measured: 768 px and 390 px specs fail (1280 passes).
- Removed setTab('build') from the 400 and catch paths: the 400 and 500 specs fail (toHaveAttribute on aria-selected).

Not done: optional showTab/showView consistency and trailing whitespace in aoe4-step-table.spec.ts (not trivial/not touched). Prettier --check warns on workbench-tabs.tsx and the page (not checked against the base; no repo format command run).
No stray processes on 3951.
Status: needs_review
