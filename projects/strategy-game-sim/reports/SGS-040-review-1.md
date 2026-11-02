# SGS-040 review 1

Branch sgs-040-aoe4-paste-grammar-deposits-reactions, tip 607bccb4bf1abe977b28880873ccb7ab05335d64, base main 9a1a074 (merge-base 9a1a074).

**Verdict: REQUEST CHANGES** (one blocking doc finding; the code itself is correct).

## Blocking findings

1. `docs/aoe4-build-order.md:458` - contract (doc) - the paste prefix table row now reads `` `move N|all <node> to <node> [walk Ns]` `` with an unescaped `|` inside a table cell. In GitHub-flavored Markdown a pipe splits the cell even inside a code span, so the row becomes four cells. The table has three columns, so the extra cell is dropped. On GitHub the authoritative design doc then shows the no-prefix action syntax as `` `build ...`; `research ...`; `move N `` and loses the rest of the `move` syntax and the whole `rally` syntax. Direction: escape the pipe as `move N\|all ...`, or write it as `move <N or all> <node> to <node> ...`.

## Spec gaps

None.

## Acceptance criteria

| Criterion | Result | Evidence |
|---|---|---|
| Node tokens in every position; the gold#1..wood#2 codes; `Gold#2` syntax | pass | `parse-text.test.ts` "node tokens" (all 7 positions, one case per code through parse then validate, uppercase rejected). `NODE_TOKEN` is used by `Tokens.node()`, `parseWhen` and `parseWhenever`. |
| GATHER_NODE_ORDER / `'a node name', ID` greps | pass | Both greps find 0 hits on the tip. |
| `move all` | pass | `parseMove` uses `t.accept('all')` (lowercase only). Tests cover `All`/`ALL` as syntax, and `move 0` as parse then `out-of-range`. |
| Triggers, one per paste-table row; validate codes; syntax cases; line numbers; no hiding | pass | "when and whenever triggers" tests. The `>` message names `>=`. The `whenever` message is exact. Lines [2,3,5] are reported in order. |
| `start` with when/whenever prefix; `when` with no action | pass | Tests "rejects a start line with the prefix", and `when berry runs out` gives "expected an action". |
| formatBuildStep (respec 1) | pass | Exported. Prints `whenever` only for `depleted` with `reaction === true`. `move` prints `String(count)`, which gives `all`. The odd-input tests cover a reaction on time, bank and no trigger, and an unknown kind. A decimal count or missing field is not tested, but by reading it is total (`String(...)` / template strings, `trigger?.kind`). Tests also cover that `formatBuildOrderText` is the start line plus one `formatBuildStep` per step. |
| Round trip of a representable order (respec 1) | pass (see note 2) | `representable` covers every action, every trigger kind, a reaction, `move all` and deposits in every node position, and is compared with `toStrictEqual`. Node-ref order "whatever the key order" holds by code (`NODE_REFS.filter`), but no test covers it (note 2). |
| Prebuilt paste round trip + whenever line | pass | `builds.test.ts` now uses `toStrictEqual` and has the `runIf('1TC')` line assertion. The implementer reports the mutation of `formatTrigger` returning undefined for `depleted` (I did not re-run it). |
| ENG 1TC reaction step | pass | Reaction count 0 -> 1. Steps 24 -> 25. The diff only appends the step from Scope. The `validates` test passes. |
| Bar parts 1-5 at 1200 and 3600 | pass | Parts 4-5 are `it.each([1200, 3600])` edited in place. The ENG 1TC 3600 s test checks gold depleted, gold#2 not depleted, and `startedAt === depletedAt`. The implementer reports both mutations (dropping the step, dropping the `triggerHolds` depleted case). The PR body must state them. |
| Route | pass (manual) | Against `next start`: text `start 4 berry 2 gold -> berry` / `when berry runs out move all berry to gold#2` / `move 1 gold to gold#2` ... with `nodeAmounts {berry:600}` gives 200, and the reaction's `startedAt` 155.76 equals berry `depletedAt` 155.76. `when wood > 400` on line 3 gives 400 with `syntax`, `line: 3`, "only '>=' is supported". No Playwright spec was added; that belongs to acceptance-test. |
| Page | not verified by me | The rendered page HTML contains `whenever gold runs out move all gold to gold#2`. The existing page spec "runs the default prebuilt build..." passes. No page-level 3600 s spec exists yet; that belongs to acceptance-test. |
| README (respec 3) | pass | On base, the restricting phrase is "at 1200 s every gold deposit ..." (line 41). The ticket's regex `1200 s only` does not match it on base. After the change it reads "at both horizons every gold deposit ...". |
| docs | pass except finding 1 | Three new prefix rows. The grep for `SGS-040\|paste syntax is\|GatherNodeId. order` gives 0. ENG 1TC's reaction is stated in Prebuilt builds. The old "paste format does not accept deposits" sentence is replaced. |
| No lists or tolerances in parse-text.ts; tsc, lint:dup, tests, perf | pass | tsc clean, jscpd 0 clones, `npm test` 988/988 (including the 20,000-char perf test), `next build` ok. |
| Determinism | pass | Parse and format are pure: no clock, no randomness, no module state. |
| No invariant regressions | pass | See below. |

