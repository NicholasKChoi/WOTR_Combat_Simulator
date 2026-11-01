# SGS-025 implementer 1
Branch sgs-025-aoe4-doc-rally-start, worktree $FACTORY_DIR/worktrees/sgs-025-aoe4-doc-rally-start. Docs only: docs/aoe4-build-order.md (+69/-17), all 13 Scope items applied.
Checks: AC greps clean (required for villagers, removed-claim pattern, owner, BuildOrderLines); tsc --noEmit ok; npm test 127/127. No unit tests written (docs only), so no mutation checks. Build not run (docs only); codegen unset.
Note: lib/aoe4-build-order/model.ts:12 comment still says rally is required for villagers (code, out of scope; types ticket).
