# SGS-110 review 1

Ticket SGS-110, branch `sgs-110-text-gutter-annotations` at `d7b7e0186d3736d31489f1d83575b115e2f0f150` (not pushed; reviewed from the local ref), base `e708ee5` (stacked on SGS-109). Diff `e708ee5..d7b7e01`, 7 files. Full review.

**Verdict: APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | `annotationsByLine` mapping and unit table | pass | `step-annotations.ts:162-168` writes `byLine[line - 1]` only for `1 <= line <= lineCount`. `step-annotations.test.ts:206-220` is an `it.each` table with `[2, 4]` of 5 giving `[null, a0, null, a1, null]`, blank/comment/start gaps, trailing blank line, out-of-range and zero lines. Unit run: exit 0. |
| 2 | Text gutter kind and times equal the table's | pass | Spec test "step lines read the same kind and times as the table rows" reads both views for one build and checks `data-kind`, `step-started` and `step-finished` per row, and at least 3 kinds. Passed in my run. |
| 3 | Empty `li` for blank/comment/start; null-run step has `data-kind`, no times, no `data-status`, no warning | pass (code), partly tested | Code: `build-text-editor.tsx:34-46`. `data-kind` comes from the annotation, `StepTimes` is rendered only when `run !== null`, `data-status={run?.status}`, `annotationToneClass(undefined, stale)` adds no `warn`. The spec checks empty lines and that the changed step has no `step-started`. It does not check `data-kind`, `step-finished`, `data-status` or background for the null-run `li` (see notes). |
| 4 | not-reached and waiting: en dash, `data-flagged`, tinted background via `annotationToneClass` | pass | `build-text-editor.tsx:42` calls `annotationToneClass(run ?? undefined, stale)`. No copied rules. Table test over both statuses asserts the API status first, then the en dashes, `data-flagged` and a background that differs from a calm line. My screenshots at 768 and 1280 show the warning tint on lines 6, 7, 10 and 11. |
| 5 | Row alignment, no sideways scroll at 1280, fixed column width, textarea `min-width: 0` | pass | `workbench.module.css`: `.annotations` joins the shared font/line-height rule, has `flex: none; width: 17ch`, and `li { height: 1.5em }`. `.textarea` keeps `min-width: 0` (unchanged). The alignment test does one `page.evaluate` under `expect.poll` and compares top and height for every line. Probe at 768 and 1280: document overflow 0, no `li` clipped. The SGS-108 layout check in `aoe4-step-annotations.spec.ts` passed. |
| 6 | Absent before a result; legend above the textarea, unique across views; start-only shows none; syntax error still shows | pass | `build-text-editor.tsx:61` checks `annotations !== null && lines.steps.length > 0`. The spec holds the first run, checks count 0, checks the legend sits above the textarea, toggles views, and covers start-only and syntax-error texts. |
| 7 | Stale dims (`data-stale`, opacity 0.5), changed step has no `step-started`, release restores | pass | Spec test "a changed step loses its times..." with `holdSimulate`. It asserts the API status first. Passed. |
| 8 | Syntax error: other lines keep dimmed annotations, the erroring line's `li` is empty | pass | Page passes `parsed.partial.lines` (`aoe4-build-order.tsx:260`). `parse-text.ts:296-297` pushes `steps` and `lines.steps` together, so the indexes match `liveSteps`. Spec test passed. |
| 9 | Hover: one band per chart with API span, `data-gutter-active` only, no `data-active`; leave clears; not-reached draws none | pass | `git grep data-active` on `build-text-editor.tsx` matches only `data-gutter-active`. The spec checks the band span, the count of `data-gutter-active`, zero `data-active` and a different `box-shadow`. My screenshot shows the blue inset outline on the hovered line. |
| 10 | Caret: focus first, click and ArrowDown shade, blank/comment clear, blur clears | pass | `build-text-editor.tsx:54-57,103-107`. Spec test passed. |
| 11 | Last event wins; fails on restore-on-leave | pass | Nothing in the editor stores the caret. The spec asserts no bands after leave, which an implementation that restores the caret's step would fail, then `ArrowRight` brings the band back. |
| 12 | Docs paragraph | pass | `docs/aoe4-build-order.md:870` covers the gutter, hover and caret shading, last event wins, blur and the legend above both views. `:934` and `:973` were updated. I checked each claim against the code (see Doc claims). No sentence says the gutter holds only line numbers or that the legend is only above the table. |
| 13 | `StepTimes` reused, lint:dup clean, no `data-active` | pass | The file imports `StepTimes` and has no local `step-started` or `step-finished` markup. `npm run lint:dup`: 0 clones. |
| 14 | No invariant regressions | pass | See below. |

## Invariants touched

- **A3** holds. `annotationsByLine` is pure. Hover, caret and blur feed only the page's `active` state, which no simulate or result path reads. No clock and no randomness.
- **S1** holds. The new imports are `lib/aoe4-build-order/format-time`, `lib/aoe4-build-order/model`, and `./step-annotation` and `./step-annotations` in the same component directory.
- S2, S3, A1 and A2 are not touched.

## Doc claims checked

