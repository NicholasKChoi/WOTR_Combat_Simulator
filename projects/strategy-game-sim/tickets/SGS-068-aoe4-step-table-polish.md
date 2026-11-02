# SGS-068: Step table polish: readable labels, optional fields tucked away, compact controls, editable start row, cards under 768 px

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / M4.9
- **Priority**: medium
- **Risk**: standard
  <!-- No strongModelTriggers item (UI only; no schema, API or simulation change). Not low: it is over
       ~100 lines of business logic and the start row writes `order.start`, which the route validates. -->
- **Invariants**: S3 (the start row adds numeric inputs; they are not capped in the table and are checked on Run by the shared schema and the route, as step numbers are today)
- **LOC estimate**: about 230 (`step-table.tsx` about 130 changed or added; `step-table-model.ts` about 70 added: labels, start edits, disclosure default; new `step-table.module.css` about 30). Tests and docs excluded.
- **Depends on**: SGS-059
- **On merge**: none
- **Source**: M4 design contract C9, "Step table (M4.9, M4.13)" behavior rules and "Left to tickets" (`design/M4.md`); plan outline L (`plans/M4-20261102.md`); criterion M4.9 (`MILESTONES.md`)

## Context

The step table prints raw field names (`walkSeconds`, `atLeast`, `trigger-count`), shows every optional field of
every row, uses text buttons for reorder and delete, and shows the `start` line as a read-only `<pre>`. M4.9 asks for
readable labels, optional fields tucked away, compact controls and an editable start row; the design adds
card rows under 768 px. SGS-059 has already renamed the `StepTable` prop to `catalog`.

## Scope

Paths are relative to the repo root. The design says `components/aoe4-build-order/`; the files are in
`components/apps/aoe4-build-order/`. Names are those of C2 and C9 (`design/M4.md`): `OPTIONAL_STEP_FIELDS`,
`BuildOrderCatalog` (`names`, `nodes`, `defaultStart`) from `lib/aoe4-build-order/schema.ts` (SGS-057).

**1. `step-table-model.ts`.**
- `export const FIELD_LABELS` with exactly the C9 table: `producer` "Building", `instance` "Building #", `unit`
  "Unit", `count` "Count", `rally` "Rally to", `walkSeconds` "Walk time (s)", `to` "To", `building` "Building",
  `builders` "Builders", `from` "From", `then` "Then", `tech` "Technology", `at` "At", `seconds` "Time (s)",
  `trigger-count` "Villagers", `node` "Node", `resource` "Resource", `atLeast` "At least", `reaction` "Every time".
- `nodeLabel(ref)`: the capitalised node id (`Sheep`, `Berry`, `Farm`, `Wood`, `Gold`, `Stone` ...), and
  `gold#k` as `Gold deposit k`.
- `optionLabel`-style helper (name is the ticket's choice) for select option text: an id in `catalog.names` shows
  its name, a node shows `nodeLabel`, any other value shows the id, and an unlisted pasted id keeps `<id> (unknown)`
  (never a display name). The option `value` stays the id.
- A pure helper for the disclosure default: true when any `OPTIONAL_STEP_FIELDS[step.action]` key is set on the step.
- Start edits, each pure and returning a new `BuildOrder`: set rally (empty string removes it), set a pair's count,
  change a pair's node, add a pair, delete a pair. Each writes `order.start`, then drops `start` when it has neither
  villagers nor rally; the page sets `text = formatBuildOrderText(order)` as it does for step edits. A pair is
  `[node, count]` in the order of `Object.entries(start.villagers)`. A count draft goes through the existing
  `parseUnsigned` rule (rejected draft leaves the order unchanged; no empty-draft delete for a count). Choosing a
  node another pair already uses is not offered (`start.villagers` is a record keyed by node).
  Add inserts, at the end, a pair for the first `catalog.nodes` entry not yet used, count 1, and is disabled when every
  node is used (design pass 4). The table shows no villager-sum hint; the sum rule is checked on Run only and its
  issue shows in `build-order-issues` once `checked`. Deleting the last pair leaves `villagers` empty (written as no villagers clause).

**2. `step-table.tsx`.**
- Every `Labeled` label comes from `FIELD_LABELS` (the six literal labels in `TriggerFields` and `label={field.name}`
  in `ActionFields` go). Option text per the helper above. Trigger-kind and action option text is the ticket's
  wording (for example "At time", "When node runs out"), with `value` unchanged.
- Optional fields: `ActionFields` splits `actionFields(step, ...)` into primary fields and those in
  `OPTIONAL_STEP_FIELDS[step.action]` (imported from `schema.ts`, not copied). Primary fields always render; optional
  ones render only while the row is expanded. A `step-more` button (`type="button"`, `aria-expanded`) toggles the row.
  State is per row index: initial value from the disclosure-default helper; it resets (recomputed from the rows) when
  the row count changes; changing a row's action recomputes that row to collapsed (no optional field is set after
  `changeAction`); clearing an optional field does not collapse the row. The `step-field-<field>` ids stay.
