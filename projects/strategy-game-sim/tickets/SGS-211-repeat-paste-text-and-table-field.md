# SGS-211: Repeat in the paste text (xN) and the step table Repeat field, with the page spec

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M12
- **Priority**: high
- **Risk**: standard
- **Invariants**: A3 (the page reads and prints `repeat` only; the simulator stays deterministic, and the same text gives the same order)
- **Unverified assumptions**: none
- **LOC estimate**: 70 (`parse-text.ts` trailing-token read and `formatAction` ~25, `step-table.tsx` field ~5, `step-table-model.ts` `changeAction` rule ~8; business logic only, tests and the acceptance spec excluded)
- **Depends on**: SGS-208, SGS-210
- **On merge**: none
- **Source**: design/M12.md (C3, C7, Behavior rules "Repeat: validation and parsing" and "Repeat: page"), criteria M12.1 and M12.3; reports/M12-planner-5.md outline C and Design questions row 4

## Context

M12.1 lets a `build` or `move` step carry `repeat`. After SGS-208 the API accepts and expands it, and after SGS-210
the page groups the copies of one source into a combined run, a copy list and one shaded span; but the page cannot
enter a repeat yet: `parse-text.ts` has no `xN` after a non-produce action, `formatAction` does not print `repeat`
(so a save of a repeated build gets the round-trip 400 `reopening it as text would change the build`), and the step
table has no Repeat field. This ticket closes that gap: the trailing `xN` in the paste text, its printing, the Repeat
number field under More options, and the page spec that drives a repeated step end to end. SGS-208 already added
`FIELD_LABELS.repeat`; this ticket does not add the label again.

## Scope

- **`lib/aoe4-build-order/parse-text.ts`** (design C3; names `parseAction`, `parseProduce`, `COUNT`, `Tokens`, `end`,
  `formatAction`):
  - After an action other than `produce` has read its own fields (including `walk Ns`), an optional trailing token
    matching `COUNT` sets `repeat` to its number, then the line must end. This covers `build`, `move`, `research`,
    `pause` and `rally` (validation, not the parser, says `repeat` is `invalid` on the last three). `xN` is a repeat only
    in that trailing position: in a node or id position it stays a node or id (`move 3 sheep to x9` names node `x9`).
  - `produce` keeps its `xN` in the count position only; a second `xN`, or an `xN` after `-> node` or `walk Ns`, stays a
    `syntax` issue (`unexpected token`). There is no paste form of `repeat` on `produce`.
  - `formatAction` prints `x<repeat>` as the last word whenever `repeat` is present on `build`, `move`, `research`,
    `pause` and `rally`, after `walk Ns` when both are present. `x1` prints as `x1`. `produce` printing is unchanged
    (planner row 4, settled: a `produce` step carrying `repeat` never reaches the formatter, because every save and load
    validates first and the table drops `repeat` on a change to `produce`; the round-trip tests make no claim for it).
  - `x09` parses as 9 and prints `x9`; `x0` and `x201` parse and fail validation as `out-of-range`. `X9`, `x 9`, `x-1`,
    `x1.5` and a `walk` after the repeat are `syntax` issues.
- **`components/apps/aoe4-build-order/step-table.tsx`** (`actionFields`): a Repeat number field, last in the field list
  for `build` and for `move`, rendered like the other optional number fields with test id `step-field-repeat`. It is
  not offered on other actions. `OPTIONAL_STEP_FIELDS` already lists `repeat` (SGS-208), so it sits behind More options,
  and a row whose step sets `repeat` starts open through the existing open-flag rule (`hasOptionalField`).
- **`components/apps/aoe4-build-order/step-table-model.ts`**: `changeAction` keeps `repeat` when the new action is in
  `REPEATABLE_ACTIONS` (exported by the new `repeat.ts` from SGS-208) and drops it otherwise; trigger and reaction carry as
  today. Do not add `FIELD_LABELS.repeat` (SGS-208 did). `setNumberField` already gives the input rules (empty removes the
  key, non-digits leave the step unchanged, `0` or `201` set the value and the inline issue list shows the
  `out-of-range` issue); confirm it needs no change.
- **New `acceptance/aoe4-repeat-step.spec.ts`**, following the `acceptance/aoe4-build-order-step-band.spec.ts` exemplar
  (helpers from `acceptance/helpers.ts`, layout and DOM state read in one `evaluate` under `expect.poll` or `toPass`):
  type a repeated step in the text view and wait for the run; show the combined row and its copy list; set Repeat in
  the table; hover the row and read the shading; open the copy list from the keyboard; check the copy-list test ids stay
  distinct. The spec saves nothing. See the criteria for the cases.
