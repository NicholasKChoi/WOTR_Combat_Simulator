# SGS-075 spec gate 3

Verdict: READY (checked against origin/main 028fc43, which contains schema.ts and text-to-build.ts)

Verified against the real code:
- 13 `/validate` import lines in 12 files, same list as the ticket; `validateBuildOrder` hit counts match (37 lines, 10 files); route has 4 matching lines; `validate.ts` still re-exports `SIM_INPUT_BOUNDS`, `nodeRefIssue`, `resolveSimInputs`.
- schema.ts: `nearestId` at 234-246 as stated, full `editDistance` per choice, threshold `Math.max(1, floor(len/3))`; the early-exit bound is sound (edit distance >= length difference) and preserves results and tie order. `isKnownId`, `isBoundKey`, `issue` are exported and nothing outside schema.ts/validate.ts imports `isKnownId`/`isBoundKey`; 3 export lines before the change, as the criterion says. `BuildOrderCatalog` has `units` and `inputDefaults`. `z.ZodType<Trigger|BuildStep|BuildStart|BuildOrder>` annotations exist and are what Scope 3 removes.
- model.ts declares the four types at 53/60/74/83 (4 grep lines). data.acceptance.test.ts:310 has the "29 documented types" title.
- `textToBuildOrder` emits `text: N characters, more than 20000` (out-of-range), matching the route criterion; the route still has the inline check, `parseBuildOrderText` and `SIM_INPUT_BOUNDS` (4 grep lines).
- docs: `validateBuildOrder` appears once (diagram, line 618); no `validate.ts` hit. Docs have no `suggestion` text yet.
- Other checks (invariants S3/A1/A3, contracts, size, diagrams, risk high, decisions, on merge, no open questions) unchanged from gate 2 and still hold. Re-spec 3 and 4 content is concrete and testable (mutation check on the 900,000-char test, rule for existing tests, hand-built catalog rule, un-export criterion).

## Notes (non-blocking)
- Doc line numbers have drifted on origin/main: Issues section is at 567 (ticket says 564), diagram around 615-620 (ticket 614-619), "validation rules in Issues" at 273 (270), "validation kind table" at 893 (877). The ticket says to grep, so the implementer will find them.
- Scope 7 and 8 say "on the SGS-057 branch"; SGS-057 is merged, so read it as origin/main (same lines).
- Scope heading says paths cite `origin/main d5c2549`; counts still hold on 028fc43.
