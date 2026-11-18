# SGS-207 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-207-bump-next-16-4-6.md

Chore, component site, Milestone none, Priority low, Risk low, about 0 business-logic lines. Bumps next from 16.4.3 to 16.4.6 in package.json and package-lock.json (next plus its @next/* entries). Verified at origin/main: package.json pins ^16.4.3, the lockfile resolves next and @next/swc-linux-x64-gnu to 16.4.3, no `use cache` or `unstable_cache` in the repo, and `npm view next@16.4.6` confirms the version exists. Criteria: installed version is 16.4.6, npm audit clean for the advisory, build/typecheck+dup lint/unit/acceptance green, no test edits.

Diagrams: none (one-line statement). Open questions: none. Overlap with other tickets: none. Lint: ticket-lint passed with no output. No scratch checkout created. Criteria were not run (npm audit not executed).
