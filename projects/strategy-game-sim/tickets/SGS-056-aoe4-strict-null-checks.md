# SGS-056: Turn on `strictNullChecks` and fix the 177 type errors

- **Type**: Task
- **Component**: aoe4-build-order (also edits 4 lines in `lib/combat-simulator/simulate.ts`, a wotr-combat-simulator file, because `tsconfig.json` is repo-wide)
- **Milestone / criteria**: M4 / M4.1 (precursor to the shared zod schema)
- **Priority**: high
- **Risk**: high
  <!-- Judged high by caution: the change edits `simulateBuildOrder`'s helpers `applyDueEvents` (line 491)
       and the repo-wide compiler config, and `simulateBattles` (a REPO.md criticalPath) lines 76, 85, 113.
       Behavior of those symbols must not change; if it did, the ticket would be wrong. -->
- **Invariants**: A3 (same build order and data give the same timings: no fix may change a result), W2 (battles stay independent: the `simulateBattles` guards must not touch battle state); both are adjacent, neither may regress
- **LOC estimate**: about 177 small edits: 32 in business logic (`simulate.ts` 12, `depletion.ts` 8, `validate.ts` 4, `lib/combat-simulator/simulate.ts` 4, and 1 each in `research.ts`, `parse-text.ts`, `effects.ts`), about 145 in tests and acceptance specs. Each edit is a narrowing of one expression.
- **Depends on**: none
- **On merge**: none
- **Source**: `design/M4.md` C1 ("Dependency and compiler") and Owner decision 1 (option A, owner 2026-11-02); outline A in `plans/M4-20261102.md`; BACKLOG line 24 (`strict: false` stops `if (!result.ok)` narrowing)

## Context

M4's schema ticket infers build order types with `z.infer`, which under `strict: false` makes object and
union fields optional and breaks even a correct `z.ZodType<T>` annotation. The owner decided the repo
turns on `strictNullChecks` first. `npx tsc --noEmit --strictNullChecks` on `origin/main` (`d5c2549`)
reports 177 errors; this ticket fixes them all and flips the flag.

## Scope

1. `tsconfig.json`: add `"strictNullChecks": true` to `compilerOptions`. `"strict": false` stays; no other
   strict flag is added.
2. Fix all 177 errors. Counts per file at `d5c2549` (re-measure before starting; sibling tickets merging
   first can shift them):
   - business logic (32): `lib/aoe4-build-order/simulate.ts` 12 (lines 288, 290, 491, 508, 517 x3, 518, 615, 836, 838, 839),
     `depletion.ts` 8, `validate.ts` 4, `lib/combat-simulator/simulate.ts` 4 (lines 76, 85, 113 x2),
     `research.ts` 1, `parse-text.ts` 1, `effects.ts` 1;
   - tests (about 145): `simulate-depletion.test.ts` 33, `simulate.test.ts` 21, `simulate-triggers.test.ts` 19,
     `acceptance/aoe4-build-order.spec.ts` 16, `research.test.ts` 13, `simulate-construction.test.ts` 11,
     `depletion.test.ts` 8, `data.test.ts` 6, `acceptance/aoe4-simulate-api-contract.spec.ts` 4,
     `validate.test.ts` 3, `step-options.test.ts` 3, `effects.test.ts` 3, `gather.test.ts` 2, and 1 each in
     `research.acceptance.test.ts`, `modified-value.test.ts`, `engine-common.test.ts`,
     `acceptance/aoe4-simulate-api-spend-population.spec.ts`.
3. Rule for every fix (design C1): narrow the type only. Allowed: a non-null assertion (`!`), a type guard
   or `if (x === undefined) throw` on a state that cannot occur, or a corrected declared type (for
   example `order: ProductionOrder | null` where it really is null). Not allowed: a fallback value
   (`?? 0`, `|| []`, a default argument), optional chaining that turns a throw into `undefined`, or any
   change to which branch runs. Output of every function stays identical.
4. Specific seams (all in non-test code, each confirmed by the `tsc` run):
   - `lib/combat-simulator/simulate.ts` 76 (`this.hitTallies[side][h]++`), 85 (`tallySurvivors(battle.outcome, battle.winner)` where `winner` may be `undefined`), 113 (`const count = this.outcomeCounts.get(kind)` used in `{ count, frequency: count / battles }`): add a guard that throws or an assertion. `kinds` are the keys the map was seeded with, so a missing entry cannot occur. Do not default to 0; that would hide a bug. This is on the `simulateBattles` critical path: results and the thrown-error behavior for valid input must not change.
   - `lib/aoe4-build-order/simulate.ts` 288/290 (`rally` possibly undefined in the walk callback), 491 (`engine.events.shift().apply` after a length check), 508 to 518 (`instance.order` possibly null in `payOrder`), 615, 836 to 839 (`step-stuck` warning built from nullable `waitingOn`, `armedAt`): assert or guard as in rule 3.
   - `validate.ts` (4 errors): a minimal assertion or guard is enough; the schema ticket deletes the file.
5. Docs: grep `README.md`, `ARCHITECTURE.md`, `docs/*.md`, and comments for statements about `strict: false` or null handling that become untrue; fix any found. Expect none.
6. The implementer lists every test file edited. Tests change only in how they reach values (`!`, a guard, a narrowed helper type); no expected value or scenario changes, because nothing about behavior changes.

**Out of scope:** any other `strict` flag (`noImplicitAny`, `strictFunctionTypes`, `strict: true`); zod and the schema (next ticket); behavior changes, even when a null-handling bug is found (list it in the report and in BACKLOG instead); deleting or rewriting `validate.ts`; `golang/`; `.js` pages (`allowJs` is on but `checkJs` is not).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `tsconfig.json` contains `"strictNullChecks": true`, still contains `"strict": false`, and sets no other strict-family flag (`git diff origin/main -- tsconfig.json` shows exactly that one added line).
- [ ] `npx tsc --noEmit` exits 0 with zero errors, and `npm run lint:dup` passes.
- [ ] `npm test` passes with the same test count as on `origin/main`; no test is added, removed, skipped, or given a changed expected value.
- [ ] `npm run acceptance` (Node 24) passes with the same test count as on `origin/main`.
- [ ] `git diff origin/main -- lib pages components` (non-test files) adds no `??`, `||` default, or `?.` token and no `as any`, `@ts-ignore`, or `@ts-expect-error`. Every added expression is a `!`, a guard that throws, or a type annotation change. (`git diff origin/main -U0 -- ':!*.test.ts' ':!acceptance' | grep '^+' | grep -E '\?\?|\?\.|as any|@ts-'` prints nothing.) Today the pre-change search already finds none of the added tokens because the diff is empty; the check reads the diff, not the tree.
- [ ] `lib/combat-simulator/simulate.ts` and `lib/aoe4-build-order/simulate.ts` changes are only the lines listed in Scope rule 4: `git diff --stat` for those two files touches no function outside the named seams.
- [ ] For a sample of the same inputs (`npm test` covers them), `simulateBuildOrder` and `simulateBattles` return identical output as on `origin/main`; no snapshot or fixture file changes.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
