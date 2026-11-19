# SGS-211 review 6

Verdict: **APPROVE**

Branch `sgs-211-repeat-paste-text-and-table-field`, tip `6fdb74d10abb29a8b51f447e46edc33d30daa501`, base `origin/main` (29bb8f0). Full review (not delta mode). Scratch: `worktrees/review-sgs-211-repeat-paste-text-and-table-field`.

## Blocking findings

None.

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

- Parse forms: **pass**. `parse-text.test.ts` "parses %j with the trailing xN as a repeat only in last position" has one row per form (build, build with builders/then/walk, move, research, research at, pause, rally, `@1:30` trigger, `whenever` reaction, `x09`), plus the `x0`/`x201` rows that assert the parsed value and `out-of-range` from `checkBuildOrder`. A probe I ran confirms `x0`/`x201` give `repeat: 0 is outside 1..200` (`out-of-range`) and research/pause/rally with `x2` give `invalid`.
- Position rules: **pass**. All 11 listed lines are rows in the existing "rejects %j as syntax" table, each naming the token (`parse-text.test.ts` new rows). Code: `parseAction` reads `COUNT` once after the action's own fields and `t.end()` rejects anything after it (`parse-text.ts:235-238`, `:301`). `produce` is excluded at `:235`.
- Node and id positions: **pass**. Rows `move 3 sheep to x9`, `build farm from x9`, `build farm from wood then x9` read `x9` as a node, and `validationCode('move 3 sheep to x9')` is `unknown-id`.
- Produce unchanged: **pass**. Row `produce ... x3` is `count: 3` with no repeat. The existing produce rows are unchanged.
- Printing: **pass**. `formatBuildStep` table gains rows for build (with walk, `x1`), move with walk, research at, pause, rally with walk, and triggered build. `representable` gains six repeat rows (build plain, with builders/then/walk, triggered; move reaction with walk, plain; research at). No row claims a round trip for produce with repeat.
- Saved builds: **pass**. `saved-builds.test.ts` "accepts a repeat on a build step and on a move step" sits in the `paste round trip` describe and uses the real formatter (the mock wraps the original). A formatter that drops repeat fails the round-trip check (implementer mutation record).
- Table field: **pass**. `step-table.tsx` adds `num('repeat')` last for build and move only. `setNumberField` is unchanged. Spec cases are covered below. The inspection confirmed the field shows on the build and move rows, is absent on the produce row with More open, and is visible on the pasted `x3` row at first render.
- `changeAction`: **pass**. `step-table-model.ts:74` keeps `repeat` only when the new action is in `REPEATABLE_ACTIONS`. Tests cover keep build->move, drop to each of produce/research/rally/pause with trigger and reaction kept, no key added, and the existing same-object test.
- Page spec `acceptance/aoe4-repeat-step.spec.ts`: **pass**, judged by reading it and by the implementer's run and mutation record (6 passed, per-case production breaks listed). Covered: one row per written step (count 2, not the expanded 4); `n of 3 done` from the response; three `step-copy` items with `data-copy` 1..3, hidden until opened; each combined-cell test id counted once before and after opening; Enter and Space open and close the list, with both the `open` attribute and visibility asserted; the pasted row starts open; build and move rows offer the field and produce/research/rally/pause do not; set 2 / letters / 0 / clear / action change; the hover span from the response on every chart, from the row and from the gutter annotation, with the precondition `span.to > first.completedAt`; band reads in one `evaluate` under `expect.poll`. The spec saves nothing.
  - Tab order: the spec asserts Shift+Tab from `step-trigger-kind` lands on the summary and Tab from the summary returns to it. The summary is in the run cell, which comes before the row's controls, so it is reached by (Shift+)Tab from them. The test name says "next to the row controls in the Tab order", which is accurate. I accept the implementer's stated deviation as meeting "reachable by Tab from the row's controls". The `tabIndex={-1}` mutation fails the test.
- Existing page specs keep their assertions: **pass**. The diff touches no other spec file.
- Docs: **pass**. Each changed sentence in `docs/aoe4-build-order-format.md` and `docs/aoe4-build-order-ui.md` checked against the code (details below).
- `npx tsc --noEmit`, `npm test`, `npm run lint:dup`: **pass** (I ran all three; results below).
- No INVARIANTS regressions: **pass**.

## Invariants touched

