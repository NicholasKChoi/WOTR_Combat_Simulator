# SGS-056 review 1

- Branch: `sgs-056-aoe4-strict-null-checks`, tip `37240fb2cee9c21b8782d37ebe1df8a0550c5b8b` (not pushed, so I reviewed it in a detached worktree at that SHA). Base `origin/main` d5c2549, which is also the merge-base.
- Mode: full review (first gate)
- **Verdict: APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

1. tsconfig gets one added line: PASS. `git diff origin/main -- tsconfig.json` adds only `"strictNullChecks": true`. `"strict": false` stays, and no other strict-family flag is set.
2. `npx tsc --noEmit` and `npm run lint:dup`: PASS. tsc exits 0 with no output. jscpd reports "Found 0 clones."
3. `npm test`: PASS. 40 files, 1076 passed and 8 skipped (1084 total), matching the implementer's measurement on main. A word-level diff of every test file shows only `!`, `let x!:`, a few annotations and casts. No `it`/`test`/`describe` line was added, removed, renamed or skipped, and no expected literal changed.
4. `npm run acceptance` on Node v24.22.2: PASS, 551 passed in 52s. This matches main's 551 (implementer's `--list` count), and the diff adds and removes no spec.
5. No new `??`, `?.`, `||` default, `as any` or `@ts-*` in non-test code: PASS. The line grep prints one line:
   `+    const trip = readRecord(overrides!, node, \`trips.${node}\`, issues) ?? {};` (`validate.ts:455`)
   **Ruling:** this meets the criterion's intent, which is that no fallback is added. `git diff --word-diff=porcelain` shows the only added token on that line is `readRecord(overrides!,`; the `?? {}` is unchanged from main. The literal grep is line-based and cannot tell the two apart. Rewriting a line in a file that ticket 2b deletes, just to quiet the grep, would be churn. The word-diff of all non-test code adds only `!` assertions, the tsconfig line and the ARCHITECTURE.md wording.
6. The two `simulate.ts` files are touched only at the named seams: PASS.
   - Combat: lines 76, 85 and 113. The ticket described line 76 as `hitTallies[side][h]++`, but the real error is `outcomeCounts.get(...) + 1` on that line. The fix is on the right line.
   - AoE4: `spawnUnit` at 285 (the declaration that feeds 288 and 290), `applyDueEvents` at 491, `payOrder` at 507 (the declaration that feeds 508 to 518), `collectRunOuts` at 615, and `stepStuckWarning` at 836 to 839. No other function is touched.
7. Identical output, no snapshot or fixture change: PASS. Every production edit is a postfix `!`, which TypeScript and SWC erase, so the emitted JS is byte-equivalent. Both suites pass unchanged, and `git diff --stat` lists no fixture, snapshot or data file.
8. No INVARIANTS regressions: PASS (see below).

## Non-test `!`: is each one a pure narrowing?

Every one is erased at compile time, so none can change runtime behavior. I also checked that each assertion states something true, or at least is never dereferenced when it would be false.

- `combat simulate.ts:76`, `:113`: `outcomeCounts.get(...)!`. `record()` throws on an unknown outcome (line 55), and `kinds` are the keys seeded in the constructor (lines 47 to 51). True.
- `combat simulate.ts:85`: `battle.winner!`. `record()` throws when a side wins without a `winner` (line 58). True.
- `depletion.ts:67-68, 80`: `entry.remaining!` comes from `drawable()`, which filters out `remaining !== null` (line 56). True.
- `depletion.ts:91` (`recordRunOut`): `stock.get(ref)!` is evaluated before the `isDepleted` check. If the ref were missing, `entry` would be undefined, but `!isDepleted` short-circuits first, and the only caller (`simulate.ts:625`) passes refs from `runOuts`, which are pushed only after `isDepleted`. Never dereferenced while undefined.
- `depletion.ts:101` (`recordIdleArrival`): this comes after the `isDepleted` return. True.
- `effects.ts:108`: `byId.get(id)!`. `researchedIds` is filled only from `entry.id` of data entries (`research.ts:24`). True. See note 1.
- `parse-text.ts:233`: `word!`. `parse` is undefined whenever `word` is, and that case throws first. True.
- `research.ts:84`: `byBaseId.get(step.tech)!`. This is the same lookup as on main, which also dereferenced `[0]` unguarded. No change.
- `simulate.ts:285`: `at.rally!`. On main, `rally.walkSeconds` was already dereferenced unguarded, so the same TypeError path exists. This is the implementer's out-of-scope finding (see below).
- `simulate.ts:491`: `events.shift()!` sits behind `events.length > 0`. True.
- `simulate.ts:507`: `instance.order!`. The only caller checks `instance.order &&` (line 544). True.
- `simulate.ts:615`: `stock.get(ref)!.depletedAt` sits behind `isDepleted(...) &&`. True.
- `simulate.ts:836-839`: `armedAt!`, `waitingOn!`. Only `status === 'waiting'` timings reach here (line 907). A waiting step was armed (line 443) and has a `waitingOn` from its handler outcome (line 448). True by construction.
- `validate.ts:455, 474, 477, 492`: `overrides!` is used inside `for (... of Object.keys(overrides ?? {}))`, and the body never runs when `overrides` is undefined. True.

