SGS-096, branch sgs-096-pinned-legend-doc, tip 1097a882d808ae2e9ca899e127400555e820f3a0, worktree $FACTORY_DIR/worktrees/sgs-096-pinned-legend-doc. Status: needs_review.
Files: docs/aoe4-build-order.md (legend sentence reworded); acceptance/aoe4-build-order-pin-compare.spec.ts (new case "the current legend item toggles only the current line").
Tests: full spec 36 passed; npm test 1495 passed, 10 skipped; tsc and lint:dup clean. Existing pinned-item case unedited and passing.
Doc claim: "a pinned item is hidden and restored under its own `pinned:<key>` key, independent of its current series' item (hiding `Gold` does not hide `Gold (pinned)`, and the reverse)." True per line-chart.tsx:144 (hidden.has(pinnedKey(s.key))).
Mutation: line-chart.tsx:144 also hid pinned when current hidden; new case failed; reverted (git checkout).
git grep "follows its current" in docs/README/ARCHITECTURE: none left. No components change. Build not run (docs+test only).
