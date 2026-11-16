# Tech-lead: batch SGS-169-SGS-169

## Decision

PASS - draft PR opened. No blockers, no untested hotspots.

## PRs (bottom to top)

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/184 - base `main` - new - head `372f015b2be340b989b9da76d7bd7a3a0fe5b799` (branch `sgs-169-effect-not-simulated-debug-severity`, draft)

### Merge risk
**medium** - adds a value to the public `Severity` enum of the simulate API and moves the research notes from `info` to it; additive for the page, which ignores severities it does not list, and a revert undoes it.

### Review focus
No hotspots: the change is two severity literals and one enum value. Unit tests pin every research note of every technology in the data at `debug`, pin `resultMessages` and the rendered message lists so a `debug` note shows in neither list nor the toggle count, and the contract spec pins the OpenAPI enum to the TypeScript list.

## What I reviewed

- Range: `origin/main...372f015` (2 commits: ec70f1d, 372f015).
- Files (10, +47/-21): `lib/aoe4-build-order/model.ts`, `lib/aoe4-build-order/research.ts`, `docs/api/openapi.json`, `docs/aoe4-build-order.md`, `docs/aoe4-build-order-format.md`, `docs/aoe4-build-order-ui.md`, `components/apps/aoe4-build-order/messages.test.ts`, `lib/aoe4-build-order/model.test.ts`, `lib/aoe4-build-order/research.test.ts`, `acceptance/aoe4-simulate-api-research.spec.ts`.
- Reviewable LoC: +8/-7 (model.ts, research.ts, openapi.json; tests and prose docs excluded).
- Checks:
  - A3 (determinism): notes are still a pure function of the order and data; only two literals changed. No `criticalPaths` symbol touched.
  - A1/A2: untouched (no cost, timing or payment code).
  - `components/apps/aoe4-build-order/messages.ts` unchanged: it already keeps only `warning`/`info`, so `debug` is dropped. Pinned by the new `messages.test.ts` cases (lists, empty render with debug-only result, toggle label count).
  - Every other `severity` consumer in `lib/`, `components/`, `pages/`, `acceptance/` grepped: none switches exhaustively over `Severity`; `acceptance/aoe4-build-order-inline-issues.spec.ts:196` counts only `info`, still correct.
  - Contract: `acceptance/aoe4-simulate-api-contract.spec.ts:160` pins `Severity.enum` to `SEVERITIES`; both list `debug` last.
  - PROJECT.md Open questions: none. Owner decided "hidden entirely" (ticket re-spec 1, Q105); the diff follows it.
  - Issue line: ticket Source is a BACKLOG bullet, no `GitHub issue #<n>`, so no Fixes/Refs line. Preview checks omitted (Unverified assumptions: none).
- Stack check: single branch on `main`, diff contains only this task.

## Non-blocking notes

- API behavior change for external clients: notes that were `severity: "info"` are now `"debug"`. No known consumer other than the page; documented in OpenAPI and the format doc.
- PR body attribution line placed above the `<!-- cf-stack -->` footer so the footer stays last for the rebase agent.
