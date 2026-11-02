# SGS-062 CI-parity suite run 1

Branch: sgs-062-aoe4-veterancy-convert-units
Tip SHA: c566e070927735963097ab837783ef3de18e016a
Base: origin/main 54d7e90eeb2828fd5a09824107c1c80b35625871 (ancestor of tip)
Worktree: detached at tip, removed after the run.

## Verdict: PASS

| Check | Command | Result |
|---|---|---|
| Unit | `npm test` (`vitest run`) | PASS: 40 files passed; 1088 tests passed, 8 skipped (1096 total) |
| Lint | `npx tsc --noEmit && npm run lint:dup` | PASS: tsc clean; jscpd found 0 clones across 75 files |
| Acceptance (port 3783) | `ACCEPTANCE_PORT=3783 npm run acceptance` | PASS: 554 passed, 0 failed |

Acceptance setup: `npm run acceptance:setup` (Chromium) exited 0.
`npm ci` exited 0 with 0 vulnerabilities.

Logs (scratchpad):
- /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/SGS-062-unit.log
- /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/SGS-062-lint.log
- /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/SGS-062-acceptance.log

## Failures

None.

## Tree state

`git status --porcelain` after the run: empty. The tree is clean after `npm ci`, the unit run, lint, and acceptance.
No codegen command is set in REPO.md, so none ran.

## Environment

- Node: installed v24.22.2 via `nvm use 24`. Declared `engines.node` is `24.x` in package.json, and REPO.md says Node 24.x. No mismatch.
- No `.nvmrc`, `.node-version`, `.python-version`, or `.tool-versions` in the repo.
- No blockers. No flakes observed.
- Processes: Playwright's webServer started and stopped its own dev server on port 3783. Nothing of this run is left listening. Other sessions have dev servers on other ports (for example 3871, from review-sgs-070-2); I did not touch them.
- The 8 skipped unit tests are reported as the suite's own count. I did not investigate them.
