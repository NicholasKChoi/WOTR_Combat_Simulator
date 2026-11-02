# SGS-057 tech-lead gate 1

## Decision
No blockers. Draft PR opened: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/67 (base `main`, head `sgs-057-aoe4-zod-schema-text-to-build` at d51b509d9c902e7d3038fa9929ec4ee8fedc1f6d). Merge risk: medium.

## Reviewed
- Range: origin/main e296ba9..d51b509 (2 commits, both authored by choinickolas@gmail.com). Merge base is e296ba9 (origin/main tip).
- 13 files, +1346/-247. Reviewable (excluding unit tests, acceptance specs and the lockfile): +718/-244.
- Read in full: schema.ts, text-to-build.ts, the validate.ts diff, step-options.ts and its test diff, model.ts, openapi.json, the contract-spec diff, the new issue-shape spec, package.json and package-lock.json.

## Checks
- Dependency: zod 4.6.7 resolved from registry.npmjs.org. The lockfile integrity matches `npm view zod@4.6.7 dist.integrity`. No dependencies, no install or postinstall scripts, MIT. Only `package.json` dependencies and the one lockfile node changed. No scope creep.
- Invariants. S3: bounds unchanged, defined once, and the route still enforces them. A1: the catalog comes only from GameData. A3: pure; issues are sorted by a fixed rank. No criticalPaths symbol touched (no simulate.ts or engine-common.ts change).
- Contract: `suggestion` is an optional, non-required OpenAPI property, and the route never emits it yet. Additive.
- Blast radius beyond the commit message: `resolveSimInputs`, which the live route calls on every request (pages/api/aoe4-build-order/simulate.ts:58), is now the zod `checkSimInputs` over a per-call catalog. The commit message says only that bounds and defaults "moved". The review report's 3000-case differential fuzz shows strictly-equal results, and the validator tests are unedited and pass. Disclosed in the PR body and placed first in Review focus. Not a blocker.
- Irreversibility, concurrency, security (secrets, permissions, auth, PII): none found.

## Merge Risk (from the PR body)
**medium** - adds an optional property to the public `BuildOrderIssue` OpenAPI schema and a runtime dependency, and swaps the code behind the live route's `resolveSimInputs`. All of it is backward-compatible, a revert fully undoes it, and the unchanged validator tests pin the route behavior.

## Review focus (from the PR body)
- [`lib/aoe4-build-order/schema.ts:585-673`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/67/files#diff-d6dc7551ac06a7b81b7fba568c068b4b268bcf8ca3e62296c5031c1e4791558eR585-R673) - this is the only new code the live route runs. A difference in issue order, message path or default merge (for example, a `null` node amount, or a `trips` override that is not an object) would change the simulate route's 400 bodies or resolved inputs without any test noticing. Check it against the deleted `resolveSimInputs` in `validate.ts`.
- [`lib/aoe4-build-order/schema.ts:222-246`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/67/files#diff-d6dc7551ac06a7b81b7fba568c068b4b268bcf8ca3e62296c5031c1e4791558eR222-R246) - `nearestId` runs full Levenshtein against every catalog id, with no early exit on length. Nothing on the route reaches it yet. Once `checkBuildOrder` serves JSON build orders, one unknown id close to the 1 MB body limit costs about 2.7 s of CPU per request. Check that a length guard (`|len(value) - len(choice)| > threshold` skips the choice) lands before the route uses it.


## Non-blocking notes
1. Latent S3 cost for the route-swap ticket (SGS-075): `nearestId` (schema.ts:222-246) runs full Levenshtein with no length early exit. Measured: one 900k-char unknown id against 60 ids takes about 2.7 s of CPU. The route does not reach it today. Before `checkBuildOrder` serves JSON `buildOrder` bodies, skip a choice when `|len(value) - len(choice)| > threshold`, or cap the value length.
2. `resolveSimInputs` builds `buildOrderCatalog(data)` on every request (about 0.34 ms). The review report already notes this. SGS-075 plans one catalog per process.
3. The PR body lists the existing tests that were edited: step-options.test.ts (new `stepOptions names` describe) and the contract spec (`suggestion` rows).
