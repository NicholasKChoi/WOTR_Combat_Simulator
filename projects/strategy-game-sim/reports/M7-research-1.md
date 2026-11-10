# M7.6 compact view: research

**Question**: With the timeline gone, should the compact annotated view be the Text tab (A), collapsed step-table rows (B), or both (C)?

## Facts
- The text editor is a plain `<textarea wrap="off">` beside a separate `<ol>` gutter, one `<li>` per line, same font and `line-height: 1.5` so rows align (components/apps/aoe4-build-order/build-text-editor.tsx:20-41, workbench.module.css:8-43). The gutter already carries per-line state (`data-error`). So a gutter annotation needs no overlay or mirror technique and no editor library.
- Text lines map to steps through `BuildOrderLines.steps[i]` = 1-based line of `order.steps[i]` (lib/aoe4-build-order/model.ts:171-175). `textToBuildOrder` returns `lines` on success and on a check failure (lib/aoe4-build-order/text-to-build.ts:7-18). Blank and comment lines have no step. A parse failure returns no `lines`, so annotations cannot be derived and must dim or disappear. This matches the M7.4 stale rule.
- `timelineRows(steps, text)` already builds per-step label, status, startedAt, completedAt, waitSeconds, blockedBy, longWait and flagged (step-timeline-rows.ts:14-30). It reparses the text itself, so the data is reusable for either option.
- Step-table rows are `<tr>` with trigger select, action select, ActionFields and move/delete buttons. Optional fields are open/closed per row via a `useState` `open[]` array, reset when the row count changes, with a "More options"/"Fewer options" toggle (step-table.tsx:195-223, 292-298, 312-345). There is no whole-row collapse today. A one-line summary would be new UI, and `parse-text.formatBuildStep` could supply its text.
- M7.6 text: "either the Text tab shows the same kind colour and times per line, or the table rows collapse to a one-line summary that keeps the annotations" (MILESTONES.md:169). M7.7 asks for no 390 px check, so a wide gutter is acceptable.
- Prior art (not fetched, so unverified): code editors show gutter and inline annotations such as blame, coverage and inline hints. Those are always a column or end-of-line decoration beside plain text, not text rewriting. I did not search AoE4 sites; I could not verify how they show per-step timings. Treat this as general knowledge only.

## Options
- **A. Annotate the Text tab** - add a second per-line column (or extend the existing gutter `<li>`) with a kind colour swatch and `start-finish`, plus waited and blocked-by as a title or an end-of-line column. Cost: small to medium. A new `lineAnnotations` map from `lines.steps` to timing rows, the gutter rendering, dimming when stale, and hover handlers on lines for M7.3. It stays compact, since one text line is one step. Tradeoff: the column sits beside an editable textarea, and long blocked-by text will not fit, so it needs truncation or a tooltip. Edits shift lines before the next run, so M7.4 staleness matters here. Rules out: nothing. Conflicts: none found.
- **B. Collapse table rows** - add a per-row collapsed state showing a one-line summary (kind colour, label, times, waited, blocked-by) and keep the existing expand for editing. Cost: medium. New collapse state and summary component beside the existing `open[]` logic, plus tests for the interplay with "More options". Tradeoff: the table is the heavy, editor-style view, so collapsed rows are still taller than text lines, and the owner already said the Text tab is the most compact view. Conflicts: none, but it adds a second expand concept to the table.
- **C. Both** - A, plus B as a later follow-up. Cost: sum of both. It satisfies "either/or" with more than the criterion needs. Only worth it if the owner uses the table as the main view.

## Recommendation
A. The owner named the Text tab as the most compact view, the gutter is already a per-line column aligned with the textarea, and `BuildOrderLines` gives the line-to-step mapping, so it is the cheapest route with no overlay. Put the kind colour and `start-finish` in the gutter column, and keep waited and blocked-by in a `title` or a truncated trailing column. Then note B as a possible backlog item for table-first users.

## Unknowns
- Whether the Text view and the step table can be visible at the same time or are alternate input modes. This decides whether the annotated Text tab is enough on its own. Settle it by reading build-input.tsx.
- How blank and comment lines should render in the annotation column (assumed empty).
- The width budget for the annotation column against the textarea. Settle it with a quick visual check.
- AoE4 site and overlay prior art was not researched or verified.

## Sources
- components/apps/aoe4-build-order/build-text-editor.tsx:12-41
- components/apps/aoe4-build-order/workbench.module.css:8-43
- components/apps/aoe4-build-order/step-table.tsx:195-223, 292-345
- components/apps/aoe4-build-order/step-timeline-rows.ts:14-30
- lib/aoe4-build-order/model.ts:171-175
- lib/aoe4-build-order/text-to-build.ts:7-18
- .claude/code-factory/projects/strategy-game-sim/MILESTONES.md:149-170