- **Docs made untrue** (name the statement, the implementer writes the replacement):
  - `docs/aoe4-build-order-format.md`: the paste-format table (the `produce` row shows `[xN]` and the other rows list no
    trailing `xN`), the grammar bullet "On a `produce` line the suffixes are ordered `[xN]`, `[-> node]`, `[walk Ns]`", the
    bullet "`xN` takes no space (`x5`)" (it does not say that `xN` also ends a `build`, `move`, `research`, `pause` or
    `rally` line as the repeat, that it is last after `walk Ns`, or that it is a node or id elsewhere), and the sentence
    that `walk Ns` "is always last on `produce`, `build`, `move` and `rally` lines" (a trailing `xN` can follow it).
    Add the repeat form to the grammar details; `repeat` on `research`, `pause` and `rally` parses and is `invalid` at
    validation.
  - `docs/aoe4-build-order-ui.md`: the step-table paragraph that lists the fields a step may omit (`instance`, `count`,
    `rally`, `walkSeconds`, `builders`, `then`, `at`) behind More control; it must name `repeat` on build and move. The
    table paragraph that says an edit sets `text` to `formatBuildOrderText(order)` needs no change. A statement that
    changing a row's action carries only trigger and reaction, if one exists, is corrected (grep for it).
  - `components/apps/aoe4-build-order/page-help.tsx` lists no text forms and no step-table fields (checked at the base);
    change it only if the search finds a sentence this ticket makes untrue.
- **Existing tests, by rule**: a test of the changed behavior gets the new expected value (examples the search found:
  `parse-text.test.ts` rows that assert `x3` after `walk 4s` or `-> sheep` on a `produce` line stay as they are, because
  produce is unchanged; `step-table-model.test.ts` "changeAction" cases and the "text round trip" table gain the repeat
  rows); any other test keeps its expected value. A test that asserts a trailing `xN` after a non-produce action is a
  `syntax` issue (the search found none at the base) changes with the grammar. The implementer lists every test it edits.
- **New unit tests**: `parse-text.test.ts` rows for every C3 form below; `step-table-model.test.ts` rows for
  `changeAction`; a row in the tests of `checkSaveBuildRequest` (`lib/aoe4-build-order/builds-routes.test.ts` and
  `named-builds-routes.test.ts` style) that a build carrying `repeat` on a `build` and a `move` step is accepted by the
  round-trip check.

**Out of scope:** `schema.ts`, `repeat.ts`, `simulate.ts`, OpenAPI and the API (SGS-208); the annotation, row, popover and
shading rendering (SGS-210); the rename API and UI; rewriting shipped builds to use `repeat` (design D15); a paste form
of `repeat` on `produce`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Parse forms (`parse-text.test.ts`, one row each): `build farm from wood x9` is a build with `repeat: 9`;
      `build farm with 2 from wood then farm walk 3s x9` keeps builders, then, walk and `repeat: 9`; `move 1 sheep to berry x3`
      is `repeat: 3`; `research wheelbarrow x2` and `research wheelbarrow at mill x2` parse with `repeat: 2`; `pause capital-town-center x2`
      and `rally capital-town-center -> wood x2` parse with `repeat: 2`; a triggered line (`@1:30 build farm from wood x2`,
      `whenever gold runs out move all gold to gold#2 x2`) keeps its trigger and reaction; `build farm from wood x09` is `repeat: 9`;
      `x0` and `x201` parse, and `checkBuildOrder` then reports `out-of-range` on that step. A test fails if a trailing `xN` is not read
      for a non-produce action, or if `repeat` is read as a count.
- [ ] Position rules (`parse-text.test.ts`, the table that rejects `%j` as `syntax` naming the token): `build farm x9 from wood`,
      `build farm from wood x9 then farm`, `build farm from wood x9 walk 3s`, `produce villager from capital-town-center x3 x2`,
      `produce villager from capital-town-center -> sheep x2`, `produce villager from capital-town-center walk 4s x3`, `X9`,
      `x 9`, `x-1`, `x1.5` after a build line, and `build farm from wood x9 x2` are one `syntax` issue each on the line. A test
      fails if `xN` is accepted anywhere but last.
