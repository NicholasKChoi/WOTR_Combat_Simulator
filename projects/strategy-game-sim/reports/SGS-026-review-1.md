# SGS-026 review 1

- Verdict: **APPROVE**
- Branch: sgs-026-aoe4-model-rally-start-types, tip 3726128509e9aca3c7f895f52feb2c52103e0a76, base 68e004a
- Reviewed in a detached worktree at the tip SHA. `origin/sgs-026-aoe4-model-rally-start-types` does not exist; the branch has not been pushed yet (the implementer report also says so).

## Blocking findings

None.

## Spec gaps

None.

## Contract

Compared `lib/aoe4-build-order/model.ts` with the design/M2.md Contracts block (lines 57-58, 63-64, 86):
- `rally` variant: `{ action: 'rally'; producer: string; instance?: number; to: GatherNodeId; walkSeconds?: number }`. Field for field the same, and it takes the shared optional `trigger` through the `{ trigger?: Trigger } &` intersection.
- `BuildOrder.start?: BuildStart`, placed between `source?` and `steps`. Matches.
- `BuildStart { villagers?: Partial<Record<GatherNodeId, number>>; rally?: GatherNodeId }`. Matches.
- `BuildOrderLines { start?: number; steps: number[] }`. Matches. The comment carries the design's wording: 1-based, `steps[i]` is the line of `order.steps[i]`, and no start means no start line.
- The `produce` comment drops "rally is required for villagers". It now says: no count means continuous production; rally only for villagers and sets the producer's rally; walkSeconds only with rally. The `produce` fields are unchanged.
- Design module table line 27 lists 18 exports, and the export-list test now expects those 18.
- Scope: no docs, parser, validator, simulator, route, `ValidateOptions`, `ParseTextResult` or `BuildOrderIssue` changes. Nothing under `golang/`. No invented constants.
- Consumers: `git grep` finds no code outside model.ts that narrows `BuildStep.action` or reads `BuildOrder` exhaustively. Only the export-list test references the type names, so adding the union variant breaks nothing.

## Acceptance criteria

1. PASS. The declarations match the design exactly (above), and so does the produce comment wording.
2. PASS. `lib/aoe4-build-order/model.test.ts` has the given `BuildOrder` with `start` and the time-30 rally step, plus a rally step without `to` under `@ts-expect-error`. `npx tsc --noEmit` exits 0. Mutation I ran myself: making `to` optional makes tsc fail with TS2578, unused directive, at model.test.ts:13. So the check can fail. It works under `strict: false` because missing required properties are still errors there.
3. PASS. The test title says 18, `BuildOrderLines` and `BuildStart` are in sorted position, and the no-runtime-export assertion is unchanged.
4. PASS. `npm test` ran 10 files and 128 tests, all passing. The `git grep -nE "^export (const|function|class|enum)"` on model.ts finds nothing (exit 1).
5. PASS. See invariants.

## Invariants touched

- A1: holds. No numeric literals in non-test code.
- A2, A3: not affected. Types only, no simulation logic.
- S1: holds. No imports added.
- S2, S3: not affected. No page and no runtime input.

## spec-checklist.md

- Contracts: CONTEXT.md Key surfaces names no AoE4 type names. The names match the design Contracts block.
- Scope and naming: pass. `rally` is a real action the design specifies, not an aspirational value.
- S1-S3, A1-A3: as above. W and H sections don't apply.

## Linter

`npx tsc --noEmit`: exit 0, no findings. There is no ESLint config.

## Review bot

`reviewBot.cli` and `rulesFile` are empty in REPO.md, so no bot ran and nothing needs reconciling.

## Conventions

- model.ts comment placement (a `//` line above each union variant) and 2-space indentation match the existing variants (`build`, model.ts:17-18).
- model.test.ts uses 4-space indentation and a `describe`/`it` layout. A comment explains the compile-time-only enforcement, which matches the sibling pattern in data.acceptance.test.ts:267-274 ("rejects Map mutation at compile time"). It uses `void [order, noTarget]` instead of the sibling's token `expect(typeof ...)`. That is fine: the sibling's expect asserts nothing real either.
- The file is named `model.test.ts`, beside `data.test.ts` and `effects.test.ts`, and is picked up by the vitest include `lib/**/*.test.ts`.

## Correctness

Types only. There are no operators, branches, resources or concurrency to check.

## REPO.md Review checklist

- Every diff: `npm ci && npx next build` exits 0, and the route list is unchanged. The diff touches no page, so there was no page to load under `npm run dev`. `lib/aoe4-build-order` has no page or route consumer on main.
- No section with `Paths:` covers `lib/aoe4-build-order/**`; the AoE4 app has no review-checklist section yet. Not a blocker.

## Non-blocking notes

- model.ts:14, the comment on the `rally` variant, reads "Rallies villagers that start from this step on; costs nothing." A reader could take "villagers that start" to mean starting villagers. The design (M2.md:129-132) means villagers that spawn after the step's `startedAt`; ones already spawned are not re-routed. A clearer version: "Sets the rally for villagers spawned from this step's start on; costs nothing." Optional.
- docs/aoe4-build-order.md:254 still shows `BuildOrder` without `start`, and its `produce` row still says rally is required. SGS-025 owns that, as the ticket says.

## Coverage

Files reviewed: lib/aoe4-build-order/model.ts (full), lib/aoe4-build-order/model.test.ts, and the data.acceptance.test.ts hunk with its sibling test. Also checked tsconfig.json, vitest.config, and design/M2.md Contracts and Rally and start. Commands run: npm ci, tsc, npm test, next build, export grep, and one mutation, which I reverted; the tree was clean afterwards. Nothing was left unreviewed. No processes were left running.
