# SGS-045 implementer 1
Branch sgs-045-aoe4-severity-message-lists, tip 5ecb2c81bc36b124f0c64f2ad75ecb27cfedd874, worktree $FACTORY_DIR/worktrees/sgs-045-aoe4-severity-message-lists. Status: needs_review.
Deviation: the components file is message-lists.tsx, not messages.tsx. `./messages` resolves to messages.ts, and allowImportingTsExtensions is off, so messages.tsx could not be imported.
Files: messages.ts (resultMessages), message-lists.tsx (WarningMessages, InfoMessages), messages.test.ts, results.tsx, pages/apps/aoe4-build-order.tsx, acceptance spec (expanded notes test, new patched-response test, failed-run test), docs/aoe4-build-order.md.
Checks: tsc and lint:dup clean; npm test 759 pass; next build ok; npm run acceptance 381 pass. Mutations (order swap, drop info) each failed the unit test and were reverted.
