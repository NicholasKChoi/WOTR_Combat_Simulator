# SGS-114 spec gate 2

Verdict: READY

Read at origin/main (fetched). Checked: results.tsx, line-chart.tsx and its test, results.module.css, pin-storage files, acceptance/helpers.ts (repo root), the six specs that use `CHART_IDS`, docs/aoe4-build-order.md (anchor paragraph at line 927, Per villager paragraph at 936), and design/M8.md C9, the Charts rows and the behavior table.

## Gate 1 gaps, all closed

1. `CHART_IDS`: the ticket now says `export const CHART_IDS = RESULT_CHART_IDS`, `RESOURCE_CHARTS` stays a standalone literal, no existing spec changes (including the local literal in `aoe4-results-split.spec.ts`), and a criterion enforces the diff scope. This matches design C9.
2. Collapsed body: the wrapper stays in the DOM with `id` and `hidden` and no children, the measure svg stays outside it, and a criterion checks that `aria-controls` equals the body id.
3. Header wrapper: the Bootstrap `d-flex flex-wrap ...` wrapper is removed, the header row is module CSS, and a criterion checks the collapsed markup has no `d-flex` or `flex-wrap`.

Gate 1 notes are also taken: focus restore is explicit, and each spec case names its viewport and `showTab`.

## Checklist

- Grounded scope: every existing file and function named exists (`browserStorage` in the page, `measureRef`, `headerControls`, `perVillager`, `results-last-good`). New files are marked new.
- Criteria are observable. The unit rows state properties (permutation, first-seen order), not counts. The spec guards the vacuous-pass case for the pin and hover test.
- Existing tests: line-chart.test.ts has no assertion on the Bootstrap wrapper or `headerControls`, so the markup change breaks none. The rule "existing tests not edited, report lists any edit" covers the rest.
- Open questions: none. Invariants: adjacent none, no contradiction. Contracts match design C9. Dependencies none; about 220 LOC. Diagrams not triggered. On merge `none` is correct. Risk `standard` fits (no criticalPaths symbol touched).
- Input validation: the stored layout has 3 flat fields and the ticket uses zod anyway.
- Docs: the "Chart controls" paragraph is in Scope. The Per villager paragraph (line 936) and the sentence about the charts being the only column stay true.
- LESSONS: geometry is read in one `page.evaluate`. No criterion asserts a CSS-module class name.

## Notes (non-blocking)

- Scope opens with "All paths are under `components/apps/aoe4-build-order/` unless noted", but `acceptance/helpers.ts`, `acceptance/aoe4-chart-layout.spec.ts` and `docs/aoe4-build-order.md` are repo-root paths. `components/apps/aoe4-build-order/acceptance/helpers.ts` does not exist. The criteria use root-relative paths, so an implementer will resolve it correctly; a one-word "(repo root)" would remove the doubt.
- `git diff --name-only ... -- acceptance` pins a two-file list. It is a scope guard against sibling-ticket conflicts, so it is acceptable.