- "kind colour as a left border and its started and finished times": `KIND_CLASS` sets `--kind-color`, and `.annotations li.annotation` draws a 4px border from it. Computed border colours: villager green, research info, building gray. `StepTimes` renders the times.
- "dimmed in the same stale state as the step table": `annotationToneClass(..., stale)` applies `.stale` (opacity 0.5).
- "hovering the annotation shows the time it waited and what blocked it": the `title` holds `Waited m:ss. Blocked by: <run.blockedBy>`, and `blockedBy` is built through `formatWaitBreakdown`.
- "Blank, comment, start and unparseable lines have an empty annotation": `annotationsByLine` returns null for those lines, which renders an empty `li`.
- Hover and caret shading, last event wins, blur clears: the handlers at `build-text-editor.tsx:44-45,54-57,103-107`.
- Legend condition: `build-text-editor.tsx:61`.

## Lint

`npx tsc --noEmit` is clean. `npm run lint:dup` reports 0 clones. No ESLint is configured.

## Bot reconciliation

`reviewBot.cli` and `reviewBot.rulesFile` are empty. No bot ran.

## Non-blocking notes

1. `acceptance/aoe4-compact-view.spec.ts:7`: `const DURATION = 1200` is never used, and `LINE_OF.comment` (`:35`) is never read. The spec depends on the page's default 1200 s duration without saying so. Delete both, or use `DURATION`. A human reviewer would flag the dead constant.
2. `acceptance/aoe4-compact-view.spec.ts:186-203`: the null-run case in criterion 3 is only partly tested. Only `step-started` count 0 is checked on the changed line. Adding `toHaveAttribute('data-kind', /.+/)`, `step-finished` count 0 and `not.toHaveAttribute('data-status', /.*/)` on `gutter(page, LINE_OF.instant)` would pin the rest. The code is correct today.
3. `build-text-editor.tsx:55`: `value.slice(0, selectionStart).split('\n').length` reimplements `lineCount` from `./text-lines`, which this file already imports. Use `lineCount(e.currentTarget.value.slice(0, e.currentTarget.selectionStart))`.
4. `workbench.module.css` `.annotations li.annotation { border-left: 4px solid var(--kind-color, transparent) }` copies `.kindBorder` in `step-annotation.module.css:24-26`. The design lists `step-annotation.module.css` as used by the M7.6 consumer, so importing that module's `kindBorder` class would keep one border rule (step-table's run cell uses it, `step-annotation.tsx:61`). This is one line, so drift risk is low.
5. Gutter times render as `0:00 1:00` with only a gap between them, while the design's behavior row reads "`step-started`–`step-finished` text". The ticket leaves the wording to the implementer, so this is not a finding. A separator would read more clearly.
6. The implementer reports that removing `onKeyUp` alone fails no test, because Chromium's `select` also covers ArrowDown. `keyup` stays because the ticket lists it. Noted, not a finding.
7. `onActiveStepChange` (`aoe4-build-order.tsx:112`) builds a new `{ result, step }` object on every caret event (each keyup and click in the textarea), so the page re-renders even when the step is unchanged. The table already used the same handler on pointer enter. The cost is small. A same-step bail-out could follow later if typing ever feels slow.
8. Not from this diff: in my probe, a `waiting` step's title reads `Waited 0:00. Blocked by: prerequisite 20:00, still waiting on prerequisite`. That is because the API's `waitSeconds` is 0 for a step still waiting. The table's run cell shows the same `0:00` (`step-annotation.tsx:66`), so the views are consistent. This is a follow-up for the run-cell owner if wanted.
9. After `fill()` the textarea keeps its horizontal scroll at the caret's end-of-text position, so the start of long lines is hidden. This existed before the diff (`wrap="off"`). The 17ch column makes it show up at narrower widths. It is not a regression of any criterion.

## Coverage

- Files reviewed: `build-text-editor.tsx`, `step-annotations.ts`, `step-annotations.test.ts`, `workbench.module.css`, `pages/apps/aoe4-build-order.tsx`, `docs/aoe4-build-order.md`, `acceptance/aoe4-compact-view.spec.ts`. Context read: `step-annotation.tsx`, `step-annotation.module.css`, `step-table.tsx` (row hover sibling), `text-lines.ts`, `parse-text.ts` (lines/steps pairing), `aoe4-step-annotations.spec.ts` (spec sibling).
- Commands run in a review worktree: `npm ci`, `tsc --noEmit`, `lint:dup`, `npm test` (exit 0), `npx next build` (OK). Acceptance: `aoe4-compact-view`, `aoe4-step-annotations`, `aoe4-build-order-step-band`, `aoe4-build-order-inline-issues`, `aoe4-split-layout`, `aoe4-results-split`, `aoe4-step-table`, `aoe4-build-order-client-check`: 103 passed.
- REPO.md review checklist: "Every diff" was followed (build plus loading the page through Playwright). In the "AoE4 build order" section, I screenshotted the Text view after a run and on hover at 768 and 1280 px. The 360 and 390 px checks were skipped per the owner's M7 scope note. No Bootstrap utility is mixed with module CSS on the new elements, and conditional classes use `cn`. No helper was copied from `lib/`.
- I could not run the full acceptance suite. Only the related specs above were run.
