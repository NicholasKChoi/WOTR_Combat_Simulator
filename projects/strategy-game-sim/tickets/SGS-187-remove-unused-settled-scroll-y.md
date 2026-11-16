# SGS-187: Remove the unused settledScrollY acceptance helper

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 5 (one exported helper and its comment in acceptance/helpers.ts, deleted)
- **Depends on**: SGS-184
- **On merge**: none
- **Source**: BACKLOG.md item "settledScrollY in acceptance/helpers.ts has no importer after SGS-182" (reported by SGS-182)

## Context

`settledScrollY` in `acceptance/helpers.ts` reads `window.scrollY` after two animation frames. SGS-182 moved the last spec that imported it, so at `origin/main` (c754c4c) no file imports it. It is dead test code. It waits on SGS-184 because that ticket rewrites the helpers file's neighbors (it deletes `TABS_VIEWPORT`, `showTab` and `SPLIT_MIN_WIDTH`) and its new B6 and B5 specs could start using the helper.

## Scope

State at the base this ticket is built on: SGS-184 is not integrated yet (its task checkout has no commits of its own). On `origin/main` the dead helpers in `acceptance/helpers.ts` are `settledScrollY` and, for SGS-184 to remove, `TABS_VIEWPORT` and `showTab`. Re-check the end state after SGS-184 lands:

- Delete `settledScrollY` and the comment above it from `acceptance/helpers.ts`, provided no file under `acceptance/` imports it at the base this ticket is built on (`git grep settledScrollY`). If SGS-184 or a later ticket made it used, the helper is no longer dead: change nothing and report that to the manager so the backlog item can be dropped.
- If SGS-184 left `TABS_VIEWPORT` or `showTab` (or `SPLIT_MIN_WIDTH`) behind with no importer, delete those too and say so in the report; SGS-184's Scope assigns their deletion to it, so a leftover is that ticket's miss.
- No doc names the helper today (searched `docs/`, `ARCHITECTURE.md`, `README.md` at `origin/main`). Ticket files that mention it are history and stay.

No behavior changes: this is a Chore, and pre-existing tests keep their assertions.

**Out of scope:** the other BACKLOG.md unused-locals chore (`tsc --noUnusedLocals`); changing any other helper; spec edits.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `settledScrollY` is removed, and `npx tsc --noEmit` passes, so any leftover importer would be a type error.
- [ ] Pre-existing tests keep their assertions; no spec file changes beyond removing an import of the helper, if one exists.
- [ ] `npm run lint:dup` and `npm test` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none
