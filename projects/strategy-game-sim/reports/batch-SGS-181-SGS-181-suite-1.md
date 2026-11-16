# Suite report: batch SGS-181-SGS-181

Verdict: PASS

- Top-of-stack SHA: baa121f23b0496fc3e3316429bc3a8f58bc0b1c7
- Task branch: sgs-181-width-row-specs-editor-annotations-chart-views
- Scratch checkout: suite-SGS-181-SGS-181 (created at the SHA, top branch listed so it resolves)
- Command run: `npm test` (commands.unit, full suite, not a subset)
- Summary line: `Test Files  84 passed | 1 skipped (85)`, `Tests  2623 passed | 15 skipped (2638)`, exit 0
- Log: `$TMPDIR/suite-SGS-181-SGS-181/suite-SGS-181.unit.log` (outside the checkout)
- Codegen: not configured (`commands.codegen` empty), not run.
- acceptanceSetup: not run. The unit suite needed only the node_modules link step, which was run on its own via `bin/link-node-modules.sh .` (the first part of acceptanceSetup). The Playwright Chromium setup was not needed for the unit verdict.
- Tree after run: `git status --porcelain` empty. No dirty tree.
- Failures: none. Nothing classified.

## Environment

- Runtime: Node v24.22.2, npm 11.19.1 (via run.sh with commands.shellSetup). Matches `engines.node` `24.x` in package.json. No `.nvmrc`, `.node-version`, or `.tool-versions` present. No mismatch.
- Vitest reported v5.0.5 and 85 workers spawned. Informational only.

## Cleanup

Scratch removal: see the `checkout.sh remove` result recorded with the handback.
