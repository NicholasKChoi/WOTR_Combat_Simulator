# SGS-154 spec gate 7

Verdict: READY

Base: origin/main f55e0aa (fetched).

## Checks
- Re-spec 6 change confirmed. Item 6(b) and its criterion now say exactly one berry `idle-arrival` warning and that the total warning count is not asserted. Re-spec 6 is consistent with the rest of the ticket; other counts name their kind.
- Diff 41b3ed3..origin/main touches no engine or simulate-api code. Changed files are the blob store (lib/aoe4-build-order/blob-*), chart layout components, docs/ARCHITECTURE wording, and two new or edited acceptance specs (aoe4-chart-layout, aoe4-split-scroll), which the ticket does not use.
- `acceptance/helpers.ts` and `acceptance/openapi-schemas.ts` are unchanged since 41b3ed3.
- The six simulate-api spec files the ticket extends still exist on origin/main (edges, markers, spear-longbow-build, triggers, depletion-engine, spend-population). `aoe4-simulate-api-veterancy-conversion.spec.ts` is absent, as the ticket says (restored by the ticket).
- Nothing new to re-probe. All other gate-6 findings stand.

## Gaps
None.

## Notes
None new.
