State batch report naming and the no-overwrite check in manage.md's launch prompt

## Problem

The batch-range naming and no-overwrite rule for reports lives in `references/common.md` (added for #4).
The simplify gate is launched as a general-purpose agent that never reads common.md, and the manager's own
report-path rule in `commands/manage.md` (~60-70) gives only `<id>-<agent>-<n>`. So batch reports get
ad hoc names and overwrite earlier ones.

## Evidence

- After #4, batch reports were still named `batch12-*` and `batch13-*` instead of `batch-<first id>-<last id>-*`.
- Two simplify reports (`batch10-simplify`, `batch11-simplify`) were overwritten by later batches.
- This repeats a finding from the previous retro that #4 targeted.

## Suggested edit

`commands/manage.md`, the report-deliverable line in the launch prompt:

```diff
 Report path: `reports/<id>-<agent>-<n>.md`
+Batch gates (simplify, suite, tech-lead): `reports/batch-<first id>-<last id>-<agent>-<n>.md`.
+Before writing or moving any report, `test -e` the path and bump `<n>` until it is free; never overwrite.
```

Put the line verbatim in the simplify launch prompt, since simplify does not load common.md.
