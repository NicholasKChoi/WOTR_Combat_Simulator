# SGS-141 implementer report 1

Status: needs_review
Branch: sgs-141-split-tab-order-spec-and-final-docs-pass, tip 373c4d6ba473f8fdb987ed6fc4678aa1ea205149 (base origin/main 90b909e)
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-141-split-tab-order-spec-and-final-docs-pass

## Files
- acceptance/aoe4-split-tab-order.spec.ts: new; two tests at SPLIT_VIEWPORT (edited state, link-shown state).
- acceptance/helpers.ts: gains `EDITED_COPY_TEXT` and `editedCopy` (moved from aoe4-my-builds.spec.ts). `saveCopy` was already exported there.
- acceptance/aoe4-my-builds.spec.ts: local `editedCopy` removed, imported from helpers.
- docs/aoe4-build-order.md: Tab-order sentence added to the Page section.

## Tests
- New spec: 2 passed. my-builds spec (uses moved helper): 73 passed in the same run (75 total).
- `npm test`: 2504 passed, 15 skipped. `tsc --noEmit` clean; `npm run lint:dup` 0 clones; `next build` OK.
- Invariants encoded: edited state asserts save-build visible+enabled, link hidden, then stops duration-seconds, editor-view-text, save-build, save-build-copy, build-column stop, results-column stop in order with strictly increasing document position. Link state asserts link visible and save-build disabled, then stops ..., save-build-copy, saved-build-link, copy-saved-link, build-column, results-column; save-build is not a stop and precedes save-build-copy in DOM; compare-collapse before every chart-drag-handle; per chart section handle before caret (matched by containing section, each section must have both). Walk ends at the chart-collapse in the last rendered chart section, cap 150 presses, fails otherwise. No positive tabindex in both states. Focus data read in one `page.evaluate` per step.
- Pre-existing tests edited: none (only the helper definition moved; test bodies unchanged).

## Mutation checks (all reverted, `git checkout components`)
- workbench-tabs.tsx: swapped build and results column blocks -> both tests failed on "stop => stop.column === 'build-column' is reached after the previous stop".
- chart-header.tsx: caret moved before the handle -> link-state test failed on "every chart section has a handle stop" (walk ends at the last caret before the last handle).
- save-build.tsx: Save as copy button moved after the link controls -> link-state test failed on "saved-build-link is reached after the previous stop". (An earlier probe moving the button before the non-focusable status changed no focus order and passed, correctly.)
- Not mutated: the edited-state save-build ordering and the no-positive-tabindex check.

## Doc claims
- docs/aoe4-build-order.md Page: "In that layout the Tab order follows the DOM order: the run bar's controls, then the Build column, then the Results column, with no positive `tabindex` anywhere; within the save row the order is the buttons, the status, the link, then Copy link." Backed by the new spec's walks (run bar controls precede build-column stops; no tabindex > 0) and `save-build.tsx` DOM order (save-build, save-build-copy, save-status, link, copy-saved-link). The status is not focusable; the sentence names DOM order.

## Grep audit
- `git grep -E "chart-move-up|chart-move-down|chart-pinned-key|pinned-age-up|Age-up \(pinned\)|gather-rates-per-villager|perVillagerSeries|PinnedLineKey" -- docs ARCHITECTURE.md`: no match.
- `Per villager|strictNullChecks` in docs and ARCHITECTURE.md: no match, so nothing kept.
- Comment grep for removed names (chart-move-, pendingFocus, PinnedLineKey, per-villager, perVillager) in components/apps/aoe4-build-order and lib/aoe4-build-order: no stale hits. `headerControls` is the current prop (line-chart.tsx, results.tsx) and is not described as living in the body. `lib/aoe4-build-order/gather.ts:18` "Per villager, in resource per second" describes engine rates, unrelated to the removed checkbox.
- OpenAPI `info` version 2.6.0, no stale text.
- ARCHITECTURE.md already lists both jscpd configs, `strict`, all three helper files plus acceptance/helpers.ts, and the Blob behavior; no edit needed. `ls` of `*test-helpers*` matches its list.

## Criteria to doc location (M9.3-M9.8, M9.10-M9.13)
- M9.3 save status/one row: docs "Saving a build and opening it by link" (save row, `save-status`) and run-bar paragraph in Page.
- M9.4 chart controls and key-results collapse, persistence: Page "Chart controls" and "Key results panel" paragraphs.
- M9.5 pinned tooltip/legend: Page chart paragraph ("tooltip lists only the current run's series", `dashed = pinned build` / `chart-pinned-legend`).
- M9.6 chart views, productionBuildings: Page chart view toggle paragraph; Outputs `SimulationResult` list (SGS-136); OpenAPI 2.6.0.
- M9.7 marker labels: Page marker legend sentences (hover/focus labels).
- M9.8 editor readability: Page "Below 48rem of the editor's own width ... compact" sentences.
- M9.10 Blob/named-build seam and unreadable list: ARCHITECTURE.md storage row; docs My builds paragraph (unreadable list kept and backed up).
- M9.11 helpers and dedupe linter: ARCHITECTURE.md Rules "checked for copied code".
- M9.12 split-scroll and run-bar cap: Page opening paragraph (40% cap, scroll anchoring) and narrow-layout sentence.
- M9.13 strict: ARCHITECTURE.md Stack line.
No doc text needed fixing beyond the Tab-order sentence.

## M9.9 spec coverage
- Saved status: aoe4-save-status.spec.ts. Drag and caret with reload persistence: aoe4-chart-layout.spec.ts (reload test), aoe4-key-results-collapse.spec.ts (reload). Pinned tooltip: aoe4-build-order-pin-compare.spec.ts (current-run-only tooltip); pinned legend `chart-pinned-legend`: same file. Two chart views: aoe4-chart-views.spec.ts. Marker-label hover and focus: aoe4-marker-labels.spec.ts. Tab order: aoe4-split-tab-order.spec.ts (new). No case added elsewhere.

## Not run
- Full `npm run acceptance` suite (only the new spec and aoe4-my-builds.spec.ts, the file whose helper moved, were run).

## Unverified assumptions added
none

## Out-of-scope findings
none
