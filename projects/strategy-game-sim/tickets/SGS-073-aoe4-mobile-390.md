# SGS-073: Make the AoE4 page fit a 390 px screen: no sideways page scroll, tables scroll in their own boxes

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / M4.13
- **Priority**: low
- **Risk**: low
  <!-- One component, CSS and class-name changes plus one Playwright spec; no route, schema, engine or other public surface; no adjacent invariant; under ~100 lines of business logic (there is none). -->
- **Invariants**: none adjacent (S1 holds: styles stay inside `components/apps/aoe4-build-order/`)
- **LOC estimate**: about 120 lines, none of it business logic (two new CSS modules about 80 lines; class-name swaps in `build-input.tsx`, `workbench-tabs.tsx`, `build-text-editor.tsx`, `issue-list.tsx`, `step-timeline.tsx`, `compare-panel.tsx`, `chart-legend.tsx`, `results.tsx` about 40 lines; the spec is not counted)
- **Depends on**: SGS-066, SGS-067, SGS-068, SGS-069, SGS-070, SGS-071, SGS-072
- **On merge**: none
- **Source**: M4.13; design/M4.md C9 (rows are cards under 768 px), C10 (`step-timeline-scroll`), C11 (`compare-scroll`), Behavior rules "Step table" row "narrow layout" (`document.documentElement.scrollWidth` <= 390 on both tabs), "Left to tickets" (CSS for tabs, sticky bar, gutter, cards, highlight; test ids and the 390 px rule must hold); plan M4-20261102 outline Q

## Context

SGS-066 to SGS-072 rebuild the page as a two-tab workbench and each styles its own part with Bootstrap classes or a
local choice, none of them checking a phone-width screen. SGS-068 makes step rows cards under 768 px and SGS-069 adds
the `step-timeline-scroll` and `compare-scroll` wrappers; this ticket is the one that guarantees the whole page, on
both tabs with a result and a pin, never scrolls sideways at 390 px, and puts the workbench styling in CSS modules.

## Scope

All paths are relative to the repo root and under `components/apps/aoe4-build-order/` unless stated. Names are those
of `design/M4.md` and the seven tickets above; this ticket adds no test id, prop, export or behavior.

