# SGS-023: Update ARCHITECTURE.md stack versions after the dependency upgrade

- **Type**: Task
- **Component**: site
- **Milestone / criteria**: M2 / M2.10
- **Priority**: low
- **Risk**: low
- **LOC estimate**: ~5 (docs only: the "Stack" section of `ARCHITECTURE.md`; no business logic)
- **Depends on**: SGS-012
- **On merge**: none
- **Source**: M2.10; follow-up to SGS-012, which leaves `ARCHITECTURE.md` stating Next.js 12, React 18 and TypeScript 4.7

## Context

SGS-012 moves the repo to Next 16, React 19, TypeScript 7, Vitest 5 and Node >= 22.12, but its scope does not touch
docs. `ARCHITECTURE.md` is a `styleSources` file that implementers and reviewers follow, so a stale "Next.js 12 /
React 18 / TypeScript 4.7" misleads them. Start this ticket only after SGS-012 is merged to `main`; read the versions
from the merged `package.json`, not from SGS-012's target table.

## Scope

A search of `ARCHITECTURE.md`, `README.md`, `docs/combat-simulator.md` and `docs/api/openapi.json` at `main` (6013fcc)
found version mentions only in `ARCHITECTURE.md` "Stack" (lines 10-11): `Next.js 12`, `React 18`, `TypeScript 4.7`.
`README.md` has two lines with no versions; `docs/` has no Node or framework version. There is no `.nvmrc` or
`.github/` workflow.

1. `ARCHITECTURE.md` "Stack": replace `Next.js 12` with the major of `next` in `package.json` (16 after SGS-012),
   `React 18` with the major of `react` (19), and `TypeScript 4.7` with the major of `typescript` (7). Keep
   "Pages Router", the Vercel line and `strict: false` as they are, if `tsconfig.json` still has `strict: false`.
2. Add the Node floor to the Stack section, copied from `package.json` `engines.node` (`>=22.12.0` after SGS-012).
   Today the section names no Node version.
3. Re-check the sentence "`tsconfig.json` only type-checks `.ts`/`.tsx`" against the merged `tsconfig.json` `include`
   (it lists `**/*.ts`, `**/*.tsx` and `pages/apps/combat-simulator.js` at `main`) and fix it only if it is false.
4. Re-grep the other repo docs (`README.md`, `docs/*.md`) for version and Node mentions after SGS-012 merges and
   update any that now disagree with `package.json`; expected result is none.

Use major versions only (as the file does today for Next and React), so routine minor bumps do not make it stale.

**Out of scope:** any code, `package.json`, `tsconfig.json` or lockfile change; REPO.md and state-dir files (SGS-012
On merge owns `acceptanceHarness`); documenting Vitest or Playwright versions (the section does not list them today);
`golang/` docs.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Docs only: `git diff --name-only main...HEAD` lists only `ARCHITECTURE.md` (plus `README.md` or `docs/*.md` if item 4
      found a stale mention).
- [ ] The major in `ARCHITECTURE.md` matches `package.json` for each of Next, React and TypeScript. Check:
      `node -p "['next','react','typescript'].map(p=>p+' '+(require('./package.json').dependencies[p]||require('./package.json').devDependencies[p]))"`
      prints the ranges, and `git grep -nE "Next\.js 16|React 19|TypeScript 7" -- ARCHITECTURE.md` finds all three
      (adjust the numbers to whatever that command printed if SGS-012 landed different majors).
- [ ] No stale version remains: `git grep -nE "Next\.js 12|React 18|TypeScript 4" -- ARCHITECTURE.md README.md docs ':!docs/api/openapi.json'`
      prints nothing (it prints the two lines today, lines 10 and 11 of `ARCHITECTURE.md`).
- [ ] `ARCHITECTURE.md` states the Node floor equal to `node -p "require('./package.json').engines.node"` (for example
      `git grep -n ">=22.12" -- ARCHITECTURE.md` matches when `engines.node` is `>=22.12.0`).
- [ ] The `strict: false` and `.ts`/`.tsx` claims in "Stack" agree with `tsconfig.json` (`git grep -n '"strict"' -- tsconfig.json`).
- [ ] No INVARIANTS.md regressions

## Open questions

None.
