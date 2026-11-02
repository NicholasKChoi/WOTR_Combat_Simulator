# SGS-068 review 1

Verdict: **REQUEST CHANGES**

Reviewed: `git diff 41e648d..63cdd045e6f4d99f350a6f08274000784ee1cb8c` (one commit, 6 files). The branch exists only
locally (it is not on origin), so the review worktree was made from the local SHA. Stacked on SGS-059 tip 41e648d
(the old base). Node 24.22.2, ACCEPTANCE_PORT=3891.

## Blocking findings

1. `components/apps/aoe4-build-order/step-table.module.css:26-28` with `step-table.tsx:79` - contract - The narrow
   rule `.field { display: flex }` never applies. `Labeled` also carries Bootstrap's `d-inline-flex`, which is
   `display: inline-flex !important` (the computed display measured under 768 px is `inline-flex`). At 390 px the
   fields happen to wrap one per line, but between about 600 and 767 px two labelled fields share a line. Measured
   with the row opened at 700 px: `Builders`@(122,362) and `From`@(294,362); `Then`@(122,401) and
   `Walk time (s)`@(332,401); `Building #` and `Unit`, and `Count` and `Rally to`, at the same y. The same holds at
   600 and 767 px. The ticket scope says "Under 768 px each row ... renders as a card: its cells stack and each
   labelled field sits on its own line". The doc sentence this diff adds ("Under 768 px each row, the start row
   included, is a card with its fields stacked", `docs/aoe4-build-order.md` Page section) is contradicted by the
   code. Direction: give the label `cn(styles.field, 'd-flex d-md-inline-flex align-items-center gap-1 me-2 mb-1')`
   (Bootstrap's md breakpoint is 768 px) and delete the dead `.field` rule, or move the display into the module
   with no utility class. Add a 700 px assertion that two fields of one row have different y.

2. `acceptance/aoe4-step-table.spec.ts:440-475` - test - "the start row sits above the step rows at both widths and
   stacks under 768 px" is flaky. It compares `boundingBox()` reads taken one after another while the page above
   the table is still shifting after `fill`. On a first read I saw rally y=907 and count y=856; 500 ms later both
   were about 814. Results: the full suite gave 1 failed and 624 passed (this test), `--repeat-each=4` failed 3 of
   4 with `Received: 54` at line 458, and it failed once more in an unrelated mutation run. The implementer's
   single run passed. That makes the "`npm run acceptance` passes" criterion unreliable. Direction: read the boxes
   that are compared in one `evaluate`, or wrap each geometric comparison in `expect(async () => {...}).toPass()`,
   at both widths.

3. `components/apps/aoe4-build-order/step-table.tsx:79,301` - convention - class names are joined with template
   literals (`` `${styles.field} d-inline-flex ...` ``, `` `${styles.table} table table-sm align-middle` ``).
   ARCHITECTURE.md:14 says "Combine class names with `classnames` (`cn`)", and every sibling does so:
   `pages/apps/aoe4-build-order.tsx:103` and `components/apps/combat-simulator/army.js`. Direction: `import cn from
   'classnames'` and use `cn(...)`. This overlaps finding 1.

## Spec gaps

None that block. See notes 1 and 2 for two design wordings that the code meets only in part.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | No raw field names; FIELD_LABELS equals C9; greps empty | pass | New spec test with every `step-more` opened; unit `it.each` over all 19 C9 pairs plus a length of 19; both greps print nothing |
| 2 | Villager option shows the data name, value `villager`; unknown keeps `<id> (unknown)` | pass | Spec test (asserts the text is not `villager`); unit `optionLabel('villager') === catalog.names.villager`; the existing unknown test is unchanged and passes |
| 3 | Collapsed produce row shows producer and unit only; toggles; same for each action | pass | Spec test for produce, including `aria-expanded` false/true and a second click. Other actions use the generic filter over the imported `OPTIONAL_STEP_FIELDS`. A probe confirmed build at 1280 shows Building and From and hides builders, then and walkSeconds |
| 4 | Loads expanded when set; clearing keeps it open; add resets; action change collapses | pass | Spec test. Mutation M2 (no collapse on action change) fails that test. Mutation M1 (no reset on row-count change) fails the existing "number fields" test, because the default build's flags leak into the new rows. The new test's add-row assertions alone do not tell reset apart from no reset (see note 6) |
| 5 | Icon buttons with aria-labels; disabled rules; Up/Down/Delete grep empty | pass | Spec test by role name; existing move/delete tests unchanged and passing; grep prints nothing |
| 6 | Start row first; values, count edit, rally `(none)`, delete both pairs plus clearing rally drops the line | pass | Spec test at line 358 |
| 7 | `start-customize` inserts `catalog.defaultStart` and hides | pass | Spec test compares with `formatBuildOrderText` over `catalog.defaultStart` |
| 8 | Node select hides used nodes; add appends the first unused node with count 1; disabled when all used | pass | Spec test plus unit tests. Mutation M3 (offer all nodes) fails the start-row test. See note 1 on "at the end" |
| 9 | No sum hint | pass | Spec test (`not.toContainText(/sum\|total/i)` after every node is added) |
| 10 | `step-row` count equals step count; start row is not a `step-row` | pass | Spec tests (count 1 with a start line; default-build count) |
| 11 | 390 px stacked, 1280 px side by side; edit at 390 rewrites text; `data-step` at both widths | fail | Behavior holds once layout settles (probe), but the test is flaky (finding 2). Fields are not one per line from 600 to 767 px (finding 1) |
| 12 | No post to simulate; existing edit tests pass unchanged; edited tests listed | pass | The acceptance diff only adds tests and imports; no existing test was edited |
| 13 | Docs grep empty | pass | `git grep -nE "not editable there\|\(set or not\)" -- docs` prints nothing. The new sentence is contradicted, see finding 1 |
| 14 | tsc, lint:dup, npm test, npm run acceptance (Node 24) | fail | tsc clean; lint:dup 0 clones; `npm test` 41 files, 1268 passed, 8 skipped; `next build` succeeds; `npm run acceptance` 624 passed and 1 failed (finding 2) |
| 15 | No invariant regressions | pass | See below |

I ticked nothing in the ticket (verdict is not APPROVE).

### Invariants touched

- S1: holds. The new imports are `lib/aoe4-build-order/*` and the component's own CSS module.
- S3: holds. The start counts are uncapped in the table, as the ticket allows. On Run they are checked by the
  schema (`startVillagers: bound(0, 200)`, `schema.ts:43`) and by the route.
- A1-A3: not touched (no simulation code). `FIELD_LABELS` and the option labels are UI text, not game numbers.

### Manager's question: the start row against the grammar and the checker

- Removing the `villagers` key when the last pair goes is the only option. `parseStart` (`parse-text.ts:241-258`)
  rejects a bare `start`, and `formatStart` (`parse-text.ts:332-338`) writes no line for an empty start. So
  `withStart` dropping `start` when it has neither pairs nor rally matches the grammar. `start -> sheep` (rally
  only, no villagers) round-trips and passes the checker: there is no sum check without villagers, and the rally
  is present.
- Dropping `start` gives an English build that the checker rejects:
  `start: no start.rally while starting building capital-town-center produces villagers` (`schema.ts:480`;
  `docs/aoe4-build-order.md:147` says an English order needs `start.rally`). The user can fix it in the table,
  because `start-customize` reappears and inserts the valid default. The only way to reach this state is to clear
  the rally first, and that alone already triggers the same issue. Not blocking. The design's "drops `start`
  (civ default)" wording is misleading for English; see note 2.
- Rally `(none)` with pairs present gives the same rally issue. It can be fixed in the table by picking a rally.
- A pair sum that differs from the total can be fixed in the table by editing the counts.

### Implementer's choices

- Trigger and action option wording ("Right away", "At time", "At villager count", "When node runs out", "When
  bank reaches"; "Produce", "Pause", "Build", "Research", "Move villagers", "Set rally"): the design leaves this to
  tickets, and the option values are unchanged. Fine.
- `aria-label` "Trigger" and "Action" (capitalised): no spec in `acceptance/` and no local `sgs-*` branch refers to
  the lowercase names (grep). C9 does not name them. Fine.
- `vertical-align: top` at every width: needed for the 1280 px same-y criterion, because `align-middle` would put
  the trigger and action selects at different y when the cells differ in height. It is a small departure from
  "looks as today" that the criterion forces. Fine.
- Expansion resets only on a row-count change: matches the design rule ("per row index and resets when the row
  count changes"). Fine.

## Bot reconciliation

`reviewBot.cli` is empty, and `reviewBot.rulesFile` is empty. No bot ran.

## Mutations (my own)

- M1, `if (expansion.rows !== steps.length)` changed to `if (false)`: the existing "number fields" test fails. Caught.
- M2, `setOpen(index, false)` on action change removed: "optional fields sit behind step-more ..." fails. Caught.
- M3, node select offers every node: "the first row edits start ..." fails. Caught.

Each was restored with `git checkout`, and the tree was clean afterwards.

## Non-blocking notes

1. "Adds the pair ... at the end": `addStartPair` appends to the record, but the page round-trips through
   `formatBuildOrderText`, which writes pairs in `NODE_REFS` order. When the first unused node sorts before the
   existing ones (for example `start 6 wood -> wood`, then Add gives sheep), the new pair shows first. The default
   start (sheep only) does not hit this. The design's two rules (edits go through the formatter; add at the end)
   conflict here. The designer may want to restate it as "in formatter order".
2. The design says "An order with neither villagers nor rally drops `start` (civ default)". For English that build
   is rejected on Run (the required `start.rally`), as described above. A design wording fix may be worth making;
   the code is fine.
3. Expansion flags stay with the row index when a row is moved, so a row with a set optional field can move into
   a collapsed slot and hide its values. Replacing the text with a build of the same length keeps the old flags.
   Both match the spec ("per row index").
4. `optionLabel` shows `food` as the raw id while `wood`, `gold` and `stone` read Wood, Gold and Stone (the bank
   resource select). This matches the spec, but it looks inconsistent.
5. The start pair's count input and node select have no label or accessible name. `key={node}` remounts the pair
   when its node changes, so focus is lost after choosing a node. C9 does not require either.
6. The new step-more test's add-row assertions cannot tell reset apart from no reset: row 1 is expanded both
   ways, and the new row defaults to false either way. The reset rule is caught incidentally by the existing
   "number fields" test (M1). Collapsing row 1 by hand before adding would make the new test discriminate.
7. "the villager option reads the data name" asserts that the text is not `villager` and is not empty, rather than
   equal to `catalog.names.villager`. The unit test covers equality.

## Coverage

Files reviewed: all six in the diff (`step-table.tsx`, `step-table-model.ts`, `step-table.module.css`,
`step-table-model.test.ts`, `acceptance/aoe4-step-table.spec.ts`, `docs/aoe4-build-order.md`).

Also read for context: `schema.ts` start rules and catalog, `parse-text.ts` start grammar and formatter,
ARCHITECTURE.md, design M4 C9, the step-table rules, and "Left to tickets".

Checks run:
- REPO.md review checklist: "Every diff" (`next build`; the page loaded through Playwright at 390, 600, 700, 767
  and 1280 px, with screenshots) and "AoE4 build order" (no lib helper copied: `OPTIONAL_STEP_FIELDS` is imported;
  no engine rule change; the timeline and charts are not touched, so the 1280 px chart check does not apply).
- The ticket's four greps.

Not reviewed: the Vercel preview, because the branch is not pushed.