**1. CSS modules for the workbench components.** `step-table.module.css` already exists (SGS-068) and stays. Add:
- `workbench.module.css`: the sticky run bar (`run-bar`: wraps its controls onto more than one row under 768 px, the
  select and number input take the full row width, `position: sticky; top: 0` unchanged), the tab bar, the editor
  and gutter (`min-width: 0` on the editor flex child so the textarea's own sideways scroll holds, see item 2), the issue
  list (`overflow-wrap: anywhere` so a 3000-character unbroken token quoted in a message cannot widen the page), the
  `results-stale` and `pinned-label` lines.
- `results.module.css`: the timeline and compare scroll boxes (item 3), the chart legends (`chart-series-legend`,
  `chart-marker-legend`: items wrap to further lines), the chart wrapper (`min-width: 0`), the simulation message lists.
- (respec 1) Only the narrow-layout width and layout rules move into these modules, plus this ticket's own new rules:
  of the rules SGS-066, SGS-067, SGS-069, SGS-070, SGS-071 and SGS-072 put in Bootstrap layout classes or inline
  `style=`, move the ones the narrow layout needs. Plain Bootstrap look-and-feel classes (`btn`, `alert`,
  `form-select`, `table`, `text-muted`) and layout classes that already work at 390 px stay where they are. The 768 px
  card breakpoint (C9) stays. Do not move the rest of the workbench styling.
  Combine class names with `classnames` (`cn`), as the rest of the repo does.
- Do not rename or remove any `data-testid`, `id`, `aria-*` or `data-*` attribute.

**2. No horizontal page scroll at 390 px (the rule).** At a 390x844 viewport, on the Build tab in text view, the Build
tab in table view, and the Results tab with a result and a pinned run, `document.documentElement.scrollWidth` is at
most 390. Find each offender in the browser and fix it in the modules above; the known candidates are the run bar
controls, the gutter plus textarea row (the textarea keeps `wrap="off"` and scrolls sideways inside itself only), the
`start` preview and step cards, the issue and message text, the chart and its two legends, the pinned label and
stale notice, and the page `container` padding. Do not set `overflow-x: hidden` on `html`, `body`, `main` or the page
`section`: that hides the overflow from the check instead of removing it.

**3. Tables scroll in their own boxes.** `step-timeline-scroll` and `compare-scroll` (SGS-069) get `overflow-x: auto`
from `results.module.css`, and the table inside each gets `min-width: 30rem` so that at 390 px the table is wider than
its box and the box, not the page, scrolls. At 768 px and above the tables look as they do now (30rem is narrower than
the page container there). Remove the `table-responsive` class if SGS-069 left it on a wrapper, so there is one scroll
box per table.

**4. Cards.** Verify, do not redo, SGS-068's card layout: at 390 px each `step-row` and `step-start-row` stacks its
labelled fields (the start card's `start-field-rally` and first `start-villagers-count` included) and every control stays inside the page width. Fix any overflow that breaks the rule in item 2 in
`step-table.module.css`.

**5. Playwright check (respec 1: this spec is the only whole-page 390 px `scrollWidth` test; SGS-074 does not repeat it).** New `acceptance/aoe4-narrow-layout.spec.ts`, using `openPage`, `runSimulation` and `runRejected` (SGS-059, covered by the dependencies) from
`acceptance/helpers.ts` and `test.use({ viewport: { width: 390, height: 844 } })`:
- Build tab, text view (the default build): scrollWidth <= 390.
- Choose the knight + longbow prebuilt (the longest text) by label with `build-order-select`, then Build tab, table
  view (`editor-view-table`): scrollWidth <= 390.
- Run (200), then `pin-run`, run again at another `duration-seconds`, click `tab-results`, and on the Results tab: scrollWidth <= 390
  with `chart-series-legend`, `chart-marker-legend`, `step-timeline-scroll` and `compare-scroll` all visible.
- `step-timeline-scroll` and `compare-scroll` each have computed `overflow-x` of `auto` and `scrollWidth >
  clientWidth` at 390 px (they scroll, the page does not); at a 1280x720 viewport both have `scrollWidth <=
  clientWidth`.
- Long issue message: fill the text with `start -> sheep` then `at 8 vils ${'a'.repeat(3000)}` (the design's invalid paste with the 3000-character token in place of `fly`; under the 20000 cap, so the parser quotes the token in a `syntax` issue). The text is rejected client side, so no POST is sent: use `runRejected(page)` (not `runSimulation`, which would time out), assert one `build-order-issue` is visible and its text contains `'a'.repeat(3000)`, then scrollWidth <= 390 on the Build tab. If the parser does not quote the token, the implementer picks the input that does and says so.

**6. Docs.** `docs/aoe4-build-order.md` section "Page" (line 762 on main): add one short paragraph for the narrow
layout (under 768 px rows are cards, the run bar wraps, the timeline and compare tables scroll in their own boxes,
the page does not scroll sideways at 390 px). Grep `docs/` and both READMEs for a statement that it is desktop-only.

**Test rule:** this ticket changes only styling, so no existing test's expected value changes. If an existing
Playwright spec depends on a Bootstrap class this ticket removes, the implementer repoints it to the test id and lists the edit.

**Out of scope:** a second whole-page 390 px test elsewhere (SGS-074 has none); any change to a test id, prop, component API, simulation or text; the step table's card design
itself (SGS-068); the scroll wrappers' creation (SGS-069); other pages (`/`, combat simulator, StarCraft helper); a
mobile navigation or tab redesign; widths other than 390 px and the 768 px breakpoint; the broader Playwright
coverage audit (M4.14).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] At 390x844, `document.documentElement.scrollWidth <= 390` on the Build tab text view, the Build tab table view (knight + longbow build), and the Results tab with a result and a pinned run (new spec, three tests).
- [ ] At 390 px `step-timeline-scroll` and `compare-scroll` have `overflow-x: auto` and `scrollWidth > clientWidth`; at 1280 px both have `scrollWidth <= clientWidth`.
- [ ] A rejected paste whose `build-order-issue` text contains a 3000-character unbroken token leaves `scrollWidth <= 390` on the Build tab.
- [ ] `ls components/apps/aoe4-build-order/*.module.css` lists `step-table.module.css`, `workbench.module.css` and `results.module.css` (today it lists none).
- [ ] `git grep -nE "overflow-x: ?hidden" -- components pages styles` prints nothing for `html`, `body`, `main` or the page section (review check).
- [ ] No `data-testid`, `id`, `aria-*` or `data-*` attribute is added, removed or renamed (`git diff origin/main -- components pages | grep -E "^[-+].*(data-testid|data-[a-z-]+=|aria-[a-z]+=|id=)"` shows only lines that moved with their element).
- [ ] The full existing acceptance and unit suites pass; every existing test edited is listed in the PR.
- [ ] `docs/aoe4-build-order.md` describes the narrow layout.
- [ ] (respec 1) Mutation, run in a throwaway worktree after the dependencies are merged (`git worktree add --detach "$FACTORY_DIR/worktrees/ticket-SGS-073"`): add `min-width: 600px` to a workbench box (the run bar or the step-card container) and the new spec's 390 px test fails; remove the worktree.
- [ ] (respec 1) Only narrow-layout rules moved to the modules; the PR lists what moved and what stayed in Bootstrap classes.
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-02 (second pass: spec gate 1)

- Underspecified: the 3000-character test would have waited for a POST that never comes and might not reach the message wrap; 20001 vs 3000 disagreed; the Results test did not switch tab.
- Changed: the test uses `runRejected`, a named input and an assertion that the issue text contains the run; figures are 3000; `tab-results` is clicked; the start card controls are named.
- Stands: all other scope and criteria.

## Re-spec 2026-11-02

- Underspecified: how much CSS moves, the 30rem and 768 px values, and who owns 390 px tests (designer pass 4, Q8 and Q10).
- Changed: 30rem and 768 px confirmed; only narrow-layout rules move to modules; this spec owns every whole-page 390 px test and the overflow mutation; both open questions removed.
- Stands: all other scope, the module split and the spec content.
