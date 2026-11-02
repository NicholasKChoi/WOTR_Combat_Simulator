# SGS-040 review 2 (full re-review after rework 1)

Branch sgs-040-aoe4-paste-grammar-deposits-reactions, tip d8c9a95d586243e20a0326b7fb047aa1de80dd87, base origin/main 9a1a074 (merge-base 9a1a074). The branch exists only locally; it has not been pushed to origin. I reviewed the full diff `origin/main...d8c9a95` (12 files) plus the rework delta `607bccb..d8c9a95`.

**Verdict: APPROVE**

## Blocking findings

None.

## Rework 1 required fixes

| Fix | Result | Evidence |
|---|---|---|
| Write the `move` row without a bare `\|`, and keep the same column count on every row | fixed | `docs/aoe4-build-order.md:458` now reads `` `move <N or all> <node> to <node> [walk Ns]` ``. I ran a script over every pipe table in the doc that counts unescaped `\|` per row against the header. Every table has the same cell count on each row, and the paste prefix table (`:451-458`) has 3 cells on every row. The three new prefix rows have an empty action-syntax cell, which renders as an empty cell. |
| Delete the dead assertion or point it at the output | fixed | `parse-text.test.ts:521` now asserts `formatBuildStep(input)`. It is still implied by the `toBe(text)` on the line above (see note 1), but the fix matches the direction given. |
| Unit test for start-villager order with deposits given in another key order | fixed | `parse-text.test.ts:554` "prints start deposits in gather node order whatever the key order": `{ stone: 1, 'gold#3': 1, gold: 2, 'gold#2': 1 }` gives `start 2 gold 1 gold#2 1 gold#3 1 stone`. Review 1 used the mutation "print canonical gather nodes, then deposits in key order". That mutation would print `2 gold 1 stone 1 gold#3 1 gold#2`, so this test now catches it. |

## Spec gaps

None.

## Acceptance criteria

| Criterion | Result | Evidence |
|---|---|---|
| Node tokens | pass | "node tokens" tests cover all 7 positions, one parse-then-validate case per code, and uppercase `Gold#2` as `syntax`. |
| GATHER_NODE_ORDER / `'a node name', ID` greps | pass | 0 hits for each. |
| `move all` | pass | `parseMove` uses `t.accept('all')`. `All` and `ALL` give `syntax`, and `move 0` gives `out-of-range`. |
| Triggers | pass | One test per paste-table row, the validation codes, the syntax messages (`>=`, the exact `whenever` message), and lines [2,3,5] in order. |
| `start` with a prefix; `when` with no action | pass | Tests at `parse-text.test.ts` "rejects a start line with the prefix" and "expected an action". |
| formatBuildStep (respec 1) | pass | The function is exported and every tested form prints as one line. The odd inputs (a reaction on time, bank or no trigger, and an unknown kind) do not throw. The function is total by reading: a decimal count or a missing field go through `String`/template strings. The start-plus-steps equality is tested. |
| Round trip of a valid order (respec 1) | pass | `representable` uses `toStrictEqual`. The key-order test is now in place. |
| Prebuilt paste round trip | pass | Mutation re-run by me: when `formatTrigger` returns `undefined` for `depleted`, "round-trips through the paste format" and "prints its gold reaction as a whenever line" fail. Reverted. |
| ENG 1TC reaction step | pass | jq: reactions 0 -> 1, steps 24 -> 25. The diff only appends the step from Scope. "validates" passes. |
| Bar at 1200/3600 | pass | Mutations re-run by me in this worktree and reverted. (a) Removing the last step of `english-1tc.json` fails "moves every gatherer off a gold deposit ... by 3600 s" (parts 4 and 5) and the ENG 1TC 3600 s test. (b) Changing the `depleted` case of `triggerHolds` (`simulate.ts:207-208`) to `return false` fails the same two tests. The PR body still has to state this. |
| Route | pass (manual) | Tested with `next start` on the tip. `whenever berry runs out move all berry to gold#2` with `nodeAmounts {berry:600}` returns 200, and the reaction's `startedAt` (155.7605) equals berry `depletedAt` (155.7605). `when wood > 400 ...` on line 3 returns 400 with `syntax`, `line: 3`, "only '>=' is supported". |
| Page | not verified, left unchecked | The served page HTML contains `whenever gold runs out move all gold to gold#2`, and the existing spec "runs the default prebuilt build..." passes. I did not drive the page at 3600 s in a browser. That spec belongs to acceptance-test. |
| README (respec 3) | pass | The README now reads "at both horizons every gold deposit ...". No `1200 s only` hit. |
| docs | pass | The prefix table has the three new forms. The `SGS-040\|paste syntax is\|GatherNodeId. order` grep finds 0 hits. ENG 1TC's reaction is stated under Prebuilt builds. |
| tsc, lint:dup, tests, acceptance, perf | pass | On Node 24.22.2: tsc clean, jscpd 0 clones, `npm test` 989/989 (including the 20,000-char perf test), `npm run acceptance` 521/521, `next build` ok. |
| Determinism | pass | Parse and format are pure: no clock, no randomness, no module state. |
| No invariant regressions | pass | See below. |