- Reorder and delete become icon buttons with `aria-label` "Move up", "Move down", "Delete step"; test ids
  `step-move-up`, `step-move-down`, `step-delete` and the disabled rules (up on row 0, down on the last row) stay.
  `step-add` stays a text button. Glyphs are the ticket's choice.
- Start row: `data-testid="step-start-row"`, always the first row of the table body, replacing the `<pre>`. While
  `order.start` is absent it shows a `start-customize` button (and no fields); click sets `start` to
  `catalog.defaultStart`. While present it shows: `start-field-rally` (select over `catalog.nodes` plus `(none)`),
  one pair per villager entry (`start-villagers-count` number control and `start-villagers-node` select, each with
  `data-index`; `start-villagers-delete` with `data-index`), and `start-villagers-add`. No `step-row` test id is used
  on it, so `step-row` counts still equal the step count.
- Layout: a CSS module `step-table.module.css` (next to the component). At width 768 px and above the table looks as
  today. Under 768 px each row, the start row included, renders as a card: its cells stack and each labelled field
  sits on its own line. The `step-row` element and its `data-step` stay the same element at every width; layout is CSS
  only.

**3. Tests.**
- `step-table-model.test.ts`: `FIELD_LABELS` has a non-empty label for every field name the table renders; `nodeLabel`
  cases; the disclosure default (set vs unset optional, per action); each start edit including drop-`start`-when-empty,
  delete last pair, rally cleared, a rejected count draft, add with every node used; a round trip through
  `formatBuildOrderText` / `parseBuildOrderText` after each start edit.
- `acceptance/aoe4-step-table.spec.ts`: new tests per the criteria below. Rule for existing tests: a test that reads
  or edits an optional field on a row where it is not set clicks `step-more` on that row first; every other test keeps
  its expected values. The implementer lists every test it edits.

**4. Docs.** `docs/aoe4-build-order.md` "Page" section (the table paragraph, about lines 770 to 780 on `origin/main`;
SGS-059 edits the sentence above it): replace "every field of that action (set or not)", "The `start` line is shown
above the rows and is not editable there" and "move up, move down and delete buttons" with the new behavior: labelled
fields, optional fields behind a per-row More control that starts open when one is set, icon buttons, the first row
editing `start` (rally, villager counts per node, add and delete; "customize" while the order has no `start`), and card
rows under 768 px. Grep `docs/` and both READMEs for any other statement of these (today only that paragraph).

**Out of scope:** the 390 px no-horizontal-scroll check, the timeline and compare scroll boxes (the 390 px ticket);
`catalog` prop rename and `page` edits (SGS-059); `schema.ts`, `OPTIONAL_STEP_FIELDS` values (SGS-057); the villager
total rule on Run (the shared schema); the editor, tabs and issue list; the API and OpenAPI; `golang/`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] No row shows a raw field name: with a build containing every action and trigger kind (the `FORMS` paste in
  `aoe4-step-table.spec.ts`, with each optional field opened), the text of `step-table` contains none of
  `walkSeconds`, `atLeast`, `trigger-count`; a unit test asserts every
  `FIELD_LABELS` value equals the C9 table. `git grep -nE 'label="(seconds|villagers|node|reaction|resource|atLeast)"' -- components/apps/aoe4-build-order/step-table.tsx` prints nothing (6 hits today) and `git grep -n 'label={field.name}' -- components/apps/aoe4-build-order/step-table.tsx` prints nothing (1 hit today).
