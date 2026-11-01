# BATCH-025-027 simplify 1

Stack (linear, on 68e004a): SGS-025 c763bec <- SGS-026 1fc08bd <- SGS-027 e0bf455. Nothing pushed.

## SGS-025 (tip c763bec, was a86b6ea)
- docs/aoe4-build-order.md l.126-131: reflowed the paragraph so no line exceeds 108 chars (text unchanged). Other >110 lines in the file are table rows or pre-existing, left alone.
- Doc-only diff, nothing else to trim.
- tsc clean; npm test 127 passed.

## SGS-026 (tip 1fc08bd, was d64cb50)
- Deleted lib/aoe4-build-order/model.test.ts (duplicated model.acceptance.test.ts); moved its one unique case (rally step needs a target node, @ts-expect-error) into lib/aoe4-build-order/model.acceptance.test.ts.
- model.ts untouched (comments already meet the bar).
- Rebased onto c763bec with no conflicts. tsc clean; npm test 131 passed.

## SGS-027 (tip e0bf455, was c6c2b79)
- lib/aoe4-build-order/effects.ts: exported hasBuilding. lib/aoe4-build-order/gather.ts: drop-off check reuses it instead of the inlined `(buildings.get(id) ?? 0) >= 1`; split the type imports into `import type`.
- Rebased onto 1fc08bd with no conflicts (data.acceptance.test.ts was touched by both branches; merged cleanly). tsc clean; npm test 186 passed.

## Conflicts
None.
