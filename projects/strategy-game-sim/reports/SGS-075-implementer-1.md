# SGS-075 implementer report, pass 1

- Ticket: SGS-075 (re-point importers, delete `lib/aoe4-build-order/validate.ts`, switch the route to the zod checks)
- Branch: `sgs-075-aoe4-delete-validate-route-check`, base `origin/main` 028fc43
- Tip: 9b22b0cf89d3d66784e8f0da3f9a63e0919911c6 (author Nick Choi <choinickolas@gmail.com>)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-075-aoe4-delete-validate-route-check
- origin/main has since moved to a30fbfd (#68, #69). `git merge-tree --write-tree HEAD origin/main` merges cleanly. #69 touches `docs/aoe4-build-order.md` and `data-schema.ts`, and the two changes do not overlap.

## Files touched
- `lib/aoe4-build-order/schema.ts`: removed the model type imports, `isBoundKey` and `isKnownId`, and made `issue` private. `TRIGGER_KINDS` is now `as const`. Split `stepUnion`/`stepSchema` and `orderObject`/`orderSchema`. Exports the inferred `Trigger`, `BuildStep`, `BuildStart` and `BuildOrder`, with their doc comments. `nearestId` exits early when the length difference is above the threshold.
- `lib/aoe4-build-order/model.ts`: re-exports those four types from `./schema` instead of declaring them by hand.
- `lib/aoe4-build-order/validate.ts`, `validate.test.ts`, `validate.acceptance.test.ts`: deleted.
- `pages/api/aoe4-build-order/simulate.ts`: uses `checkBuildOrder` and `checkSimInputs`, sends text through `textToBuildOrder`, and builds a module-level English catalog once.
- `acceptance/helpers.ts`: adds `buildOrderFrom(text)`. It lazily requires the data module, so specs that don't use it never load english.json. On a bad order it throws `Error(messages.join('\n'))`.
- `acceptance/aoe4-build-order-from.spec.ts` (new): every shipped build round-trips through format → `buildOrderFrom`, and a `knigt` paste throws `line 2: unknown unit "knigt" in unit`.
- `acceptance/aoe4-simulate-api-contract.spec.ts`: imports `SIM_INPUT_BOUNDS` from schema.
- `lib/aoe4-build-order/schema.test.ts`: about 459 added lines of migrated and new cases (see the case audit).
- `lib/aoe4-build-order/data.acceptance.test.ts`: title and list changed to the 25 documented types.
- Re-pointed tests: `builds.test.ts`, `parse-text.test.ts`, `simulate-triggers.test.ts`, `step-options.test.ts`, `test-helpers.ts`, `build-move.acceptance.test.ts`, `research.acceptance.test.ts` and `components/apps/aoe4-build-order/step-table-model.test.ts`.
- `docs/aoe4-build-order.md`:
  - The issue shape gains `suggestion?`.
  - The three-tier rule (field / cross-field / cross-step / start) replaces the old "run only once ids resolve" paragraph. It also states that an unknown action hides trigger issues and gives the issue order.
  - The diagram now goes text → textToBuildOrder → parseBuildOrderText → checkBuildOrder + checkSimInputs, with buildOrderCatalog feeding the checks.

## Pre-existing tests edited
| file:test | change | rule |
|---|---|---|
| data.acceptance.test.ts: "...documented types" | title changed to 25 types; the four type names that moved to schema removed from the list | Scope 3 (model types now come from schema) |
| builds.test.ts, parse-text.test.ts, simulate-triggers.test.ts, step-options.test.ts | `validateBuildOrder(x, ENGLISH)` became `checkBuildOrder(x, buildOrderCatalog(ENGLISH))`; assertions unchanged | Scope: re-point importers |
| step-table-model.test.ts, build-move.acceptance.test.ts, research.acceptance.test.ts, test-helpers.ts, aoe4-simulate-api-contract.spec.ts | import path only | Scope: re-point importers |

No API acceptance spec expectations changed.

## Case audit (validate.test / validate.acceptance.test → schema.test)
- **Migrated:** the bounds table (including NaN/Infinity → out-of-range), start villager bounds, the 201-step cap, unknown ids in steps and start (including `__proto__`), cross-field and start rules, kings-palace rally sources, repeated research, issue location and field order, sparse holes, hostile inputs, a 16-row node-ref table plus direct `nodeRefIssue` cases, the trigger and reaction tables, and the checkSimInputs fields, defaults, bounds, merge, fresh objects and nodeAmounts.
- **Dropped:**
  - "exports exactly the runtime names": the module is deleted.
  - validate "hard-codes request caps" `textChars.max`: already covered by "keeps the request bounds". The frozen check was migrated.
  - nodeRefIssue "message contains value": migrated as "reason names the ref".
- **Re-specified:**
  - "a step with a shape issue gets no further checks". `produce` from an unknown building with `count: 'x'` now reports two field issues, `unknown building "nowhere" in producer` and then `count must be a number`. This follows design M4's rule that field issues all report and only cross-field checks wait on resolved ids.
  - The no-rally kings-palace case now filters out the start-rally rule instead of expecting exactly two issues.
- **Already covered** by the existing schema.test / text-to-build.test: line-labelled repeats, the lines label, the step cap, the unknown trigger kind listing, rejected techs naming the property, checkSimInputs merge/order/non-object, resolveSimInputs parity, and civ french.

## Tests
- `npm test`: 40 files, 1184 passed, 8 skipped, 0 failed (schema.test.ts alone has 301).
- `ACCEPTANCE_PORT=3815 npm run acceptance`: 573 passed, 0 failed.
- Invariants encoded:
  - every rejection is an issue with a code and a location, never a throw;
  - field issues all report, cross-field checks run only on resolved ids, and cross-step issues come last;
  - bounds come from the frozen `SIM_INPUT_BOUNDS`;
  - `nearestId` returns the same result as plain Levenshtein, and its cost is bounded for huge ids (900k chars under 500 ms);
  - checkSimInputs returns fresh objects and reads its defaults from data.
- Manual route probe (dev server on 3816, since stopped):
  - 20001-char text → 400 `text: 20001 characters, more than 20000`;
  - 20000-char text → 200;
  - `knigt` text → 400 with `line: 2`, `suggestion: "knight"`;
  - JSON `knigt` → 400 `steps[0]: ...`, `suggestion: "knight"`.

## Mutation checks
Each break was made in schema.ts, the tests were run, and the file was restored from a scratchpad backup (confirmed byte-identical with `cmp`).

| break | result |
|---|---|
| drop the `nearestId` length early exit | 900k-id cost test failed |
| threshold `>` → `>=` | 2 equality tests failed |
| disable the finite check | 1 bounds test failed |
| node-ref deposit index 1 → 3 | 9 node-ref tests failed |
| ignore the rally instance | kings-palace test failed |
| reaction check only when trigger is undefined | 3 failed |
| remove the repeated-research rule | 3 failed |
| disable the start rally rule | 1 failed |
| share one trip object | fresh-objects test failed |
| walkSeconds from a constant instead of data | reads-defaults test failed |

## Clean stages
- Codegen: none set.
- `npx tsc --noEmit`: OK.
- `npm ci && npx next build`: OK.
- Lint: `npm run lint:dup` found 0 clones. The repo has no eslint, so I removed the one eslint-disable comment I had added.
- Unit and acceptance: see Tests.
- Diff review: no lockfile, `next-env.d.ts` or AGENTS.md noise. Only ticket files are in the commit.

## WOTR probe
I temporarily added a require.cache log to `acceptance/fight-api-caps.spec.ts`. With it in place, the 11 tests passed and the log printed `english=0 data=0`. So the lazy require in helpers keeps the AoE4 data out of the WOTR specs, and `require` works under Playwright. The file is restored, and `git status` shows it clean.

## Invariant check
- The route's response shape (`error`, `issues`, `omittedIssues`, `MAX_REPORTED_ISSUES`) is unchanged.
- The 405 and non-object body handling is unchanged.
- The text cap is enforced before parsing.
- The model types keep their names for every importer, through the re-export.
- No module imports validate.ts, and the acceptance greps are clean.

## Out-of-scope findings
None.

## Status
`needs_review`
