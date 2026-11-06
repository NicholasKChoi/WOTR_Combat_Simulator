# SGS-095 spec gate 4 (re-spec 3)

Verdict: READY

## Buildable given SGS-098

- SGS-098 lists the two 1200/3600 s men-at-arms tests (the `for (const durationSeconds of [1200, 3600])` loop). Its deletion rules also remove constants left unused. After SGS-098 the spear/longbow spec keeps only the "at 3600 s each of the three gold deposits runs out..." test, which uses `GOLD_NODES`, `simulate` and the warm-up, not `MAN_AT_ARMS_STEP`, `CASTLE_LANDMARK_SECONDS` or `MAN_AT_ARMS_START_SECONDS`. So the ticket's condition resolves to "dropped": item 1 and criteria 1 and 2 do not apply.
- Branch bff8a52 edits that spec (the `findIndex` line, +3/-1) and sits on 9274372. When rebased onto SGS-098's branch it will conflict (modify against delete). The ticket already says to discard that edit or let it vanish, and the report must say so. That is unambiguous.
- Items 2, 3 and 4 do not touch anything SGS-098 deletes. Both tickets edit `acceptance/helpers.ts` (SGS-098 may remove unused exports, 095 adds `openCombatSimulator`). That can give a trivial textual conflict but no semantic one.
- Spot checks on the branch: `helpers.ts` holds the one `goto('/apps/combat-simulator')` and the one `networkidle` (in `openPage`), which matches criterion 6. Criterion 6 holds in the end state. The schema test and the comment deletion are in the diff.

## Checks 1-13

Grounded scope, testable criteria, no open questions, invariants none (test-only), no contract or doc changes, Risk low (test-only, no criticalPaths symbol), no new input boundary: all fine. Criterion 5's "no test removed by this ticket" is correct on top of SGS-098.

## Notes (non-blocking)

- The ticket still carries conditional wording for item 1 and criteria 1 and 2. Replace it with "dropped: SGS-098 deletes every `MAN_AT_ARMS_STEP` use" so the implementer does not have to re-derive it. The implementer can just verify with `git grep MAN_AT_ARMS_STEP -- acceptance/` after rebasing: no match means dropped.
- If no match is found after rebase, the LOC estimate (about 40 lines) shrinks by 3 lines.
- The `Depends on` line still mentions origin/main 9274372. The current base is whatever SGS-098's branch is on (9328355 or later). The rebase instruction is clear anyway.
- Criterion 7's `npm run acceptance` pass depends on SGS-098 being green. Stack order is already stated.
