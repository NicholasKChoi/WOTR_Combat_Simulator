# Batch 080/081 simplify pass 1

- sgs-080-aoe4-one-villager-per-farm: reviewed diff vs main (engine slots, farm-idle warning, landmarks, timeline kinds, results split). No trim worth making; comments meet the bar, no dead code or single-use helpers found. No commit. Tip: c8cca5f.
- sgs-081-aoe4-retune-prebuilt-farms: already stacked on c8cca5f, so no rebase needed. Diff is build JSON, README, docs and tests (data pins, not touched). No trim. No commit. Tip: 2fc9593.

npm test / tsc not rerun: no code changed.
