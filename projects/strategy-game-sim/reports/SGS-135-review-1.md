# SGS-135 review 1

- Branch `sgs-135-chart-header-drag-handle-and-caret`, tip `d906392`, base `5e5bd8e` (full review, not delta).
- Verdict: **REQUEST CHANGES**

## Blocking findings

1. `acceptance/aoe4-chart-layout.spec.ts:163-175` - test - The "do not scroll" check in "ArrowUp on the first chart and ArrowDown on the last change nothing, keep focus and do not scroll" cannot fail, and it passes only because of a race.
   - Evidence (UI inspection, 1024x768, the spec's exact call sequence, 3 runs, `inspect3.cjs`): `scrollY` at line 166 = 0, at line 173 = 0, and 1 s later = 2052 in every run. The site has `html { scroll-behavior: smooth }`. `locator.focus()` on the Units handle (line 165) and on the Floating handle (line 168) both start a smooth scroll that has not moved the window when either read runs. So the test compares two readings taken before any scroll starts. A keyboard scroll that `preventDefault` failed to stop would not show up either: an unprevented ArrowDown measured at 2052 after three round-trips and 2092 only after 800 ms. A slower runner flips the race the other way: the focus scroll to 2052 lands before line 173 and the test fails on correct code. The ArrowUp half also starts at `scrollY` 0, the minimum, where ArrowUp cannot move the page.
   - Why it matters: the ticket criterion "the page does not scroll" is unchecked, and the test can flake.
   - Direction: make it a two-row table, `[UNITS, 'ArrowUp']` and `[FLOATING, 'ArrowDown']`. For each row:
     - Place the handle mid-viewport with an instant scroll: `handle.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))`.
     - Focus with `handle.focus()`; the handle is already in view, so this does not scroll.
     - Read `scrollY` and `document.documentElement.scrollHeight - innerHeight` in one evaluate. Assert `0 < scrollY < max`. Measured at 1024x768: docH 2966, max 2198, Floating centred about 2052, Units centred about 410.
     - Press the key. Wait for any keyboard scroll animation to finish (`page.waitForTimeout(500)`, as `aoe4-save-open.spec.ts:72` does), then assert `scrollY` is unchanged, the order is the default, the status is `''` and focus is on that handle.
     - Production change it must fail on: delete `event.preventDefault()` at `components/apps/aoe4-build-order/chart-header.tsx:42`. ArrowDown then moves `scrollY` from about 2052 to 2092 (+40 px, measured), and ArrowUp from about 410 to 370.

2. `components/apps/aoe4-build-order/chart-header.tsx:33` - convention - The handle builds its className with a template literal, `` `btn btn-sm btn-outline-secondary ${styles.dragHandle}` ``. REPO.md Conventions says to combine Bootstrap and module classes with `classnames` as `cn`, and every other mixed className in the directory does that, for example `step-table.tsx:315` `cn(styles.table, 'table table-sm align-middle')` and `chart-legend.tsx:16`. This line is the only template-literal className under `components/apps/aoe4-build-order/`. Direction: `className={cn(styles.dragHandle, 'btn btn-sm btn-outline-secondary')}` with `import cn from 'classnames'`.

## Spec gaps

None that block. For the manager and ticket: the ticket's Unverified assumption says the Playwright focus case "exercises" the focus-restoring effect "for real". That is not true here: the implementer disabled the effect and every test still passed, because Chromium keeps focus on a keyed reorder and a mouse-down already focuses the handle. The effect is still what design C3 prescribes, so this is not a code finding.

## Acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| `chartHandleKey` table, fails if Enter or Space is mapped | pass | `chart-header.test.ts:6-19` has a row for each key; `chart-header.tsx:15-19`. |
| (respec 1) `dropIndexAt` strict count, five cases, equal midpoint not counted | pass | `chart-drag.ts:2` uses `<`. `chart-drag.test.ts` rows cover above (0), below (3), between, on `[10,20],10` → 0, on a later midpoint, and empty. Both a `<=` and a count-below mutation fail a row. |
| `ChartHeader` markup order, attributes, slot when collapsed, no-layout | pass | `chart-header.test.ts:34-68`. The order test asserts every marker is present before comparing positions. |
| (respec 1) `SeriesChart` collapsed or expanded markup; `git grep chart-move-` empty | pass | `line-chart.test.ts:59-87`. I ran `git grep -n "chart-move-"`: no match. No absence test spells the old ids. |
| (respec 1) Pointer drag Playwright | pass | `aoe4-chart-layout.spec.ts:250-339`. Viewport 1024x2800: measured section tops and bottoms (779-1308, 1326-1854, 1872-2401, 2419-2948) put every handle and the drop point (2403) inside it. The drop point lies between the third midpoint (2136) and the fourth (2683). Covers the dragging attribute, the unchanged order during the drag, the drop, the status, sub-4px, Escape, and a collapsed chart. See note 1. |
| Keyboard reorder Playwright | **fail** | Moves, repeats, announcements and the ignored keys are covered (`:137-199`). The "page does not scroll" part cannot fail (blocking finding 1). |
| (respec 1) Caret Playwright, Per villager while collapsed | pass | `:59-124`. The opposite state is asserted before each action. The implementer report records that the per-villager spec passed; I did not run it (review runs no acceptance tests). |
| Persistence and key-results beside it | pass (by reading) | `:201-215`. Key-results code is unchanged on this branch. The implementer report says `aoe4-key-results-collapse.spec.ts` passed. |
| Split-view case | pass (by reading) | `:341-364`. |
| One help and one status, `aria-describedby` target, text | pass | `:126-135`; `results.tsx` renders both once. |
| (respec 1) No `pendingFocus`; effect and announcement only on a real change; no-op ArrowUp status test | pass | `results.tsx` `moveByKey` returns before `placeChart` when the index is out of range, so `focusAfterMove` stays null. The drop path calls `onDrop` only when `target !== startIndex` (`use-chart-drag.ts:59`). Test `:177-188` follows the respec. |
| Docs | pass | `docs/aoe4-build-order.md:995-1007`. I checked each sentence against the code (see Doc claims). |
| tsc, lint:dup, tests, next build | pass | I ran `npx tsc --noEmit`, `npm run lint:dup` (0 clones), vitest on the 3 changed test files (40 passed) and `npx next build` (success). I did not run the full `npm test`; the implementer reports 2459 passed. |
| No INVARIANTS regressions | pass | See Invariants. |

## Invariants touched

- S1 holds: imports stay inside `components/apps/aoe4-build-order/`.
- A1-A3 hold: the diff touches only UI files in the A paths and no simulation or engine code.
- S2, S3, W1, W2 and H1-H3 are not affected.

## Doc claims checked

- Title-row order, and that collapsing keeps the handle, title, caret and Per villager visible: `chart-header.tsx:28-53`, `line-chart.tsx` (header `controls`, body empty when collapsed). Holds; the inspection confirmed it at 375 and 1280.
- Caret label flip, click, Enter or Space, and kept focus: `collapse-caret.tsx`. Holds.
- Primary button only, a 4 px start, order unchanged until the drop, drop by pointer height: `use-chart-drag.ts:29,52,57`, `chart-drag.ts`. Holds.
- Escape or a cancelled pointer ends the drag with no change: `use-chart-drag.ts:50,62-64,67-70`. Holds.
- A touch drag does not scroll the page: `.dragHandle { touch-action: none }`. Holds by CSS; not tested, as the ticket's out-of-scope list allows.
- Focus moves to the moved handle; the status gives the position out of four; first-up and last-down are no-ops: `results.tsx`. Holds.

## UI inspection

The preview (`next dev`) served the task worktree on port 3771; it is stopped and the port is free. Scripts and screenshots are in `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/ea918271-89a9-476e-95c2-a67b7d3c8a20/scratchpad/`.

- Loaded the results view at 375x900 and 1280x900, in the default state, with Gather rates collapsed, and while dragging.
  - Clipped overflow in chart headers: none.
  - Overlapping header children: none.
  - Words broken mid-word: none.
- Header rects at 375 width: handle 32x35, title, caret 28x35, and Per villager wrapping to its own line. At 1280 all four sit on one line.
- Dragging versus not dragging: computed opacity is 0.6 on the dragged section and 1 on the others, back to 1 after Escape. The two states are distinct.
- Collapsed versus expanded caret: glyph ▸ versus ▾, and `aria-expanded` matches.
- Screenshots read: `rates-1280.png`, `rates-collapsed-375.png`, `dragging-375.png`. No defects.
- Scroll measurements at 1024x768 and the drag-viewport fit at 1024x2800 are cited in finding 1 and the criteria table.

## Bot reconciliation

REPO.md has no `reviewBot.cli` and no rulesFile, so there is nothing to reconcile.

## Non-blocking notes

1. `acceptance/aoe4-chart-layout.spec.ts:265-266, 290, 317-318`: LESSONS.md says to read every rect in one `page.evaluate`. `startDrag` reads the section boxes in one evaluate and the handle rect with a separate `boundingBox()`; `:317-318` does the same. The margins are large (about 270 px between midpoints), so the impact is low. Reading the handle rect inside `sectionBoxes` would follow the lesson.
2. `:288-301` and `:315-328` repeat the opening of `startDrag` (handle centre, move, down). Two copies, below the three-block rule. `startDrag(page, id, toY, steps)` taking a y value would let both use it.
3. The drag spec does not assert its viewport-fit precondition (drop point and every handle inside 2800 px). The measured margin is 397 px (drop point 2403). The fourth section's bottom, 2948, is already past 2800, which is harmless today. A cheap guard would be `expect(boxes[below].bottom + 2).toBeLessThan(viewport height)`.
4. `use-chart-drag.ts`: ArrowUp or ArrowDown pressed on the focused handle in the middle of a pointer drag reorders immediately, so `startIndex` goes stale. A drop that lands on the new index then reports a move. This is an unusual combination; ignoring arrow keys while `session.current` is set would close it.
5. The implementer's notes stand as notes. Focus effect: see Spec gaps. `pointercancel` and `lostpointercapture` are unexercised, but the code path is shared with Escape (`cancel` → `finish`). The stale announced position on rapid ArrowDowns cannot happen with real key events in React 18+, which flushes discrete-event updates before the next event.

## Coverage

- Reviewed every file in `git diff 5e5bd8e...HEAD`: `chart-drag.ts`, `use-chart-drag.ts`, `chart-header.tsx`, `chart-header.module.css`, `line-chart.tsx`, `results.tsx`, `results.module.css`, the three Vitest files, `acceptance/aoe4-chart-layout.spec.ts` and `docs/aoe4-build-order.md`.
- Compared against `collapse-caret.tsx`, `step-table.tsx`, `chart-legend.tsx`, `save-build.tsx` (Escape handlers) and `acceptance/helpers.ts`.
- REPO.md checklist: ran "Every diff" (next build, page loaded) and the AoE4 section (UI at 375 and 1280, layout checks).
  - The 360x760 and 768 widths, and the 390 and 700 chart widths, were not screenshotted. No header layout depends on those widths beyond wrapping, which the 375 run covers.
- Not run: the acceptance specs and the full `npm test` (review runs no acceptance tests; for the unit suite I relied on the implementer's run).
- No LSP used; the changed symbols have single callers, which I confirmed with grep.
