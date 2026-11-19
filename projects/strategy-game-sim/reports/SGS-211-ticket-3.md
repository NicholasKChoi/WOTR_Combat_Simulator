# SGS-211 ticket (report 3): re-spec 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-211-repeat-paste-text-and-table-field.md
Base read: origin/main d80751be. SGS-208 and SGS-210 read from their current (re-specced) ticket files; names used (`REPEATABLE_ACTIONS` from `repeat.ts`, `OPTIONAL_STEP_FIELDS.repeat`, `FIELD_LABELS.repeat`, `step-copies`, `step-copy-list`, `step-copy`, `data-copy`, `Each copy`, `sourceSpan`) match them.

## Summary

SGS-211 "Repeat in the paste text (xN) and the step table Repeat field, with the page spec", component aoe4-build-order, ~70 LOC business logic, risk standard, depends on SGS-208 and SGS-210. Covers the trailing `xN` grammar and printing, the Repeat table field and `changeAction` rule, the saved-build round trip, docs, and a new page spec that also carries the browser check SGS-210 relies on (hovering a repeated row or its gutter line shades one span covering every started copy; kept unchanged).

## Gaps folded in (spec-gate 2)

1. "after a reload" dropped from the copy-list case. The page starts `text` from `builds[0]` and persists no editor text, so nothing to reload into. "Closed on first render" kept.
2. Table-field criterion: the page spec now has a case for each of the four: field shown on build and move rows only (produce, research, rally, pause rows with More open show none); typing letters leaves the text line unchanged; `0` gives a `build-order-issue` with `data-code="out-of-range"` and the step's `data-line` (the page's `IssueList` renders under both views, `pages/apps/aoe4-build-order.tsx`); a pasted `xN` row's `step-field-repeat` is visible before `step-more` is pressed. Verified `NumberControl` is `type="text"`, so letters can be typed.
3. Round-trip test row now names `lib/aoe4-build-order/saved-builds.test.ts` (`checkSaveBuildRequest` describe, next to the paste round-trip cases); rule lives in `saved-builds.ts`.

## Non-blocking notes

- Action change closing the row: kept the existing rule (UI doc "An edit that changes a row's action closes that row", `step-table.tsx` `open.map((was, i) => i !== index && was)`). Scope states build-to-move keeps Repeat behind a closed More control; the UI doc edit says the action change keeps Repeat and the closing rule stays unchanged.
- Docs bullet's grep for "carries only trigger and reaction" removed; Scope records that the base doc has no such statement.
- Copy-list count reworded: three items present, none visible until the list is opened.
- Other notes (optionalByRow subsets, verified names) needed no change.

Changed criteria tagged `(respec 1)`; `## Re-spec 1 - 2026-11-18` appended.

## Diagrams

None (single component, outside the core control loop).

## Lint

ticket-lint with `--graph` and `--spec` origin/main: no errors, no warnings (exit 0). Spec-gate self-check skipped: risk is standard, spec-gate runs on it.

## Open questions

none

## Overlap

None beyond the planned SGS-208 / SGS-210 split.
