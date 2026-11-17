# SGS-193 review 5

- Branch `sgs-193-step-annotations-name-the-wait`, tip `cd3add99a7ce4443e7183f298db275ebc589f45d`, base `origin/main` (683991c, SGS-192 merged). Full review (not delta mode).
- Verdict: **REQUEST CHANGES** (one convention finding in the acceptance spec; the production change, unit tests and doc are correct).

## Blocking findings

1. `acceptance/aoe4-step-annotations.spec.ts:582-585` and `:541-542`, `:566-567` - convention - the new describe re-implements the file's own `openTable(page, text)` helper (`acceptance/aoe4-step-annotations.spec.ts:27-32`: `openPage`, `setText` when text is given, `showView(page, 'table')`, `expect(step-run first).toBeVisible()`). The busy test inlines exactly those four calls; the two loop tests split the same four calls between the test body (`openPage`, `setText`) and the first two lines of `expectTableAndPopover`. Every other table test in the file (`:95`, `:106`, `:124`, `:133`) calls `openTable`. A maintainer changing how the table is opened would have to find three copies. Direction: in the busy test replace lines 582-585 with `await openTable(page, text)`; in the loop test replace `await openPage(page)` / `await setText(page, text)` with `await openTable(page, text)` and delete the `showView(page, 'table')` and `step-run` visibility lines at the top of `expectTableAndPopover` (it then starts at the `step-blocked-by` assertion). No assertion changes.

## Spec gaps

none.

## Acceptance criteria

- AC1 (completed/in-progress entries, `waitDetails` order, zero-second omitted, detail text): **pass**. `step-annotations.ts:56` maps `waits` in list order; `:62` filters `seconds > 0` and uses `waitDetailText`. Unit rows `completed keeps list order, not reason order` (CASTLE, GOLD, BUSY: reason order would put GOLD first), `completed leaves out zero-second entries`, `completed with no entry`, `in-progress with/without an entry`; GOLD prints `50 gold`, not `resources`.
- AC2 (`waiting` tails; for/on not swapped; own-target entry printed): **pass**. `:57` pushes `still waiting for` only when `waitingForText !== null`. Rows `waiting with entries then waitingFor` (prints `Castle Age 20:00` before the tail), `waiting prints the entry for its own target` (Barracks), `waiting with waitingFor and no entry`, `waiting without waitingFor falls back to waitingOn`, `waiting without waitingFor and no entry`. No `waitTargetKey` use in the page.
- AC3 (`not-reached` unchanged even with details): **pass**. Row `not-reached ignores waitingFor and entries` gives non-empty `waitDetails` and a `waitingFor`.
- AC4 (`StepRun` shape, `formatWaitBreakdown` gone): **pass**. `tsc --noEmit` clean at the tip; no reference to `formatWaitBreakdown`/`BREAKDOWN_ORDER` remains; the unit test asserts `'waitBreakdown' in run` is false.
- AC5 (cell and popover share `blockedBy`; `annotationDetailText` forms kept): **pass**. `annotationDetailText` unchanged; its table untouched; `step-annotation.test.ts` changes only the `run()` fixture fields. Inspection showed cell and popover text identical for the knight and busy cases.
- AC6 (`longWait`, `flagged`, `waitedText`, `finishedText`, stale, alignment unchanged): **pass**. No assertion in those tests changed; 105/105 unit tests pass in `step-annotation*`.
- AC7 (acceptance, three cases from API facts): **pass by reading** (not run, per role). Each case asserts API facts first (`status`, `waitingFor.kind`, `waitDetailText(waitingFor)`, non-zero entry count > 0; busy: `waitBreakdown.prerequisite > 0`, exactly one non-zero entry, kind `building-busy`), builds the expected text from `waitDetails` via `waitDetailText` and `formatMinSec`, and checks the Table `step-blocked-by` with exact `toHaveText`; the two waiting cases also check the Text-view popover. A tail-only page fails the exact match because `nonZero(timing).length > 0` is asserted. At the base the cell reads `prerequisite 20:00, still waiting on prerequisite` / `prerequisite 0:23`, so each case fails at the base.
- AC8 (docs): **pass**. Run-cell paragraph rewritten; `git grep -n "in that order" -- docs/aoe4-build-order-ui.md` matches nothing.
- AC9 (A2-labelled: text from the result only, detail beats `waitBreakdown`): **pass**. Test `builds waits from the details only...` passes `waitBreakdown: { resources: 99 }` with differing details and asserts `waits` follows the details and `blockedBy` has no `resources`.
- AC10 (no invariant regressions): **pass**, see below.

