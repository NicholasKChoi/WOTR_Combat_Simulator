# SGS-208 spec gate (report 8)

Ticket: `tickets/SGS-208-repeat-a-build-or-move-step.md` (risk high, no dependencies, after Re-spec 3). Read at `origin/main` after fetch. `ticket-lint.py` exits 0 with no output. No scratch checkout; code read with `git show`.

## Verdict: READY

## Gaps

none.

## Report 6 gap, now closed

- Plain `step-stuck` form numbering: Scope now says both forms number the step `source + 1`, never the expanded index, and notes that `stepStuckWarning` (`simulate.ts` line 995, `step ${timing.step + 1}`) prints the expanded index after expansion, so it must change. This matches design C4 (design/M12.md line 116). The Stuck copy criterion adds a repeated step before a still-waiting single-copy step (no `repeat`, and `repeat: 1`) and requires `source + 1`, which differs from `step + 1` there, so a named test fails on the wrong number. The format-doc bullet names the step-number note. Closed.

## Other checks (carried from reports 4 and 6, ticket unchanged there)

- Grounded scope, testable criteria (no code searches, no stale counts), no open questions, invariants A1 A2 A3 S3, contracts C1 C2 C4 match, size ~150 LOC, diagram present, On merge `none`, risk `high` right, docs enumerated, one input field (under the zod threshold), no throwaway overlap (SGS-209 makes the identical `info.version` edit), Unverified assumptions `none` right.
- Hotspots (high risk): expand-first with the `waitingOn` loop, notes index and stuck lookup on the expanded order, expanded versus written count, suppression condition, issue location on the submitted index, input not mutated, per-copy trigger and reaction behavior, and the stuck-message numbering each have a named test that fails when the logic breaks.

## Notes (non-blocking)

- design/M12.md still reads "draft for owner approval of Defaults D1 to D17"; not a ticket gap.
