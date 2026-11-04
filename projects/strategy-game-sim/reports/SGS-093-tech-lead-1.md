# SGS-093 tech-lead 1

Decision: **APPROVE, draft PR opened** (no blockers, no untested hotspots)

PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/94 (#94), base `main`, head `sgs-093-aoe4-docs-prebuilt-cleanups` @ 26eebf9e2942894622c1232ba60d744fa5d428cb, draft. Not stacked, so it has no footer. The body was set through `gh api -X PATCH` and verified.

## Merge risk
**medium** - edits the public OpenAPI document (the simulate 200 `example` becomes an `examples` map). The schemas are unchanged, so the change is backward-compatible, and a revert undoes it.

## Review focus
No hotspots: the code changes are tests only. The one build-data edit removes a rally step that leaves the simulated result unchanged. The existing build-quality cases and the timeline digest pin the build, and the contract spec checks both new OpenAPI bodies against the live engine.

## What I reviewed
- Range: origin/main fcfbaf1..26eebf9 (3 commits: b2ddc5f, 6f999ef, 26eebf9).
- 8 files, +1387/-446. That is almost all `docs/api/openapi.json` (+1293/-365): recorded engine output and re-indentation of the existing body. Hand-written: README +54/-56, doc +11/-10, build JSON -9, OpenAPI request example +46. Tests: contract spec +19/-4, spear spec 1/1, builds.test +8, house-warnings digest 1/1.
- I read INVARIANTS (A1, A3 apply), the CONTEXT open questions (none), the ticket, implementer-1/2 and suite-1.

## Checks
- Invariants: A1 holds (no game numbers move). A3 holds: the removed 380 s TC rally was compared at 1200 s and 3600 s with the result unchanged (implementer-1). The comparison ran before the rebase, but the main commits since (#90, #91, #92) are a spec removal, UI changes and test helpers, with no engine change. The gold `depletedAt` pin and the King's Palace digest still match on the rebased tip (suite-1 PASS).
- The spear digest change (1cead3b6a8f33aa3 to 95876b5e98214174) is expected, since the hashed `steps` array is one entry shorter.
- Contract: no reader of the simulate 200 `example` remains. I grepped `responses['200']` repo-wide: only `fight-api-contract.spec.ts` reads `.example`, and that is the fight operation, which is untouched. The OpenAPI file is not served (`GET /docs/api/openapi.json` is 404 by spec), so no external consumer reads the key that changed.
- Spear step-index consumers: the only index pin was `MAN_AT_ARMS_STEP` (35 to 34). prebuilt-plans locates by unit. localStorage on the page stores the user's own runs, not prebuilt indices.
- Knight README claim checked against `english-knight-longbow.json`: `build house` at steps 1, 7, 21, 22, 23 and `build kings-palace` at 27. "A block just before the King's Palace" is accurate enough (three steps sit between them).
- No security, concurrency, irreversibility or open-question issues.

## Non-blocking notes
- `simulate-house-warnings.test.ts:167` still carries the comment "Re-pinned for the house lead-time rule" above the spear row, which no longer explains the current pin (noted by the implementer).
- `MAN_AT_ARMS_STEP` stays an index constant rather than locating the step by action and unit, as the ticket preferred. It is correct now but will go stale again on the next edit to the build.
- `next build` and the full acceptance suite were not run after the rework. This is a data/doc/test-only diff, and the Vercel preview check covers the build.
