# SGS-068 review 2

Verdict: **APPROVE**

Reviewed: tip f44688f3708cea0603a8fb37fcd4fee142ff1ef5. This was a full gate run because review bounced the
previous tip. Base: the old sgs-059 tip 41e648d (the branch is stacked on it and exists only locally). I read the
rework delta `git diff 63cdd04..f44688f` (3 files) line by line. I re-checked the rest of `41e648d..f44688f` against
review 1: nothing outside the 3 rework files changed. Node 24.22.2. Worktree:
`worktrees/review-sgs-068-2`, removed after the review.

## Blocking findings

None.

## Rework 1 fixes

1. **Fields stack one per line under 768 px.** `step-table.tsx:80` `Labeled` is now
   `className="d-flex d-md-inline-flex align-items-center gap-1 me-2 mb-1"`. The dead `.field` rule is gone from
   `step-table.module.css`, and `git grep styles.field` prints nothing. I measured it with a throwaway Playwright
   probe (deleted afterwards). The probe loaded the FORMS build plus `start 3 sheep 1 wood -> sheep`, opened every
   `step-more`, and read label tops per row:
   - At 600, 700 and 767 px, every label computes to `display: flex`. All 7 rows (start row included) have 0 labels
     sharing a y. For example, at 700 px the build row reads Time (s)@839, Building@927, Builders@966, From@1005,
     Then@1044, Walk time (s)@1083, all at x=122. Review 1 had seen Builders and From on one line here.
   - At 768 and 1280 px, labels compute to `inline-flex` and share lines as before. At 1280 px the produce row
     has Building, Building # and Unit on y=66.
   - The 700 px screenshot shows cards with one field per line. The start-row pairs each sit on their own line.
2. **The new test is a real check.** "labelled fields share a line from 768 px and stack one per line below it"
   (`acceptance/aoe4-step-table.spec.ts:486`) catches both of these mutations:
   - M1: the label class put back to `d-inline-flex ...`. The test fails at 700 px (`Expected: 6, Received: 4`).
   - M2: the label class set to `d-flex` with no md variant. The test fails at 1280 px (`Expected: < 6, Received: 6`).
   I restored both with `git checkout`, and the tree was clean afterwards.
3. **The start-row layout test is stable.** It now reads positions in a single `page.evaluate` per pair, and each
   width's comparisons sit inside `expect(async () => ...).toPass()`. I ran
   `ACCEPTANCE_PORT=3941 npx playwright test acceptance/aoe4-step-table.spec.ts --repeat-each=10` while
   `acceptance/aoe4-build-order.spec.ts --repeat-each=3` ran in parallel from a second worktree on port 3942 (86 of
   its tests ran during the window). Result: **200 passed, 0 failed, 0 flaky** (57.4 s). Review 1 had 3 failures in 4
   runs.
4. **`cn(...)` is used.** `step-table.tsx:1` imports `cn from 'classnames'`, and `:302` uses
   `cn(styles.table, 'table table-sm align-middle')`. The label className is now a plain string literal and needs no
   `cn`, which matches siblings that use plain strings for static classes.
5. **No other change.** The diff touches only the spec, the CSS module and the two `step-table.tsx` lines.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | No raw field names; FIELD_LABELS equals C9; greps empty | pass | Unchanged since review 1; spec and unit tests pass; greps print nothing |
| 2 | Villager option shows the data name; unknown keeps `<id> (unknown)` | pass | Unchanged; tests pass |
| 3 | Collapsed rows show primary fields only; toggle | pass | Unchanged; tests pass |
| 4 | Expansion defaults, reset and collapse on action change | pass | Unchanged; tests pass |
| 5 | Icon buttons with aria-labels; disabled rules; grep empty | pass | Unchanged; tests pass |
| 6 | Start row edits | pass | Unchanged; tests pass |
| 7 | `start-customize` | pass | Unchanged; tests pass |
| 8 | Node select excludes used nodes; add; disabled when all used | pass | Unchanged; tests pass |
| 9 | No sum hint | pass | Unchanged; tests pass |
| 10 | `step-row` count equals step count | pass | Unchanged; tests pass |
| 11 | 390 px stacked, 1280 px side by side, edit at 390 rewrites text, `data-step` at both widths | pass | Stable test (200/200 under load); the probe confirms stacking at 600-767 px too |
| 12 | No post to simulate; existing edit tests unchanged | pass | The rework edits only the new layout test and adds one test |
| 13 | Docs grep empty | pass | Empty. The added sentence ("is a card with its fields stacked") now holds, measured above |
| 14 | tsc, lint:dup, npm test, npm run acceptance (Node 24) | pass | tsc clean; lint:dup 0 clones (81 files); `npm test` 41 files, 1268 passed, 8 skipped; `npx next build` ok; `npm run acceptance` 626 passed |
| 15 | No invariant regressions | pass | See below |

I ticked all 15 criteria and the four Rework 1 boxes in the ticket.

### Invariants touched

- S1: holds. The one new import is `classnames`, which the repo already uses.
- S3: holds. Nothing changed since review 1 (start counts are checked on Run by the schema and the route).
- A1-A3: not touched.

## Lint

`npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones.

## Bot reconciliation

`reviewBot.cli` and `reviewBot.rulesFile` are both empty, so no bot ran.

## Non-blocking notes

1. `acceptance/aoe4-step-table.spec.ts:447`: the `tops` helper takes `page2: Page` even though `page` is in scope.
   Dropping the parameter would read more cleanly.
2. Start-row pairs (`step-table.tsx:256`) keep `d-inline-flex` at every width. Each pair is a count, node and delete
   group with no label, so the "one labelled field per line" rule does not cover it. At 600-767 px the pairs still
   land one per line (screenshot). "Add villagers" sits beside the last pair.
3. The 1280 px half of the new test only asserts that some labels share a line. That is enough to catch a lost md
   variant (M2), but it does not pin the full desktop layout.
4. Review 1's notes 1 to 7 still apply unchanged. None of them blocks.

## Coverage

Files reviewed: `components/apps/aoe4-build-order/step-table.tsx`, `step-table.module.css`,
`acceptance/aoe4-step-table.spec.ts` (rework delta, in full). Review 1 covered the other files in the branch diff, and
the rework does not change them.

REPO.md checklist:
- "Every diff": `next build` passed, and I loaded the page through Playwright at 600, 700, 767, 768 and 1280 px with
  screenshots.
- "AoE4 build order": no lib helper is copied and no engine rule changed. Charts are untouched, so the 1280 px chart
  check does not apply.

Not reviewed: the Vercel preview, because the branch is not pushed.

All processes I started (next dev on 3941 and 3942, Playwright) are stopped. The load worktree is removed.
