# SGS-134 review 1

Verdict: **APPROVE**
Branch: sgs-134-chart-layout-model-key-results-collapse, tip 1ea93cb5a77a22fb6484eb3750fe8c2cafe84b3e
Base: origin/main 5564bd0. Local `main` is stale (cdc51b1), so `git diff main...HEAD` shows 60 files. The task diff is `git diff origin/main...HEAD`: 11 files, +328/-38.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

- `moveChartTo` clamped final index, relative order kept: **pass**. `chart-layout.ts:61-67` removes the id and then splices at `min(max(toIndex,0), order.length)`, which is `0..order.length-1` of the original order. The `chart-layout.test.ts` `moveChartTo` table covers first, last, middle, current index, -1 and 9, plus an id not in order (equal, not the same array), `collapsed` unchanged, and no mutation of the input or the default. If the insert happened before the removal, moving units to 3 would give `[r,g,u,f]` instead of `[r,g,f,u]`, so the "last index" row fails. With the `Math.max` clamp removed, `splice(-1)` inserts before the last item, so the "below 0" row fails.
- `normalizeChartLayout` keeps `key-results` in `collapsed` only: **pass**. `chart-layout.ts:35` uses `isPanelId` for collapsed and `isChartId` for order. There are tests for keep-once and dropping unknown ids in collapsed, for dropping key-results and unknown ids from order, and for an unchanged M8 value. Filtering collapsed with `isChartId` would fail the keep-once test.
- `toggleChartCollapsed` accepts `key-results`: **pass**. The test adds it, removes it, and checks the state is restored. The exact `toEqual` on the list would catch a duplicate.
- Round-trip with key-results collapsed, and throwing storage: **pass**. The round-trip test uses the shared `fakeStorage`. The existing `it.each` rows use the shared `throwingStorage` for both read and write. The file has no local copies.
- `useChartLayout` called only in the page: **pass**. `git grep 'useChartLayout('` outside test files finds the definition (`use-chart-layout.ts:12`) and one call (`pages/apps/aoe4-build-order.tsx:162`). `results.tsx` imports only the `ChartLayoutControls` type.
- (respec 1) Hook source check: **pass**. `move`, `moveTo` and `toggle` go through `update`, a functional `setState((prev) => ...)` (`use-chart-layout.ts:28`), so two calls in one render compose in call order, and none of them touch storage. The mount effect stores the read object in `readLayout` and sets `{ layout: read, loaded: true }` in one call. The only write is the `[state]` effect (`:23-26`), which returns early when `!loaded` or `state.layout === readLayout.current`. Under StrictMode's double mount, the second read replaces both the ref and the state, so no write happens on load.
- (respec 1) `ComparePanel` static markup, expanded and collapsed: **pass**. `compare-panel.test.ts` asserts every item the criterion lists for both states. With the body children always rendered, the collapsed test fails on `pinned-label`. With the pin buttons hidden, it fails on `pin-run`.
- `CollapseCaret` aria-label and aria-controls: **pass**. An `it.each` covers both states.
- (respec 1) Playwright `aoe4-key-results-collapse.spec.ts`: **pass by reading** (not run, per role). It uses `SPLIT_VIEWPORT` and asserts the opposite state before each click: expanded, then collapsed, then expanded again. It checks that the body content is hidden, the pin buttons stay visible and the caret keeps focus. The reload test collapses `chart-gather-rates` and the key-results panel, checks both ids are stored, reloads, and checks both are still collapsed.
- (respec 1) M8 layout loads, and `aoe4-chart-layout.spec.ts` is unedited: **pass by reading**. The spec is unchanged in the diff. Its "loading writes nothing" case is met by the write guard above. The new spec's third test covers an M8 value with a chart collapsed. Whether the old spec actually passes is for the acceptance gate to confirm.
- Docs no longer contradict the code: **pass**. `docs/aoe4-build-order.md:1001-1009,1013` covers the collapsed contents, order holding chart ids only, no write on load, the key results panel paragraph with persistence, and the pin buttons now sitting in the title row. `ARCHITECTURE.md` has no matching statements. I checked every Doc claim in the implementer's list against the code, and each holds. See note 1 for one wording point.
- `tsc --noEmit`, `lint:dup`, `npm test` and `next build`: **pass**. I ran them in the review worktree: tsc is clean, jscpd found 0 clones in both configs, vitest ran 75 files with 2377 passed and 13 skipped, and `next build` succeeded.
- No INVARIANTS.md regressions: **pass**. See below.

## Invariants touched

- A1, A2, A3: hold. The diff touches no simulation, data or engine code; it only adds UI state and a localStorage layout.
- S1: holds. No import crosses into another app.
- S2 and S3: not affected. No new page, input or route.

## spec-checklist

- Contracts: names match design C2, C3 (CollapseCaret props and DOM), C4 and C5 exactly: `KEY_RESULTS_PANEL_ID`, `LayoutPanelId`, `moveChartTo`, `ChartLayoutControls`, `compare-panel`, `compare-heading`, `compare-collapse` and `compare-body`. CONTEXT.md lists no surface this diff touches.
- Scope: `line-chart.tsx`, the drag handle, `chart-header` and the move buttons are untouched, as are `golang/` and every Out of scope item. No open questions.
- Naming: no dead values.
- A1–A3: not applicable (no simulation path).

