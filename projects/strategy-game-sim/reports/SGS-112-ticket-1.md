# SGS-112 ticket, re-spec 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-112-server-debt-typed-replies-fail-closed.md

## Summary

SGS-112 "Fix builds-route debt: typed replies, one issue cap, one counter step, fail-closed env, id failure 500", component aoe4-build-order, M8.6 / M8.7 / M8.8, risk high, about 200 business-logic lines, no dependencies, On merge none. Re-spec folds in spec-gate round 1 (all three gaps and the actionable notes). The design/M8.md revision changed only C1 id samples, C5 timestamps, C6 library rows, C11 run-bar height and C8/C12 page rows; C2, C3 and the Debt table that this ticket implements are unchanged, so no contract name moved.

## Changes

- Gap 1: Scope "OpenAPI" now says "add" a 500 (none exists today) with schema, description and example. New Scope paragraph for `acceptance/aoe4-builds-api-contract.spec.ts`: the `saveBuild` key list gains `'500'` and the no-live-reproduction test also validates the new 500 example as `BuildsError`. Criterion reworded to "passes after that edit" (respec 1).
- Gap 2: "Tests to update" adds the export-list rule and names `build-store.acceptance.test.ts` (`build-store exports exactly the documented names` gains `nextCounter`); its `takeSaveSlot` end-to-end case is stated to need no change. New criterion (respec 1). No other export-list test covers a module this ticket changes (checked `git grep "exports exactly"`).
- Gap 3: Docs scope names the `docs/aoe4-build-order.md` reply table with the exact row `| 500 | the build id could not be created | try again later |`, and the Builds routes bullets (fail-closed DELETE, refused save writes nothing); grep terms gain `500`. Docs criterion tagged (respec 1).
- Notes: `deploymentEnv` rows go in `saved-builds.test.ts`, `storeFor` fail-closed cases in `build-store.test.ts` (criterion respec 1); GET body is the inline `SavedBuild & { id: string }`, no new exported name; handlers may use explicit `sendReply<Union>` but never cast (tsc criterion respec 1).

## Checks run

- `git grep "count + 1"` at origin/main: only `build-store.ts` and `blob-build-store.ts` (end state: build-store.ts only).
- `git grep MAX_REPORTED_ISSUES` non-test at origin/main: `api.ts`, `saved-builds.ts`, `simulate.ts` (end state: `api.ts`, `api-route.ts`).
- `function recordingTarget`: `api-route.test.ts`, `builds-routes.test.ts` today; `route-test-support.ts` only after.
- `storageEnv(process.env` in pages: `builds/[id].ts` today; none after.
- Contract spec line pins `['200','201','400','405','413','429','503']`, confirming the new 500 breaks it until edited.
- ticket-lint: clean.

## Diagrams

Existing read/act/record flowchart of the save route kept (order of operations changes).

## Open questions

none

## Overlap

The later named-build tickets reuse `errorReply`, `storageUnavailable`, `idFailure`, `nextCounter`, `deploymentEnv` and bump OpenAPI to 2.5.0; this ticket keeps 2.4.0 and only adds the `saveBuild` 500, so those tickets must extend (not reset) the contract spec's key list.
