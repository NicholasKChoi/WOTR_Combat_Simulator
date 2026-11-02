# Batch M3 w4 simplify + suite 1

Tips:
- sgs-038-aoe4-depletion-engine: 6efd836 (was 04ff671). Trim: createEngine computes runRefs(order) once instead of twice. No other trims.
- sgs-044-aoe4-chart-marker-data: a2ea776 (was a6347d8). Only rebased onto the new 038 tip (clean, own commits 9f040a7, a2ea776). No trim.
- sgs-045-aoe4-severity-message-lists: ffe63c6 unchanged. No trim.
- sgs-048-aoe4-pin-compare: 7729620 unchanged. No trim (compare.ts AGE_NAMES duplicates 044's model constant, but 048 is not based on 044, so left).

Suite (Node 24), stack tops:
- 044: tsc + lint:dup pass; npm test 34 files / 840 tests pass; next build pass.
- 048: tsc + lint:dup pass; npm test 34 files / 775 tests pass; next build pass.