- [ ] Node and id positions: `move 3 sheep to x9` parses with `to: "x9"` and no `repeat`, and validation reports `unknown-id`;
      `build farm from x9` and `build farm from wood then x9` read `x9` as a node. A test fails if a trailing-position rule takes
      `x9` as a repeat in a node slot.
- [ ] Produce unchanged: `produce villager from capital-town-center x3` is `count: 3` with no `repeat`; `produce villager from capital-town-center x3 -> sheep walk 4s`
      still parses as before.
- [ ] Printing: `formatBuildStep` prints `x<repeat>` last for a build, move, research, pause and rally step that has `repeat`, after `walk Ns`
      when present, and before nothing else; `repeat: 1` prints `x1`; a step without `repeat` prints as before. Round trip: for build, move and
      research steps (plain, with walk, triggered, and a reaction), `parseBuildOrderText(formatBuildOrderText(order))` gives equal steps, and the
      `representable` round-trip table gains repeat rows. No row claims a round trip for `produce` with `repeat`.
- [ ] Saved and named builds: `checkSaveBuildRequest` accepts a body whose build has `repeat` on a `build` step and on a `move` step
      (the round-trip check no longer answers `reopening it as text would change the build`), and a test fails if the formatter drops
      `repeat`.
- [ ] Table field: a build row and a move row each offer `step-field-repeat` under More options; no other action row does. Typing `2`
      into it sets `repeat: 2` and the text view's line ends `x2`; clearing it removes `repeat` and the `x2`; letters leave the step
      unchanged; `0` sets `repeat: 0` and the inline issue list shows the `out-of-range` issue for that step. A row whose pasted line
      has `xN` starts open. (Covered by the spec below for the page and by `step-table-model.test.ts` for the model rule.)
- [ ] `changeAction` (`step-table-model.test.ts`): a build step with `repeat` changed to `move` keeps `repeat`; the same step changed to
      `produce`, `research`, `rally` and `pause` drops it, with trigger and reaction carried as today; a step without `repeat` gains no
      `repeat` key; the same action returns the same object. A test fails if `repeat` is kept for a non-repeatable action or dropped
      for build or move.
- [ ] Page spec `acceptance/aoe4-repeat-step.spec.ts`:
  - typing a build step with `x3` in the text view runs once; the row for that step has `step-copies` reading `<done> of 3 done`
    and the closed copy list holds exactly three `step-copy` items with `data-copy` 1, 2 and 3 once opened; the number of `step-row`
    elements is the number of steps written, not the expanded count.
  - the row's `step-started`, `step-finished`, `step-waited`, `step-blocked-by` and `step-run` each match exactly one element, before
    and after the copy list is opened (the copy items do not reuse the combined cell's test ids), and the copy items' own values
    (started, finished) are visible text only once the list is open.
  - the copy list is closed on first render and after a reload; focusing its `<summary>` (`Each copy`) and pressing Enter opens
    it, pressing Enter again closes it, and Space does the same; the items are visible only while it is open (a visibility check,
    not only the `open` attribute). The summary is reachable by Tab from the row's controls.
  - setting Repeat to 2 in the table (More options, then `step-field-repeat`) reformats the text line to end `x2`, runs again, and
    the row's `step-copies` reads `<done> of 2 done` with two `step-copy` items; changing the step's action to a non-repeatable one
    removes the `xN` from the line and the row shows no `step-copies`.
  - hovering the repeated row shades exactly one span on every chart: its `data-from` equals the first copy's `startedAt` and its
    `data-to` the last started copy's end, taken from the response of the run (not from the page); the same span when the line's
    gutter annotation is hovered in the text view. A test fails if the span covers only one copy.
  - layout and band values are read in one `evaluate` under `expect.poll` or `toPass`.
  The spec saves no build and names none. It is mutation-checked and run per common.md.
- [ ] Existing page specs (`aoe4-step-table`, `aoe4-step-annotations`, `aoe4-build-order-step-band`, `aoe4-editor-width`) keep their assertions,
      including the `step-more` test that counts the optional fields of a `produce` row.
- [ ] Docs: the format doc's paste-format table and grammar details describe the trailing `xN` for `build`, `move`, `research`, `pause` and
      `rally`, its last position, the produce exception and the node/id reading; no sentence in `docs/aoe4-build-order-format.md` says `walk Ns`
      is the last suffix on a `build`, `move` or `rally` line; the UI doc's list of optional step-table fields names `repeat`.
- [ ] `npx tsc --noEmit`, `npm test`, `npm run lint:dup` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none
