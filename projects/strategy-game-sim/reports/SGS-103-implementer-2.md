# SGS-103 implementer 2 (Rework 1, text-only)
Status: needs_review
Branch sgs-103-build-routes, tip b04a27c78c7a649ac7dfae0aa90519c01d2042a6, worktree $FACTORY_DIR/worktrees/sgs-103-build-routes (base sgs-101 @ 380e778, not rebased).

Files: ARCHITECTURE.md (row sentence narrowed to the builds route files), docs/api/openapi.json (SaveBuildRequest.buildOrder description and saveBuild description now state the read-back check; fractional walkSeconds rejected). Replacements are the verbatim texts from the checklist. All three boxes ticked in the ticket.

Tests: npm test 1698 passed, 10 skipped; npx tsc --noEmit clean; playwright specs aoe4-builds-api-contract, aoe4-simulate-api-contract, fight-api-contract, fight-api-spec-surface, aoe4-builds-api: 167 passed. No code changed, so no new unit tests or mutation checks. Lint/build/codegen not run (text-only change).
Doc claims: the quoted replacement sentences; true per checkSaveBuildRequest read-back rejection (saved-builds.test.ts:211) per review.
Out-of-scope findings: none.
