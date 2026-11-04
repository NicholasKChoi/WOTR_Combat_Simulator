# SGS-094 tech-lead 1

## Decision
No blockers and no untested hotspots, so I opened a stacked draft PR (a single PR, with the footer stack).

- PR #101: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/101
  - head `sgs-094-aoe4-deer-pack-2450` at 24a7963, base `main` at d950413
  - Pushed the branch to origin (it was new there). I made no new commits.
  - Set the body with `gh api -X PATCH .../pulls/101 -F body=@reports/SGS-094-pr-body.md`.

### Merge risk
**medium** - changes a default value that `/api/simulate` returns (a public surface). The response shape stays the same and a revert fully undoes the change.

### Review focus
No hotspots: this is one data value. `data.test.ts` (`node amounts`) and the new `aoe4-simulate-api-deer-pack.spec.ts` both fail if the value goes back to 1750. The engine reads the amount through unchanged code.

## What I reviewed
- Commit range: origin/main d950413..24a7963 (2 commits, both authored by choinickolas@gmail.com).
- 9 files, +39/-13 in total. Reviewable change is +4/-4: `data/aoe4-build-order/rules/base.json` and `docs/api/openapi.json`. The rest is tests: one new acceptance spec, plus value updates in the triggers spec and in the data, schema, depletion, triggers and house-warnings unit tests.
- Checks against the blocker list:
  - Invariants: A1 holds, since the value stays in versioned data. A2, A3, S3, W1 and W2 are not touched.
  - Critical paths: none of the `criticalPaths` symbols changed.
  - API contract: no schema or shape change. Only the default value changes.
  - Other categories: no security, concurrency or irreversibility concerns.
  - Open questions: the ticket and CONTEXT.md have none open.
- Searched the branch (excluding golang/) for `deer: 1750`, `7 deer x 250` and `deer ... 1750`: no matches.
- The house-warnings digest re-pin is explained in the commit message: the old digests come back when `nodeAmounts.deer` is set to 1750. The review gate verified this. I did not re-run it myself.

## Non-blocking notes
- The new acceptance spec pins `depletedAt: null` for deer on all three shipped builds. If a later change adds deer gathering to a shipped build, that spec will fail by design.
