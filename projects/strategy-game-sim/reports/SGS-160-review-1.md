# SGS-160 review 1

Verdict: APPROVE. Tip ff83f4fe, base origin/main e50e074.

Blocking findings: none.

Acceptance criteria
- Test passes on unchanged product, fails at base: pass. The filter now keeps only ids in CHART_IDS, and the implementer records the base failure on the old prefix filter (received `chart-reorder-help` and `chart-order-status`). Not run by me (gate rule).
- Still fails on wrapped chart or chart before help/status: pass. The implementer's mutations are recorded: wrapping each chart yields `[]` at line 45, and moving the status paragraph after the charts fails the `slice(-4)` assertion at line 46. The code supports both.
- Independent of non-chart child names: pass. The filter is membership in CHART_IDS only, so extra hidden paragraphs cannot change line 45. The `slice(-4)` assertion still holds with extra paragraphs placed before the charts. Not mutation-tested; it follows from the code.
- Only the spec file changes: pass. `git diff --name-only origin/main...HEAD` lists only `acceptance/aoe4-results-split.spec.ts`.
- Other assertions kept: pass. The diff is one line.
- INVARIANTS: none apply (ticket says none; diff touches only an acceptance spec).

Ticket type Bug: the base failure and the cause location (spec filter) are recorded, and the fix is at the cause. No pre-existing test assertions were weakened. Line 45 still asserts the exact ordered list of four chart ids, and line 46 still asserts they are the last four children.

Lint: `npx tsc --noEmit` and `npm run lint:dup` are clean (0 clones).

Bot: no reviewBot configured; skipped.

Conventions: the one-line change matches the neighbouring spec style. Doc claims: none added.

Non-blocking notes
- `CHART_IDS.some((chart) => chart === id)` is needed because `id` is `string | null` and CHART_IDS is a readonly literal tuple, so `.includes(id)` would not typecheck. That is a reasonable form.
- UI inspection: not applicable (test-only diff).

Coverage: the single changed file, `acceptance/aoe4-results-split.spec.ts`, plus `CHART_IDS` in `acceptance/helpers.ts`. Unreviewed: `results.tsx` mutation runs, which I took from the implementer's report.
