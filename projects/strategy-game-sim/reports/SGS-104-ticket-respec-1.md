# SGS-104 ticket re-spec 1 (Re-spec 3 on the ticket)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-104-split-layout.md
Input: reports/SGS-104-implementer-1.md (needs_spec), branch sgs-104-split-layout at bca1d06.

## Decision on the step-table start-row check

Settled by the docs, no owner gap. `docs/aoe4-build-order.md` promises only "Under 768 px each row, the start
row included, is a card with its fields stacked". It does not promise the rally select and the villagers
count share one line at 768 px and wider. `design/M6.md` "Left to tickets" leaves split column proportions to
the ticket. Widening the Build column cannot fix it either: the 1024 px tabs layout (960 px container, one
full-width panel) fails the old check too (30.9 px off per the implementer).

New rule 6: the wide half runs at `WIDE_VIEWPORT` and asserts the documented property, the start row is a
table row with its rally cell and villagers cell side by side: `start-villagers-count` left edge >
`start-field-rally` left edge. The step-row check and the 390 px half are unchanged.

Checked in a throwaway detached worktree at bca1d06 (removed afterwards):
- With the relaxed assertion, the test passes at 1800 (rally x 316, y 10.6; count x 489, y -34.3: the count cell
  is to the right, the rally select wraps under the Start label in its cell, which is why the old y check failed).
- Mutation: `step-table.module.css` stacking query `max-width: 767.98px` -> `1999px`, with the step-row expect
  disabled so only the start-row check runs: fails (rally x 400, count x 281.5). With the step-row expect on, the
  step-row check fails first (87.25 px).

## Folded-in implementer deviations (now in Scope / criteria)
- `.workbenchSplit > :first-child { overflow-x: auto }` in Scope (CSS) plus a criterion naming the break
  (Results' `simulation-warnings` intercepts `step-delete` clicks at 1280 without it).
- `WIDE_VIEWPORT = { width: 1800, height: 900 }` exported from `acceptance/helpers.ts`.
- Rule 4 now allows `WIDE_VIEWPORT` or `TABS_VIEWPORT` (covers "labelled fields share a line" at TABS_VIEWPORT,
  and the narrow-layout compare-table describe at 1800), expected values unchanged, each listed as a finding.
- Rule 3 allows the results-split spec's own 1800-wide `WIDE` constant and holds the 1799/1800 boundary case.
- "split at 1280" asserts top >= 0, top < innerHeight, left >= 0, right <= innerWidth; no bottom edge.
- Docs: a sentence that a Build panel wider than its column scrolls sideways inside it (already on the branch).
- Wiring criterion corrected: `min-width: 1200px` legitimately matches in `use-split-layout.ts`
  (`WORKBENCH_SPLIT_QUERY`); the old "no match" wording contradicted Scope. Verified on the branch: only that match.

## History
Renamed the two old-format headings to `Re-spec 1 - 2026-11-09` and `Re-spec 2 - 2026-11-09`; the focus
criterion tag became `(respec 1, respec 2)`; new tags are `(respec 3)`. Appended `Re-spec 3 - 2026-11-09`.
Lint: clean.

## Branch work that stands
Everything at bca1d06. The only change the implementer needs: replace the start-row y check in
`aoe4-step-table.spec.ts` with the left-edge check (rule 6), then rerun `npm run acceptance`.

## Open questions
none (no owner or designer gap).

## Overlap
None with other tickets.
