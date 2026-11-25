# SGS-215 ticket (9): Re-spec 3

- Ticket: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-215-production-past-population-cap.md`
- Mode: re-spec from `reports/SGS-215-review-8.md` (NEEDS_SPEC). Branch `sgs-215-production-past-population-cap` at ae92952, base main (origin/main 7d74800).

## Summary

SGS-215 "Let production continue past the population cap" (aoe4-build-order, M13, risk high, about 40 LOC of business logic, no dependencies) is unchanged in what it builds. Two review findings are folded in:

1. **Criterion 6 (population waits only before the lift), tagged `(respec 3)`.** I dropped the ENG 1TC 1800 s row. The review showed that no prebuilt build has a step that waits on population at or after its cap instant, so that row passes at the base. The criterion now names one case: the lowered-`maxPopCap` fixture, where a `produce` step is armed after the cap instant and would wait on population under the old check. The test first asserts that ordering, then the per-step `waitBreakdown.population` rule and the final `waitingOn` rule. The criterion says outright that the ENG 1TC row already on the branch is deleted. On the branch, the existing row "occur only before the cap at a lowered cap of 30" already asserts `populationCapReachedAt < 800` for a step triggered at 800 s, and review-8 reports that it fails under mutation M1.
2. **Docs text.** Scope's `docs/aoe4-build-order.md` bullet now contains the required exact edit: replace the sentence "...skip the supply check and go on to their resource, building and busy checks, ..." with "...skip only the supply check; every other check still applies, ...". It also states the rule behind the edit: the doc must not claim a check order the engine lacks, because the `produce` handler checks its building first and `payOrder` has no building or busy check. The docs criterion is tagged `(respec 3)` and requires that sentence.

Also changed:
- The Mermaid flowchart node had the same wrong wording ("go on to resource, building and busy checks"). It is reworded to "supply check skipped, every other check applies".
- A `git grep` over `docs`, `README.md`, `lib`, `data` and `components` at the branch tip finds that wording only at `docs/aoe4-build-order.md:373-374`. No other site needs the fix.

`## Re-spec 3 - 2026-11-24` is appended. The branch work that still stands: engine, build retune, and every other test and doc edit. The next pass deletes one test row, keeps or adds the ordering assertion, and swaps one doc sentence.

## Diagrams

The existing core-loop flowchart (read / act / record) stays; only the one node label changed.

## Lint

`ticket-lint.py --graph ... --spec /home/choin/git/WOTR_Combat_Simulator origin/main <ticket>` prints nothing: no errors and no warnings. The ticket is `high` risk, so it skips the self-check and goes to spec-gate.

## Open questions

none

## Overlap

None new. SGS-216 still owns the page-side parts, as the ticket's Out of scope says.

## Not acted on (review-8 non-blocking notes)

- The `simulate-house-gate.test.ts` comment that reads as change history.
- The `wealthy`/`rich` helpers.
- The feature-list summary.
- The long README line.

I left all four to the implementer's discretion. None changes a criterion.
