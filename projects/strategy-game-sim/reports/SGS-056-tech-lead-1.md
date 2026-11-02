# SGS-056 tech-lead review 1

## Decision
No blockers. Opened draft PR.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/63 - base `main`, head `sgs-056-aoe4-strict-null-checks` @ 37240fb2cee9c21b8782d37ebe1df8a0550c5b8b, draft, title "Turn on strictNullChecks and narrow the nullable expressions it flags". Single PR, so no stack footer.

### Merge risk (verbatim from body)
**medium** - edits the source of critical-path symbols (`simulateBattles` tallies, `offerSteps`, `payOrder`) and the repo-wide compiler config, but the emitted JS is identical and a revert fully undoes it.

### Review focus (verbatim from body)
No hotspots: every code edit is erased at compile time (the transpiled output of all 24 changed `.ts` files matches `main` byte for byte), and `npx tsc --noEmit` passes with the new flag, so `next build` type-checks clean.

## What I reviewed
- Range: origin/main d5c2549..37240fb (1 commit, authored choinickolas@gmail.com). The branch was not on origin yet, so I reviewed the local branch and then pushed it.
- 26 files, +115/-114. Non-test: tsconfig.json, ARCHITECTURE.md, lib/aoe4-build-order/{simulate,depletion,validate,effects,research,parse-text}.ts, lib/combat-simulator/simulate.ts (+23/-22). Tests and acceptance specs: 17 files, +92/-92, all type-only.
- Critical-path hunks (`git diff -W`): `offerSteps` (events.shift()!), the function after `orderNeed` (`instance.order!`), the rally walk in noteCapReached's neighbour (`at.rally!`), startAutoHouses (`stock.get(ref)!`), the step-stuck warning builder, and the combat tally class used by `simulateBattles` (3 `!`). All are non-null assertions only.
- Runtime equivalence: I transpiled every changed `.ts` file at origin/main and at the branch tip with rolldown/oxc `transform` (scratch script /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/cmp/t.mjs). All 24 outputs are byte-identical, so the A3 and W2 invariants cannot have regressed.
- `npx tsc --noEmit` exits 0 on the tip.
- Invariants, irreversibility, security, concurrency, contracts: none touched. No schema, API, or data change, and no open question answered.

## Non-blocking notes
- `lib/aoe4-build-order/effects.ts:108`: `.map((id) => state.data.byId.get(id)!)` followed by `.filter((e) => e?.type === 'technology')`. The assertion now claims non-null while the filter still guards against undefined at runtime. Behavior is the same, but the type says something the runtime does not rely on. Worth tidying when the schema ticket touches this.
- Blast radius for siblings: from merge on, every open or future branch must pass the flag. Any M4 branch cut before this merge should be expected to pick up new tsc errors on rebase.
- There were no other open PRs when the PR was opened.
