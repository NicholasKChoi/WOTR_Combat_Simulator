# SGS-199 spec gate 2

Ticket: tickets/SGS-199-page-help-modal.md (re-spec 1). Read at origin/main; Depends-on tickets (SGS-193, SGS-197, SGS-198) read as ticket files. No branch or scratch checkout used.

**Verdict: NEEDS_SPEC**

Gate-1 gaps 1 to 4 are closed: the outside-modal legend rule, the `help-section` selector, the feature table and no-caveat regex, the numeric bounds, `.warn` reuse, and the rect-based backdrop rule are all present and sound. Two new gaps remain.

## Gaps

1. **Scope, existing-test rule - a page-wide `h3` query in `aoe4-split-scroll.spec.ts` breaks.**
   - The same test the ticket cites ("the headings share a size and lead their panels", `aoe4-split-scroll.spec.ts:161`) also reads `charts: [...new Set([...document.querySelectorAll('h3')].map(size))]` (line 172) and asserts `expect(sizes.charts).toHaveLength(1)` (line 176).
   - The ticket requires seven `h3` section headings inside `help-modal`, which is always in the DOM. Unless they happen to compute the chart headings' font size, the set gets a second entry and the test fails. The ticket's collision rule covers only `getByText` counts, and the criterion "every existing page-wide `getByText` count keeps its expected value" does not cover a DOM query.
   - An implementer would either restyle the modal headings to match chart headings (a guess driven by an unrelated test) or edit the test unprompted.
   - Fix: widen the Scope rule from "page-wide `getByText` count" to "any page-wide locator or `querySelectorAll` count, set or size comparison (`getByText`, `locator('h3')`, `querySelectorAll`); the implementer searches `acceptance/` for them and either scopes that locator to exclude `help-modal` without changing its expected value, or picks markup that none matches". Name the `h3` font-size set in `aoe4-split-scroll.spec.ts` as an example found at base. Widen the "Existing tests" criterion the same way ("every existing page-wide count or set keeps its expected value"). The section headings are `h3` by the ticket's own rule, so scoping the query is the natural fix.

2. **Criterion "Section 5" - the drag-handle and caret terms cannot match as defined.**
   - At base the names are `Reorder <title> chart` (`chart-header.tsx:36`) and `Collapse <title> chart` or `Expand <title> chart` (`collapse-caret.tsx`, called with `name={`${title} chart`}`). "Accessible name with the chart title removed" literally gives `Reorder  chart` (two spaces) and `Collapse  chart`, which a section's `textContent` will not contain, and the caret term flips between Collapse and Expand with state.
   - An implementer guesses whether to normalize whitespace or write the double space.
   - Fix: state the rule as "remove the title together with one adjacent space (`Reorder chart`, `Collapse chart`), asserted first by comparing the full name to `<verb> <title> chart`". For the caret, say the spec reads the verb from the live state and the section needs the word `collapse` or `expand` for the state seen. Alternatively, use whitespace-normalised, case-insensitive comparison for every row and say so.

## Notes (non-blocking)

- Q133 (open, on SGS-193) asks whether a waiting step's text keeps its already-counted entry. SGS-199 asserts only the `still waiting for` tail and the section text, which hold under either answer, so Q133 does not block this ticket. Dependency ordering still applies.
- The series legend heading is `Series` and the marker heading is `Markers` (`chart-legend.tsx`). The rows for them hold trivially, because the section text will contain `series` and `markers` in ordinary prose; fine, they cannot fail for a real reason but cost nothing.
- Names verified at base: `help` ticket names `chart-series-legend`, `chart-marker-legend`, `chart-pinned-legend`, `chart-drag-handle`, `chart-collapse`, `step-annotation.module.css` `.warn` plus `tbody > tr > td.warn`, `annotationToneClass`, `MIN_SUPPORTED_VIEWPORT`, `WIDE_VIEWPORT`, `openPage`, `waitForRun`, `plotPoint`, `readLayout`. The existing legend assertions listed in Scope all exist (`build-text-editor.tsx:70`, `step-table.tsx:313`, `step-annotation.test.ts:157` and `:179`, and the four acceptance specs). Zoom and upgrade-dot names match the SGS-197 and SGS-198 tickets.
- The `:not([data-testid="help-modal"] *)` selector is valid in Chromium.
- Risk, Diagrams, On merge, Invariants, Unverified assumptions, docs-deferred-to-SGS-200, and size (about 120 LOC) all hold. No overlap with other open tickets.
