# Batch simplify: SGS-137, SGS-139

- SGS-137 (sgs-137-chart-view-toggles): reviewed own diff against 4f369f3. No trims warranted; no commit. Tip unchanged: 6de222d02fe3d1c6cd6046bfecb55f9dc6345a3b. vitest (full, 31 files in components run 763 pass), tsc, lint:dup (0 clones) green.
- SGS-139 (sgs-139-marker-legend-hover-focus-labels): reviewed own diff. No trims warranted (existing comments meet the comment bar; the derived-state reset is justified by its comment). Rebased `--onto 6de222d 4f369f3` cleanly, no conflicts. New tip: 1538718c2a2932b455654490628fc1ef3428c917. After rebase: full vitest, tsc, lint:dup (0 clones) green.
- Nothing pushed; no browser/e2e tests run.
