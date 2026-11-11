# SGS-129: Turn on `strict` in tsconfig

- **Type**: Task
- **Component**: site
- **Milestone / criteria**: M9 / M9.13
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (the test edits touch `lib/combat-simulator/**` and `acceptance/**` but change no asserted value; W1 and W2 are not affected)
- **Unverified assumptions**: none
- **LOC estimate**: 0 (typing-only edits in two test files and one config line; no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M9.md, "Strict mode scope (M9.13)" and the M9.13 row of the Criteria map

## Context

`tsconfig.json` has `strict: false` with `strictNullChecks: true`. Running `tsc --noEmit --strict` against the base reports exactly three TS7053 errors (implicit `any` from indexing `FightOutcomes` with a string), all in tests: `lib/combat-simulator/simulate.test.ts` (in the `summarize` custom-kinds test and in the `simulateBattles` outcome-classification table test) and `acceptance/fight-api-contract.spec.ts` (the per-kind key loop over `body.outcomes`). Turning `strict` on now is cheapest before the other M9 tickets add code that would each need to be strict-clean.

## Scope

- `tsconfig.json`: set `strict` to `true` and remove `strictNullChecks` (redundant under `strict`). Keep `allowJs`, add no `checkJs`, and leave `pages/apps/combat-simulator.js` in `include` unchecked, as today.
- Fix the three errors with typing-only edits in `lib/combat-simulator/simulate.test.ts` and `acceptance/fight-api-contract.spec.ts`, for example a typed record view of `outcomes` or a narrowed key type. Do not use `// @ts-ignore`, `// @ts-expect-error`, or an `any` annotation or cast to silence an error. If `tsc --noEmit` reports further errors at the base that this ticket's tree shows (a sibling ticket may have merged first), fix those the same way.
- `ARCHITECTURE.md` (Stack section): the statement that TypeScript runs with `strict: false` and `strictNullChecks: true` becomes untrue.
- Check with `grep` for other docs stating the old setting (a `git grep` for `strictNullChecks` outside `node_modules`); fix any it finds.

**Out of scope:** checking `pages/apps/combat-simulator.js` (`checkJs`); changing any asserted value, test name, or production code; the Ajv `strict: false` option in the acceptance specs (unrelated to the compiler).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `tsconfig.json` has `strict: true` and no `strictNullChecks` entry; `checkJs` is not enabled
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `next build` passes
- [ ] The diff adds no `@ts-ignore`, `@ts-expect-error`, or `any` (annotation or `as any` cast) anywhere
- [ ] The edits to `lib/combat-simulator/simulate.test.ts` and `acceptance/fight-api-contract.spec.ts` change only types: every `expect` still asserts the same value, and `npm test` passes with the same number of tests as before the change
- [ ] No doc states that TypeScript runs with `strict: false` or relies on `strictNullChecks` alone (`git grep -n "strictNullChecks"` outside `node_modules` finds nothing, and `ARCHITECTURE.md` describes the strict setting)
- [ ] No INVARIANTS.md regressions

## Open questions

none
