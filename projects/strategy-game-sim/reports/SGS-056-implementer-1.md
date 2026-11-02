# SGS-056 implementer report 1

- Ticket: SGS-056 (turn on `strictNullChecks`, fix the 177 errors)
- Branch: `sgs-056-aoe4-strict-null-checks` (from `origin/main` d5c2549)
- Tip SHA: `37240fb2cee9c21b8782d37ebe1df8a0550c5b8b`, authored choinickolas@gmail.com, not pushed
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-056-aoe4-strict-null-checks`
- Status: **needs_review**

## Re-measure

`npx tsc --noEmit --strictNullChecks` on d5c2549 gave 177 errors with the same per-file counts as the ticket. All 177 are fixed; `npx tsc --noEmit` (with the flag in tsconfig) exits 0.

## Files touched (26 files, +115/-114)

Config and docs
- `tsconfig.json`: one added line, `"strictNullChecks": true`. `"strict": false` is unchanged, and no other strict flag was added.
- `ARCHITECTURE.md` line 11: now reads "TypeScript 7, `strict: false` with `strictNullChecks: true`." The rest of the sentence was rewrapped and is unchanged. A grep of README.md, docs/*.md and code comments found nothing else about strict or null handling. The only other hits are Ajv `{ strict: false }`, which is unrelated.

Business logic (all fixes are `!` assertions, no guards or fallbacks)
- `lib/combat-simulator/simulate.ts`: `outcomeCounts.get(battle.outcome)!` on line 76 (`record` throws earlier on an unknown outcome), `battle.winner!` on line 85 (`record` throws earlier when a side win has no winner), and `outcomeCounts.get(kind)!` on line 113 (`kinds` are the seeded keys). I used `!` rather than a new throwing guard, so no new branch exists and thrown errors stay the same. Note that the ticket's description of line 76 is wrong: the error is on `outcomeCounts.get(...) + 1`, not on `hitTallies`.
- `lib/aoe4-build-order/simulate.ts`:
  - `spawnUnit`: `const rally = at.rally!` (covers both errors on lines 288 and 290).
  - `applyDueEvents`: `engine.events.shift()!`.
  - `payOrder`: `const order = instance.order!` (the only caller checks `instance.order`).
  - `collectRunOuts`: `engine.stock.get(ref)!` (follows `isDepleted`).
  - `stepStuckWarning`: `formatMinSec(armedAt!)`, `waitingOn: waitingOn!`, `at: armedAt!`.
  - No other function is touched.
- `lib/aoe4-build-order/depletion.ts`:
  - `entry.remaining!` x3 in `drawDown`/`nextRunOut`; `drawable` already filters out null.
  - `stock.get(ref)!` in `recordRunOut` and `recordIdleArrival`, where it follows `isDepleted`.
- `lib/aoe4-build-order/validate.ts`: `overrides!` x4, all inside loops over `Object.keys(overrides ?? {})`.
- `lib/aoe4-build-order/effects.ts`: `state.data.byId.get(id)!` in `activeEffects`. I put the assertion on the `.map` line rather than the `.flatMap` line so the acceptance grep does not hit the pre-existing `?? []`.
- `lib/aoe4-build-order/parse-text.ts`: `t.accept(word!)` after the `!parse` throw.
- `lib/aoe4-build-order/research.ts`: `data.byBaseId.get(step.tech)!`.

Tests and acceptance specs. These changes only affect how values are reached: `!`, `let x!: T` definite assignment, one helper return narrowed, and one array annotation. No expected value or scenario changed.
- `lib/aoe4-build-order/simulate-depletion.test.ts`: the `depletion()` helper now ends with `find(...)!`. Other changes are `depletedAt!`, `let result!`, `let seen!`, `real!(...)`, `s.gatherers[then!]` and `completedAt!`.
- `lib/aoe4-build-order/simulate.test.ts`: `startedAt!`/`armedAt!`, `let spent!/houses!/result!/supply!`, `probe` returns `state!`/`result!`, and `.get(...)!`.
- `lib/aoe4-build-order/simulate-triggers.test.ts`: `runOut!`, `armedAt!`/`startedAt!`, `let result!`/`let reacting!` and `eng1tc!`. The `depletedAt()` helper is unchanged because a test asserts it is non-null.
- `lib/aoe4-build-order/simulate-construction.test.ts`: `find(...)!` in `editEntry` and in `unit()`, `.get(...)!`, and `completedAt!`/`startedAt!`/`started!`.
- `lib/aoe4-build-order/research.test.ts`: `.get(...)!`, `find(...)!`, `effects!`, `.at(-1)!`, `let result!`/`let state!` and `startedAt!`.
- `lib/aoe4-build-order/depletion.test.ts`: `stock.get('<ref>')!` x8.
- `lib/aoe4-build-order/data.test.ts`: `baseId!` (after `filter(Boolean)`), `upgrade!.age` and `.get(...)!` x4.
- `lib/aoe4-build-order/effects.test.ts`: `byId.get(...)!` x3.
- `lib/aoe4-build-order/step-options.test.ts`: `.get(...)!` x2 and `entry!`.
- `lib/aoe4-build-order/validate.test.ts`: `nodeRefIssue(...)!` x2, plus `as Record<string, number>[]` on a literal array of villager maps.
- `lib/aoe4-build-order/gather.test.ts`: `find(...)!` inside a spread (covers both errors).
- `lib/aoe4-build-order/engine-common.test.ts`, `modified-value.test.ts` and `research.acceptance.test.ts`: one `!` each.
- `acceptance/aoe4-build-order.spec.ts`: `const boxes: { x; y; width; height }[] = []`. Under strictNullChecks with noImplicitAny off, `[]` was typed `never[]`; this one line fixes all 16 errors.
- `acceptance/aoe4-simulate-api-contract.spec.ts`: `properties!`, `required!` and `pop()!`.
- `acceptance/aoe4-simulate-api-spend-population.spec.ts`: `s as Record<string, string>` became `s as unknown as Record<string, string>`.

## Tests

- `npm test`: 40 files, 1076 passed, 8 skipped (1084). This is identical to `origin/main`, which I measured before any change.
- `npm run acceptance` (Node v24.22.2): 551 passed. `playwright test --list` on a detached `origin/main` worktree also gave 551 tests in 27 files. That temporary worktree has been removed.
- No test was added, removed or skipped, and no expected value changed.
- Invariants these tests encode: A2 (`floating` never below zero), A3 (determinism test in simulate-triggers, plus every timing assertion), and W2/OutcomeAccumulator tests in the combat suite.

## Pre-existing tests edited

All edits fall under Scope 6 ("Tests change only in how they reach values"). Each one is a type-level narrowing; the list is under Files touched above. No assertion or scenario changed in any of them.

## Mutation checks

No new tests were written (the ticket forbids adding any), so there are no per-test breaks to report. Every production change is a TypeScript `!` or annotation, which is erased at compile time, so the emitted JS for `simulateBuildOrder` and `simulateBattles` is unchanged. The unchanged pass counts on both suites confirm this.

## Codegen, build, lint

- codegen: not set.
- build: `npm ci && npx next build` exit 0. The build left no file changes behind (no tsconfig or next-env rewrite).
- lint: `npx tsc --noEmit` exit 0. `npm run lint:dup` found 0 clones, both after each batch and at the end.
- Acceptance grep `git diff origin/main -U0 -- ':!*.test.ts' ':!acceptance' | grep '^+' | grep -E '\?\?|\?\.|as any|@ts-'` prints one line:
  `+    const trip = readRecord(overrides!, node, \`trips.${node}\`, issues) ?? {};`
  The `?? {}` was already on that line on main; the only added token is `!`. Removing the hit would mean restructuring a line in `validate.ts`, a file the schema ticket deletes, so I left it. The reviewer should read this as no added token.
- `git diff --stat origin/main` shows no stray files: no lockfile, editor or cache changes.

## Invariant check

- A3: upheld. The changes are type-only and the outputs and test counts are identical.
- W2: upheld. The `simulateBattles`/`OutcomeAccumulator` changes are type-only assertions on values that are already validated; no state is shared or touched.
- A1 and A2: untouched.

## Out-of-scope findings

- `lib/aoe4-build-order/simulate.ts:285`: `spawnUnit` assumes the producing instance has a rally. `addBuildingInstance` (line 183) can set `rally: undefined` when there is no held rally, no default and no `fallback`. A villager spawned there would throw a TypeError. This is unchanged behavior (the `!` keeps the throw), but it is a latent crash path worth a BACKLOG line.
- The ticket text describes `lib/combat-simulator/simulate.ts:76` as `hitTallies[side][h]++`; the actual error is `outcomeCounts.get(battle.outcome) + 1` on line 76. The ticket wording needs no action.

## Processes

The Playwright webServer and next build exited on their own. No process is left running and no port in the 3100-3999 range is listening.
