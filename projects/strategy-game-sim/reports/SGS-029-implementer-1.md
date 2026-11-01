# SGS-029 implementer 1

- Ticket: SGS-029, validate build orders and resolve simulation inputs
- Branch: `sgs-029-aoe4-validate-build-order`, base origin/main 16f757f
- Tip: c9c1e86 (one commit, not pushed)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-029-aoe4-validate-build-order
- Status: **needs_review**

## Files touched
- `lib/aoe4-build-order/validate.ts` (new, 422 lines; about 350 of them logic): `SIM_INPUT_BOUNDS`, `ValidateOptions`, `validateBuildOrder`, `resolveSimInputs`. A private `OrderChecker` class runs the checks, alongside private input defaults.
- `lib/aoe4-build-order/validate.test.ts` (new, 512 lines, 98 Vitest tests, uses `loadGameData('english')`).
- `docs/aoe4-build-order.md` (+21/-1): a paragraph under the bounds table (unknown extras ignored; defaults at any depth, `trips` merged per node and then per field with the `walkSecondsCamp: 3` example, `influenceCoverage` per key; more than 200 steps is one `out-of-range` issue). The Issues list now says "six" rally/start rules, followed by the three producer-capability and repeat-research rules, the resolve-first note, and "the simulator assumes all nine rules hold". I grepped for `validateBuildOrder`, `resolveSimInputs` and `SIM_INPUT_BOUNDS` (lines 39, 369, 385+) and found nothing that disagrees.

## Design choices worth review
- Issue order: top level (`civ`, `name`, `source`, `start` shape, `steps` shape/length), then `start` (villagers per key, then rally, then the starting-building rule), then steps in index order. Within a step: syntax (trigger first, then action, then each field in declaration order; a shape issue stops the step), then trigger kind/range, then per field in declaration order (`unknown-id` or `out-of-range`; tech classification right after the tech id resolves), then the cross-field `invalid` rules.
- A tech is classified only after its id resolves to a technology or upgrade entry. Classification runs over the baseId's tech entries, and the first rejection wins, so `classifyTech` never sees a unit or building. A rejected tech counts as unresolved, so it neither gets nor causes a repeat-research issue.
- Each `invalid` rule waits for the ids it needs: produce capability needs `producer` and `unit`; `rally` on a non-villager needs `unit`; a rally step on a non-producer needs `producer`; the villager-producer `build` rule needs `building`; research `at` needs `tech` and `at`; repeat needs `tech`. `walkSeconds` without `rally` depends only on presence.
- A present `start.rally` counts as present for the starting-building and build rules even when it is mistyped or unknown. The same goes for a shape-valid earlier rally source with an unknown `to`/`rally`. This avoids a cascade of follow-on issues, since the order already fails on the first issue.
- The 200 caps are hard-coded in `SIM_INPUT_BOUNDS`, not read from `maxPopCap`. The table and each row are frozen. The input defaults (1200, true, 1, `'wood'`, `{ mill: 1 }`) are private constants. `trips` and `walkSeconds` defaults are read from `data.base` on every call, into fresh objects.
- Messages are `<where>: <text>`, where `<where>` is `steps[i]` or `line N` for a step, `start` or `line N` for start, the field name for top-level issues, and `inputs.<path>` for inputs. Repeat research names the first earlier step (`steps[j]` or `line N`).

## Tests (npm test: 11 files, 229 tests, all pass; validate.test.ts 98)
Each test encodes:
- the valid order from the acceptance list; Bloomery and Shaft Mining accepted; ignored/unmodeled techs accepted; extra properties ignored;
- syntax for a non-object step, a missing field, a mistyped field, an unknown or missing action, and each wrong-typed trigger form; top-level syntax for each field; mistyped start fields; a shape issue stops further checks on that step;
- `unknown-trigger-kind`; `unknown-id` for unit, producer, building, tech (`forestry-1`, a unit used as a tech), the `at` building, nodes, `rally.to`, `__proto__`, civ, a start key and `start.rally`;
- `unsupported-tech` (military-academy names `buildTime`) and `unknown-tech-effect` (forestry);
- min, max and just outside for every step bound: trigger seconds and count, produce and move count, builders, instance, `walkSeconds` on all four step kinds (60 and 60.5 on rally), plus non-integer, `Infinity` and `NaN`; `start.villagers` -1, 201 and 1.5; 200 steps accepted and 201 giving exactly one issue;
- all nine `invalid` rules, each with a failing case and a passing neighbour, as listed in the acceptance criteria (both `town-center` and `kings-palace` for the build rule, including the instance-scoped and later-source cases);
- resolve-first cases for capability and repeat research;
- issue location: JSON start, paste start and step lines, a short `lines.steps`, no `line` without options; issue order across levels and within a step; no throw on null, undefined, a string, an array, `{}`, a number, a null step, or a JSON `__proto__` villagers key;
- `resolveSimInputs`: defaults; defaults follow mutated data built with `buildGameData`; the per-node, per-field `trips` merge and the per-key `influenceCoverage` merge; every supplied field taken; bounds for every `SimInputs` row (durationSeconds, walkSeconds, houseBuilders, the three trip fields, influenceCoverage); syntax for each field with its path; `unknown-id` for a trips node (including `__proto__`), `houseBuilderSource` and an `influenceCoverage` key; declaration order and extras ignored; fresh copies.