- A3 (same order and data, same timings): holds. The change is parser and formatter only, with no randomness or clock use. The same text parses to the same steps, and the round-trip tests confirm format then parse is the identity for repeat rows.
- A1, A2: not affected (no simulation code changed).
- S1-S3: no site-wide paths touched. Repeat's cap (1..200 and the expanded-step cap) is enforced in `schema.ts` (SGS-208), which is unchanged.

## Doc claims checked

- Format doc table: `[xN]` on pause/build/research/move/rally. True per `parseAction`.
- Example line `build farm from wood walk 3s x4`. Parses per `parseBuild` plus the trailing COUNT.
- "`walk Ns` ... On a `produce` line it is always last. On a `build`, `move` or `rally` line it is last except for a trailing `xN`." True.
- The trailing-`xN` bullet, clause by clause:
  - `x9 walk 3s` and `x9 x2` are syntax issues.
  - research/pause/rally `invalid`, confirmed by the probe.
  - `x0`/`x201` `out-of-range`.
  - `x09` -> 9, printed `x9`.
  - Node reading, `unknown-id`.
  - The produce rules.
  All true.
- Unchanged sentences still true: line 101 (produce suffix order), line 133 ("print exactly these forms"), and line 59 (a node-position token reaches validation unchanged).
- UI doc: `repeat` on build and move is in the optional-fields list, and "Changing a row's action to build or move keeps its Repeat value; changing it to another action drops it." True per `changeAction`. The open-flag bullets are unchanged, and `hasOptionalField` uses `OPTIONAL_STEP_FIELDS`, which lists `repeat`.
- Docs-made-untrue search (README, ARCHITECTURE, `lib/aoe4-build-order/README.md`, data README, `page-help.tsx`, `docs/aoe4-build-order.md`): nothing this diff makes untrue.

## Lint and build

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones (184 files).
- `npm test`: 94 files passed, 1 skipped; 3067 tests passed, 15 skipped.
- `npx next build`: succeeded.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so there was nothing to run.

## UI inspection

I served the task checkout with `npx next dev` on port 3487 and stopped it afterwards (port confirmed free). The script `review-inspect/inspect.cjs` loaded `/apps/aoe4-build-order` at 1200, 1280 and 1800 px (the REPO checklist widths). It pasted one line per action (build x3, build, move, produce, research, rally, pause) and switched to Table view. It checked the initial state, then opened More on the rows 1-3 (build, move, produce) and set Repeat to 12 on row 0.

- Clipped overflow inside step rows: none at any width.
- Overlapping sibling boxes: none.
- Mid-word wraps: none.
- Document horizontal overflow: none.
- Repeat field:
  - Initial: present and visible only on row 0, value `3`, label `Repeat`, 90x35, `type=text` like the other number fields.
  - After opening: present on the build and move rows, absent on the produce row.
- Screenshots read: `table-1280-initial.png` and `table-1200-rows.png`. The Repeat field sits under Walk time (s), styled like the other optional fields. The combined row shows `3 of 3 done` and a closed `Each copy` summary.
- The ticket names no visual states for the field, so there was no computed-style comparison.

## Non-blocking notes

- `acceptance/aoe4-repeat-step.spec.ts` defines its own `runPasted` and `bandsPerChart`, which parallel the local helpers of the exemplar `acceptance/aoe4-build-order-step-band.spec.ts:26-57`. Neither is in `acceptance/helpers.ts`, so this follows the exemplar's pattern, and jscpd reports no clone. Moving both into `helpers.ts` would be a reasonable backlog item.
- The `saved-builds.test.ts` line `expect(formatBuildOrderText(...)).toContain('x3')` is a precondition, not the claim. The `ok` assertion carries the test.
- The implementer report says "Pre-existing tests edited: none", but it did append rows to the existing `everyForm` and `representable` tables. The ticket's existing-test rule names exactly that, so this is not a finding.

## Coverage

- Reviewed: every file in the diff (`parse-text.ts`, `step-table.tsx`, `step-table-model.ts`, three unit test files, the new acceptance spec, two docs).
- Read for context: `repeat.ts`, the `schema.ts` repeat rules, `acceptance/helpers.ts`, and the exemplar step-band spec.
- `REPO.md` Review checklist: did "Every diff" (next build, page loaded) and the "AoE4 build order" section (no copied lib helper or constant, docs checked, screenshots at 1200/1280/1800, no Bootstrap/module CSS mix in the diff).
- Not run, by rule: acceptance specs. Their coverage is judged from the implementer's run and mutation record.
- LSP was not available.
