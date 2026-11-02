# SGS-066: Results-first workbench: tabs, sticky run bar, text/table toggle, auto-size editor with line numbers

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / M4.7
- **Priority**: medium
- **Risk**: standard
  <!-- No strongModelTriggers item: UI layout and page state only; no route, schema or engine change, and the
       contract names are the design's exact ones. Estimated about 190 lines of business logic, under 250, but
       it restructures the page and the run flow, so not low. -->
- **Invariants**: S2 (the page stays inside `Layout` and stays linked from the landing page); S1 (new components import only from `lib/aoe4-build-order/` and `components/apps/aoe4-build-order/`); S3 (the Run path and its unchecked duration are unchanged)
- **LOC estimate**: about 190 (`pages/apps/aoe4-build-order.tsx` about 60 changed; new `workbench-tabs.tsx` about 40; new `build-text-editor.tsx` about 45; new `text-lines.ts` about 8; `build-input.tsx` about 35 changed; CSS module not counted). Spec rewrites, helpers, unit test and docs excluded.
- **Depends on**: SGS-059
- **On merge**: none
- **Source**: M4 design contract C8 (test ids, `lineCount`, `BuildTextEditor`, `WorkbenchTab`, `BuildInput` props) and Behavior rules "Page run, editor and tabs" rows Run tabs, Run stays on screen, line numbers, auto-size, view toggle (both rows), tabs (both rows) (`design/M4.md`); plan outline J (`plans/M4-20261102.md`) as amended by designer pass 3 (`reports/M4-designer-3.md`: the "Run tabs (from M4.7)" rule, the `text-lines.ts` and component paths under `components/apps/aoe4-build-order/`)

## Context

Today the page is one long column: editor, table, error list, then Results. A user who runs a build has to scroll
past the editor and the table to see the answer. M4.7 makes Results the first thing seen after a run: two tabs,
a run bar that stays on screen, one editor view at a time (text or table), and a textarea that grows to its
text with line numbers beside it. SGS-059 left the textarea in `BuildInput` with `IssueList` under it; this
ticket moves the textarea into the new editor and the issue list into the Build tab.

## Scope

All paths are relative to the repo root. Names are exactly those of `design/M4.md` C8 and SGS-059
(`PageProps { builds, catalog }`, `IssueList`, `BuildInput` `issues` prop, `StepTable` prop `catalog`,
`runRejected`, `textToBuildOrder`).

**1. `components/apps/aoe4-build-order/text-lines.ts` (new).** `export function lineCount(text: string):
number`: `''` gives 1, `'a\nb'` gives 2, `'a\n'` gives 2 (the count of `\n` plus 1). `issueLines` is not
added here (the inline issues ticket defines it). New `text-lines.test.ts` beside it covers those three
rows and a text with a blank line in the middle (`'a\n\nb'` gives 3).

**2. `components/apps/aoe4-build-order/build-text-editor.tsx` (new).** `export function BuildTextEditor(props:
{ text: string; onChange(text: string): void; errorLines: readonly number[] }): JSX.Element`.
- A `<textarea>` with `data-testid="build-order-text"` and `id="build-order-text"` (the label `Build order`
  keeps `htmlFor`), the classes and `spellCheck={false}` it has today, `value={text}`, `onChange` calls
  `props.onChange`, and `rows={Math.max(8, lineCount(text))}` replacing today's `rows={16}`. The textarea never
  shows a vertical scrollbar (`overflow-y: hidden`, no manual resize): the page scrolls instead.
- A gutter beside it, `data-testid="build-order-gutter"`, `aria-hidden="true"`, with one
  `data-testid="build-order-line-number"` item for each of 1 to `lineCount(text)`, text the number,
  `data-line` the number, and `data-error="true"` on an item whose number is in `errorLines` (attribute absent
  otherwise). Gutter and textarea use the same font, font size and line height and the same top padding, so
  line N's number sits level with line N's text. Lines do not wrap (`wrap="off"`): alignment needs one visual
  row per line, and a line longer than the box scrolls sideways inside the textarea only.
