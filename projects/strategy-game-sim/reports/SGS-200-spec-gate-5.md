# SGS-200 spec gate, round 5

Verdict: NEEDS_SPEC

Read at origin/main 683991c (after `git fetch origin`). SGS-190, 191, 192, 197 are integrated; SGS-193, 198 and 199 are not, so their text was checked against their tickets. The round-3 gap (no criteria for the B-B, B-W and B-H rules) is closed: the new criteria map each rule group to a doc sentence, exclude B-B13 and B-W10 with owners named, and offer a not-applicable escape. One factual gap remains: the ticket describes the base wrongly in two places.

## Gaps

1. **Scope (Marker control bullet) and the `marker legend` criterion - the ticket says the base still describes a per-chart marker legend, but SGS-195 has merged and the UI doc at origin/main has none - the ticket's claim about the code does not match the base, and the implementer is sent hunting for text that is gone.**
   - Scope says "at the base the Results paragraph says a marker legend titled 'Markers' sits in its own row below the series legend, that a run with no markers draws no marker legend, ...". At origin/main, `docs/aoe4-build-order-ui.md` lines 132-139 already describe "One marker control titled 'Markers', above the charts and shared by all of them" and "A run with no markers draws neither lines nor the marker control". `git grep -n -i "marker legend" origin/main -- docs/` finds nothing. The criterion "At origin/main it matches the UI doc's Results and Chart controls paragraphs" is therefore also false.
   - What still needs work in that paragraph: complete it to B-M1 to B-M10 (for example B-M5 fallback, B-M8 lifetime, B-M10 keyboard); the Chart controls paragraph (lines 147-152) still says "title row" and "everything under the title row (the series legend and the plot)", which SGS-194's merge made untrue.
   - Proposed fix: replace the "at the base" sentence with "at origin/main the paragraph already describes the marker control (the marker-control ticket merged); re-read it against the code and `design/M11.md` B-M1 to B-M10, and complete it". Change the criterion's last sentence to "At origin/main it matches nothing; it is kept so wording added later is caught." Keep the search itself.

## Checks that passed

- Grounded: `lib/aoe4-build-order/wait-detail.ts`, `unit-lines.ts`, `components/apps/aoe4-build-order/chart-markers.ts`, `chart-zoom.ts`, `use-chart-zoom.ts` exist at origin/main, so the ARCHITECTURE criterion is satisfiable now. UI doc line 20 (text-view kind legend, `kind legend renders above`), line 99 (`step-kind-legend`, cell paragraph), line 103 (`in that order`), line 114 (`tier <tier>`, `unitId`) and the format doc line 433 (`was still waiting on resources`) all match as the ticket says. `Queue length is not consulted` and `replaces its order (a switch)` already find nothing (SGS-190 removed them), as the criterion allows. `MarkerLegend` and `Show .* marker labels` find nothing.
- Rule numbers B-B1 to B-B13, B-W1 to B-W12, B-H1 to B-H9, B-T1 to B-T6, B-M1 to B-M10, B-Z1 to B-Z15 and B-U1 to B-U9 all exist in `design/M11.md`. The format doc already states `waitingFor`, `waitDetails`, matching and accrual (lines 393-402, 472-515), so the B-W mapping is satisfiable.
- Criteria are observable and non-stale: rule-number maps, searches over docs only (none over code), no pinned counts. Risk low, invariants A3 adjacent, `Unverified assumptions: none`, open questions none, On merge is a single `; `-separated list matching the design's CONTEXT.md Key surfaces, no diagram needed, no input validation, no throwaway overlap with another open ticket. Check 16 not applicable (low risk).

## Notes (non-blocking)

- `lib/aoe4-build-order/README.md` at origin/main already lists `wait-detail.ts` (line 62, added by SGS-192) and mentions the wait detail in the event loop (line 159). Scope says "add `wait-detail.ts`"; the implementer should check that entry and add only `unit-lines.ts` and `instanceFree` (neither is in the README yet). One clause in the Scope bullet ("add ... if missing") would save a duplicate entry.
- SGS-193, 198 and 199 are not merged; SGS-200 cannot start until they are, which Depends-on enforces.
