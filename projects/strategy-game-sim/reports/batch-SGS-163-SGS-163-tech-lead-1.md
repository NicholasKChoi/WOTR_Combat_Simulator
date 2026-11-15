# Tech-lead batch SGS-163

Decision: no blockers, no untested hotspots. Draft PR opened.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/171, base main, new, head e510f1fd05980dece2dc918ea5b6d58ba5fff07a

## Merge risk
**low** - test-only change in one acceptance spec; no public surface or `criticalPaths` symbol touched, and a revert fully undoes it.

## Review focus
No hotspots: test-only change; mutating `addIdleArrival` to keep the latest `at` makes the new assertion fail.

## Reviewed
origin/main...sgs-163-pin-first-arrival, one file (acceptance/aoe4-simulate-api-depletion-engine.spec.ts), +13/-2. Invariants A3 respected (bounds derived from the response, no literals). No irreversibility, security, or contract concerns.

## Notes
- `gh pr edit --body-file` fails on a Projects (classic) GraphQL deprecation error; the body was set through `gh api PATCH` instead and verified.
- The body source is at reports/pr-171-body.md.
