# SGS-104 spec gate 4

**Verdict: READY**

Scope of this gate: Re-spec 3 (rule 6, rule 4's `WIDE_VIEWPORT`/`TABS_VIEWPORT` remedy, the Build-column
`overflow-x` rule, the `WIDE_VIEWPORT` export, the 1280 rect bounds, the wiring criterion fix). Checked against
the branch at bca1d06 (base 5b29e9e, which is still `origin/main`'s tip, so there is no rebase to do),
`docs/aoe4-build-order.md` at bca1d06, `design/M6.md` Layout and "Left to tickets", and
`reports/SGS-104-implementer-1.md`.

## Relaxed start-row criterion (rule 6, ticket lines 379-388; criterion lines 441-447)

- **Docs agree.** `docs/aoe4-build-order.md:922-923` (bca1d06) says only "Under 768 px each row, the start row
  included, is a card with its fields stacked". No sentence promises that the rally select and the villagers
  count share one line at 768 px and wider. The docs set no rule for the start row's inner layout at 768 px and
  wider beyond "not a card". The left-edge property is the observable form of that.
- **Design agrees.** `design/M6.md:730-732` leaves split column proportions to tickets. The Layout table
  (`design/M6.md:583-593`) says nothing about step-table row geometry. Rule 6 contradicts nothing there.
- **Testable, and it can fail.** The branch test (`acceptance/aoe4-step-table.spec.ts:470-514` at bca1d06)
  already runs at `WIDE_VIEWPORT` and reads both rects of each pair in one `page.evaluate` under `toPass`, which
  satisfies the repo lesson. Only line 496 (`Math.abs(rally.y - count.y) < 4`) has to become `count.x > rally.x`.
  The re-spec report records the mutation: widening the stacking query to 1999px made the new assertion fail
  (rally x 400, count x 281.5). The criterion's own "no assertion still requires one line" can be checked by
  reading the file.
- **Rule 6 is the only expected value that changes.** Rule 4 (lines 376-377) names it.

## Other Re-spec 3 items

- `.workbenchSplit > :first-child { overflow-x: auto }`: the Scope rule (lines 329-333) and the criterion (436-440)
  match the branch CSS. The break is observable: the `step-delete` and `step-add` tests time out when the rule is
  removed.
- `WIDE_VIEWPORT` export (line 345): it is on the branch in `acceptance/helpers.ts`.
- Rule 4 `TABS_VIEWPORT` branch (lines 374-376): it covers the "labelled fields share a line" move on the branch,
  with expected values unchanged.
- "split at 1280" (lines 428-435): top, left and right bounds only. These are consistent with the implementer's
  finding 2.
- Wiring criterion (423-427): it allows the one legitimate `min-width: 1200px` match in `use-split-layout.ts`.
  The old contradiction with Scope is gone.
- Invariants (S1, A3), Risk `standard` (no `criticalPaths` symbol is touched), On merge `none`, Open questions
  `none`, Docs scope: unchanged from gate 3 and still correct. The branch docs already state every Scope "Docs"
  item, including the Build-column scroll sentence (`docs/aoe4-build-order.md:867`). No timeline sentence still
  says 1200 px (lines 902 and 963 say 1800).

## Gaps

None.

## Notes (non-blocking)

1. Ticket line 377, "no spec is left failing or loosened", conflicts on a literal reading with rule 6, which
   loosens one assertion. The sentence just before it ("The only test whose expected value changes is the one in
   rule 6") resolves this, so an implementer will not guess. Next time, reword it as "no other spec is loosened".
   (ticket)
2. Criterion line 489-490, "in a file with a viewport pinned to `TABS_VIEWPORT`": rule 2 (line 362) asks for the
   narrowest scope. On the branch, `aoe4-build-order-run-errors.spec.ts` pins the whole describe, although only 5
   of its 9 tests assert on tabs. This is a question of review against rule 2, not a spec gap. The rework can
   pin those tests one by one, or the report can say why the describe is the narrowest workable scope. (ticket)
3. Criterion lines 486-487 ask the report to record whether "resize while hidden" passed before the layout
   change. Implementer report 1 says this was not run on the base. The rework should run that spec against
   5b29e9e (for example, in a detached throwaway worktree) and record the result. (ticket)
4. Rule 6 says the docs "promise" that the start row is a table row with its cells side by side at 768 px and
   wider. The doc states only the under-768 card rule, and the side-by-side reading is an inference from it. The
   inference is sound, and the criterion matches the code, so no edit is needed.

## Rework the implementer needs (no guessing required)

- Replace the start-row y check at `acceptance/aoe4-step-table.spec.ts:496` with the left-edge check.
- Optionally narrow the run-errors pin (note 2).
- Run the resize-while-hidden spec on the base (note 3).
- Rerun `npx tsc --noEmit`, `npm run lint:dup`, `npm test`, `npm run acceptance` and `npx next build`, and
  report the counts.
