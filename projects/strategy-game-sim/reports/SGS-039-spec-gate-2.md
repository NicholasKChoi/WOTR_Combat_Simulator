# SGS-039 spec gate 2

Verdict: READY

Both gate-1 gaps are closed.
- Gap 1: the default-depletion criterion no longer expects a `gold#2` entry for ENG 1TC. It says sheep and gold run out and there is no `gold#2` entry. The `gold#k` 4000 case is tested with an order that names `gold#2`.
- Gap 2: `data/aoe4-build-order/README.md` is in Scope (Prebuilt builds sentence and Known data gaps line) with two grep criteria. I re-ran both on the current tree: "never depleted" matches at line 71 and "keep running by 3600 s" at line 40, so each finds 1 line before and must find 0 after.

Checks:
- The notes from gate 1 are folded in: `triggerWakeAt` takes `Trigger | undefined`, the 508 s / 760 s / 3305 s basis is stated, and SGS-042's horizon tests are edited in place.
- Names and behavior match design/M3.md: the `Trigger` kinds, `reaction`, `triggerWakeAt`, `accrueWait`, `nodeRefIssue`, `triggerAtLeast`, and the reaction ordering, arming, wake, conflict and repeat rules.
- The bar in the ticket matches the design (parts 1-3 at both horizons, 4-5 at 1200 s). The design leaves the 3600 s halves of 4-5 to the paste-grammar ticket, which is SGS-040.
- The 508 s / 3305 s basis matches the SGS-040 ticket text.
- Invariants A1, A2, A3 and S3 are named and not contradicted. Risk `high` is right.
- There are no open questions. The project LESSONS.md is empty.
- Size is about 210 lines.
- On merge: none. This is correct, because the ticket adds no command or harness.
- Docs: the stale `docs/aoe4-build-order.md` lines are listed (`Resources are infinite` at 25, `At most one step is armed` at 150). The openapi.json and README edits are in Scope.

Notes (non-blocking):
- SGS-040's Scope does not list the README edit, which changes "at 1200 s" to both horizons for gold parts 4-5. SGS-039 names the hand-off, but the manager should add it to SGS-040's Scope.
- SGS-050 line 49 assumes the README bar sentence is rewritten by SGS-039. That is now true, so SGS-050 should only add its entry.