Ticket boxes left unticked because the verdict is not APPROVE.

## Invariants touched

- A1 holds. parse-text.ts adds no numbers, node lists or resource lists, and start order comes from `NODE_REFS` in `model.ts`. The ENG 1TC step is data.
- A3 holds. Parse and format are pure and deterministic.
- A2 is not touched (no engine change).
- S3 is not touched: no new numeric input. `atLeast` is bounded by validation, which the `when wood >= 400000` case shows as `out-of-range`.

## Linter

`npx tsc --noEmit` clean. `npm run lint:dup` found 0 clones.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. No `rulesFile`.

## Non-blocking notes

1. `lib/aoe4-build-order/parse-text.test.ts` "formatBuildStep > prints %j as one line": `expect(text).not.toContain('\n')` asserts on the expected literal, not on the output, so it cannot fail. The `toBe(text)` on the line above already covers it. Delete it, or assert on `formatBuildStep(input)`.
2. The start-order test gap is for acceptance-test. A mutation of `formatStart` that prints gather nodes in canonical order and appends deposits in object-key order passed all 890 aoe4 unit tests. `representable`'s keys `{sheep, wood, gold#2}` are already in node-ref order, and the "gather node order" test has no deposit. Suggested case: `{ stone: 1, 'gold#3': 1, gold: 2, 'gold#2': 1 }` gives `start 2 gold 1 gold#2 1 gold#3 1 stone`.
3. `lib/aoe4-build-order/parse-text.acceptance.test.ts:27` "maps every action with all suffixes and both trigger kinds" was not extended to the new forms, although the ticket Scope names that file. Coverage exists in parse-text.test.ts. This is for acceptance-test.
4. The ticket said the other ENG 1TC tests would keep their values. The implementer edited two unit tests and four acceptance specs that encoded "no gold#2 / 24 steps / 2 idle on gold". I checked each edit: each one follows directly from the new reaction, every pinned timing value is unchanged, and the timelines and markers indexes now count from `english1tc.steps.length`. The PR body must list all six.
5. The doc example block under Paste format ("One example per action") shows no `when`/`whenever` line. Not required.

## Review checklist (REPO.md)

- Every diff: I ran `next build` (ok) and served the app (`next start`). The page HTML carries the new prebuilt line. I ran 5 Playwright specs (the 4 edited API specs plus `aoe4-build-order.spec.ts`): 123 passed. I did not run the full `npm run acceptance`; the implementer reports 521 passed.
- AoE4 build order: no helper, constant or tolerance was copied. `NODE_REFS` is imported and the local `GATHER_NODE_ORDER` is deleted. I checked the engine rule docs against the code: the docs match except for the table rendering in finding 1. No chart changes.

## Conventions

- `it.runIf(build.name.includes('1TC'))` matches the lookup at `simulate-triggers.test.ts:252`.
- `LineError` messages follow the existing `expected X, got 'y'` shape (`parse-text.ts:66`).
- The `validationCode` helper is local to the test. test-helpers.ts exports no equivalent, and jscpd reports 0 clones.

## Coverage

Reviewed the full diff of all 12 files. I read `parse-text.ts` in full around the changes. I checked `model.ts` for `NODE_REFS`, the README, and docs lines 436-530 and 755-770. Not reviewed: the page component under a real browser at 3600 s (that belongs to acceptance-test). Processes I started (`next start` on port 3877, Playwright) were stopped, and the port was confirmed free.