- [ ] The `unit` select's selected option for `villager` reads the data name (the `catalog.names` entry, not `villager`) and its `value` is `villager`; an unlisted pasted id still reads `<id> (unknown)` with `data-unknown="true"` (existing test unchanged).
- [ ] A produce row for `produce villager from capital-town-center` shows `step-field-producer` and `step-field-unit` and none of `step-field-instance`, `-count`, `-rally`, `-walkSeconds` until `step-more` is clicked (`aria-expanded` false then true); a second click hides them again. The same for each action: only fields outside `OPTIONAL_STEP_FIELDS[action]` show while collapsed.
- [ ] A row whose text sets an optional field (`... x3 -> sheep`) loads expanded; clearing that optional field does not collapse it; adding a row resets expansion to the rows' data; changing a row's action leaves its optional fields hidden.
- [ ] `step-move-up`, `step-move-down`, `step-delete` have accessible names "Move up", "Move down", "Delete step" and keep their behavior and disabled states (the existing move/delete/disabled tests pass unchanged): `git grep -nE '^\s+(Up|Down|Delete)$' -- components/apps/aoe4-build-order/step-table.tsx` prints nothing (3 hits today).
- [ ] The first body row is `step-start-row`. For `start 3 sheep 1 wood -> sheep`: `start-field-rally` has value `sheep`, two pairs with `start-villagers-count` 3 and 1 and node values `sheep` and `wood` (`data-index` 0 and 1); changing the first count to 5 rewrites the textarea to `start 5 sheep 1 wood -> sheep` (formatter order) and reparses; changing the rally to `(none)` removes the `->` clause; deleting both pairs and clearing the rally removes the `start` line.
- [ ] For text with no `start` line, `start-customize` is visible and no `start-field-*` exists; clicking it writes the catalog's default start into the textarea (equal to `formatBuildOrderText({ ...order, start: catalog.defaultStart })`), hides the button, and shows the fields.
- [ ] A pair's node select does not offer a node used by another pair; `start-villagers-add` adds a pair at the end with the first unused `catalog.nodes` entry and count 1; it is disabled when every node is used. (respec 1)
- [ ] With start pairs that do not sum to `catalog.startVillagerTotal`, the table shows no sum hint or warning text (respec 1).
- [ ] The `step-row` count still equals the step count with and without a `start` line (`step-start-row` is not a `step-row`).
- [ ] At a 390 px viewport the `step-trigger-kind` and `step-action` of a row have the same x and the action's y is greater (stacked), and the start row's controls stack the same way; at a 1280 px viewport they are on the same y (side by side). A step edit made at 390 px rewrites the text as at desktop width. `step-row` is the same element at both widths (its `data-step` read at each width).
- [ ] Table edits still never post to the simulate route, and the existing edit tests (rewrite text, number fields, reaction toggle, unknown values, other prebuilt) pass; tests edited only to click `step-more` are listed in the PR.
- [ ] `docs/aoe4-build-order.md` no longer says the start line is not editable: `git grep -nE "not editable there|\(set or not\)" -- docs` prints nothing (2 hits today).
- [ ] `npx tsc --noEmit`, `npm run lint:dup`, `npm test` and `npm run acceptance` (Node 24) pass.
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-02

- Underspecified: Add start villager default and whether the table hints at a villager-sum mismatch (two open questions).
- Changed: Scope and criteria state the designer answers (first unused node, count 1, at the end, disabled when all used; no sum hint); both questions removed.
- Nothing on a branch is affected; the rest of the spec stands.
