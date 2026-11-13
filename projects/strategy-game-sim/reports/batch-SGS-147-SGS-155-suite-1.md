# Suite gate: SGS-147, 149, 150, 155 (each rebased onto origin/main f55e0aa)

Command: `npm test` (vitest run, via run.sh, node v24.22.2). Detached scratch worktree, branches untouched, nothing pushed. Tree clean after each run (no codegen).

| Ticket | Branch tip | Rebased SHA | Conflicts | Result |
|---|---|---|---|---|
| SGS-147 | 6bb1297 | fa90886 | none | PASS: 81 files passed, 1 skipped; 2519 tests passed, 15 skipped |
| SGS-149 | 76390a0 | 95c7a55 | none | PASS: 81 files passed, 1 skipped; 2513 passed, 15 skipped |
| SGS-150 | 9450b34 | 24e2820 | none | PASS: 81 files passed, 1 skipped; 2512 passed, 15 skipped |
| SGS-155 | bf73e7f | 180a7ab | none | PASS: 82 files passed, 1 skipped; 2531 passed, 15 skipped |

No failures to classify.

Logs: .claude/code-factory/worktrees/suite-147.log, suite-149.log, suite-150.log, suite-155.log

## Environment
Node v24.22.2 matches engines `24.x`. No .nvmrc present. No mismatch.
