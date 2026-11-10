# SGS-104 implementer 3 (rework 1)

Branch sgs-104-split-layout, tip 32d9d29be00937f22311c5592497c0ba085d671d, worktree $FACTORY_DIR/worktrees/sgs-104-split-layout. Status: needs_review.

Files touched:
- docs/aoe4-build-order.md: timeline sentence replaced and first-paint sentence replaced, both verbatim from the ticket.
- components/apps/aoe4-build-order/use-split-layout.ts: comment replaced verbatim.
- acceptance/aoe4-split-layout.spec.ts: the three setup lines became `await openPage(page)`; the unused AOE4_PAGE import is dropped.

Results: tsc clean; lint:dup 0 clones; npm test 1802 passed, 10 skipped (59 files); next build ok; playwright acceptance/aoe4-split-layout.spec.ts 10 passed.

Doc claims: the new texts are the ticket's replacement texts verbatim. The "opened directly" claim holds because the hook's getServerSnapshot returns false and the client reads matchMedia afterwards.
Pre-existing tests edited: none. No new tests, so no mutation checks. Out-of-scope findings: none.
