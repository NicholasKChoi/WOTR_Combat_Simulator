# SGS-080 implementer 2 (Rework 1)

- Ticket: SGS-080, rework pass for "## Rework 1" (review-1). All 5 Required-fixes boxes are ticked in the ticket.
- Branch: `sgs-080-aoe4-one-villager-per-farm`, tip `123936b` (on top of `61590e2`), base `origin/main` `1bdf1d6`. Not pushed.
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-080-aoe4-one-villager-per-farm`

## What happened

An interrupted earlier pass left uncommitted edits in 5 files. I checked each one against the checklist. All of them matched the required fixes exactly, so I made no further changes and committed them as they were.

## Files touched (commit 123936b)

- `docs/aoe4-build-order.md`: the Idle villagers sentence is now the exact text the review asked for.
- `acceptance/aoe4-simulate-api-depletion-engine.spec.ts`: "infinite nodes > farm and wood never run out over an hour" now starts with `{ villagers: { wood: 6 }, rally: 'wood' }` and has steps `[PAUSE, farm, farm, farm]`, where `farm` is `build farm from wood then farm`. The assertions are unchanged. This is a Scope 5 edit: the test built its own order with 3 farmers and no farm.
- `acceptance/aoe4-simulate-api-contract.spec.ts`: `'farm-idle'` is added after `'idle-arrival'` in the pinned SimWarning code list. `WarningKeys<'farm-idle'>` with `{ code, severity, message, at, idleVillagers }` is the third entry of `simWarningVariants`, in both the type and the value.
- `acceptance/aoe4-gathered-resources.spec.ts`: the version pin and the test title change from 2.1.0 to 2.2.0.
- `acceptance/aoe4-simulate-api-issue-shape.spec.ts`: the version pin and the test title change from 2.1.0 to 2.2.0.

## Pre-existing tests edited (this pass)

- `acceptance/aoe4-simulate-api-depletion-engine.spec.ts:infinite nodes > farm and wood never run out over an hour`: the setup now builds 3 farms, and the expected values are kept. Allowed by Scope 5 (a test that builds its own order with farmers but no built farms builds the farms in its setup).
- `acceptance/aoe4-simulate-api-contract.spec.ts:every SimWarning variant is closed ...` and `SimWarning variant keys match the schema variants`: `farm-idle` is added to the pinned lists. Allowed by the Rework 1 checklist (the new OpenAPI variant is part of the ticket's scope).
- `acceptance/aoe4-gathered-resources.spec.ts:is a documented required property ... at version 2.2.0` and `acceptance/aoe4-simulate-api-issue-shape.spec.ts:suggestion is an optional string property and the document version is 2.2.0`: version pins. Allowed by the Rework 1 checklist and by the Scope 4 bump to 2.2.0.

## Doc claims

- "Nothing moves them on its own, except that a farm that completes takes villagers waiting idle at `farm` (below); `move` and `build` take them from their node like gatherers." This is the text the review gave, applied word for word. It is true by `simulate.ts` `completeConstruction` -> `fillSlots` (moves idle villagers to gatherers at the node the completed building creates) and by `sendWalking`, which takes from idle and from gatherers.

## Tests run (Node 24.22.2 via nvm)

- `npx tsc --noEmit`: exit 0.
- `npm run lint:dup`: "Found 0 clones."
- `npm test`: 2 failed, 1335 passed, 10 skipped. Both failures are the known shipped-build ones and belong to SGS-081:
  - `lib/aoe4-build-order/builds.test.ts > ENG Spear/Longbow into MAA/Crossbow > reaches Castle, with the opening army before the Castle landmark and the transition after it`
  - `lib/aoe4-build-order/research.acceptance.test.ts > the Knight/Longbow build converts its longbowmen when veteran longbowmen completes > holds 12 tier-2 longbowmen just before completion and moves them all to tier 3 at it`
- `npm run acceptance`: 6 failed, 696 passed. These are exactly the 6 shipped-build failures the checklist says to leave alone for SGS-081, and they are not edited:
  - `aoe4-build-order-knight-longbow-page.spec.ts:12` (a farm-idle warning now appears)
  - `aoe4-simulate-api-spear-longbow-build.spec.ts:34` at 1200 s and at 3600 s
  - `aoe4-simulate-api-spear-longbow-build.spec.ts:43`
  - `aoe4-simulate-api-veterancy-conversion.spec.ts:38`
  - `aoe4-simulate-api-veterancy-conversion.spec.ts:44`
- The three review-1 findings in the acceptance suite (depletion-engine hour, two contract-spec failures) and the two version pins now pass.

## Mutation checks

- I wrote no new unit tests in this pass. The edits are acceptance pins and a setup change.
- The reason the hour-long case's setup change matters was shown by review-1: without built farms, the test fails with a `farm-idle` warning and zero food.

## Codegen / build / lint

- Codegen is not set.
- I did not rerun `npx next build` in this pass because no source changed. Review-1 ran it on `61590e2` and it passed.
- Lint is clean (see above).

## Process cleanup

- No dev server or listener is left running. Playwright started and stopped its own server.

## Invariants

- No engine code changed in this pass, so A1, A2, A3 and S3 are as review-1 found them: upheld.

## Out-of-scope findings

None.

## Status

`needs_review`
