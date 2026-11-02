# SGS-068 tech-lead 1

## Decision
No blockers. Opened one draft PR.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/77 (PR 77), base `main`, head `sgs-068-aoe4-step-table-polish` at af66e14fb13cb4c52db576d96efffcae26fc375c. Draft: true. No footer because it is a single PR.

The branch existed only locally before this run, so I pushed it with `git push -u`. I added no commits.

## Merge risk
**low** - UI-only and a revert fully undoes it; it touches no API, schema or config and no critical-path symbol, and the new acceptance and unit tests pin the changed behavior.

## Review focus
- [`components/apps/aoe4-build-order/step-table.tsx:292-298`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/77/files#diff-3f755e736f2684ff64b018a83fdb50ad0a07bc94c2bad334214e01d2d3eab1feR292-R298) - which rows are open is tracked by row index and recomputed only when the row count changes. A move up or down, or a textarea edit that keeps the count, can leave a row that sets `rally` or `count` collapsed with its value hidden (the text still holds it). Check that this is acceptable or whether moves should carry the open flag.

## What I reviewed
- Range: origin/main f11e0c5 (merge-base) to af66e14, 4 commits, all authored by choinickolas@gmail.com.
- Files: `components/apps/aoe4-build-order/step-table.tsx` (+124/-32), `step-table-model.ts` (+106/-1), `step-table.module.css` (+24, new), `docs/aoe4-build-order.md` (+9/-3), `step-table-model.test.ts` (+147/-2, where the 2 removed lines are import lines), `acceptance/aoe4-step-table.spec.ts` (+302/-0, 11 new tests).
- Reviewable LoC: +254/-33, excluding tests and docs.
- Checked against: INVARIANTS (S3, A1-A3 for the AoE4 paths), CONTEXT open questions (none), and the `criticalPaths` in REPO.md (none touched, no `lib/` change).
- Consumers: no code or test outside the step table depends on the old aria-labels `trigger`/`action` or on the Up/Down/Delete button text (git grep over acceptance, components and pages).

## Blocker checks
- Invariants: none violated. S3: the start counts are uncapped in the table, but Run checks them through the schema and the route, as it does for step numbers. A1: the new strings are UI labels, not game numbers. A2 and A3: the simulation is not touched.
- Irreversibility, schema, API, security, concurrency: none. The change is UI only, and a revert undoes it.
- Open questions: none were answered unilaterally. Both re-spec answers came from the designer and are recorded in the ticket.

## Non-blocking notes
- The open state of each row is keyed by index and recomputed only when the row count changes (step-table.tsx:292-298). After a move up or down, or a textarea edit that keeps the count, a row that sets an optional field can stay collapsed with that value hidden. This is listed as the PR's review focus. A possible follow-up is to carry the open flag through `moveStep`.
- step-table.tsx:294-297 calls `setExpansion` during render. This is React's documented "adjust state when a prop changes" pattern, so it is correct, but it is subtle.
- `Customize start` stores `catalog.defaultStart` by reference (step-table.tsx, StartRow). Every start edit rebuilds the object through `withStart`, so nothing mutates the catalog.
