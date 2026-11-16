# SGS-186: Remove unused locals from three AoE4 acceptance specs

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 3 (one unused constant, one unused helper, one unused import specifier; no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG item "Remove unused locals flagged by `tsc --noUnusedLocals`", reported by the SGS-180 implementer

## Context

`tsc --noUnusedLocals` flags three declarations in the acceptance specs that nothing reads. They are dead test code; removing them changes no behavior.

## Scope

This ticket changes no behavior the owner sees. At `origin/main`:

- `acceptance/aoe4-chart-views.spec.ts`: the constant `MIXED_NODES_PASTE` is declared and never referenced.
- `acceptance/aoe4-compact-view.spec.ts`: the helper `bands` is declared and never referenced.
- `acceptance/aoe4-my-builds.spec.ts`: `isNamedPath` is imported from `acceptance/helpers.ts` and never used in the file.

Remove each. Keep the `isNamedPath` export in `acceptance/helpers.ts`; `stubNamed` there uses it. Remove any import that becomes unused as a result (for example `Page` in the compact-view spec, if `bands` was its only user).

Check by running the typecheck with `--noUnusedLocals` over the acceptance specs; if it flags other unused locals in files this ticket touches, remove those too and list them in the report. Do not change `tsconfig.json` or enable the flag.

**Out of scope:** enabling `noUnusedLocals` in the tsconfig; unused locals elsewhere in the repo; the same-named `bands` helper in `acceptance/aoe4-build-order-step-band.spec.ts`, which is used.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `tsc --noEmit --noUnusedLocals` reports no unused-local error in the three spec files.
- [ ] Pre-existing tests keep their assertions; no test is added, removed, or edited beyond deleting the dead declarations.
- [ ] `acceptance/helpers.ts` still exports `isNamedPath`, and the repo's lint command (`commands.lint`) passes.
- [ ] No INVARIANTS.md regressions

## Open questions

none
