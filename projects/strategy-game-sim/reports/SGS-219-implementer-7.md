# SGS-219 implementer report (n=7, Rework 1)

Status: **needs_review**

- Ticket: SGS-219. Branch `sgs-219-units-chart-population-cap-mark`, tip `65026066fb27e560c2c1cf6cd6a45c75715dbb54` (two new commits over reviewed tip 49e116a; b0f3fa7 then 6502606). Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-219-units-chart-population-cap-mark`. Not pushed.
- `checkout.sh task` reused the checkout at 49e116a (no `origin/<branch>` ref exists, so no own-commit check applies).

## Files touched (this pass)

- `acceptance/aoe4-population-cap-mark.spec.ts`: the only file changed. No production code touched.
  - Added `PINNED_LINE: Record<string, string> = { [UNITS]: 'pinned:villager', [POPULATION]: 'pinned:population' }`. `villager` is the default build's Units line (`unitLineSeries` `key: u.baseId`; the spec passes with it).
  - The hide/hover/pin test asserts `path[data-series="${PINNED_LINE[id]}"]` `toHaveCount(1)` per chart, restoring the exact-count Population assertion.
  - Both `before` comparisons use `await expect.poll(() => mark.evaluate((el) => el.getBoundingClientRect().left)).toBe(before)`.
  - In the "adds only its own label" test, removed `expect(without.markLabels).toBe(0)` (no break could fail it alone; `:163` already asserts mark count 0). The `toPass` now holds the two data-condition guards (marker lines > 0, dots > 0), which settle the read. It was not a pre-existing assertion.

Checklist ticked in the ticket (Rework 1, three boxes).

## Line numbers

The spec gained one line (the `PINNED_LINE` const) above the tests, so each review line number is +1 below (review `:77` is now `:78`, and so on).

## Tests run

- `npx playwright test acceptance/aoe4-population-cap-mark.spec.ts` (after `npm run acceptance:setup`): 14 passed, at both commits (final run on tip 6502606).
- `npm test` (full vitest): 96 files passed, 1 skipped; 3168 tests passed, 15 skipped.
- Other acceptance specs were not rerun: only this spec changed, and the previous run list (27 files) stands.

## Pre-existing tests edited

`acceptance/aoe4-population-cap-mark.spec.ts` hide/hover/pin test (per chart): the Population row again asserts `pinned:population` `toHaveCount(1)` (restores the original assertion); the Units row asserts `pinned:villager` `toHaveCount(1)`. The two `getBoundingClientRect().left` reads are now `expect.poll`.

## Mutation checks

Run in the `mutate-sgs-219` scratch (branch at b0f3fa7, which holds the spec as committed after the first change), provisioned with `link-node-modules.sh .` and `npm run acceptance:setup`, each run via `run.sh <scratch>`. `tree-record.sh` on the task checkout (clean tree) before creating the scratch and after removing it: both `hash 6d9b3f285ef4cb73bf050b5c44bc358bfe4a646f`, empty listing; match. Each break was reset with `git checkout -- components` and `git diff --exit-code` before the next. Scratch removed.

Line numbers below are the current spec's.

| Break (scratch file) | Item | Failed at |
|---|---|---|
| `line-chart.tsx:281` `stroke="#000000"` | `:81` stroke (Units row, first loop iteration) | `:81` `toHaveAttribute('stroke', '#a52a2a')` |
| `line-chart.tsx:282` `strokeWidth={3}` | `:82` stroke-width | `:82` |
| `line-chart.tsx:285` `data-at={at + 1}` | `:78` (Units row); `:103` views test | `:78` in the first test; `:103` in the views test (also failed the two zoom-position tests, `:265` and `:283`) |
| `line-chart.tsx:284` `data-label="Cap"` | `:79` data-label | `:79` |
| `line-chart.tsx:287` label value `'Population cap'` (no time) | `:80` (Units row); `:104` in the views test ("draws the mark in both its Units and Buildings views"); `:125` in both hide/pin rows | `:80`, `:104`, `:125` |
| `line-chart.tsx:287` label value `pinned ? '' : ...` | `:125` (label text after pinning; the count at `:124` does not catch it) | `:125`, Units and Population rows |
| `results.tsx:138` `markerView={id === 'chart-units-produced' ? undefined : markerView}` | `:120` (Units row, marker count 0 after hiding every kind) | `:120` Units row |
| `results.tsx:141` `pinned={pinned && id !== 'chart-units-produced' ? {...` | `:123` Units row (no pinned lines on Units) | `:123` Units row |
| `results.tsx:73` view-dependent time (`buildings` view: `at + 60`) | `:103` data-at in the views test | `:103` |
| `use-chart-zoom.ts` shared module-level zoom window across charts | `:134` (Population not zoomed after zooming Units) | `:134` |
| shared window plus `line-chart.tsx:170` `data-zoom-from` only on Units (so `:134` passes) | `:135` (Population mark kept) | `:135` alone. This is a contrived break; `:134` is the direct observable and `:135` is kept for the criterion that Population keeps its mark |
| `timeMarkDrawn` returns `mark !== null` plus `ifOverflow="visible"` on the ReferenceLine | `:133` Units count 0 after zooming past the mark | `:133`. Without `ifOverflow="visible"` the first break passes: recharts discards a line outside the domain itself |
| `use-chart-zoom.ts` `reset: () => undefined` | `:137` mark returns after reset | `:137` |
| `line-chart.tsx:287` label value `''` on the Units chart only (line drawn, label gone) | `:178` `withMark.markLabels` 1 | Expected 1, received 0 on the `toPass` at `:178` (the other lines in that block compare rows/lines/paths/dots/labels, which the break leaves equal) |

Choices stated by criteria and tests: "Units mark in both views" (rejected alternative: a view-dependent time, row above); "each chart zooms on its own" (rejected alternative: a shared zoom window, rows above).

Deleted (no break could fail it alone): `expect(without.markLabels).toBe(0)` (old `:167`).

Not separately broken: the `:114`, `:169`, `:170` data-condition guards (exempt); unchanged pre-existing Population-only assertions.

## Doc claims

None added or changed this pass.

## Clean before handoff

- codegen: none set. `next build`: succeeded (route table printed). `tsc --noEmit && npm run lint:dup`: clean, 0 clones. `npm test`: pass (above).
- `git diff --stat origin/main`: the six files the ticket names (spec, `page-help.test.ts`, `page-help.tsx`, `results.tsx`, two docs); no stray files.

## Invariant check

A1, A2, A3 (AoE4 paths): no production change this pass; hold.

## Unverified assumptions added

None.

## Out-of-scope findings

- `timeMarkDrawn` in `line-chart.tsx:72` is not what hides a zoomed-out mark on its own: recharts' default `ifOverflow` discards a ReferenceLine outside the domain, so the break that only removes the in-window rule is not caught by any test. Not a defect; noted because a test cannot distinguish the two mechanisms.
- Review's non-blocking notes (`page-help.tsx:106` line length, `page-help.test.ts:55` regex span, no Units "run with no markers" test) were not in the Required fixes and are untouched.