## UI inspection

I served the task worktree with `npx next dev -p 3871`. The inspection script is `/tmp/claude-1000/sgs134-review/inspect.cjs`; the server and script ran in one call because a separately started server did not survive between calls, and the server was stopped afterwards. At 375, 768 and 1280 px wide (800 high; Results tab below 1200), I checked three states: no pin, pinned and expanded, and collapsed.

- Overflow: one hit, `compare-scroll` scrollWidth 540 vs clientWidth 321 at 375 px and 534 at 1280 px. This is the intended horizontally scrolling wrapper the doc describes, and it existed before this change. Nothing else overflows, and the document has no horizontal overflow at any width.
- Overlap among the header row items (`compare-heading`, `compare-collapse`, `pin-run`, `unpin-run`): none. At 375 px, `unpin-run` wraps to a second line through `flex-wrap`, with no overlap.
- Mid-word wraps in the panel: none.
- States: expanded shows the caret glyph `▾` with label "Collapse key results" and body `display: block`. Collapsed shows `▸`, "Expand key results" and `display: none`. The section's height drops (to 94 px at 375 and 43 px at 768 and 1280), and `margin-bottom` is 18px in every state. With no pin, the body has height 0 and the section is 43 px tall at 768 and 1280, so spacing above the results does not change.
- The stored value after a collapse was `{"version":1,"order":[...default],"collapsed":["key-results"]}`.
- Screenshots read: `w375-expanded.png`, `w768-collapsed.png`, `w1280-page-collapsed.png`. They show the heading, caret and pin buttons in one row, and the label and table below. Nothing is clipped.

## Linter

`npx tsc --noEmit && npm run lint:dup` is clean.

## Review bot

Not configured (`reviewBot.cli` and `rulesFile` are empty). Nothing to reconcile.

## Conventions

- `compare-body` uses `data-collapsed={collapsed ? 'true' : 'false'}` plus `hidden`, the same pattern as `line-chart.tsx:158-160`.
- `compare-panel.test.ts` matches `save-build.test.ts:1-40`: `createElement` + `renderToStaticMarkup`, a `render` builder, and a regex tag helper like `button()`.
- The new CSS lives in `workbench.module.css`, which the component already imports. No Bootstrap `d-*`, `flex-*` or spacing utility shares an element with a module class: `ms-3` was removed from `pinned-label`, and the header row uses only `.compareHeader`.
- The Playwright spec uses 2-space indent and `test.use({ viewport })` like `aoe4-chart-layout.spec.ts`. It has no `boundingBox` reads, so the LESSONS.md rule is not triggered.

## Review checklist (REPO.md)

- Every diff: `next build` passes, and I loaded the touched page through the user flow: run, pin, collapse, expand.
- AoE4 build order: no helper is copied; the duplicated `uniqueChartIds` was generalised into `uniqueIds`. I checked the doc against the code. The UI checks at 375, 768 and 1280 px found no overflow other than the intended scroll wrapper, and no overlapping labels. Collapsing visibly changes the glyph, the label and whether the body shows. Class names are built without template literals. The checklist also names 360, 390 and 700 px; 375 px stands in for the narrow widths, where the header wraps cleanly.

## Bot reconciliation

None (no bot).

## Non-blocking notes

1. `docs/aoe4-build-order.md:1004-1005`: "until a chart or the key results panel is moved or collapsed" can be read as saying the key results panel can be moved; it can only be collapsed. Optional rewording: "until a chart is moved or collapsed, or the key results panel is collapsed."
2. `docs/aoe4-build-order.md:1037` (existing sentence, not edited): with no earlier result, Results "shows the compare panel (pin label and Unpin, ...)". When the panel is collapsed, the pin label is not shown. The new key results paragraph covers this, so a reader is not misled. A follow-up could add "when expanded".
3. `use-chart-layout.ts:17-20`: the mount effect replaces the whole state. A `toggle` made between the first paint and the mount effect would be lost. That window is effectively unreachable (effects run before any user input can be handled), so this is not a defect.
4. Moving `pinned-label` into the body puts it on its own line under the header, where before it sat beside the pin buttons. This follows from C4 ("compare-body holding pinned-label") and is intended.

## Coverage

Reviewed:
- `chart-layout.ts` and its test
- `use-chart-layout.ts`
- `collapse-caret.tsx`
- `compare-panel.tsx` and its new test
- `results.tsx`
- `workbench.module.css`
- `pages/apps/aoe4-build-order.tsx`
- `docs/aoe4-build-order.md`
- `acceptance/aoe4-key-results-collapse.spec.ts`
- `acceptance/aoe4-chart-layout.spec.ts`, unchanged, read for the no-write-on-load rule

Not run: Playwright specs (they belong to the acceptance gate). `aoe4-split-scroll.spec.ts:174` expects `results-heading` first in `panel-results`, which still holds.
