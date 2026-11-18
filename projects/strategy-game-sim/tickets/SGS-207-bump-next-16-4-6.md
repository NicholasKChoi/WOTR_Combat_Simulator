# SGS-207: Bump next to 16.4.6

- **Type**: Chore
- **Component**: site
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 0 (package.json range and package-lock.json entries only; no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md item "Bump next 16.4.3 to 16.4.6" (discovery/standalone-20261116-1.md); advisory GHSA-mfr8-8qww-v76h

## Context

Moderate advisory GHSA-mfr8-8qww-v76h covers next 16.3.0 to 16.4.4. The code uses neither `use cache` nor `unstable_cache` (a search of the repo at the base finds no use), so it is not reachable; the bump clears the audit finding. `package.json` pins `"next": "^16.4.3"` and `package-lock.json` resolves `next` and the `@next/swc-*` optional packages to 16.4.3. 16.4.6 is published on the registry. AGENTS.md warns this Next.js has breaking changes: the implementer skims the 16.4.4 to 16.4.6 release notes and the relevant guide under `node_modules/next/dist/docs/` for anything touching pages-router, API routes, or `next build`.

## Scope

- `package.json`: raise the `next` range so it cannot resolve below 16.4.6.
- `package-lock.json`: update `node_modules/next` and every `@next/*` entry the lockfile holds for it (the `@next/swc-*` platform packages, `@next/env`) to the 16.4.6 release, by `npm install next@16.4.6` or equivalent, with no unrelated dependency changes. Any other lockfile movement the install causes is listed in the implementer's report.
- Behavior unchanged: no source, config, or test file changes unless the new version forces one; a forced change is named in the report with the reason.

**Out of scope:** upgrading react, react-dom, typescript, or any other dependency; adopting new Next features; changing `use cache` or caching behavior.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The installed `next` version is 16.4.6 and no `@next/*` lockfile entry for it remains at 16.4.3
- [ ] `npm audit` reports no finding for GHSA-mfr8-8qww-v76h
- [ ] The build, typecheck and duplication lint, unit, and acceptance suites pass
- [ ] Pre-existing tests keep their assertions; no test is edited
- [ ] No INVARIANTS.md regressions

## Open questions

none
