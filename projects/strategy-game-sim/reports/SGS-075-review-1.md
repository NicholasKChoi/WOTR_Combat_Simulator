# SGS-075 review 1

- Branch: `sgs-075-aoe4-delete-validate-route-check` (local only, reviewed by SHA)
- Tip: `9b22b0cf89d3d66784e8f0da3f9a63e0919911c6`, base `028fc43` (main now `a30fbfd`)
- Diff: 20 files, +583 / -1422
- Verdict: **APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | no `from '.../validate'` imports; the three validate files are gone | pass | the grep prints nothing; `ls lib/aoe4-build-order/validate*` finds no file |
| 2 | `validateBuildOrder` is gone outside golang | pass | `git grep -n validateBuildOrder -- . ':!golang'` prints nothing |
| 3 | route uses the new checks; the 20000 cap still holds | pass | the route grep prints nothing. Against `next start`: 20001 chars gives 400 `text: 20001 characters, more than 20000` (out-of-range). 20000 chars reaches conversion and validation (400 with a `start` rule issue, not the cap) |
| 4 | route behavior unchanged apart from the documented rules | pass | every `aoe4-simulate-api*.spec.ts` passed with no expectation edits. A `buildOrder` with unit `knigt` from `house` returns `unknown-id` with `suggestion: "knight"` and no `house cannot produce` issue for that step, while step 1 (`villager from house`) still gets its cross-field issue. Text `start 6 sheep -> sheep\nproduce knigt from stable` returns `line 2: unknown unit "knigt" in unit`, `suggestion: "knight"`. 405, the exactly-one rule and `text: must be a string` are unchanged |
| 5 | `model.ts` re-exports the four types; the type list has 25 entries | pass | the grep prints nothing; line 52 is `export type { BuildOrder, BuildStart, BuildStep, Trigger } from './schema'`; `data.acceptance.test.ts` passes |
| 6 | `buildOrderFrom` added; data loads lazily | pass | `aoe4-build-order-from.spec.ts` passes. No top-level value import of `data` in `helpers.ts`. A throwaway spec ran `fight-api-validation.spec.ts` (80 tests) through `helpers.ts` and then dumped `require.cache`: `english=0 data=0 helpers=1` |
| 7 | `builds.test.ts` uses `checkBuildOrder(build, buildOrderCatalog(ENGLISH))` | pass | in the diff; `npm test` passes |
| 8 | validate cases migrated or dropped; `lint:dup` clean | pass | `npm run lint:dup` finds 0 clones. The dropped cases (module export list, `textChars.max`, the nodeRefIssue message case moved as "reason names the ref") and the re-specified shape-issue case are listed in the implementer report |
| 9 | docs name no removed symbol; Issues section and diagram updated | pass | the grep prints nothing. The Issues section documents `suggestion?`, the three check tiers, the issue order, and that an unknown action hides trigger issues. The diagram shows `textToBuildOrder`, `checkBuildOrder + checkSimInputs` and `buildOrderCatalog` |
| 10 | `schema.ts` exports shrink as specified | pass | both greps print nothing; `issue` is now private |
| 11 | specs that depended on the old order are edited (respec 3) | pass | none needed editing: the API suite passes unchanged. The unit-level re-spec is listed by the implementer |
| 12 | `nearestId` early exit | pass | `Math.abs(wanted.length - candidate.length) > threshold` at `schema.ts:230`. The reference-equality and 900k tests pass. Mutation check: with the line removed, the 900k test fails (2291 ms) and the 10 reference cases still pass. File restored |
| 13 | tsc, unit tests and acceptance pass | pass | `tsc --noEmit` exit 0. `npm test`: 40 files, 1184 passed, 8 skipped. `npm run acceptance` (Node 24, port 3827): 572 passed, 1 timeout in `aoe4-step-table.spec.ts:190`, which passed 3 of 3 on `--repeat-each 3` (36/36 for the file). The log shows a dev-server `Unexpected end of input` during the full run, so this looks like load flake, not this diff. The implementer had 573/573 |
| 14 | no INVARIANTS regressions | pass | see Invariants below |

## Differential check (old `validateBuildOrder` at `a30fbfd` vs new `checkBuildOrder`)

The harness used a seeded generator to produce shipped, mutated and generated orders. It compared the old validator, run in the old-main worktree, with the new `checkBuildOrder(order, buildOrderCatalog(ENGLISH))`.