## Invariants touched

- A1 (game numbers from data): holds; no numeric literal added to simulation code.
- A2 (resources never go negative): holds; the page only formats the result, no spend path touched.
- A3 (determinism): holds; no randomness or clock added.
- S1: holds; imports stay within the aoe4 app (`lib/aoe4-build-order/wait-detail`, browser-safe: imports only `engine-common`, `landmarks`, `model` values and types).

## Checklist and contract

- spec-checklist Contracts: `StepRun.waits`, `StepRun.waitingForText`, removal of `waitBreakdown`/`formatWaitBreakdown` match design/M11.md C17 and Modules row (line 70) exactly; B-W10 table matched row by row.
- Scope: nothing out of scope touched (no engine, `wait-detail.ts`, API, help modal, or other doc sections). No invented constants.
- Pre-existing tests edited: `formatWaitBreakdown` test deleted, `StepRun` table re-expressed, `step-annotation.test.ts` fixture swap - all under the ticket's rule for tests depending on the changed text or type.
- Doc claims checked against `step-annotations.ts:54-58,62-63` and `annotationDetailText` (`:51`): all true (see note 1 on the empty case).

## Lint

`npx tsc --noEmit && npm run lint:dup`: clean (0 clones).

## Bot reconciliation

No `reviewBot.cli` and no `rulesFile` in REPO.md; section skipped.

## UI inspection

Served the task checkout with `npx next dev -p 3917`, ran `inspect.cjs` (Playwright, Chromium) at 1200, 1280 and 1800 px for three pastes: the knight case, the busy town-center case, and a five-step build (`build barracks with 9 from sheep`, `produce man-at-arms from barracks x3`, `build blacksmith from sheep`, `produce knight from stable x1`) that yields a villagers entry, a building entry, an age entry plus `still waiting for Feudal Age`, and a `not reached` step. For each: Table view run cells and the Text-view popover on the step line were checked for clipped overflow, sibling overlap and mid-word breaks. Result: 0 overflow, 0 overlap, 0 mid-word breaks in all 18 checks. Cell texts seen: `Castle Age 20:00, still waiting for Castle Age`; `a free Capital Town Center 0:23`; `3 more villagers at sheep 1:05`, `a Barracks 0:13`, `Feudal Age 18:42, still waiting for Feudal Age`, `not reached (earlier-step)`. Popover text equals `Still waiting. Blocked by: <cell text>` / `Waited 0:23. Blocked by: <cell text>`. Screenshots read: table at 1200 (run cell wraps at word boundaries inside its column) and popover at 1200 (popover drawn outside the gutter, two lines, no clipping). Server stopped; port free.

## Non-blocking notes

1. `docs/aoe4-build-order-ui.md:105` - "The popover's `Blocked by:` part shows the same text." For a step with an empty `blockedBy` the popover shows `nothing` (`step-annotations.ts:51`) while the cell is empty. In context the sentence follows the wait rules, and the ticket prescribed it, so not blocking; if touched, consider: "The popover's `Blocked by:` part shows the same text, or `nothing` when the cell is empty."
2. `acceptance/aoe4-step-annotations.spec.ts:545-549` - the popover hover sequence repeats the nested describe's `runLines` / `lineAt` / `popover` helpers (`:171-189`), which are scoped to that describe and so unreachable here. Acceptable as is; hoisting them to file scope would remove the copy.
3. `acceptance/aoe4-step-annotations.spec.ts:565` - `expect(expected).not.toBe(...)` is implied by the preceding `nonZero(timing).length > 0` assertion; harmless.

## Coverage

- Reviewed: `components/apps/aoe4-build-order/step-annotations.ts`, `step-annotations.test.ts`, `step-annotation.test.ts`, `acceptance/aoe4-step-annotations.spec.ts`, `docs/aoe4-build-order-ui.md`; read `lib/aoe4-build-order/wait-detail.ts`, `acceptance/helpers.ts` (openPage, showView, waitForRun), `step-annotation.tsx` render of `step-blocked-by`, design/M11.md C17 and B-W10.
- REPO.md review checklist: Every diff (build per implementer report, `tsc` here; page loaded via inspection) and AoE4 build order (no copied helper in `lib/` or components; widths 1200/1280/1800 checked; no `golang/`). No `next build` run by me; the implementer recorded it ok and the change adds one browser-safe import.
- Not run: acceptance tests (role rule).
