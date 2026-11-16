# SGS-176 implementer report 1

- Ticket: SGS-176, branch `sgs-176-lib-export-doc-comments`, base `origin/main` (d144e01)
- Tip SHA: 8484866049756b092a3e56f1083e23d229af52cd (one commit)
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-176-lib-export-doc-comments`

## Files touched
36 files under `lib/`, comments only (291 insertions, 49 deletions; the deletions are existing comments above exports folded into the new `/** */`).
- `lib/combat-simulator/`: `army.ts`, `battle.ts`, `simulate.ts`, `fight-api.ts`.
- `lib/aoe4-build-order/`: `api-route.ts`, `api.ts`, `blob-build-store.ts`, `build-store.ts`, `builds-routes.ts`, `builds.ts`, `civ-rules.ts`, `construction.ts`, `data-schema.ts`, `data.ts`, `depletion.ts`, `effects.ts`, `engine-common.ts`, `english-catalog.ts`, `format-time.ts`, `gather.ts`, `houses.ts`, `landmarks.ts`, `markers.ts`, `model.ts`, `named-builds-routes.ts`, `named-builds.ts`, `parse-text.ts`, `production-buildings.ts`, `production-floors.ts`, `research.ts`, `save-rate-limit.ts`, `saved-builds.ts`, `schema.ts`, `simulate.ts`, `step-options.ts`, `text-to-build.ts`.

## Coverage
- A scratch check listed every top-level `export` in the file set (no `*.test.ts`, no test-support modules) not preceded by a comment: none. Re-exports (`export type {...} from`) skipped.
- 7 exports keep their existing `//` comment because it already states the job (exemption b): `refusedSaveSlot`, `disallowedMethod` (builds-routes.ts), `shortText`, `BuildOrderLines` (model.ts), `researchEntry`, `convertUnits` (research.ts), `triggerWakeAt` (simulate.ts).
- Existing comments above other exports were folded into a `/** */` with their fact kept (for example `SIM_INPUT_BOUNDS`, `RESOURCE_TOLERANCE`, `buildGameData`, `sendReply`, `BLOB_SDK_RETRIES`, `UnitSeries`, `resolveUnitEntry`); those few stay multi-line to keep the rationale.
- Diff check (scratch script over `git diff -U0 origin/main`): every added or removed line is a comment line; no code line changed; nothing outside `lib/`.
- Every quoted section heading exists verbatim as a `##`..`####` heading in the matching doc. Headings used: combat-simulator.md: Armies, Round order, Casualties, Input bounds, Number of battles N, Independence of battles, Outcome reporting, Extension points. aoe4-build-order.md: Model rules, Data sources, Depletion, Technologies, Severity, Build order input, Route, Builds routes, Named builds routes, Outputs, CivRules seams, Determinism bounds and resources (as "Determinism, bounds and resources"), Saving a build and opening it by link, Extension points. I dropped one `(Page)` citation (step-options.ts) because the doc never mentions step options.
- No ticket ids, invariant numbers or factory file names in the comments (grep of added lines).

## Tests and stages
- `npx tsc --noEmit`: pass. `npm run lint:dup`: 0 clones.
- `npm test`: 84 files passed, 1 skipped; 2609 passed, 15 skipped, 0 failed (after the fix below).
- `npx next build`: pass.
- Codegen: not set. No test file edited; no new tests (comments only), so no mutation checks apply.
- First run had one failure: `simulate.test.ts` "has no numeric literal beyond 0, 1, 60, the sample step and the one shared tolerance". It strips `//` comments and string literals by regex and reads `/** */` text as code, so an apostrophe in a comment in `simulate.ts` swallowed the `5` of `SAMPLE_SECONDS`. I reworded the five affected comments (`simulate.ts` x4, `civ-rules.ts` x1) to contain no apostrophes. Test unchanged. Future comments in `simulate.ts` and `civ-rules.ts` must avoid `'` and backticks for the same reason.

## Doc claims (quoted sentences made true by code)
Each comment was written from the symbol's body read in this pass. Claims that go beyond the name, with their source: `sameSecretHash` "in time that does not depend on where they differ" (`named-builds.ts:sameSecretHash`, XOR loop; it returns early on a length mismatch); `buildStoreFromEnv` "creates the process's store once and reuses it" (`processStore ??=`); `savedBuildId` "first 11 characters of its hash" (`ID_LENGTH`); `isDepleted` "a ref with infinite or no stock never has" (`remaining === 0` with `?.`); `NAMED_BUILD_VERSION` "The format version of a named build." (symbol has no users in `lib/`, comment states only its name's meaning).

## Out-of-scope findings
- `NAMED_BUILD_VERSION` (named-builds.ts) is exported but referenced nowhere in `lib/`, `pages/` or `components/`.
- `lib/aoe4-build-order/simulate.test.ts` source-shape test scans comment text as code (see above); a comment-aware scan would remove the apostrophe restriction.

## Invariants
W1/W2 and the AoE4 simulation invariants are adjacent by path only; no code changed, so all upheld.

## Unverified assumptions added
None.

## Status
`needs_review`
