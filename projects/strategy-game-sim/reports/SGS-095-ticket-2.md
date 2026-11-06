# SGS-095 ticket author 2 (re-spec 1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-095-test-hygiene-followups.md

Verified against origin/main 9274372 (fetched).

## Gate gaps folded in

1. Scope item 4: the helper does `page.goto('/apps/combat-simulator')` and then `page.waitForFunction` until `#fight-form` has an own property starting with `__reactProps$` (React 19.3 DOM internal props key, set at hydration). No product code change. The helper change is required even when the flake does not reproduce, since it fixes a race. The report must name the exact command and what it showed. Checked: `#fight-form` carries only `className`, `id` and `onSubmit` (pages/apps/combat-simulator.js), and all three specs use goto + `networkidle` in their `beforeEach`.
2. Criterion 4: the throw is injected at the top of `checkSimInputs` only when `houseBuilderSource` is a string longer than 1000 characters. In schema.test.ts the only such input is the 5000-character `houseBuilderSource` row. The other houseBuilderSource values in the file are 'wood', 'gold#2', 'gold', 1 and 'fish'. The expected result is that exactly that row fails and everything else passes, run with `npx vitest run lib/aoe4-build-order/schema.test.ts`. The baseline claim (the mutation breaks the whole file at collection on origin/main) comes from reading the code: `sites.flatMap` calls `run` in the describe body. I did not run it, because the throwaway worktree has no node_modules.
3. Criterion 3: reworded so that no schema call executes at describe-body time and every call is inside an `it` callback. Helper and row closures may be defined there. A matching Scope sentence was added to item 2.

Also: Depends on tells implementers to branch from origin/main, not the stale local main. Item 1 now says the JSON types need no cast. Criterion 6 is now a `git grep -n networkidle` check, which currently finds the three specs (lines 39, 39, 6).

Diagrams: none (unchanged). Open questions: none. Overlap: none found.
