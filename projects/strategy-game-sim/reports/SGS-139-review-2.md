# SGS-139 review 2 (delta)

Verdict: **APPROVE**

Branch `sgs-139-marker-legend-hover-focus-labels`, tip `5c9f115`, base `origin/main` 4f369f3. Delta mode: I reviewed `a04ccdc..5c9f115` against review 1's blocking finding. The rest of the branch was approved in review 1.

## Blocking findings

None.

## Review 1 blocking finding 1: fixed

`acceptance/aoe4-marker-labels.spec.ts:26-27`: `setup` now counts markers per kind, keeps the non-age-up kinds that have any, and sorts them by count, highest first. `Array.prototype.sort` is stable, so ties keep `CHART_MARKER_KINDS` order. With this build that picks `blacksmith`, which has 8 markers (review 1 simulation). The `toBeDefined` guard still covers a build with no such kind.
- `:69`: `expect(labelsOf(result, kind).length).toBeGreaterThanOrEqual(2)` runs before the overlap poll. A data change that leaves fewer than two labels now fails loudly.
- The overlap poll (`:70-77`) can now fail. The implementer's mutation check matches the break that review 1 named: forcing row 0 in `placeMarkers` made the poll return `true` and the test failed at `:77`. The precondition review 1 stated still holds: labels are about 110-160 px wide and consecutive markers sit about 20 px apart, so with one row the labels overlap.
- The other tests in the file share `kind`, so they now run on `blacksmith` too. `tabTo` uses `present.indexOf(kind)`, so it adjusts. The implementer reports 8 of 8 spec tests passing after the change; I did not run them (gate rule).

## Rest of the delta

`components/apps/aoe4-build-order/results.module.css:38,42`: `#0d6efd` is now `var(--bs-primary, #0d6efd)`. This follows review 1 note 2 and matches the sibling `workbench.module.css:92`. Bootstrap's `--bs-primary` is `#0d6efd` (`node_modules/bootstrap/dist/css/bootstrap.min.css`, loaded in `pages/_app.js:1`), so the rendered colour does not change.

## Spec gaps

None.

## Acceptance criteria

The only change is to the hover, labels and no-overlap criterion, which review 1 failed. It is now **pass**:
- The label set is checked by `expectLabels`.
- No age-up label remains (`:67`).
- The no-overlap check can fail, and its precondition is asserted (`:69`).

Every other criterion is unchanged since review 1 and still passes.

## Invariants touched

A1-A3 and S1 still hold. The delta changes one test file and one CSS file, with no simulation, data or import changes.

## Test files across the branch

`git diff 4f369f3...5c9f115` shows two test files: `acceptance/aoe4-marker-labels.spec.ts` and `components/apps/aoe4-build-order/line-chart.test.ts`. `line-chart.test.ts` is identical to the version review 1 checked. The spec's only changes are the stronger kind choice and the new precondition, so no test was weakened.

## Lint

`commands.lint` (`npx tsc --noEmit && npm run lint:dup`) passes in the task worktree: tsc clean, jscpd 0 clones. The worktree is still clean afterwards.

## Bot reconciliation

REPO.md has no `reviewBot` CLI or rules file, so there is nothing to reconcile.

## UI inspection

Not run. The only UI change in the delta swaps a literal colour for a CSS variable that resolves to the same value. Review 1's inspection covers the rendered UI.

## Non-blocking notes

None new. Review 1 notes 1, 3, 4 and 5 were not addressed. They are optional.

## Coverage

- Reviewed: the delta `a04ccdc..5c9f115` (spec file and `results.module.css`), all of `acceptance/aoe4-marker-labels.spec.ts` lines 1-100, and the test-file diff across the whole branch.
- Not run: acceptance and Playwright tests (gate rule), and `npm test` and `next build`, because no production TypeScript changed in the delta.
- No processes started.
