# SGS-135 acceptance-test 1

Verdict: PASS. No new tests were needed and no commit was made. Branch tip stays 4b0b5a8.

The implementer's rewritten `acceptance/aoe4-chart-layout.spec.ts` already covers every Playwright criterion in the ticket, and each test can fail. I wrote nothing.

## Harness
`acceptanceSetup` ran (node_modules linked, Chromium installed). Then
`npx playwright test acceptance/aoe4-chart-layout.spec.ts acceptance/aoe4-gather-rates-per-villager.spec.ts acceptance/aoe4-key-results-collapse.spec.ts acceptance/aoe4-chart-readability.spec.ts`
gave **32 passed** (36.5s).

## Coverage against criteria
- **Pointer drag (first chart dropped between the third and fourth midpoints gives R,G,U,F):** the test sets a 2800px-tall viewport and drops 2px under the third chart's bottom. It checks `data-dragging` during the drag, that the order is unchanged until the drop, and that the status and focus are right after it.
- **Drag edge cases:** a press under 4px, Escape, a drop at the start index, and a collapsed chart each have a test.
- **Keyboard reorder:** repeated ArrowDown, ArrowUp, and focus kept after each move are covered.
- **No-op arrows:** ArrowUp on the first chart and ArrowDown on the last leave the order, status and focus unchanged, and the page does not scroll. The scroll test confirms the page was mid-scroll before the key press.
- **Ignored keys:** Enter, Home, End and Space each change nothing.
- **Announcement on a no-op:** after ArrowDown on the first chart, the status text is recorded; ArrowUp on the chart now first leaves it unchanged.
- **Caret:** click, Enter and Space each flip the state, with the opposite state asserted first and focus kept.
- **Per villager:** the control stays visible and usable while Gather rates is collapsed, and the choice survives expanding.
- **Help and status elements:** exactly one `chart-reorder-help` and one `chart-order-status`. Every handle's `aria-describedby` points at the help, which mentions drag and arrow keys.
- **Persistence:** the layout survives two reloads without being rewritten. Three stored-value normalisation cases and blocked storage are covered.
- **Split view:** the step band and pinned lines show on expanded charts only after a reorder and a collapse.
- **Other specs:** the key-results collapse, Per villager and chart-readability specs pass unchanged.

## Mutation checks
Each break was reverted with `git checkout -- <file>`. `git diff --exit-code` was clean at the end.

| Break | Test that failed | Failing assertion |
|---|---|---|
| `use-chart-drag.ts:5` threshold 4 → 0 | under 4px press | `not.toHaveAttribute('data-dragging','true')` (line 301) |
| `use-chart-drag.ts:63` Escape key replaced | Escape cancels drag | `not.toHaveAttribute('data-dragging')` (line 313) |
| `chart-drag.ts:2` `midpoint < pointerY` → `>` | drag first below third | layout poll, order not R,G,U,F |
| `results.tsx` moveByKey bounds check removed | ArrowUp on first chart; announcement-unchanged | status `''` became "Units produced moved to position 0 of 4" |
| `chart-header.tsx:123` `preventDefault` removed | no-scroll tests (first and last chart) | `scrollY` equals `before.y` (line 174) |
| `results.tsx` focus effect `.focus()` → `.blur()` | ArrowDown moves one place and keeps focus | active-element poll (line 149) |
| `chart-header.tsx:132` controls hidden when collapsed | Per villager while collapsed | `perVillager` not checked, element not found (line 92) |
| `use-chart-drag.ts:60` `target !== startIndex` → `true` | drop at start position | status `''` became "Gather rates moved to position 2 of 4" |

One run of the focus-effect break used a bad sed and failed on a parse error, so it was invalid. I redid it correctly and the result is in the table.

Not mutated: the collapse and caret flip tests, the persistence and normalisation cases, the help-text test, and the split-view case. These are the previously existing and plainly state-asserting tests, and I did not break production code for them.

## Failures
None.

## Criteria not expressible in the harness
- Touch input and the browser's own scroll gestures are not exercised, as the ticket states.
- `chartHandleKey`, `dropIndexAt` and the header markup are Vitest cases, not acceptance tests. They were not in scope here.
- The `chart-move-` grep and the docs check are search and review criteria.
