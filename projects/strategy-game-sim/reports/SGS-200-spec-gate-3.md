# SGS-200 spec gate, round 3

Verdict: NEEDS_SPEC

Read at origin/main (after `git fetch origin`). M11 code does not exist yet (every Depends-on ticket is spec_ready or needs_spec in TASK-GRAPH), so new files and rules were checked against design/M11.md and the Depends-on tickets. Both round-2 overlap gaps (Units row, wait sentences) are closed: the ticket now checks SGS-198's and SGS-193's text and rewrites only the surrounding sentences. One criterion gap remains.

## Gaps

1. **Acceptance criteria - the model-doc and format-doc scope (B-B rules, `waitingFor`/`waitDetails` rules, `step-stuck` example) and the B-H rules have no criterion that a reviewer can confirm - the implementer cannot tell when "fill any B-B rule still missing" is done, and review has nothing to check against.**
   - Scope bullets under `docs/aoe4-build-order.md` and `docs/aoe4-build-order-format.md` say to fill any B-B rule and any `waitingFor`/`waitDetails` rule still missing. The only criteria touching these docs are stale-phrase searches (`Queue length is not consulted`, `replaces its order (a switch)`, `still waiting on resources`); they prove stale text is gone, not that B-B1..B-B12 (design rows at M11.md lines 198-209) or the B-W rules for `waitingFor`/`waitDetails` are stated. The mapping criterion (65) covers B-T, B-M, B-Z and B-U only; the help-dialog criterion (67) covers B-H only by "claims match the code".
   - Proposed fix: extend criterion 65 (or add one) so the report also maps each B-B rule (B-B1 to B-B12; B-B13, the build-file edits, belongs to SGS-190) and each B-W rule that is a user-visible record rule (`waitingFor`, `waitDetails`, the wait-reasons table, B-W12 unchanged) to the sentence in `docs/aoe4-build-order.md` or `docs/aoe4-build-order-format.md` that states it, and each of B-H1 to B-H5, B-H7 to B-H9 to its UI doc sentence, with the same "not applicable, with reason" escape. Also fix the criterion-65 lead-in, which names "B-T, B-M and B-Z" as the rule groups but then lists B-U too.

## Checks that passed

- Grounded: at origin/main, UI doc line 20 (text-view kind legend sentence), line 99 (`step-kind-legend` cell sentence), line 103 (`in that order`), line 114 (Units row, `tier <tier>`), lines 132-149 (marker legend, Chart controls), model doc lines 187 and 210, format doc line 424 (`was still waiting on resources`) all exist. Each stale-phrase search in the criteria matches at the base as the ticket says (`MarkerLegend` and `Show .* marker labels` match nothing, as stated).
- `lib/aoe4-build-order/README.md`: every non-test file at origin/main already has a Module map entry (checked file by file), so the "every file has an entry" criterion is satisfiable by adding only the new M11 files. ARCHITECTURE.md line 6 holds "does not list every file".
- Design rule numbers B-T1..6, B-M1..10, B-Z1..15, B-U1..9, B-H1..9, B-B1.. and B-W10 all exist in design/M11.md.
- ARCHITECTURE entries are supported by the design: `wait-detail.ts` browser-safe with value imports only from `model.ts`, `engine-common.ts`, `landmarks.ts` (M11.md line 52); `chart-markers.ts` the home of every marker rule (line 59); `chart-zoom.ts` pure (line 60). `unit-lines.ts` carries no such rule, consistent with the ticket.
- `instanceFree` lives in `engine-common.ts` per C7c. The wait-text, Units-row and gutter-popover checks agree with SGS-193 and SGS-198 as written. SGS-193's open owner question affects only the exact run-cell text; the ticket already says to follow SGS-193's as-built text.
- On merge: single `; `-separated item list, no prose; matches the design's CONTEXT.md Key surfaces list. Risk low and invariants A3 fine for docs only. Unverified assumptions none is right. Open questions none. Diagrams not required. Input validation not applicable. No throwaway overlap with open tickets (SGS-190, 192, 193, 195, 198, 199 each leave the stated text to this ticket or are checked, not rewritten).

## Notes (non-blocking)

- Criterion 58 `still waiting on resources` is case-insensitive over `docs/`; SGS-193's `still waiting on <cause>` fallback text must not use `resources` as its example cause, or the search will match a legitimate sentence. If it does, change the example cause rather than the search.
- SGS-190, 193, 197 and 199 are needs_spec; SGS-200 cannot start until they merge, which Depends-on enforces.