- This ticket's page passes `errorLines={[]}` (SGS-059's issues are not live and carry no highlight; the
  inline issues ticket passes the real lines). No `issueLines` here.
- Styling: a CSS module next to the components (for example `workbench.module.css`) or Bootstrap classes;
  the design leaves this to the ticket.

**3. `components/apps/aoe4-build-order/workbench-tabs.tsx` (new).** `export type WorkbenchTab = 'build' |
'results'` and `export function WorkbenchTabs(props: { active: WorkbenchTab; onSelect(tab: WorkbenchTab):
void; resultsEnabled: boolean; build: ReactNode; results: ReactNode }): JSX.Element`.
- A `role="tablist"` container `data-testid="workbench-tabs"` with two `role="tab"` buttons in the order Build,
  Results: `tab-build` and `tab-results`, each with `aria-selected` true for the active tab only. `tab-results`
  has the `disabled` attribute while `resultsEnabled` is false; `tab-build` is never disabled.
- Two panels, `panel-build` and `panel-results` (`role="tabpanel"`), both always mounted. The inactive one has
  the `hidden` attribute. Mounting both keeps chart, table and editor state across tab switches.

**4. `components/apps/aoe4-build-order/build-input.tsx`.** It becomes the sticky run bar: the form keeps
`BuildInput` as its name and gets `data-testid="run-bar"` and `position: sticky; top: 0` with a background
and a z-index so content scrolls under it, in both tabs at every width. It holds, in one bar, `build-order-select`
(select stays local state; the lift is a later ticket), `duration-seconds`, `run-simulation`, and a view toggle:
two buttons `editor-view-text` and `editor-view-table` with `aria-pressed` (true on the active one).
- Props: drop `text`, `onTextChange` and SGS-059's `issues`; add `view: EditorView` and `onViewChange(view:
  EditorView): void`, where `export type EditorView = 'text' | 'table'` is exported from this file. Choosing a
  prebuilt build still replaces the text, so `onTextChange` stays: the select calls it with the build's text. Keep
  `builds`, `duration`, `onDurationChange`, `running`, `onRun`.
- The textarea and its label leave this file (they live in `BuildTextEditor`, item 2); `IssueList` leaves it
  too (item 5). `PrebuiltBuild` stays exported here.

**5. `pages/apps/aoe4-build-order.tsx`.**
- New state: `tab: WorkbenchTab` (initial `'build'`) and `view: EditorView` (initial `'text'`). Both live in
  the page, so the view and the tab survive runs and tab switches and reset on reload (no storage).
- Layout: the `h1`, then `BuildInput` (the run bar), then `WorkbenchTabs`.
  - `build` panel: when `view === 'text'`, `BuildTextEditor` (with `errorLines={[]}`); when `view === 'table'`,
    `StepTable`, or the `step-table-unavailable` notice with the first parse issue while the text does not parse
    (the toggle stays usable). The two views are never mounted together. Switching view never rewrites the text.
    Directly under that view, in both views, `IssueList` with the client issues from SGS-059 (a client
    rejection must be visible whichever view is open), then the `simulation-error` list (it moves here from
    its place under the table; same markup and test id).
  - `results` panel: today's `ComparePanel`, `Results` and the "Results" heading, unchanged inside.
- Tab rules (design Run tabs and tabs rows):
  - On load: Build. `resultsEnabled = result !== null || pinned !== null`. The tab shown is Build whenever
    Results is disabled (derive it from `tab` and `resultsEnabled`; do not leave a selected-but-disabled tab).
  - Run, after SGS-059's step 3 (a client rejection), step 6 (400) and step 7 (network or HTTP failure): set
    `tab` to `'build'`. After step 5 (200): set `tab` to `'results'` and scroll the top of `panel-results`
    into view (`scrollIntoView` on a ref, run after the panel is shown; the sticky bar must not cover it, so
    give the panel a `scroll-margin-top` of the run bar's height or equivalent).
  - A click on an enabled `tab-results` or on `tab-build` sets `tab` and does nothing else.
- `StepTable` and `parsed` are only rendered or computed as the page does today; moving the table into the
  table view must not change what it renders.

**6. Specs (`acceptance/`).** Every Playwright spec that runs the page is updated by these rules; find each by
test title because earlier tickets shift line numbers. Add small helpers to `acceptance/helpers.ts` (for
example `showTab(page, tab)` and `showView(page, view)`, each clicking `tab-*` or `editor-view-*`); `runRejected`
needs no change (a rejection selects Build, so `build-order-issues` is visible).
- Rule A, results: after a 200 the Results tab is selected, so assertions on charts, messages, timeline and
  compare table need no change. An assertion that something is absent or a button is enabled or disabled
  (`toHaveCount(0)`, `toBeEnabled`, `toBeDisabled`) needs no change either, since those do not need the
  element visible.
- Rule B, text after a 200: a step that fills `build-order-text` (or edits the table) after a run that
  returned 200 first clicks `tab-build`. Affected today: the pin-compare spec's `run` helper (`fill` of
  `opts.text` after an earlier run) and "the pin survives a text edit and a prebuilt change"; in
  `aoe4-build-order.spec.ts` every test that fills text after a 200 run (for example "a failed run after a
  successful one removes the charts", the notes test, "editing the text after a run keeps the labels until the
  next run", "a 400 run and a start-only run show no timeline", "a failed run shows neither..." when preceded
  by a run, the pin and marker tests that refill text); in `aoe4-build-order-m3-flow.spec.ts` the first test
  (edits `step-field-count` after a run and a pin).
- Rule C, table versus text: a test that reads or edits `step-*` elements (`step-table`, `step-row`,
  `step-add`, `step-field-*`, `step-table-unavailable`) first clicks `editor-view-table`; a test that reads
  `build-order-text` after table edits first clicks `editor-view-text`. A test that fills text and then
  reads the table does: fill in the text view, click the table view, assert rows, and click the text view
  again for any later `toHaveValue` on the textarea. This covers every test in `acceptance/aoe4-step-table.spec.ts`
  (22 `step-*` hits today; the "default build renders one row per step" test reads `inputValue()` in text
  view, then toggles) and the three tests in `acceptance/aoe4-build-order-m3-flow.spec.ts`. "table buttons
  never post to the simulate route" clicks `editor-view-table` before `step-add`.
- Rule D, other tests keep their expected values. The implementer lists every test it edits.
- New specs (`aoe4-build-order.spec.ts` unless stated), one per behavior:
  1. Load: `tab-build` has `aria-selected="true"`, `panel-build` visible, `panel-results` hidden,
     `tab-results` disabled, `editor-view-text` has `aria-pressed="true"`, `build-order-text` is visible and
     `step-table` has count 0.
  2. Run the default build: `tab-results` selected and enabled, `panel-results` visible, `panel-build` hidden,
     and `panel-results`'s top is inside the viewport and not above the bottom edge of `run-bar`. Click
     `tab-build`: `build-order-text` visible with the text it had; click `tab-results`: charts still drawn.
  3. Reject a paste with `runRejected` after a successful run: `tab-build` selected and `build-order-issues`
     visible; `tab-results` is still enabled when a pin exists and disabled when none was pinned. A 400 run
     (mocked, as the existing mocked-400 test does) and a mocked 500 run also select Build and show
     `simulation-error`.
  4. Unpin while on Results with no current result (run, pin, run a rejected paste, click `tab-results`,
     click `unpin-run`): `tab-build` is selected and `tab-results` is disabled.
  5. Sticky: at 1280x720 run the default build, scroll `window` to the bottom, and `run-bar`'s bounding box
     top is 0 (within 1 px) with `run-simulation` clickable; the same with the Build tab selected and the
     page scrolled (use the build with the longest text).
  6. Line numbers: `build-order-line-number` count equals the textarea's line count for the default build,
     the first has `data-line="1"` and the last `data-line` equals that count; filling `''` shows one item
     (`1`); filling `a\nb\n` shows three.
  7. Auto-size: after filling 30 lines, the textarea's `scrollHeight` is at most its `clientHeight` (no inner
     vertical scroll) and its `rows` attribute is `30`; after filling 3 lines `rows` is `8`. Line 20's number
     and line 20's text are level: the gutter item's box top matches the position of that line within the
     textarea to within 2 px (compute from the textarea's top, padding and line height).
  8. Toggle: `editor-view-table` sets `aria-pressed` true on it and false on the text button, hides
     `build-order-text` (count 0) and shows `step-table`; typing `start -> sheep\nat 8 vils fly capital-town-center`
     in the text view and switching to table shows `step-table-unavailable` containing `fly` and the toggle
     still works back to text; the textarea text is byte-for-byte what was typed after a round trip. The view
     survives a run and a tab switch (table view, run, `tab-build`: still table), and resets on reload.
- Unit: `components/apps/aoe4-build-order/text-lines.test.ts` (item 1).

**7. Docs.** `docs/aoe4-build-order.md` "Page" section (opens "The page is `/apps/aoe4-build-order`", about
line 762 on `origin/main` before SGS-059): its first paragraph lists the controls in a different layout.
Rewrite it to say: a sticky run bar (prebuilt select, `durationSeconds` input, Run, and a text/table
toggle), two tabs Build and Results (Results disabled until a run succeeds or a run is pinned; a successful run
selects Results and scrolls it into view; a rejected or failed run selects Build), the editor view (text:
line-numbered textarea growing to its text, minimum 8 rows; table: the step table), and the view and the tab
surviving runs but not reloads. The sentence "the textarea stays editable" in the "table is replaced by a
notice" sentence becomes: the toggle stays usable. Line 806 ("A step timeline sits above the charts...") and
line 814 ("Under the "Results" heading...") are about the Results tab and stay true; check them and the
SGS-059 text for any statement that the textarea and table are on the page at once, and fix each hit. Grep
the two READMEs and `docs/` for "textarea" and "step table" and fix any that say the table always shows.

**Out of scope:** `issueLines`, live issues, suggestions, gutter highlight and scroll-to-issue (the inline
issues ticket); lifting `selected` out of `BuildInput`, pin naming, pin storage, `results-stale`, `pinned-label`
and restoring a pin (the pin ticket; `resultsEnabled` already reads `pinned`, so a restored pin needs no change
here); the step table internals, labels and cards (`step-table.tsx`, `step-table-model.ts`); 390 px checks
beyond what the sticky bar and the editor need; `lib/`, the route, `api.ts`, OpenAPI; the Results panel contents
and the timeline, compare and chart components.

## Diagrams

The ticket changes the page's Run path (which tab follows each outcome) and adds a tab state machine.

```mermaid
stateDiagram-v2
  [*] --> Build: load (Results disabled)
  Build --> Results: click tab-results (enabled when a result or a pin exists)
  Results --> Build: click tab-build
  Build --> Results: Run, 200 (scroll panel-results into view)
  Build --> Build: Run, client rejection, 400 or failure
  Results --> Build: Run, client rejection, 400 or failure
  Results --> Results: Run, 200
  Results --> Build: unpin with no current result (Results becomes disabled)
