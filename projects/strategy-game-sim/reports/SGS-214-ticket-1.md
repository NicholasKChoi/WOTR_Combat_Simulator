# SGS-214 ticket report 1: no ticket written (target is a state-dir file)

Verdict: no ticket file written, no row to add. Per pipelines/docs.md `## ticket`, an item that cannot be
delivered as a Docs ticket gets no row: remove the `(docs)` tag and apply the edit directly.

## Why

- The CONTEXT.md meant is `$FACTORY_DIR/CONTEXT.md` (the file with "Component model", "Key surfaces",
  "Design docs"; the retro's Proposal (repo) says `CONTEXT.md - add after the Design docs section`).
  It is the factory state file on branch `code-factory-state` (git log there shows `eb93b160`,
  `e3636c00` touching it).
- The code repo has no CONTEXT.md: `git ls-tree -r origin/main` lists none (checked at the fetched
  origin/main). A Docs ticket becomes a PR on `main` and review's Docs check reads the code at the
  branch tip, so the section cannot be delivered or reviewed that way. Retro applied earlier
  CONTEXT.md edits directly (`eb93b160`, see retro-20261121 "Past proposals").
- Also, SGS-214 would add a branch `sgs-214-context-test-layers-section` that changes nothing in the code
  repo.

## What to do instead

Insert the section verbatim from `reports/retro-20261121.md` (lines 166-183, the markdown block under
pattern 5 "Proposal (repo)") into `$FACTORY_DIR/CONTEXT.md` between "## Design docs" (including its
trailing "AoE4 behavior is also stated outside the design docs" paragraph) and "## Out of scope", then
delete the BACKLOG.md `(docs)` item. Risk tier does not matter then: it is a state edit, not a PR.

## Claims checked against origin/main (all true unless noted)

- Unit layer: `vitest.config.mts` `test.include` is `utils/**/*.test.ts`, `lib/**/*.test.ts`,
  `components/**/*.test.ts`; no `environment` set (Node). `npm test` is `vitest run` (package.json).
- `renderToStaticMarkup` is used by 12 `*.test.ts` files.
- Acceptance: `package.json` `acceptance` is `playwright test`; `playwright.config.ts` `testDir: 'acceptance'`;
  `acceptance:setup` installs Chromium.
- `auto-run-status` / `data-status`: `components/apps/aoe4-build-order/build-input.tsx` (`#auto-run-status`,
  `data-testid="auto-run-status"`, `data-status={status}`); `acceptance/helpers.ts` waits on it.
- Reload: `docs/aoe4-build-order-ui.md` says the pinned run is kept in `localStorage` key
  `aoe4-build-order.pinned-run` and re-run on load; `pages/apps/aoe4-build-order.tsx` reads `?n=` through
  `initialBuildQuery(router.query)`. Not verified line by line that "the first build" is the default.
- Minor inexactness in the proposal text: the doc says `?n=` or `?b=` links open a build; the proposal
  names only `?n=`. Consider writing "`?n=` or `?b=`" when applying. The text also says "no hover or focus"
  for the unit layer and "CSS modules give class names only": `vitest.config.mts` sets
  `css.modules.classNameStrategy: 'non-scoped'`, consistent.

## Not done

Did not edit BACKLOG.md, TASK-GRAPH.md or CONTEXT.md. No scratch checkout made; ticket-lint not run
(no ticket).
