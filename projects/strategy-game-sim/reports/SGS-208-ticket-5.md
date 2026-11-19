# SGS-208 ticket author, re-spec 2 (report 5)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-208-repeat-a-build-or-move-step.md
Mode: re-spec from reports/SGS-208-spec-gate-4.md. Read at origin/main d80751be. Risk high, so spec-gate re-runs; no self spec-check.
ticket-lint (with --graph and --spec): exit 0, no errors or warnings.

## Summary

The ticket is unchanged in shape: "Repeat a build or move step: schema, expansion, simulator copies, OpenAPI 2.7.0". Component aoe4-build-order, M12, about 150 LOC, no dependencies. The diagram is unchanged. Two blocking gaps and the non-blocking notes are folded in.

## Blocking gaps

1. **Home of the copy rule.** Scope now makes `docs/aoe4-build-order.md` "Ordering and triggers" the one home of the rule. Today that section says only "Steps run in list order". The rule:
   - a `build` or `move` with `repeat` N runs as N consecutive copies in list order;
   - each copy keeps the trigger and `reaction`, and re-checks its own trigger when reached (D2);
   - reaction copies arm together at the run-out instant;
   - the result equals the step written out N times, apart from `source`, `copy` and the `step-stuck` message.

   The format doc's text beside the step table says in one line what `repeat` does and links to that section. The Docs criterion is now `(respec 2)` and checks both.
2. **The `step-stuck` message when a source has one copy.** The rule is now keyed on the copy count of the source, n = the number of `copies` entries with that `source`, not on the `repeat` key the copies drop. A source with one copy (no `repeat`, or `repeat: 1`) keeps today's message. A source with n >= 2 copies uses `copy <k> of <n>`. The Stuck copy criterion `(respec 2)` adds a `repeat: 1` case: its message equals the message for the same order with the `repeat` key removed. The test fails if a `repeat: 1` source gets the copy form.

## Non-blocking notes applied

- **Equivalence `(respec 2)`:** the orders are JSON steps with `repeat: 3` and `repeat: 2`; the `xN` paste form lands in the paste ticket. The `expandRepeats` case `x3` now reads `repeat: 3`.
- **Issue location `(respec 2)`:** the line is checked only when a line map is passed to `checkBuildOrder`.
- **Invariants:** the field now names A1 (the repeat bound is a request cap in `SIM_INPUT_BOUNDS`, not game data) and A2 (each copy pays through the unchanged payment path), beside A3 and S3.
- **`docs/aoe4-build-order.md`:**
  - The warnings sort sentence after the warnings table ("then `step-stuck` by step") is now named; it should say expanded index.
  - The Severity table's `step-stuck` row (around line 486) states only the severity, so the ticket says it stays as is.
  - The format doc's "by step index" was already named.

## Open questions

none

## Overlap

None new.
