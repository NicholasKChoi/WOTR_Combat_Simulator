# SGS-208 ticket author, re-spec 3 (report 7)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-208-repeat-a-build-or-move-step.md
Mode: re-spec from reports/SGS-208-spec-gate-6.md. Read at origin/main d80751be. The ticket is risk high, so spec-gate runs again; I did no self spec-check.
ticket-lint (with --graph and --spec): exit 0, no errors or warnings. The first run flagged the Re-spec sections as out of order (oldest must come first); fixed.

## Summary

The ticket is still "Repeat a build or move step: schema, expansion, simulator copies, OpenAPI 2.7.0": aoe4-build-order, M12, about 150 LOC, no dependencies. The diagram is unchanged.

## Blocking gap folded in

The step number in the `step-stuck` message. At base, `simulate.ts` `stepStuckWarning` prints `step ${timing.step + 1}`. After expansion `timing.step` is the expanded index, so "keeps today's message unchanged" would name the wrong submitted step for a single-copy step that comes after a repeated step.

- **Scope (`simulate.ts`):** both forms now number the step by its submitted position, `source + 1`, never by the expanded index (design C4). The plain form `step <source+1> (<action>) was still waiting on ...` matches today's text whenever no earlier step repeats.
- **Stuck copy criterion `(respec 3)`:** adds a case where a repeated step comes before a still-waiting single-copy step, tried both with no `repeat` and with `repeat: 1`. The warning's `step` must be the expanded index, and the message must number the step `source + 1`, which differs from `step + 1` in that order. The test fails if either form numbers the step by its expanded index.
- **Docs:** the format doc's `warnings` bullet ("1-based step number") is now named in Scope. That number is the submitted step's, while the warning's `step` field is the expanded index.

## Open questions

none

## Overlap

None new.
