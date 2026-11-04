# SGS-089 acceptance-test 1: PASS

Branch sgs-089-aoe4-engine-guard-crashes-hangs. Prior tip 294a9f6, new tip c9f592b7097dca2547af623d39ffbd23808a2bff (one test file added).

Harness: vitest, calling the real Next handler `pages/api/aoe4-build-order/simulate.ts` with a minimal req/res (no API test existed). Ran; tsc clean, lint:dup clean, `vitest run lib/aoe4-build-order` 32 files / 1091 passed, 10 skipped.

## Tests (lib/aoe4-build-order/simulate-api.acceptance.test.ts, 7 cases)
- Per shipped build (3): API answers 200 and body JSON equals direct `simulateBuildOrder` with default inputs.
- Per shipped build (3): API answers 200 with `autoHouses: false` (no production-time or rally error).
- API answers 400 (not a throw/500) for a build whose `start` is `{}`: validation keeps the rally TypeError path unreachable.

## Shipped builds unchanged (A3)
Throwaway test run on b9481e3 (detached worktree) and on the branch, outputs compared with cmp: ENG 1TC (list 0) identical 56732 B, Spear/Longbow into MAA/Crossbow identical 62331 B, Knight/Longbow identical 65702 B (listBuilds order). Scripts and outputs not committed; worktree removed.

## Mutation checks (all failed as expected, all reverted via git checkout)
- simulate.ts guard `seconds > 0` -> `seconds > 100`: 6 of 7 failed (API throws).
- simulate.ts `if (!rally)` -> `if (rally)`: 6 of 7 failed.
- schema.ts:487 `startVillagerProducers.length > 0` -> `> 99`: the 400 test failed.

## Notes
- Ticket unit tests in simulate.test.ts (guard rows, houseDemand pair, rally rows, supply-wait) are the implementer's, not duplicated; the full lib suite passes.
- Not expressible at the API: both guards themselves (validated requests cannot reach them); thrown-Error-to-500 behaviour left unchanged per ticket.
- No impl-defects, spec-gaps or blockers.
