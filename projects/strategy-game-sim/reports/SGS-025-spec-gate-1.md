# SGS-025 spec-gate 1

Verdict: NEEDS_SPEC (two small author gaps, no owner gaps). Confirmed risk: standard.

Checked against origin/main 68e004a `docs/aoe4-build-order.md` (441 lines), design/M2.md (Rally and start, Line map,
Contracts, bounds, Paste grammar, Extension points, Owner decisions), designer report M2-designer-rally-start.md,
INVARIANTS.md, LESSONS.md (repo and project: no entries), CONTEXT.md (Open questions: none).

## Checks that pass
- Grounded scope: every cited doc line (19-20, 53, 116-122, 124-129, 154-164, 254, 257-263, 272-276, 280-291, 293-309,
  322, 324-326) matches the text on 68e004a. Extension points table and issues flowchart exist. No new files.
- Open questions: none in ticket or CONTEXT.md; the three rally decisions are answered and in design Owner decisions.
- Contracts: every name (`BuildStart`, `start?`, `rally` action, bounds row, paste lines, issue codes) matches design/M2.md.
  Depends-on none is right (SGS-026/028/029 depend on this ticket, not the reverse).
- Size: docs only, ~100 lines.
- Diagrams: none triggered. On merge: none needed. Docs: the ticket is itself the doc fix and covers the stale lines.
- Decisions: body agrees with design. No decision history is to be written into the doc (doc has no "owner" today).
- Risk: docs are not a strongModelTriggers item alone; no criticalPaths. The doc is a public-surface spec, so not low.
  standard is correct.

## Gaps (author)

1. Acceptance criteria - AC1 contradicts Scope item 11 - AC1 requires
   `git grep -nE "villager .produce. without .rally." -- docs/aoe4-build-order.md` to find nothing, but Scope item 11
   and the design say the doc should state that "a villager `produce` without `rally` is valid and uses the standing
   rally". An implementer who writes that sentence on one line fails AC1; one who wraps it around a line break to
   dodge the grep passes it by accident. Fix: narrow AC1 to the removed claim, for example
   `git grep -nE "without .rally. is .invalid" -- docs/aoe4-build-order.md` finds nothing, and keep the `required for
   villagers` grep as is. Alternatively drop the second grep and rely on the AC6 reviewer check.

2. Scope item 11 / issue location - the ticket's hedge about "a paste line-map seam the designer is concurrently adding"
   is stale and the doc's current sentence conflicts with it. design/M2.md already has the Line map block (committed
   c83ca33): in paste, a step issue carries both `step` and `line`; a `start` issue carries `line` only; JSON `start` issues
   carry neither. The doc at l.311-312 says "A paste error carries the 1-based `line`; a step error carries `step`",
   which item 11's "state where each issue is reported" must fit with. An implementer would guess whether to restate
   the sentence. Fix: replace the parenthetical in Scope with: state at l.311-312 that a paste step issue carries both
   `step` and `line`, a paste `start` issue carries `line` only, and a JSON `start` issue carries neither; do not
   describe `BuildOrderLines` or the parse/validate signatures (they stay in design/M2.md).

## Notes (non-blocking)
- Invariants: the ticket says only "No INVARIANTS.md regressions". Name the adjacent entries: A3 (same-instant ordering
  rule, rally state as a pure function of the order), S3 (new `start.villagers` bound) and A2 (rally step has no cost).
- AC "git grep -ni owner finds nothing": true on 68e004a; also keep "confirmed" and dates out, as the ticket says.
- Scope item 10 says "`walk Ns` ... list at l.300 becomes `produce`, `build`, `move` and `rally`"; the design text at that
  point still reads `produce`, `build`, `move`. Follow the ticket (rally lines do take `walk Ns`); the design is
  incomplete there and could be fixed by a designer, but this does not block the doc edit.
- Design says "message names it" for the starting-building rule; include that in the doc row if it states messages.

Out-of-scope findings: design/M2.md paste grammar sentence ("`walk Ns` is always last on `produce`, `build`, `move` lines")
omits `rally`; file design/M2.md, a doc fix for a designer.
