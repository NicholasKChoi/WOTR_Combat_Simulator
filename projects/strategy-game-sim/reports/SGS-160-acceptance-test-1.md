# SGS-160 acceptance-test 1

Verdict: PASS. Tip ff83f4fe76b4ebea5079eefedfd648c72ce05ad5 unchanged; no commit made (no tests written; the diff is itself the spec fix).

Harness: acceptanceSetup ran (Chromium installed). Ran `acceptance/aoe4-results-split.spec.ts` and `acceptance/aoe4-chart-layout.spec.ts` (same component): 31 passed, 0 failed.

## Criteria checked (by temporary edits to results.tsx, all reverted; `git diff --exit-code` clean on components/)

- Fails at base: origin/main spec version run against the product: the "direct children" test fails. Tip version passes.
- Chart wrapped in an extra div (results.tsx map return): test fails at the spec line 45 filter assertion (received `[]`, expected four ids).
- Status paragraph moved after the charts (chart before the paragraph): test fails at line 46 `slice(-4)` assertion (received ends with `chart-order-status`, expected the four charts).
- Two extra hidden paragraphs added (`chart-extra-note`, `other`): test passes (does not depend on non-chart child names).
- Product diff: `git diff --name-only origin/main...HEAD` lists only `acceptance/aoe4-results-split.spec.ts`. Other assertions in the spec are untouched.

No failures, no spec-gaps. No criteria inexpressible. No processes left running.
