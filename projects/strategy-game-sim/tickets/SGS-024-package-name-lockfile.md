# SGS-024: Name the root package so npm stops rewriting the lockfile name

- **Type**: Task
- **Component**: site
- **Milestone / criteria**: M2 / none (repo hygiene)
- **Priority**: low
- **Risk**: low
- **LOC estimate**: 0 business logic (2 lines in package.json; 2 name lines in package-lock.json)
- **Depends on**: none
- **On merge**: LESSONS.md (FACTORY_DIR/LESSONS.md): delete the "Lockfile name after npm install" entry.
- **Source**: SGS retro proposal 6 (owner approved); recurred on SGS-007, SGS-002, SGS-015

## Context

The root `package.json` has no `name`, so `npm install` run in a worktree writes the worktree folder
name (for example `sgs-015-...`) into the top-level `name` of `package-lock.json`, and the implementer
must revert it by hand each time.

## Scope

- `package.json` (repo root): add `"name": "wotr_combat_simulator"` and `"private": true` as the first
  two keys. npm disallows uppercase package names, so the lockfile's current `WOTR_Combat_Simulator`
  changes to lowercase; this is intended.
- `package-lock.json`: regenerate with `npm install --package-lock-only` from the ticket worktree.
  Checked on origin/main in a throwaway directory with a different folder name: the only diff is
  top-level `"name"` becoming `wotr_combat_simulator` and a new `"name": "wotr_combat_simulator"` line
  in `packages[""]`. Rebase onto the current origin/main first and re-check that no other line changes.
- Docs: `git grep -n -i "package.json\|lockfile\|package-lock"` over ARCHITECTURE.md, README.md and
  docs/ on origin/main finds only ARCHITECTURE.md line 13 (Node 24.x via `engines.node`), which stays
  true. No doc edits needed.

**Out of scope:** any dependency version change; adding a `version` field; engines or scripts changes;
the `golang/` directory.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] `package.json` has `"name": "wotr_combat_simulator"` and `"private": true`.
- [x] `node -p "const l=require('./package-lock.json');[l.name,l.packages[''].name].join()"` prints `wotr_combat_simulator,wotr_combat_simulator`.
- [x] `git diff origin/main -- package-lock.json` changes only name lines (two added/changed lines; no version, resolved or integrity lines).
- [x] Running `npm install --package-lock-only` (or `npm install`) from a worktree whose folder is named differently leaves `package-lock.json` byte-identical.
- [x] `npx next build`, `npx tsc --noEmit` and `npm test` pass.
- [x] No INVARIANTS.md regressions

## Open questions

None.