## Invariants touched

- A3 (determinism): holds. The changes are type-only, and the determinism test and every timing assertion pass unchanged.
- A2 (no negative resources): holds. `affordable`, `spend` and `orderNeed` are untouched. `payOrder` gained only a `!`.
- A1: not touched. No literals were added.
- W2 (independent battles): holds. `OutcomeAccumulator` gained type assertions only, with no new shared state.
- W1: not touched. Dice and casualty logic are unchanged.
- S1 to S3: no site-wide paths changed.

## spec-checklist.md

- Contracts (Key surfaces): no API, schema or field name changed. Pass.
- Scope: nothing under `golang/`, no out-of-scope strict flag, no zod. Pass.
- Open questions: none were answered with a constant. Pass.
- Naming: no new names. Pass.
- A1 to A3 and W1 to W2: as above. Pass.

## Linter

`npx tsc --noEmit` exits 0 and `npm run lint:dup` finds 0 clones. There are no findings, test files included.

## Review bot

`reviewBot.cli` is empty, so no bot ran and there is nothing to reconcile. `rulesFile` is empty.

## Conventions

- Non-null assertions already appear in the repo's tests, and `as unknown as` is the established cast in the tests (`data.test.ts:17-19`, `depletion.test.ts:45`, `houses.test.ts:12`). The new `as unknown as Record<string, string>` in `aoe4-simulate-api-spend-population.spec.ts:71` and the `as Record<string, number>[]` in `validate.test.ts:221` follow that pattern.
- `ARCHITECTURE.md:11` is reworded as Scope 5 asked, and the sentence is now true. A grep of README.md, `docs/*.md` and ARCHITECTURE.md finds no other statement about `strict` that has become false.
- No comments were added. Shipped files contain no ticket ids or factory pointers. The commit message is clean.

## Correctness

No inversions, swallowed errors, races or leaks. The diff adds no branch.

REPO.md review checklist:
- Every diff: `npx next build` (Node 24) exits 0 and leaves no file changes behind. The touched pages are exercised through their user-visible flows by the 551 Playwright specs, which drive the AoE4 page and the combat simulator page and send real `/api/fight` and `/api/aoe4-build-order/simulate` requests. They include `fight-api-caps`, `fight-api-validation` and `combat-simulator.spec`.
- Combat simulator: the round-trip trace is not applicable because no field changed. The `/api/fight` boundary cases are covered by the acceptance fight-api specs, which all pass. Dice and casualty logic are unchanged, so no fight-distribution run is needed.
- AoE4 build order: no helper or constant was copied. No engine rule changed, so no doc sentence is contradicted. No chart change.

## Non-blocking notes

1. `lib/aoe4-build-order/effects.ts:108-109`: `.map((id) => state.data.byId.get(id)!)` is followed by `.filter((e) => e?.type === 'technology')`. The assertion says the value is never undefined, while the next line still guards against undefined, so the two read as contradicting each other. The implementer chose this placement to keep the pre-existing `?? []` off the grep. It is harmless and does not change behavior. If it gets touched, put the `!` in the `flatMap` instead, or drop the dead `?.`.
2. The ticket's Scope 4 description of combat line 76 (`hitTallies[side][h]++`) is wrong. The actual error was `outcomeCounts.get(...) + 1`. No action is needed on the code.

## Out-of-scope findings (pass-through, confirmed)

- `lib/aoe4-build-order/simulate.ts:179-183`: `addBuildingInstance` can leave `rally: undefined` on a villager producer when there is no held rally, no rally default and no `order.start.rally`. `spawnUnit` (line 285, now `at.rally!`) then throws a TypeError when it reads `rally.walkSeconds`. This behavior is unchanged from main. I did not check whether validation rules out a missing `start.rally` together with no default. Candidate for a BACKLOG line.

## Coverage

- Reviewed all 26 changed files: every non-test hunk in full context, and every test hunk by word-level diff plus a hunk read of `validate.test.ts`, `simulate-depletion.test.ts` and `aoe4-simulate-api-spend-population.spec.ts`.
- Ran tsc, lint:dup, `npm test` (Node 22), `npx next build` and `npm run acceptance` (Node 24).
- I did not run main's suites myself. Equal counts rest on the diff adding or removing no test declaration, plus the implementer's measurement on main.
- I did not load the pages by hand with `npm run dev`. Playwright covers the touched flows.
- No processes are left running.
