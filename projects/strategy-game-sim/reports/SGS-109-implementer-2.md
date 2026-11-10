# SGS-109 implementer 2 (rework 1)

Branch sgs-109-row-hover-drop-timeline, tip 1c1cf1ba5d783e3e1c517a07c77f01d0ee33eb5e (on 1469a85), worktree $FACTORY_DIR/worktrees/sgs-109-row-hover-drop-timeline. Status: needs_review.

Files
- acceptance/aoe4-build-order-step-band.spec.ts: start-row test rewritten as mixed-input cases; test at :215 retitled.
- docs/aoe4-build-order.md: the two replacement texts applied verbatim.
- tickets/SGS-109-row-hover-drop-timeline.md: Rework 1 boxes ticked.

Tests: step-band spec 13/13 pass. tsc --noEmit clean; jscpd ran without a failure. Full build and unit not rerun (no production code changed).

Mutation checks (step-table.tsx:243, each undone with git checkout)
- Removed onPointerEnter from the start row: the test fails at "hover start row" step with expected 0 bands, received 4.
- Removed onFocus from the start row: the test fails at the "focus start control" step with expected 0, received 4.

Doc claims: the two replaced sentences quoted in the ticket; true per stepKind/step-table logic as the review specified them (not re-derived).

Out-of-scope: none.
