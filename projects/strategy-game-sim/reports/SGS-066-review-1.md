# SGS-066 review 1

Verdict: REQUEST CHANGES

Branch: sgs-066-aoe4-workbench-tabs-editor. Tip: 0d57ba110d8b027e417381225b9b1336488858ad, a local branch that is not on origin (`origin/sgs-066-...` does not exist, so I reviewed from the local ref). Diff reviewed: `41e648d..0d57ba1`, stacked on the old sgs-059 tip.

## Blocking findings

1. `components/apps/aoe4-build-order/workbench.module.css:9` with `pages/apps/aoe4-build-order.tsx:74-76`
   - Category: correctness / contract.
   - What: the fixed `scroll-margin-top: 8rem` (144 px, because the root font is 18 px) is shorter than the run bar whenever the bar wraps. I loaded the page in Playwright, scrolled to the bottom and ran the default build:

     | width | run-bar height | `panel-results` top after the scroll |
     |-------|----------------|--------------------------------------|
     | 1280 | 94 px | 144 px (clear of the bar) |
     | 768 | 187 px | 144 px (43 px under the bar) |
     | 390 | 247 px | 144 px (103 px under the bar) |

   - Why it matters: at 768 px and below, the "Results" heading and the top of the compare panel end up under the sticky bar after every successful run. Ticket item 5 says "the sticky bar must not cover it". The design says the bar is sticky "at every width". 768 px falls outside the ticket's 390 px carve-out.
   - Direction: scroll by the bar's measured height, not a constant. Two options:
     - a `--run-bar-height` CSS variable fed by a ResizeObserver on the form;
     - computing the scroll target as `panel top + scrollY - bar.offsetHeight`.

     Then extend new spec 2 to a width where the bar wraps (for example 768 px).

2. `acceptance/aoe4-build-order.spec.ts:712-786` (`runThenFail` and "a 400/500 run after a successful one selects Build and shows simulation-error")
   - Category: test.
   - What: the setup never pins, so the failed run leaves Results disabled, and the derived `shownTab` shows Build whatever the 400 and failure paths do. I removed `setTab('build')` from both the `!response.ok` path and the `catch` path in `pages/apps/aoe4-build-order.tsx`, then ran all 85 `acceptance/aoe4-build-order*` tests: all 85 passed.
   - Why it matters: the test name claims "selects Build", but no assertion can fail on that behavior. The criterion "each ... keeps the pin; `tab-results` stays enabled with a pin" goes unchecked for 400 and 500.
   - Direction: in `runThenFail`, click `pin-run` after the 200. Then assert:
     - `tab-build` is selected;
     - `tab-results` is enabled (the pin was kept);
     - `simulation-error` is visible.

     Re-run the mutation above to confirm the test now fails.

3. `docs/aoe4-build-order.md:812-813`
   - Category: contract (a doc sentence the code contradicts).
   - What: the doc says the textarea "grows to its text (at least 8 rows) and never scrolls inside". The code uses `wrap="off"` with `overflow-x: auto` (`workbench.module.css:44`), so a long line scrolls sideways inside the textarea, as the ticket requires.
   - Direction: say it never scrolls vertically, and that a line longer than the box scrolls sideways inside it.

4. `components/apps/aoe4-build-order/workbench-tabs.tsx:24,36`
   - Category: convention.
   - What: class names are built with template literals (`` `nav-link${... ? ' active' : ''}` ``). ARCHITECTURE.md:14 says "Combine class names with `classnames` (`cn`)". The sibling `build-input.tsx:41,84` uses `cn`. These are the only template-literal `className`s under `components/` and `pages/`.
   - Direction: use `cn('nav-link', active === 'build' && 'active')`.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Load state | pass | New spec 1 passes. It checks `hidden`, `disabled`, `aria-pressed` and the `step-table` count of 0. |
