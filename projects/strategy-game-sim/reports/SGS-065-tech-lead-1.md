# SGS-065 tech-lead 1

## Decision
No blockers. Opened the draft PR.

## PR
- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/73 (draft), base `main`, head `sgs-065-aoe4-knight-longbow-no-idle` at 6839b0457b3b349a510e640ce026133a2b367b53. Single PR with no stack footer. The body was set through `gh api -X PATCH`.

### Merge risk (verbatim)
**low** - A revert fully undoes it (one appended data step plus README prose). It touches no public surface (API, schema, CLI, config) and no critical-path symbol. Tests pin the changed simulate output for this build.

### Review focus (verbatim)
No hotspots: the change is one appended reaction step in a build data file, run by the existing reaction path. The new and re-pinned tests pin its effect on every output field at 1800 s and 3600 s.

## What was reviewed
- Commit range: origin/main e7af539..6839b04 (3 commits, all authored by choinickolas@gmail.com). The branch was not on origin before this run; I pushed it here.
- Files (+105/-15 in total):
  - Data and docs (reviewable, +16/-4): `data/aoe4-build-order/builds/english-knight-longbow.json` (+11) and `data/aoe4-build-order/README.md` (+5/-4).
  - Tests: the API spec, the house-lead-time spec digests, the house-warnings unit digest, the new `builds.test.ts` case and the new page spec.
- Invariant checks:
  - A1 holds: the fix is in the data, with no number in code.
  - A2 holds: no engine change.
  - A3 holds: the run stays deterministic, and the exact-run assertions are pinned.
  - S1-S3 and W1-W2 do not apply to these paths.
- Other checks:
  - CONTEXT.md lists no open questions.
  - No `criticalPaths` symbol is touched.
  - No secrets, schema or contract change. The request/response shape is the same; only this build's output content changes.

## Merge-risk reasoning
The PR is a data change to a shipped build, so for that build the simulate output (steps list, warnings, gatherRates, floating) changes from the sheep run-out on. Timings do not. Per the review differential, gold run-outs, population, spent and the cap instant are identical.

The rating is low, not medium, because nothing above low applies:
- No public surface: the API, schema, CLI and config are unchanged.
- No critical-path symbol is touched.
- A revert fully undoes it.
- The new 1800 s and 3600 s tests and the re-pinned digests pin the changed output.

## Non-blocking notes
- The new page spec redefines a local `REACTION_COUNT = 6`. The ticket's grep criterion (0 hits for `REACTION_COUNT`) was scoped to the existing API spec's meaning, but a literal re-run of `git grep -n REACTION_COUNT -- acceptance` now finds the page spec. The constant there is a different thing, the six on-page reaction rows.
- README "16:38 (997.9 s)" matches the measured 997.87 s.
