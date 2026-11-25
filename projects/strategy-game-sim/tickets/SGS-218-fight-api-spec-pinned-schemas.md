# SGS-218: Add the rename request schema to the pinned schema list in the fight API spec surface test

- **Type**: Bug
- **Component**: wotr-combat-simulator
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 1 (one entry in `AOE4_SCHEMA_NAMES`; test file only)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md follow-up from SGS-215 (`reports/SGS-215-implementer-7.md`), failing acceptance test on main

## Context

`acceptance/fight-api-spec-surface.spec.ts` test "has exactly the pinned fight and AoE4 schema names and no others" fails on main. The pinned list `AOE4_SCHEMA_NAMES` was not updated when the named-build rename endpoint added the `RenameNamedBuildRequest` schema to `docs/api/openapi.json`, where it is defined under `components.schemas` and referenced by the rename operation. The spec's exact-set check is the only gate over the schema set, and the rename ticket's own acceptance specs (`aoe4-named-builds-rename.spec.ts`) do not touch this list, so nothing caught the drift when it merged.

Docs: `docs/api/openapi.json` components.schemas

## Scope

- In `acceptance/fight-api-spec-surface.spec.ts`, add `RenameNamedBuildRequest` to `AOE4_SCHEMA_NAMES` (the test sorts the expected list, so position is free; keep the list's alphabetical order).
- Search of the acceptance specs for other tests pinning the whole schema set found none besides this one (`git grep` for `AOE4_SCHEMA_NAMES` and `components.schemas` key lists under `acceptance/`; other specs name individual schemas only, e.g. `aoe4-named-builds-api-contract.spec.ts` `NEW_SCHEMAS`). No doc or comment becomes untrue.
- Do not change `docs/api/openapi.json`: the schema is referenced by the rename operation, so it is correct.

**Out of scope:** any other failing test in that spec, the schema's content, other acceptance specs.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The acceptance test "has exactly the pinned fight and AoE4 schema names and no others" passes against the current `docs/api/openapi.json`; it fails at the base with a diff naming `RenameNamedBuildRequest` (this is the regression test).
- [ ] The pinned list still rejects drift: removing any schema from `docs/api/openapi.json`, or adding an unpinned one, still fails that test (the test's exact-set assertion is unchanged).
- [ ] The rest of `acceptance/fight-api-spec-surface.spec.ts` keeps its assertions; `docs/api/openapi.json` is unchanged.
- [ ] No INVARIANTS.md regressions

## Open questions

none
