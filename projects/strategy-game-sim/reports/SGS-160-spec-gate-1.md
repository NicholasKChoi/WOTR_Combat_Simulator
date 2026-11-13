# SGS-160 spec gate 1

**Verdict: READY**

Caveat: `git fetch origin` failed in the sandbox (reflog/gc error), so code was read at the existing local `origin/main` ref, which may be slightly stale.

## Checks
- Grounded scope: `acceptance/aoe4-results-split.spec.ts` holds the test and the line `children.filter((id) => id?.startsWith('chart-'))`. `CHART_IDS` is exported from `acceptance/helpers.ts` as `RESULT_CHART_IDS`. `results.tsx` renders `chart-reorder-help` and `chart-order-status` inside `results-last-good`. The ticket's cause matches the code. `startsWith('chart-')` appears nowhere else in `acceptance/`.
- Criteria: each is observable. The mutation criteria can fail. A chart wrapped in an extra element drops out of the membership filter. A chart placed before a paragraph breaks the `slice(-CHART_IDS.length)` assertion. No search criterion over code. No stale counts. No quoted names that fail to match the code.
- Open questions: none. Invariants `none` is fine, since the change is test-only. Risk `low` is right: no criticalPaths symbol or strong-model trigger. On merge `none` is valid. Docs: nothing goes stale. Input validation does not apply. No Depends-on and no overlap with other tickets was identified. Unverified assumptions `none` is correct, with no external service involved.

## Notes (non-blocking)
- Criterion 3 ("adding another hidden paragraph with any test id leaves it passing") holds only when the paragraph sits before the charts, because the `slice(-4)` assertion is kept. Consider "any test id, placed before the charts".
- `CHART_IDS` may be a readonly tuple of literal types, so `CHART_IDS.includes(id)` can raise a TypeScript error on a `string | null` argument. The implementer will need a cast or a `Set<string | null>`. This is not a spec gap.