```

```mermaid
flowchart LR
  subgraph read
    R[Run click] --> C[textToBuildOrder]
  end
  subgraph act
    C -->|ok: order| P[POST buildOrder]
    C -->|ok false: issues| X[no request]
    P -->|200| S[result and run text]
    P -->|400 or failure| F[server issues]
  end
  subgraph record
    S --> TR[tab = results, scroll panel-results]
    F --> TB[tab = build, simulation-error]
    X --> TB2[tab = build, IssueList]
  end
```

## Acceptance criteria

- [ ] On load `tab-build` is selected, `panel-build` is visible, `panel-results` has the `hidden` attribute, `tab-results` is disabled, `editor-view-text` is pressed and `build-order-text` is visible with `step-table` absent (new spec 1).
- [ ] After a 200 run the Results tab is selected, `panel-results` is visible and `panel-build` is hidden, and the top of `panel-results` is inside the viewport and below the `run-bar` bottom edge; both panels stay mounted (switching to Build and back keeps the text and the charts) (new spec 2).
- [ ] A client rejection, a mocked 400 and a mocked 500 each select Build; the client rejection shows `build-order-issues` (visible) with `simulation-error` count 0, the other two show `simulation-error`; each clears the shown result and keeps the pin; `tab-results` stays enabled with a pin and is disabled without one (new spec 3).
- [ ] Unpinning while on Results with no current result selects Build and disables `tab-results` (new spec 4).
- [ ] `run-bar` stays at the viewport top (`top` 0 within 1 px) after scrolling the page to the bottom, in both tabs, and holds `build-order-select`, `duration-seconds`, `run-simulation`, `editor-view-text` and `editor-view-table` (new spec 5).
- [ ] The gutter has one `build-order-line-number` per line: first `data-line="1"`, last `lineCount(text)`; `''` shows 1; `a\nb\n` shows 3; line numbers sit level with their lines (new spec 6 and 7). `rows` is `max(8, lineCount)` and the textarea has no inner vertical scroll at 30 lines (new spec 7).
- [ ] The toggle shows exactly one of `build-order-text` and `step-table`; `step-table-unavailable` with the first parse issue shows in table view for unparseable text and the toggle still works; switching views leaves the text unchanged; the view survives a run and a tab switch (new spec 8).
- [ ] `lineCount('')` is 1, `lineCount('a\nb')` 2, `lineCount('a\n')` 2, `lineCount('a\n\nb')` 3 (`text-lines.test.ts`).
- [ ] Mutation: change `lineCount` to ignore the final empty line (`'a\n'` gives 1); `text-lines.test.ts` fails and the line-number spec fails. Confirm by applying it before handing over (the files are new, so this check runs after they exist).
- [ ] `git grep -n "rows={16}" -- components pages` prints nothing (1 hit today, in `build-input.tsx`), and `git grep -n 'data-testid="build-order-text"' -- components pages` prints exactly one hit, in `build-text-editor.tsx` (1 hit today, in `build-input.tsx`).
- [ ] `git grep -n "IssueList" -- components/apps/aoe4-build-order/build-input.tsx` prints nothing; `IssueList` renders only from the page, under the editor or table view.
- [ ] Every spec that ran before still passes under rules A to D; `git grep -c "tab-build" -- acceptance` is greater than 0 in `aoe4-build-order.spec.ts`, `aoe4-build-order-pin-compare.spec.ts` and `aoe4-build-order-m3-flow.spec.ts`, and `git grep -c "editor-view-table" -- acceptance/aoe4-step-table.spec.ts` is greater than 0. The ticket lists every test it edited.
- [ ] `docs/aoe4-build-order.md` describes the tabs, run bar, toggle and editor, and no longer says the textarea, step table and results are on the page at once: `git grep -nE "a build order textarea, a$|step table, a .durationSeconds" -- docs` prints nothing (the paragraph is rewritten).
- [ ] `npx tsc --noEmit`, `npm run lint:dup`, `npm test` and `npm run acceptance` (Node 24) pass.
- [ ] No INVARIANTS.md regressions

## Open questions

- `designer`: when the table view is open, where does `build-order-issues` show? The design says "directly under the editor in `panel-build`" and shows a client rejection in the Build tab, but it does not say what a rejection shows in table view. This ticket renders `IssueList` under whichever view is open so the issue is always visible and `runRejected` works in both views. Confirm, or specify a switch to text view on rejection.
- `designer`: if the user unpins from the Results tab while no current result exists, the design's "no target" rule implies Results must disable; this ticket falls back to Build in that case. Confirm.
- `designer`: this ticket ships the `errorLines` prop and the gutter's `data-error` attribute with the page passing `[]` until the inline issues ticket, so J is not exercised by a test for `data-error`. Confirm that the prop belongs here, or move it to the inline issues ticket.
