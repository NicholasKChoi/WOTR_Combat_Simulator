# Batch 1 simplify

Reviewed both branch diffs against d54af2e by hand (quality only, comment bar applied). No changes made; no commits.

- SGS-001 (sgs-001-wotr-combat-design-doc): nothing changed. The doc has no obvious redundancy; the repeated bounds and Current code notes each carry distinct content. Tip 47c8931.
- SGS-007 (sgs-007-unit-test-runner): nothing changed. Config, script and 4 smoke tests are minimal, no comments, every test can fail for a real reason. The `exclude` list is redundant given `include` but the ticket specifies it explicitly. Tip e2ce61d.

No tsc/test/build re-runs, since nothing was modified.
