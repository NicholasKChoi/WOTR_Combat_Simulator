# SGS-128 implementer report 1

Status: needs_review

- Ticket: SGS-128. Branch: `sgs-128-shared-test-helpers-and-jscpd-gates`. Base `origin/main` (cdc51b1).
- Tip SHA: 16efd1acbbd7e7fc7bbef2dc6acdf37a35cc1f6d (one commit).
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-128-shared-test-helpers-and-jscpd-gates`

## Files touched
- `.jscpd.json`: `acceptance` added to `path`.
- `.jscpd.tests.json` (new): same paths, minLines 5, minTokens 70, threshold 0, pattern `**/{*.test.ts,*.spec.ts,*test-helpers.ts,route-test-support.ts,acceptance/helpers.ts}`.
- `package.json`: `lint:dup` is `jscpd && jscpd --config .jscpd.tests.json`.
- `ARCHITECTURE.md`: copied-code rule describes both configs and lists the four shared helper files.
- `components/apps/aoe4-build-order/storage-test-helpers.ts` (new): `fakeStorage(entries)`, `throwingStorage`.
- `components/apps/aoe4-build-order/storage-test-helpers.test.ts` (new): helper tests.
- `pin-storage.test.ts`, `chart-layout.test.ts`, `my-builds-storage.test.ts`: local fakes removed, shared helpers imported, seeding via `fakeStorage({ [KEY]: raw })`; partial throwing storages are `Object.assign(fakeStorage(), { setItem: throwingStorage.setItem, ... })`.
- `saved-build-loader.test.ts`: local `stubFetch` and `json` removed; uses `stubFetch`, `reply`, `lastCall` from `fetch-test-helpers.ts`.
- `simulate-client.test.ts`: local argument-free `stubFetch` removed; uses `stubFetch(reply({}))` and `lastCall`.
- `lib/aoe4-build-order/route-test-support.ts`: now exports `getterFor`, `rejectingGetter`, `withBroken`, `bigSource`, `INVALID_SAVE_BODIES` (the 5 rows both route tests shared).
- `builds-routes.test.ts`, `named-builds-routes.test.ts`: import those (named adds its own `a string body` row first).
- `lib/aoe4-build-order/production-floors.ts`: new pure `productionChecks(floors, result, sample, countOf)` returning `{ atLeast, atMost }` tuples `[label, actual, bound]`; imports neither runner.
- `lib/aoe4-build-order/production-floors.test.ts` (new): tests `productionChecks`.
- `lib/aoe4-build-order/builds.test.ts` and `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts`: the 1200 s floor and floating-cap checks call `productionChecks` and assert each tuple with their own `expect` (same assertions: `toBeGreaterThanOrEqual` on floors, `toBeLessThanOrEqual` on the cap).
- `acceptance/helpers.ts`: added `submitFight`, `WARM_UP_TIMEOUT_MS`, `Reason`, `Timing`, `saveBody`, `plotPoint`, `TWO_UNKNOWN_IDS`, `fillTwoUnknownIds`.
- `acceptance/openapi-schemas.ts`: added `keys`, `Examples`, `examples`, `expectBody`, `referencedSchemaNames` (app-neutral, data as arguments).
- Acceptance specs folded: `combat-simulator`, `fight-api-caps` (`submitFight`); `fight-api-contract`, `aoe4-simulate-api-contract`, `fight-api-spec-surface`, `aoe4-builds-api-contract`, `aoe4-named-builds-api-contract` (openapi-schemas); `aoe4-simulate-api-triggers`, `-waits` (shared types and warm-up constant); `aoe4-simulate-api-prebuilt-farms`, `-prebuilt-plans` (dropped local `simulate` wrapper, use `simulateOk<Result>`); `aoe4-simulate-api-knight-longbow-build`, `-spear-longbow-build` (one-line wrappers over `simulateOk`); `aoe4-simulate-api-edges` (`issuesOf` built on one `rejected`); `aoe4-named-builds-api`, `-create` (`saveBody`); `aoe4-step-annotations` (local `legendColors`, `openLongestBuildTable`); `aoe4-compact-view` (local `caretThenHoverThenLeave`); `aoe4-chart-readability`, `aoe4-gather-rates-per-villager` (`plotPoint`); `aoe4-build-order-pin-compare` (local `pinAndExpectLabel`); `aoe4-build-order-client-check`, `-inline-issues` (`fillTwoUnknownIds`).

Files edited with a pre-existing test: the three storage tests, `saved-build-loader.test.ts`, `simulate-client.test.ts`, `builds-routes.test.ts`, `named-builds-routes.test.ts`, `builds.test.ts`. Only setup changed, same cases and assertions (named routes keep all six rows; builds-routes keeps its five).

## Local fetch helpers kept
- `auto-run.test.ts`: `reply(status, body)` and `unreadable(status)` build a `Response`-shaped object directly (return a `Response`, not a `() => Promise<Response>` respond function). No `stubGlobal('fetch'` appears in that file.
- None other in test files.

## Tests
- `npm test`: 74 files, 2351 passed, 13 skipped (pre-existing skips), 0 failed.
- New: `storage-test-helpers.test.ts` (9 cases: each `throwingStorage` member and `length` throws; `fakeStorage` returns seeded entries, reflects `setItem`, `removeItem`, `clear` in `getItem`/`keys()`/`length`, and does not alias its seed or share state). `production-floors.test.ts` (2 cases: tuple pairing of counts, food rate, floating amounts at the sample).
- Acceptance harness (changed, so run once per common.md): ran the touched API specs (350 passed) and the touched UI specs (98 passed) with Playwright. Not the whole acceptance suite.

## Doc claims
- ARCHITECTURE.md: "`npm run lint:dup` runs two jscpd configs and fails if either finds a clone" (package.json `lint:dup` is `jscpd && jscpd --config .jscpd.tests.json`, `&&` stops at the first failure so the second config is not run after the first fails; the claim is still true that the command fails). "`.jscpd.json` checks the AoE4 lib, components, API route and `acceptance/` for blocks of at least 8 lines and 70 tokens" (`.jscpd.json`). "`.jscpd.tests.json` checks the same paths, limited to test files and test helpers, for blocks of at least 5 lines and 70 tokens" (`.jscpd.tests.json`). Helper list matches the four files that exist.
- Comments added: `plotPoint` ("The point at `fraction` of a chart's plot width, halfway down, in page coordinates."), `submitFight` ("Clicks Fight! and waits for the 200 response from /api/fight."), `fillTwoUnknownIds`, `referencedSchemaNames`, `productionChecks` ("Each runner asserts atLeast with toBeGreaterThanOrEqual and atMost with toBeLessThanOrEqual."); each matches its function body. `WARM_UP_TIMEOUT_MS` comment moved from the specs.

## Pinned outputs
None.

## Mutation checks (all undone; tree clean after)
- `storage-test-helpers.ts` `clear: () => map.clear()` to a no-op: "reflects setItem, removeItem and clear..." failed (`expected [ '2', ['b','c'], 2 ] to deeply equal [ null, [], 0 ]`).
- `throwingStorage.key: blocked` to `() => null`: "throws from key" failed (`expected [Function] to throw`).
- `length` getter `return blocked()` to `return 0`: "throws from length" failed.
- `fakeStorage` ignoring `entries`: "returns the seeded entries" and "reflects..." failed.
- `production-floors.ts` food floor to 0 and floating sample index to 0: the two `productionChecks` tests failed on their named assertions.
- `builds.test.ts` floor assertion made `floor + 100000`: the 1200 s floors test failed (`villager: expected 51 to be greater than or equal to 100050`).
- `my-builds-storage.test.ts` removeItem-throws row replaced with a non-throwing function: "is false when removeItem throws" failed (`expected true to be false`).
- `route-test-support.ts` row `durationSeconds: 59` to 600: both route tests for that row failed ("expected the body to be refused").
- Not mutated: fetch conversions (`saved-build-loader`, `simulate-client`) and acceptance fold helpers; those are covered by the existing tests that now run through them (they pass; acceptance specs ran green).

## Probe (reviewer's, run by me, not committed)
Pasted the `fakeStorage` body into `components/apps/aoe4-build-order/probe.test.ts`: `npm run lint:dup` exited 1 with a clone naming `probe.test.ts` and `storage-test-helpers.ts`. File removed.

## Codegen, build, lint
- codegen: none set.
- `npx next build`: succeeded.
- `commands.lint` (`npx tsc --noEmit && npm run lint:dup`): tsc clean; lint:dup `Found 0 clones` for both configs. Baseline measured 19 clones in the tests config; all folded.
- Acceptance grep criteria: `git grep "function fakeStorage\|throwingStorage =\|const throwing =" -- '*.test.ts'` empty; `git grep "function stubFetch\|stubGlobal('fetch'"` only `fetch-test-helpers.ts`. No `ignore` entry or `jscpd:ignore` in the configs or scanned files.

## Invariant check
- S1: no spec imports another spec. Cross-app folds (`openapi-schemas.ts`: `keys`, `examples`, `expectBody`, `referencedSchemaNames`) import nothing from `components/apps`, `lib/<app>/` or `data/<app>/`. The `combat-simulator` and `fight-api-caps` fold is `submitFight` in `acceptance/helpers.ts` (WOTR helper beside existing WOTR helpers). `helpers.ts` already imported AoE4 code before this change.
- The Vitest/Playwright fold: `productionChecks` lives in `lib/aoe4-build-order/production-floors.ts`, which both runners already imported, and imports neither `vitest` nor `@playwright/test`.
- A1-A3 untouched (no engine change). `productionChecks` is test-support logic added to a lib module the ticket's "no production code" note did not name; the ticket's Scope names a module "both runners can import" and this is that module.

## Notes
- `ticket "Unverified assumptions"`: none added.
- `route-test-support.ts` `bigSource` reads `listBuilds()[0]` at import time, as both route tests already did.
- `aoe4-compact-view.spec.ts` has a pre-existing unused `bands` const (not mine, left).
- An earlier `tsc --noUnusedLocals` check found two unused `APIRequestContext` imports I caused; fixed.

## Out-of-scope findings
- None beyond the pre-existing unused `bands` const above.
