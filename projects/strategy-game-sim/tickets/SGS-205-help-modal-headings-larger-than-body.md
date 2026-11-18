# SGS-205: Make the help dialog's headings larger than its body text

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: Bootstrap's heading utility classes (`h4`, `h5`, `h6`) resolve to `1.5rem`, `1.25rem` and `1rem` in the Chromium acceptance run, with the root and body font size at 18px from `styles/global.css` so `1rem` equals the body size (a real computed-style check in the regression spec exercises it)
- **LOC estimate**: 5 (heading classes in `page-help.tsx`, a doc sentence if needed)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md "AoE4 help modal: the headings are smaller than the body text" (owner M11.8 check, 2026-11-17)

## Context

In the `How this page works` dialog the section headings do not read as headings: they look no larger than the paragraphs under them. Headings in the dialog must use the page's heading scale, so each is larger than the body text.

### Cause

`HelpSection` in `components/apps/aoe4-build-order/page-help.tsx` renders each section heading as `<h3 className="h6">`. Bootstrap's `.h6` is 1rem, the same size as the page body text (`styles/global.css` sets the root and body font size to 18px, so 1rem is 18px; `<p>` inherits the body size), so the h6 heading is at best equal to its paragraph and is not larger (the implementer measures the dialog's actual sizes; a dialog default could make the body larger still). The rest of the page sizes the same levels larger: the page's `h2` headings (`build-order-heading`, `results-heading` in `pages/apps/aoe4-build-order.tsx`) use `h4`, and the chart titles (`<h3>` in `chart-header.tsx`) use `h5`. Nothing tests a size: `page-help.test.ts` checks the heading tags and labelling only, and `acceptance/aoe4-help-modal.spec.ts` reads heading text but never a computed font size, so the undersized heading passed every gate. Same defect elsewhere: `chart-legend.tsx` uses `h6 mb-1` for its `Markers` and `Series` list headings, which are control labels on a chart, not section headings, and are left alone.

## Scope

- In `components/apps/aoe4-build-order/page-help.tsx`, give the section headings (`HelpSection`'s `h3`) a size from the page's heading scale that is larger than the body text, matching how the page sizes an `h3` section title (chart titles use `h5`). Keep the dialog title (`help-title`, an `h2` at the page's `h4`) larger than the section headings. Use the shared Bootstrap heading classes, not a new font-size rule in `page-help.module.css`. Heading tags, ids, `aria-labelledby` wiring, DOM and Tab order, and the dialog's text do not change.
- Confirm the measured sizes in Chromium (the regression spec does this) rather than trusting the class names: the paragraph text inside the dialog, each section heading, the dialog title, and a chart title on the same page (the `h3` that `ChartHeaderRow` in `chart-header.tsx` renders) must be measured with `getComputedStyle`. The page must have run so a chart is rendered behind the dialog when the chart title is measured.
- Docs: `docs/aoe4-build-order-ui.md` "Help dialog" does not state heading sizes; leave it unless the implementer finds a statement the change makes untrue.
- Tests: extend `acceptance/aoe4-help-modal.spec.ts` (the existing seven-section test is the natural place) with the regression below. `page-help.test.ts` checks markup only and keeps its assertions. No other test depends on the section heading class (searched `h6` in the AoE4 tests: only the chart-legend markup test pins `h6`, for the list headings, which stay).

**Out of scope:** the `Markers` and `Series` list headings in `chart-legend.tsx`; the dialog's body copy, layout, width or scrolling; heading sizes elsewhere on the page; adding new styles or tokens.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] With the dialog open in Chromium, every section heading's computed font size is strictly larger than the computed font size of the paragraph text in the same dialog, and the dialog title's computed font size is larger than every section heading's. A regression spec in `acceptance/aoe4-help-modal.spec.ts` asserts both and fails at the base, where the section headings equal the body size.
- [ ] (respec 1) With the dialog open in Chromium over a page that has run, every help section heading's computed font size equals the computed font size of a chart title (the `h3` in a chart header) on the same page. The regression spec in `acceptance/aoe4-help-modal.spec.ts` measures both and asserts equality; it fails at the base, where the section headings are smaller than the chart title, and fails for any section size other than the chart title's.
- [ ] Heading tags, ids, `aria-labelledby` links and the dialog's text are unchanged: `page-help.test.ts` and the rest of `aoe4-help-modal.spec.ts` keep their assertions.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-17

- Underspecified: the match with the chart-title size was a code-reading criterion (no new rule in `page-help.module.css`) with no test, so any size between the body and the title passed; the Unverified assumptions line called the body size 1rem without saying it is 18px.
- Changed: criterion 2 now has the regression spec measure a chart title's computed font size on the same page and assert each section heading equals it; the shared-Bootstrap-classes rule stays in Scope only; Context and Unverified assumptions state the 18px root and body size.
- No branch work exists yet; nothing to keep or discard.