I ticked every criterion except Page in the ticket file.

## Invariants touched

- A1 holds. `parse-text.ts` adds no numbers, node lists or resource lists. The start order comes from `NODE_REFS` in `model.ts`, and the ENG 1TC step is data.
- A3 holds. Parse and format are deterministic and pure.
- A2 is not touched (no engine change).
- S3 is not touched. The new `atLeast` number is bounded by validation (`when wood >= 400000` gives `out-of-range`).

## Linter

`npx tsc --noEmit` is clean. `npm run lint:dup` found 0 clones.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. There is no `rulesFile`.

## Conventions

The conventions are unchanged since review 1:
- `LineError` messages follow the `expected X, got 'y'` shape.
- `it.runIf(build.name.includes('1TC'))` matches `simulate-triggers.test.ts:252`.
- `validationCode` is local and has no equivalent in `test-helpers.ts`.

The new test sits in the existing `formatBuildOrderText` describe next to the "gather node order" case and uses the same object-literal style.

## Non-blocking notes

1. `parse-text.test.ts:521`: `expect(formatBuildStep(input)).not.toContain('\n')` is still implied by `toBe(text)` on line 520, because no expected literal contains `\n`. It is harmless, and it does what the fix asked for.
2. The PR body must list the six edited pre-existing tests and the two bar mutations: `simulate-triggers.test.ts`, `simulate.test.ts`, and the depletion-engine, markers, timelines and triggers API specs. Review 1 checked each edit, and I re-read each one in this pass. Each edit follows from the new reaction, and every pinned timing value is unchanged.
3. Review 1 note 3 still applies. `parse-text.acceptance.test.ts` was not extended to the new forms. Coverage exists in `parse-text.test.ts`; extending that file belongs to acceptance-test.
4. A start line written as `whenever gold start ...` gets the `whenever takes only` message, not `'start' takes no trigger`. Both are `syntax`, and the criterion's form (`whenever gold runs out start ...`) gets the start message, which is tested.

## Review checklist (REPO.md)

- Every diff: I ran `next build` (ok) and served the app with `next start` on port 3877. I loaded the page and called the route. I ran the full `npm run acceptance` (521 passed), which drives the page flows.
- AoE4 build order: nothing is copied (`NODE_REFS` is imported and the local list is deleted). The docs match the code for every paste rule the diff adds. No chart change.

## Coverage

I reviewed the full diff of all 12 files, with the rework delta in detail. I ran a table cell-count check over the whole of `docs/aoe4-build-order.md`. I started `next start` (killed, port 3877 confirmed free) and the Playwright harness (it exits on its own). After the run nothing listens on 31xx-39xx. I reverted all mutations with `git checkout`, and the worktree was clean before I removed it.