- **JSON path, 5003 cases**: 0 accept/reject disagreements (old-only-ok 0, new-only-ok 0). Breakdown:
  - 1020 accepted by both.
  - 2361 identical issue lists.
  - 130 with the same issues in a different order. Every one is either a cross-step issue moved last, or `steps: must be an array` moved ahead of `start` issues. Both follow design C3: civ, name, steps, start, steps by index, cross-step last.
  - 1492 with different issue sets. All are explained by the designed rules (0 unexplained):
    - Old-only issues are cross-field, cross-step or start rules that now stay quiet because a field failed, or trigger issues that an unknown action now hides.
    - New-only issues are field issues on steps where the old validator stopped at the first shape error. The design says all field issues report.
- **Accepted orders**: 981 of 1020 are deep-equal. The other 39 differ only by keys the new check drops (`trigger.atLeast/count/resource/seconds/node` on the wrong trigger kind, `to` on a step that does not take it). That is design M4.md line 428: "unknown keys ... ignored and dropped from the checked order". No values differ and no keys are added.
- **Text path, 4006 cases** (including 20000, 20001 and empty input): 0 ok disagreements. Breakdown:
  - 3411 identical.
  - 15 with the same issues in a different order. These were not inspected one by one. They have the same multiset of issues, consistent with cross-step issues moving last.
  - 11 with different issue sets, explained by the same rules.

## Invariants touched

- **S3 (bounded requests)**: holds. The 20000 cap now lives in `textToBuildOrder` and was probed live. `checkSimInputs` enforces `SIM_INPUT_BOUNDS`. A 900,000-char unknown unit id through `buildOrder` returned in 0.02 s. The `nearestId` early exit removes the quadratic cost.
- **A1 (no game numbers in schema code)**: holds. The diff adds no constants beyond the design's threshold formula.
- **A3 (pure checking)**: holds. The catalog is memoised once per process in the route and in `helpers.ts`. `checkBuildOrder` and `checkSimInputs` keep no state. The fuzz run was deterministic across repeats.

## Bot reconciliation

No review bot is configured (`reviewBot.cli` is empty), so there were no bot findings to reconcile. The repo has no `reviewBot.rulesFile`.

## Lint

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.

## Review checklist (REPO.md)

- **Every diff**:
  - `npx next build` succeeds.
  - Route probed live against `next start` on port 3828. The page was exercised by the Playwright acceptance run, which starts the dev server.
- **AoE4**:
  - No copied helpers or constants: jscpd finds 0 clones, and `buildOrderFrom` reuses `textToBuildOrder` and `buildOrderCatalog`.
  - No doc sentence contradicted by the code (checked the Issues section).
  - The route contract is unchanged, so `docs/api/openapi.json` needs no edit (`suggestion` was already there from SGS-057).

## Conventions

- The route keeps its existing helper style (`rejected`, `isPlainObject`) and uses `??=` memoisation as the ticket specifies.
- `helpers.ts` follows the file's existing 2-space, no-semicolon style.
- The new spec matches the sibling `acceptance/aoe4-simulate-api-issue-shape.spec.ts` (Playwright `test.describe`, no page).
- `schema.test.ts` additions use the file's `it.each` table style.

## Non-blocking notes

1. `schema.ts:228`: the comment "The edit distance is at least the length difference, so this skips only candidates that cannot win." sits above `const candidate = ...` rather than directly above the skip on line 230. It still reads correctly.
2. `docs/aoe4-build-order.md:620` lists the order as "civ, name, the step-count cap, start". A non-array `steps` (`steps: must be an array`) also comes before `start`, in the same slot. The sentence does not name it but does not contradict it.
3. `acceptance/aoe4-build-order-from.spec.ts` compares `start` and `steps` only, not `civ`/`name`. That is enough for the criterion, which asks that the order come back.
4. The `unknown-id` message echoes the whole id, so a 900k-char id gives a 900k-char message. This predates the diff and S3 bounds the request, so it is out of scope here.
5. `orderSchema(catalog)` is rebuilt on every `checkBuildOrder` call. This predates the diff (SGS-057) and is out of scope.
6. Acceptance flake: `aoe4-step-table.spec.ts:190` ("table buttons never post to the simulate route") timed out once under full-suite load and passed in isolation.

## Coverage

- **Read in full**: the route, `helpers.ts`, the new spec, the `schema.ts` diff, the `model.ts` diff, the docs diff, the `builds.test.ts` diff, and the new `schema.test.ts` cases for `nearestId`, cost and accepted orders.
- **Spot-checked**: the rest of the 459-line `schema.test.ts` addition and the mechanical import re-points in eight test files.
- **Not reviewed one by one**: the 15 text-path issue lists that differ only in order (same multiset).
- All worktrees and processes I started have been removed or stopped.
