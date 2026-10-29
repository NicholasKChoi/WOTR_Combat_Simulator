# SGS-004 suite report (CI-parity unit gate)

**Verdict: PASS**

- Ticket: SGS-004 (`tickets/SGS-004-wotr-combat-caps.md`)
- Branch: `sgs-004-wotr-combat-caps` (local only, not on origin)
- Tested SHA: `0a84a2e3923dbf508b8b8d9d0e4b4fef212936a8` ("Drop step-narrating comments in battle.ts")
- Base: `origin/main` at `006c553`
- Worktree (detached at the SHA, no branch created): `/home/choin/git/WOTR_Combat_Simulator/.claude/worktrees/agent-a64594475b06ad74d`
- Scratch branch: none (detached HEAD; `worktree-agent-a64594475b06ad74d` is the worktree's own auto-branch, left untouched)

## Setup

- `npm ci` (acceptanceSetup prefix) exited 0. Log: `$TMPDIR` npm-ci.log (scratch, not committed).
- `commands.acceptanceSetup` also runs `npm run acceptance:setup` (Playwright Chromium install). Skipped: the unit suite (Vitest) does not use Chromium.
- `commands.codegen` is empty in REPO.md; not run.

## Unit command

`npm test` (= `vitest run`), Vitest v1.6.1, exit 0.

```
 ✓ utils/utils.test.ts  (4 tests) 3ms
 ✓ lib/combat-simulator/battle.test.ts  (23 tests) 10ms
 ✓ lib/combat-simulator/army.test.ts  (6 tests) 22ms

 Test Files  3 passed (3)
      Tests  33 passed (33)
```

Full log: `$TMPDIR` unit-full.log (scratch).

## Tree state

`git status --porcelain` after the run shows only `?? .claude/` and `?? .mcp.json`. These are the sandbox phantom dotfiles noted in memory, not produced by the suite. No codegen ran, and no tracked file changed, so the tree is clean for CI purposes.

## Failures

None.

## Not covered

- Acceptance (Playwright) specs added by the ticket (dice cap, hit cap, elite-only casualties, commit `76a266e`) were not run. They are outside `commands.unit`.
- `commands.lint` (`npx tsc --noEmit`) and `commands.build` were not run; they are outside this gate.
