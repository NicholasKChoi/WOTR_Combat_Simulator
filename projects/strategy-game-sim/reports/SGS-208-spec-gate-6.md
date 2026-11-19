# SGS-208 spec gate (report 6)

Ticket: `tickets/SGS-208-repeat-a-build-or-move-step.md` (risk high, no dependencies, after Re-spec 2). Read at `origin/main` d80751b (fetched, unchanged since report 4). `ticket-lint.py` exits 0 with no output. No scratch checkout; code read with `git show`.

## Verdict: NEEDS_SPEC

Both gaps from report 4 are closed. One new, small gap remains, in the `step-stuck` message number.

## Gaps

1. **Scope `simulate.ts` and Stuck copy criterion - which step number the plain `step-stuck` message prints for a single-copy source that follows a repeated source.**
   - Scope says a source with one copy "keeps today's message unchanged". Today's code (`stepStuckWarning`, `simulate.ts` line 995) prints `step ${timing.step + 1}`, and after expansion `timing.step` is the expanded index. For an unrepeated step placed after a repeated one, `timing.step + 1` and `source + 1` differ. Design C4 (design/M12.md line 116) says the unrepeated-source form is `step <source+1> (<action>) ...`. "Unchanged" read literally gives the expanded number, which names the wrong submitted step; the design reading gives the submitted number. The ticket states `source+1` only for the copy form.
   - The Stuck copy criterion only compares a `repeat: 1` step against the same order with `repeat` removed. That holds for either number, and the case it names has no earlier repeated step, so no named test fails on the wrong number.
   - Proposed fix: in Scope, say the plain form numbers the step by its submitted position (`step <source+1> (<action>) was still waiting on ...`), which equals today's text whenever no earlier step repeats. Add to the Stuck copy criterion a case with a repeated step before a still-waiting single-copy step (no `repeat` or `repeat: 1`) and require its message to name `source + 1`, not `step + 1`.

## Report 4 gaps, now closed

- Home of the copy rule: Scope names `docs/aoe4-build-order.md` "Ordering and triggers" (line 156 at base, says only "Steps run in list order") and has the format doc link to it. The Docs criterion (respec 2) checks it. Closed.
- `repeat: 1` message ambiguity: rule is now keyed on the number of `copies` entries for the source, with a `repeat: 1` case in the criterion. Closed apart from the numbering gap above.
- Report 4 notes (JSON-built equivalence orders, "when a line map is passed", A1 and A2 named) are all folded in.

## Other checks (all pass)

- Grounded scope: base lines and doc statements the ticket names exist (`docs/aoe4-build-order.md` lines 61, 79, 156, 474; format doc lines 174, 188, 220, 392, 428 to 436). `repeat.ts` is new and said so.
- Contracts match design C1, C2, C4 (the cap message, `source`/`copy`, copy wording). Risk `high` right. On merge `none` right. Unverified assumptions `none` right (no external service). Open questions none. Diagram present. Input validation: one field, under the zod threshold. No throwaway work (SGS-209 makes the identical `info.version` edit; SGS-210 and 211 depend on this).
- Existing-test rules, suppression semantics and the OpenAPI list were verified in report 4 and the ticket is unchanged there.
- Hotspots (high risk): expand-first with the `waitingOn` loop, notes index and stuck lookup on the expanded order, expanded versus written count, suppression, issue location on the submitted index, input not mutated, per-copy trigger and reaction behavior each have a named failing test. The stuck-message numbering is the only one without a discriminating test, covered by gap 1.

## Notes (non-blocking)

- design/M12.md still reads "draft for owner approval of Defaults D1 to D17"; not a ticket gap.