`textChars` is a route-only bound (SGS-033). It is checked here only for its value (20000).

## Mutation checks
I scripted these in /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/9e073c9d-a56e-49b2-9b87-63be82c3ecea/scratchpad/mutate.py. Each break was applied to `validate.ts`, the test file was run, and the original was restored in `finally`; `git status` was clean apart from the new files afterward. All 50 mutants were killed:

| # | Break | Failing tests |
|---|---|---|
| 1 | arrays count as records | 3 |
| 2 | trigger shape skipped | 4 |
| 3 | `unit` made optional | 1 |
| 4 | no early return after a shape issue | 11 |
| 5 | `unknown-trigger-kind` dropped | 1 |
| 6 | node lookup by `in` | 3 |
| 7 | civ check dropped | 2 |
| 8 | tech classification dropped | 2 |
| 9 | finite check dropped | 1 |
| 10 | integer check dropped | 9 |
| 11 | steps cap off by one | 1 |
| 12 | villager-sum rule dropped | 7 |
| 13 | `walkSeconds`-without-`rally` rule dropped | 1 |
| 14 | rally-on-non-villager rule dropped | 1 |
| 15 | rally step on a non-producer allowed | 1 |
| 16 | starting-building rule dropped | 3 |
| 17 | rally source ignores `instance` | 2 |
| 18 | build ignores earlier sources | 2 |
| 19 | build ignores `start.rally` | 2 |
| 20 | produce capability dropped | 1 |
| 21 | produce capability not gated on `producer` | 2 |
| 22 | research `at` rule dropped | 1 |
| 23 | research `at` not gated on `at` | 1 |
| 24 | repeat research dropped | 1 |
| 25 | repeat names the latest earlier step | 1 |
| 26 | a rejected tech counts as resolved | 1 |
| 27 | step lines ignored | 2 |
| 28 | start line ignored | 1 |
| 29 | `line` always set | 2 |
| 30 | `trips` replaced per whole node | 1 |
| 31 | `influenceCoverage` without defaults | 2 |
| 32 | `influenceCoverage` shares the frozen default | 5 |
| 33 | `walkSeconds` default hard-coded | 1 |
| 34 | trip default hard-coded | 3 |
| 35 | trips node check dropped | 2 |
| 36 | `houseBuilderSource` check dropped | 1 |
| 37 | `autoHouses` syntax check dropped | 1 |
| 38 | `influenceCoverage` key check dropped | 1 |
| 39 | input bound dropped | 8 |
| 40 | input type check dropped | 5 |
| 41 | input record check dropped | 3 |
| 42 | non-object inputs accepted | 2 |
| 43 | start checks dropped | 15 |
| 44 | field order reversed | 1 |
| 45 | name check dropped | 2 |
| 46 | source check dropped | 1 |
| 47 | start villagers type check dropped | 1 |
| 48 | start key check dropped | 2 |
| 49 | `start.rally` id check dropped | 1 |
| 50 | tech entry types unfiltered | 1 |

The finite-check mutant survived on the first run, because `NaN` on integer fields already fails the integer check. I added `NaN` on a rally `walkSeconds` (a non-integer field), and the mutant was then killed.

## Stages
- codegen: not configured.
- lint (`npx tsc --noEmit`): clean.
- unit (`npm test`): 229/229 pass.
- build (`npx next build`, after `npm ci`, Node v24.22.2, which matches `engines` 24.x): succeeds.
- `git diff --stat 16f757f` shows only the three files above. No lockfile or other tool changes.
- Exports: `git grep -nE "^export " -- lib/aoe4-build-order/validate.ts` lists exactly four. There is no `parse-text` import and no `Date` or `Math.random`.

## Invariant check
- S3: every numeric field of a step, start and inputs is bounded by `SIM_INPUT_BOUNDS`, including non-finite values. More than 200 steps short-circuits before any per-step work.
- A1: no game number in `validate.ts`. Trip and walk defaults come from `data.base`, and the starting count and buildings from `data.civData`. The 200 caps and input defaults are request caps and input defaults, not game numbers.
- A3: no clock or randomness. The output depends only on input and data. `GameData` is never mutated; `resolveSimInputs` returns fresh objects.
- A2 and W1–W2: not touched.

## Out-of-scope findings
- origin/main has moved to 72d74a0 (SGS-027 merged) since this branch's base. `git merge-tree` against it is clean, and `classifyTech`'s signature is unchanged there.
- For SGS-033 (route): with `strict: false`, TypeScript does not narrow these result unions on `!result.ok` or on the false branch of `result.ok ? … : …`. Accessing `.issues` there fails `tsc`. `result.ok === false` (or `'issues' in result`) does narrow. The route should use that form; the tests here do.
