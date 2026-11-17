# Tech-lead report: batch-SGS-193-SGS-193 (tech-lead-2)

## Decision: PASS - stacked draft opened

No blockers. No untested hotspots.

## PRs (bottom to top)

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/206 - base `main` - **new** - head `a84332a347505df974d5c36e87a4e7921d388bb0` (draft)

### Merge risk
**low** - display text only: a revert fully undoes it, it touches no API, schema, CLI, config or critical engine symbol, and unit and acceptance tests pin the new text.

### Review focus
No hotspots: the change swaps the source of one display string from `waitBreakdown` to `waitDetails`/`waitingFor`. Every row of the wording rules (each status, zero-second entries, list order, both tails) is a row in the `StepRun` table in `step-annotations.test.ts`, and the acceptance spec checks the live text against the API result.

## What was reviewed

- Commit range: `683991c` (origin/main, merge base; SGS-192 is integrated as #205)...`a84332a` (2 commits: cd3add9, a84332a).
- Files: `components/apps/aoe4-build-order/step-annotations.ts` (+12/-17), `docs/aoe4-build-order-ui.md` (+4/-3), `components/apps/aoe4-build-order/step-annotations.test.ts` (+45/-19), `components/apps/aoe4-build-order/step-annotation.test.ts` (+2/-1), `acceptance/aoe4-step-annotations.spec.ts` (+51/-1). Total +114/-41; reviewable business logic and docs +16/-20.
- Stack check: one member on `main`, and its diff holds only its own task. The PR was new (`gh pr view` found none).
- Checks:
  - A2: the wait text comes from the result's `waitDetails`, `waitingFor` and `waitingOn` only.
  - A1 and A3: nothing touched.
  - No `criticalPaths` symbol changed.
  - No API, OpenAPI or schema change.
  - No leftover `waitBreakdown` or `formatWaitBreakdown` reference in page code.
  - `result` on the page is always a fresh API response. Pins store only text and duration, so no stored result lacks `waitDetails`.
- Issue line: the ticket `Source` names no `GitHub issue #<n>`, so the body has none.
- Preview checks: the ticket lists `Unverified assumptions: none`, so the body has no Preview checks section.
- Stack footer: marker `cf-stack`. It lists only #206, since the SGS-192 dependency is integrated and no open PR stacks on this one.

## Non-blocking notes

- The PR body input file is at `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/pr-206-body.md`.
