# SGS-048 rebase 1

Rebased sgs-048-aoe4-pin-compare onto sgs-045-aoe4-severity-message-lists (`git rebase --onto sgs-045... 77fa279 sgs-048...`). New tip: 772962028e20ac66af6eb884605361ac90e66284. Not pushed.

## git log --oneline origin/main..sgs-048-aoe4-pin-compare
7729620 Add acceptance tests for pinning a run, the dashed overlay and the compare table
79dd597 Pin a run and compare key numbers and chart overlays on the build order page
ffe63c6 Pin warning ordering, failed-run persistence and reload reset of the info toggle
e68dc07 Test the warnings element is absent when a run has no warning-severity messages
5ecb2c8 Show result warnings and collapsible info messages on the AoE4 page

## Conflicts (only in the first sgs-048 commit)
- results.tsx: Results props are now { result, pinned, infoExpanded, onInfoToggle }; keeps resultMessages, WarningMessages/InfoMessages and the pinned props on all three SeriesCharts. The old notes block was already removed by 045.
- pages/apps/aoe4-build-order.tsx: kept both useState hooks (pinned, infoExpanded); ComparePanel renders under the Results heading, then Results gets pinned plus the info props.
- docs/aoe4-build-order.md: kept 045's message-list text and 400 wording ("removes any earlier charts and message lists"), dropped the old notes sentence, added the pin and compare paragraphs, and added the `pinned:<key>` data-series note.
No semantic decisions needed. The second commit (acceptance spec) applied cleanly.

## Checks (Node 24)
- tsc --noEmit and lint:dup: pass (0 clones)
- npm test: 34 files, 775 tests pass
- next build: pass
- npm run acceptance: 392 passed (includes both aoe4-build-order.spec.ts and aoe4-build-order-pin-compare.spec.ts)
Authors: all commits by Nick Choi <choinickolas@gmail.com>.
