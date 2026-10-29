# SGS-007 ticket report

File: tickets/SGS-007-unit-test-runner.md
Title: Add a unit test runner runnable by `npm test`. Component: site. Risk: standard (new devDependency, config and
package.json script; no invariant touched; ~35 business-logic lines). Depends on: none. Downstream: SGS-004, SGS-005.

Choice: Vitest (`vitest run`). No Babel config, Jest would need babel-jest/ts-jest/next/jest; esbuild handles `.ts`
natively, no DOM needed for `lib/` logic, Node 22 fine. PR #12's Jest is not on main.

Convention: `<name>.test.ts` beside the code in `utils/` or `lib/<app>/`, never under `pages/`. Runner `include` is
explicit (`utils/**` and `lib/**` `*.test.ts`) because Vitest's default would pick up Playwright `*.spec.ts` in
`acceptance/` and `golang/frontend/src/App.test.js`; Playwright `testDir: 'acceptance'` keeps the reverse separation.

Smoke test: `utils/utils.test.ts` on `shuffle` (same elements incl. duplicates, no input mutation, new array, empty).

Diagrams: none (single component).
Open questions: none blocking. Risk noted in ticket: TS 4.7 with `moduleResolution: node` may not parse/resolve newer
Vitest/Vite typings; implementer picks a compatible major (I did not install anything to verify).
Overlap: SGS-002 also edits package.json and package-lock.json; the second to merge regenerates the lockfile.
Out of scope noted: REPO.md `commands.unit` (human, after merge). TASK-GRAPH.md not edited.
