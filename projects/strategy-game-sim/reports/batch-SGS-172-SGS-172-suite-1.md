# Suite report: batch SGS-172-SGS-172

Verdict: PASS

Branch: sgs-172-readme-entry-point (base main)
Tip SHA: 1c0d25f6d41fad14b78296dd583281a5b9e4560e
Scratch checkout: suite-SGS-172-SGS-172 (removed at end of run)

## Run

- Scratch checkout created at 1c0d25f with the top branch listed so the SHA resolves.
- Diff against origin/main: README.md only (53 insertions, 2 deletions). Docs-only change.
- Node dependencies linked with `bin/link-node-modules.sh .` through run.sh (cache: nm-cache/d57d0fdd0e531d4b).
- `commands.acceptanceSetup` not run: the unit suite does not need Chromium, and the batch is docs-only.
- `commands.codegen` is empty; not run.
- `commands.unit` run in full: `npm test` (vitest run), through run.sh.
  - Log: /tmp/claude-1000/suite-SGS-172-SGS-172/suite-SGS-172-SGS-172.unit.log
  - Summary: Test Files 84 passed, 1 skipped (85); Tests 2609 passed, 15 skipped (2624). Duration 6.34s.
- `git status --porcelain` after the run: empty (clean tree).

## Failures

None.

## Environment

- Runtime: Node v24.22.2, npm 11.19.1 (through run.sh with commands.shellSetup loaded).
- Declared: `engines.node` = `24.x` in package.json. No .nvmrc, .node-version, or .tool-versions present.
- Match: yes. No mismatch.
- Unit run used the cached hardlinked node_modules; no install step was needed beyond the link.
