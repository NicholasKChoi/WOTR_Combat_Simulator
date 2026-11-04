# Tech-lead gate: batch 082 / 086 / 092

Decision: no blockers, no untested hotspots. Three draft PRs opened, each based on main (b9481e3), not stacked, no footer.
Reduced check (all low): invariants, irreversibility, security from the combined diffs. No invariant applies (A1-A3 untouched: no lib/data/api code changed; only a test deletion, tests, tab keyboard/CSS/page scroll-margin, docs). No schema, migration, secrets, permission or concurrency change.

| Task | PR | Branch @ tip | Risk |
|---|---|---|---|
| SGS-082 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/90 | sgs-082-aoe4-remove-build-order-ui-spec @ 04d2573 | low |
| SGS-086 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/91 | sgs-086-aoe4-small-screen-tabs-keyboard @ c83ac75 | low |
| SGS-092 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/92 | sgs-092-aoe4-test-hygiene @ 74b6f02 | low |

## Review focus (verbatim)
- #90: No hotspots: the only change is deleting a test file, so no production logic moves.
- #91: pages/apps/aoe4-build-order.tsx:51-54 - if the bar's position is misread, the results heading scrolls under a sticky bar (or leaves a gap) after a run - pinned by acceptance/aoe4-small-screen.spec.ts "stays sticky at the top and offsets the results scroll by its height".
- #92: No hotspots: test-only changes with no production code touched; re-pinned digests change because the hashed field set is now explicit.

## Reviewed
Each branch has one commit on origin/main b9481e3. 082: 1 file, -939. 086: 7 files, +233/-6. 092: 13 files, +63/-43.

## Notes
- gh pr edit failed silently (Projects classic GraphQL deprecation error); bodies were set via `gh api PATCH` and verified.
- 082 deletes a 939-line acceptance spec; the other specs were not re-audited for coverage of what it covered (planned removal per ticket).
- 086's mutation criterion is only met by the unit test (see review-1); non-blocking.
- 092 re-pins three digests (hashed field set changed, not behavior); suite passes.
