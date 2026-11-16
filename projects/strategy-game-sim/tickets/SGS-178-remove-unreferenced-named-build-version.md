# SGS-178: Remove the unreferenced NAMED_BUILD_VERSION export

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none (the AoE4 invariants match `lib/aoe4-build-order/**` by path only; no simulation or data behavior changes)
- **Unverified assumptions**: none
- **LOC estimate**: 2 (delete one exported constant and its doc comment in `lib/aoe4-build-order/named-builds.ts`; no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md bullet "`NAMED_BUILD_VERSION` unreferenced" (found by the SGS-176 implementer)

## Context

`NAMED_BUILD_VERSION` (`= 1`) in `lib/aoe4-build-order/named-builds.ts` is exported but nothing reads it. A grep at origin/main over the whole repo (`lib/`, `pages/`, `components/`, `acceptance/`, tests, docs, ARCHITECTURE.md, `docs/api/openapi.json`) finds only its definition. The stored and public named-build shapes in that file carry no version field, so the constant versions nothing. End state chosen: remove it, because using it would add a field to a stored and public shape, which is a design decision outside a chore.

## Scope

Behavior-neutral: this ticket changes no behavior the owner sees.

- Delete the `NAMED_BUILD_VERSION` export and the doc comment above it from `lib/aoe4-build-order/named-builds.ts`. Delete any comment another change has since added for it.
- Re-grep (case-insensitive, `named.build.version` and `namedBuildVersion`) over the repo at the base before deleting; if a reference has appeared since, report it instead of deleting.
- Doc impact: the search found no doc, README, or openapi text naming the constant, so no doc changes. The `"version": 1` values in `docs/api/openapi.json` are unrelated example payloads and stay.

**Out of scope:** adding a version field to named-build shapes or storage; other unreferenced exports (report any found).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `named-builds.ts` no longer exports `NAMED_BUILD_VERSION`; the typecheck passes, so a leftover reference anywhere would be a type error.
- [ ] Every pre-existing test keeps its assertions and passes unchanged.
- [ ] No behavior change: no other line of `named-builds.ts` is edited.
- [ ] No INVARIANTS.md regressions

## Open questions

none
