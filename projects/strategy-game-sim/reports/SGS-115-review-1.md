# SGS-115 review 1

Verdict: **REQUEST CHANGES**

Branch `sgs-115-split-scroll`, tip `3a0fc44351af4487535f58f5da3dc7f0b8e071ab`, base `main` (b3da879). One commit, author `choinickolas@gmail.com`.

## Blocking findings

1. `acceptance/aoe4-split-scroll.spec.ts:22-26, 69-70` - test - Two of the four assertions in "each column scrolls on its own" cannot fail. `scrollColumn` sets `el.scrollTop` directly. Setting one element's `scrollTop` from script never moves `window.scrollY` or another element's `scrollTop`, whatever the CSS is. So `expect(after.page).toBe(before.page)` and `expect(after[other]).toBe(before[other])` pass for any implementation. The criterion "leaves `window.scrollY` ... unchanged" is therefore not tested. - Direction: drive the scroll with a real wheel. Set the column's `scrollTop` to its end. Assert first that `window.scrollY` is below its maximum (`document.documentElement.scrollHeight - innerHeight`), so the window could still move. Then `page.mouse.move` to the column's centre (inside the viewport) and `page.mouse.wheel(0, 200)`, and assert that `window.scrollY` and the other column's `scrollTop` are unchanged. The production change this catches is removing `overscroll-behavior: contain` from `.column` (`components/apps/aoe4-build-order/workbench.module.css:26`). I checked it at 1280x800 with `build-column` at its end and the window at 0. A wheel of 200 left `window.scrollY` at 0 with the rule in place. With the rule overridden to `auto`, `window.scrollY` went from 0 to 200. Keep the existing `scrollTop > 0` check that each column scrolls itself (programmatic scroll is fine for that part). Run the mutation once and list it in the report.

2. `docs/aoe4-build-order.md:851` - contract (text) - The edited sentence says the textarea "does not scroll vertically itself, its column does". Below 1200 px there is no scrolling column: the tabs layout keeps the page scroll, `.column` is not applied, and my inspection at 1024 and 375 shows the page scrolling. The sentence describes the text view in both layouts, so it is false for the tabs layout. - Direction: replace the line
   `rows) and does not scroll vertically itself, its column does (a line longer than the box scrolls sideways), and the table view is the`
   with exactly
   `rows) and does not scroll vertically itself (in the side-by-side layout the Build column scrolls, below 1200 px the page does; a line longer than the box scrolls sideways), and the table view is the`

## Spec gaps

None that block. Two criteria say the column-scroll test "fails if either column loses `overflow-y: auto` or `min-height: 0`". The implementer's analysis is correct: with `overflow-x: hidden` on the same element, `overflow-y: visible` computes to `auto`. A grid item with a non-visible overflow already has an automatic minimum height of 0. So neither declaration can be pinned on its own. The declarations are redundant but required by C11. This is for the ticket/spec owner to note for the future, not a code change.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Workbench top = bar bottom + margin, bottom = innerHeight, at SPLIT and WIDE | pass | Spec lines 33-52 (alert count 0 asserted, `margin > 0` asserted). Inspection at 1280x800, scrolled to end: bar bottom 93.89, margin 18, split top 111.69, split bottom 799.69. At 1800x900: split top 111.69, bottom 899.69. |
| 2 | Each column scrolls itself; window and other column unchanged | **fail** | Overflow precondition and `scrollTop > 0` are tested. The two "unchanged" assertions cannot fail (blocking 1). |
| 3 | Hover shades an on-screen chart | pass | Spec lines 77-98. Probe: 0 `chart-step-band` after the fill and after `scrollIntoViewIfNeeded`, 4 after the hover, so the hover causes the band. |
| 4 | `--aoe4-run-bar-height` follows the bar through `duration-error` | pass | Spec lines 100-120 assert that the height changed. Inspection: property 112px, then 206px with the error, then 112px after clearing. |
| 5 | Columns have `overflow-x: hidden`; Build column not clipped in table view | pass | Spec lines 122-140. Inspection: `overflowX` `hidden`, `scrollWidth` 534 = `clientWidth` 534 (1280), 624 = 624 (1800). |
| 6 | Below 1200 px: tabs, no columns, page scrolls; split-layout and small-screen specs pass | pass | Spec lines 142-149. Inspection at 1024/375: no columns, `docHeight` > `innerHeight`. Wrapper div rendered in both layouts (`workbench-tabs.tsx:100,111`), so panels do not remount. The implementer reports both specs passing. |
| 7 | Accessible name "Build order" via `aria-labelledby`; text shown once per view; no `htmlFor` | pass | `build-text-editor.tsx:96`, page passes `labelledBy="build-order-heading"`. Spec lines 157-167. `git grep 'htmlFor="build-order-text"' -- components pages` finds nothing. Inspection: one "Build order" text node per view. |
| 8 | `build-order-heading` first in `panel-build` (including `step-table-unavailable`); `results-heading` first in `panel-results` | pass | Spec lines 166, 169, 184-192. `results-heading` is the first child of the `results` node (`<div>`), as the ticket specifies. The test reads `firstElementChild.firstElementChild` accordingly. |
| 9 | h2 sizes equal in split and tabs; all `h3` equal | pass | Inspection: 27px/27px (1280, 1800), 26.02px/26.02px (1024), 24.08px/24.08px (375); `h3` all 22.5px. The implementer reports that the `h4`-drop mutation fails the spec. |
| 10 | Hook writes nothing and does not throw on null ref or no `ResizeObserver` | pass (by reading) | `use-run-bar-height.ts:8-9`: `form?.closest` and an early return before any write or `new ResizeObserver`. |
| 11 | Docs "Page" describes separate scrolling and headings; no stale sentence | **fail** | Columns and headings are described. One edited sentence is false for the tabs layout (blocking 2). |
| 12 | tsc, lint:dup, npm test, three specs pass | pass (tsc, lint:dup, build run by me); npm test and specs unverified by me | I ran `npx tsc --noEmit && npm run lint:dup` (0 clones) and `npx next build` (pass). The implementer reports `npm test` (1972 passed) and the acceptance specs passing. Per my role I did not run acceptance. |
| 13 | No invariant regressions | pass | See below. |

