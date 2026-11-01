# SGS-026 acceptance-test 1 (written by manager from the agent's returned text; agent wrote no report file)

Verdict: PASS. Committed d64cb50 on sgs-026-aoe4-model-rally-start-types (not pushed).

Test file: lib/aoe4-build-order/model.acceptance.test.ts (type-level; enforced by `npx tsc --noEmit` via @ts-expect-error).
Pins: BuildStart/BuildOrderLines/BuildOrder.start optionality; rejections for non-GatherNodeId rally/to/villager keys, non-number counts, missing steps, rally without producer; rally step accepts instance, villagers trigger, no trigger/walkSeconds; produce unchanged.

Runs: tsc --noEmit pass; vitest lib/aoe4-build-order 5 files / 61 tests pass. No lint config in repo.
Mutations (each failed tsc, reverted): steps optional; start.rally string; villagers Record<string,string>; start required; rally producer optional; rally `to` optional (caught by model.test.ts).
Failures: none. Not tested: comment wording; runtime exports covered by data.acceptance.test.ts.