| 2 | 200 selects Results, below the run bar, both panels mounted | **fail** | Passes at 1280 px. At 768 px and 390 px the panel top sits under the bar (finding 1). Mounting is fine: the text survives a tab switch, and the charts redraw when Results is selected again. |
| 3 | Rejection, 400 and 500 select Build | partial | The rejection part passes with and without a pin, and my mutation "rejection selects Results" fails 2 specs. The 400 and 500 parts cannot fail for the tab, and keeping the pin on 400 and 500 is not checked (finding 2). |
| 4 | Unpin with no current result | pass | Making `resultsEnabled` always true fails 5 specs, including this one. |
| 5 | Sticky bar in both tabs; the bar holds the five controls | pass | The spec passes at 1280 px. The five controls are in the `run-bar` form; I checked this in code, since no spec asserts it. |
| 6 | Gutter line numbers, `BuildTextEditor` takes only `{text, onChange}`, no `data-error` | pass | The props interface has exactly those two props, and no `data-error` appears in the code. |
| 7 | `rows` = max(8, n), no inner vertical scroll at 30 lines | pass | `rows` is 30 at 30 lines and 8 at 3 lines; `scrollHeight` ≤ `clientHeight`; line 20 sits level within 2 px. |
| 8 | Toggle shows one view, unparseable notice, text kept, view survives a run and a tab switch, resets on reload | pass | New spec 8 passes. |
| 9 | `lineCount` unit rows | pass | 4 rows. |
| 10 | Mutation: `lineCount` ignores a trailing newline | pass | I applied it myself. The unit test fails (1 of 4) and "the gutter has one line number per line of text" fails. |
| 11 | Greps for `rows={16}` and `build-order-text` | pass | `rows={16}`: no hits. `build-order-text`: one hit, `build-text-editor.tsx:26`. |
| 12 | `IssueList` greps | pass | No hit in `build-input.tsx`. It renders from the page only, under the open view. |
| 13 | Old specs pass under rules A-D, plus `tab-build` and `editor-view-table` counts | pass, with one gap | Full suite: 620 passed. `tab-build` counts: 9, 3 and 2. `editor-view-table` count in the step-table spec: 9. The ticket file does not list the edited tests; the list is only in the implementer report. |
| 14 | Docs rewritten; the old-wording grep is empty | partial | The grep is empty, but one new sentence is contradicted by the code (finding 3). |
| 15 | tsc, lint:dup, npm test, acceptance pass | pass | Node 24.22.2. tsc is clean; lint:dup finds 0 clones; unit tests: 1225 passed, 8 skipped; acceptance (port 3911): 620 passed; `npx next build` OK. |
| 16 | No invariant regressions | pass | See below. |

I ticked no criteria, because the verdict is not APPROVE.

### Invariants touched

| Invariant | Holds? | Why |
|-----------|--------|-----|
| S1 | holds | The new components import only `./` modules and `classnames`. The page imports from its own app folders. |
| S2 | holds | The page is still inside `Layout`, and the link in `pages/index.js` is untouched. |
| S3 | holds | The Run path, the POST body and the duration handling are unchanged. |
| A1-A3 | not touched | No `lib/` change. |

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. `rulesFile` is empty.

## Non-blocking notes

- The helpers are used unevenly. `showTab` and `showView` are added to `acceptance/helpers.ts`, but most new and edited call sites click `tab-build` or `editor-view-table` inline. In `aoe4-step-table.spec.ts:19-27` the `expectText` and `textValue` helpers call `showView(page, "text")` and then switch back with a raw `page.getByTestId("editor-view-table").click()`. Use the helpers throughout.
- Several `await expectText(page, ` lines in `aoe4-step-table.spec.ts` (around lines 67-71, 118, 170-182, 197, 256, 270) end in trailing whitespace. That is Prettier-style reflow left half-done in a file that is otherwise Prettier-formatted.
- The docs sentence "Results is disabled until a run succeeds or a run is pinned" (`docs/aoe4-build-order.md:808`) matches the ticket's wording. It does not say that Results becomes disabled again after a failed run with no pin, which the derived rule does. Suggested wording: "Results is enabled while there is a shown result or a pin".
- Possible bottom-line overlap on the textarea: with `wrap="off"`, `overflow-y: hidden` and `rows = lineCount`, a long line brings up a horizontal scrollbar. On platforms with classic, non-overlay scrollbars (Windows), that scrollbar can sit over the last line, and it cannot be scrolled to. Headless Chromium uses overlay scrollbars (`scrollHeight == clientHeight` with a 3643 px wide line), so I could not reproduce it. A fix would be to add the scrollbar height to the padding, or to use `rows + 1` when a line overflows.
- The implementer's two notes:
  - **Charts drawing nothing while Results is hidden**: not a defect. The Recharts `ResponsiveContainer` measures 0 inside a `hidden` panel, and the charts redraw once the panel is shown. New spec 2 checks the redraw: 3 series paths after switching back. Nobody can see a hidden chart, and the absence assertions are unaffected.
  - **The fixed 8rem scroll margin**: a defect (finding 1).
- `resultsShownCount` is a counter whose only job is to trigger the scroll. A name like `scrollToResults` would say what it does. Optional.

## Coverage

- Reviewed every file in the diff:
  - 5 new or changed production files, the CSS module and the docs;
  - 6 acceptance specs and the helpers.
- Siblings compared:
  - `build-input.tsx` and `issue-list.tsx` for `cn` and markup style;
  - `line-chart.tsx` for `useEffect` and `useRef`;
  - `acceptance/helpers.ts` for helper style.
- REPO.md review checklist:
  - "Every diff": I ran `next build` and loaded the page through Playwright at 1280, 768 and 390 px.
  - "AoE4 build order": no helper or constant is copied from `lib/`; this is not a chart change.
- Mutations run, each reverted afterwards:
  - a rejection selects Results: 2 specs fail;
  - Results always enabled: 5 specs fail;
  - 400 and failure paths no longer select Build: all 85 pass (finding 2);
  - `lineCount` ignores a trailing newline: the unit test and the gutter spec fail.
- Not reviewed: a real-OS scrollbar check, since I had headless Chromium only.
- The temporary probe spec was deleted, the worktree was left clean, and nothing listens on port 3911.