## Invariants touched

- A1-A3: the diff touches `components/apps/aoe4-build-order/**` and `pages/apps/aoe4-build-order.tsx`, but only for layout, headings and a CSS custom property. There is no simulation path, cost literal, spend, or randomness. All hold.
- S1: the new hook is imported only by the aoe4 page from its own app directory. Holds. S2/S3: not affected.
- spec-checklist: names match C11 exactly (`build-column`, `results-column`, `--aoe4-run-bar-height`, `useRunBarHeight`, `runBarRef`, `labelledBy`, `build-order-heading`, `results-heading`). Nothing out of scope is implemented, there are no invented constants, and `golang/` is untouched.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot ran.

## UI inspection

The preview (`npx next dev`) was served from the task worktree on port 3871, with the base `main` (b3da879) on port 3872 for comparison. Both were stopped. Loaded `/apps/aoe4-build-order` at 1280x800, 1800x900, 1024x768 and 375x760. States covered: initial; scrolled to end; long build (text); last annotation hovered after scrolling the Build column; table view; `duration-error` shown; error cleared; a 1024 to 1280 resize round trip. Screenshots are in `/tmp/claude-1000/rev115/`.

- Overflow/clipping: none flagged in any state.
- Overlap: only recharts SVG `g` layers, which stack by design. No HTML sibling overlap.
- Mid-word wraps: `step-kind-badge` ("Villag/er", "Buildi/ng") in the table view at 1280 and 1800. This is **pre-existing**: the base `main` wraps all 42 badges of the default build at the same panel widths (534/624 px both before and after). It is owned by the M8.5 polish ticket (C12, "no badge wraps at 1280"), so it is not this diff's.
- Headings: same computed size per layout, see criterion 9. Screenshots 1280-scrolled-end and 375-initial look right.
- Geometry with the bar growing: with the error shown and the page scrolled to the end, the bar is stuck and the split bottom is at 800.05 (correct).

## Non-blocking notes

- Scroll anchoring after the bar shrinks. At 1280x800, scrolled to the end with `duration-error` shown (`scrollY` 244), clearing the error dropped `scrollY` to 151. Chrome scroll-anchors on content in the workbench, which moves up by the 94 px the bar lost. The bar then unsticks (`top` 93.8) and the columns' bottoms sit 94 px below the viewport until the user scrolls the page again. It is transient, and no criterion or doc sentence covers it. `overflow-anchor: none` on the section or `.workbenchSplit` would likely prevent it. This is a candidate follow-up.
- `aoe4-split-scroll.spec.ts:37`: `window.scrollTo({ top: ..., behavior: 'instant' })` duplicates the existing `scrollInstantly(page, top)` helper (`acceptance/helpers.ts:168`).
- `aoe4-split-scroll.spec.ts:174`: the `?? document.body` fallback lets a missing `build-order-heading` silently compare against the body's font size. It would very likely still fail, but `!` (as on line 175) states the intent.
- `aoe4-split-scroll.spec.ts:77-98`: the hover test does not assert that no band is shown before the hover. I checked that none is (0 before, 4 after). Adding `expect(page.getByTestId('chart-step-band')).toHaveCount(0)` before `hover()` would make the cause explicit.
- On platforms with classic (non-overlay) scrollbars, the new column scrollbar narrows the Build panel by about 15 px. Headless Chromium hides scrollbars, so this could not be measured here. The `step-table-scroll` wrapping rules should absorb it.

## Coverage

- Reviewed: every changed file (`use-run-bar-height.ts`, `build-input.tsx`, `build-text-editor.tsx`, `workbench-tabs.tsx`, `workbench.module.css`, `pages/apps/aoe4-build-order.tsx`, `docs/aoe4-build-order.md`, `acceptance/aoe4-split-scroll.spec.ts`). Compared against siblings: `use-split-layout.ts` (hook style), `line-chart.tsx:88` (effect style), `acceptance/helpers.ts:160-180` (scroll helpers), and other acceptance specs that reference `panel-build` (`aoe4-step-annotations.spec.ts:223-243` still holds: `panel-build` keeps `overflow-x: visible`).
- REPO.md Review checklist: "Every diff" (build run, page loaded through its flow) and "AoE4 build order" (doc sentences checked; screenshots at 375/1024/1280/1800 instead of the exact 360/768/390/700 widths; no overflow at the widths loaded; no Bootstrap utilities mixed with module CSS on the new elements, since `.column` is used alone). No copied helper or constant from another `lib/aoe4-build-order` module.
- LSP was not used. All callers of `BuildInput` and `BuildTextEditor` (only the page) are typed; `tsc` passes, so no missed caller.
- Not run, by role: `npm test` and the acceptance specs (the implementer's report is the record).
