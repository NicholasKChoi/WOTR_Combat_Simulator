# SGS-097: Clarify OpenAPI issue wording and truncate long object keys in issue labels

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog cleanup, 2026-11-06)
- **Priority**: low
- **Risk**: standard
  <!-- Not low: the message text of the public 400 response changes (for object keys over 40 characters) and
       the public OpenAPI document is edited. Not high: no response field is added, removed or retyped, no
       criticalPaths symbol or strongModelTriggers item applies (the engine is untouched), and the 400 `message`
       is documented as human-readable text, not a parsed format. -->
- **Invariants**: none adjacent (A1-A3 govern the engine; this touches only issue labels and docs)
- **LOC estimate**: about 15 business-logic lines (`schema.ts`: `checkSimInputs` label join and
  `startVillagersSchema` name; one new test table in `schema.test.ts`); the rest is OpenAPI JSON and doc wording
- **Depends on**: none (SGS-091, which added `shortText` for quoted ids, is integrated on main)
- **On merge**: state-dir edit to `design/M4.md` (not a code-repo file): in the Step table section, row
  `start row | delete last pair`, replace "An order with neither villagers nor rally drops `start` (civ default)" with
  "An order with neither villagers nor rally drops `start`. English requires `start.rally`, so Run rejects such an
  order with the check issue `no start.rally while starting building ... produces villagers`; the user fixes it
  with Customize start (`start-customize`)". In row `start row | start-villagers-add`, replace "at the end" with
  "to `start.villagers`; the formatter writes villager pairs in its fixed node order, so the new pair can appear
  anywhere in the text, first included".
- **Source**: BACKLOG.md bullets from the SGS-068 review (design M4 step table), SGS-061 review (OpenAPI wording,
  design C4) and SGS-091 ticket (long keys in labels)

## Context

Three leftovers from earlier reviews. An OpenAPI description says an issue message "names the step" when start,
inputs and request issues have no step; the 400 description does not list the two request-level messages the design
(C4) says it lists; and an issue label built from a user-supplied object key carries the key in full, although SGS-091
caps every quoted id at 40 characters.

## Scope

Paths relative to the repo root, verified against `origin/main` at 9274372.

**1. Design wording (SGS-068 review): moved to On merge.** The two misleading cells are in
`design/M4.md` (state dir), not in the code repo. `docs/aoe4-build-order.md` does not repeat either: on main it
already says "An English order still needs `start.rally`, because its starting town center is a villager producer"
(Starting state and population paragraph), and no doc or README says "civ default" or "Add the pair". Nothing in the
code repo changes for this item. (The test title `adds the first unused node with a count of 1 at the end` in
`components/apps/aoe4-build-order/step-table-model.test.ts` describes the model's pair list, which is correct; leave
it.)

**2. OpenAPI wording (SGS-061 review).** `docs/api/openapi.json`:
- `components.schemas.BuildOrderIssue.properties.message.description`: replace "naming the step and the offending
  id, kind or property" with wording that names where the issue is: a step (`steps[N]`), `start`, `inputs.<path>`,
  `civ` or `request`, plus the offending id, kind or property. It must not say every message names a step
  (`step` is absent for start, inputs and request issues, as the `step` property description says).
- `paths./api/aoe4-build-order/simulate.post.responses.400.description`: add the two request-level messages, with
  their exact text, `request: missing buildOrder` and `request: text is no longer accepted; convert the paste to
  buildOrder and send that`, and say that each is a single `syntax` issue with no `step`. The existing examples
  (`missingBuildOrder`-style and removed-`text` entries) stay; the description now states what the examples show.
- In `docs/aoe4-build-order.md`, Validation section: the sentence "A message names the step or line and the offending
  id, kind or property." gets the same correction (location is a step, line, `start`, `inputs.<path>` or `request`).

**3. Truncate object keys in issue labels (SGS-091 ticket).** Decision: yes, truncate, by the same rule as SGS-091
(`shortText` in `lib/aoe4-build-order/model.ts`: first 40 characters plus `...`). Reason: the `inputs.<path>: ` prefix
and `start.villagers.<node>` name are the same user-supplied text as the quoted id, and today a 900,000-character key
in `nodeAmounts` produces a message that is 900,000 characters even though the quoted id inside is cut. Two sites:
- `lib/aoe4-build-order/schema.ts`, `checkSimInputs`: the label `['inputs', ...found.path].join('.')` passes every
  segment through `shortText`. Segments that are fixed field names are shorter than 40 and unchanged; the keyed
  segments (`trips`, `influenceCoverage`, `nodeAmounts` keys) are cut.
  These rows run through `checkSimInputs` (the test file's `simIssues` helper). `keyedRecord` reports a bad key
  with path `[key]`, so the key is in the label for the key's own reason: today `{ trips: { [k]: {} } }` gives
  `inputs.trips.<k>: unknown node "<shortText(k)>"`, `{ influenceCoverage: { [k]: 1 } }` gives
  `inputs.influenceCoverage.<k>: unknown building "<shortText(k)>"`, and `{ nodeAmounts: { [k]: 1 } }` with `k` not
  a gather node gives `inputs.nodeAmounts.<k>: unknown node "<shortText(k)>"`. After the change `<k>` in the label
  is `shortText(k)` too.
- `lib/aoe4-build-order/schema.ts`, `startVillagersSchema`: the `name` built from the node key for the
  `start.villagers.<node>` label uses `shortText(node)` for the key. That `name` appears only in the count problems
  from `typed(name, 'number', ...)` (`start.villagers.<node> must be a number`) and `inRange(name, 'startVillagers')`
  (`start.villagers.<node>: <n> is outside 0..200`); the key's own problem, `nodeAt('start.villagers', false)(node)`,
  carries no key label and already quotes via `shortText`. These rows run through `checkBuildOrder` (the test
  file's `messages` helper with `order([], { rally: 'sheep', villagers: { [k]: <bad count> } })`), where the count
  message is rendered with the `start: ` location, for example `start: start.villagers.sheep must be a number`.
- Response shape: unchanged. The issue has no separate `path` field; the path exists only as the prefix of
  `message`, so only the text of `message` changes, and only for keys over 40 characters. Flagged in Risk.
- `docs/aoe4-build-order.md`, the node-validation paragraph ("A quoted id longer than 40 characters is cut ..."):
  extend the sentence to say the same cut applies to an object key shown in an issue label
  (`inputs.<path>`, `start.villagers.<node>`).

**Out of scope:** `design/M4.md` edits (On merge); engine, route and schema shape changes; truncating field names
that are fixed by the schema; step-level labels (`steps[N]`, `line N`), which hold no user text.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `BuildOrderIssue.message.description` in `docs/api/openapi.json` no longer says the message names "the step"
  unconditionally and states the other locations (`start`, `inputs.<path>`, `request`). Check:
  `git grep -n "naming the step and" -- docs/api/openapi.json docs/aoe4-build-order.md` finds nothing.
- [ ] (respec 1) The simulate `400` description contains both exact request-level messages quoted in Scope, and the
  existing 400 examples are unchanged. Check:
  `jq -r '.paths["/api/aoe4-build-order/simulate"].post.responses["400"].description' docs/api/openapi.json`
  prints text containing `request: missing buildOrder` and
  `request: text is no longer accepted; convert the paste to buildOrder and send that` (today it contains neither; a
  plain `git grep "request: missing buildOrder"` already matches the examples, so it does not confirm the
  description), and the contract spec (`acceptance/aoe4-simulate-api-contract.spec.ts`, 400-example cases) still
  passes.
- [ ] (respec 1) A new table in `lib/aoe4-build-order/schema.test.ts` (next to the `quoted ids in issue messages`
  table, same lengths 39, 40, 41 and 5000, key built from a fill such as `x` repeated so it is never a valid id)
  pins the label for each key site. With `cut` = the key for lengths 39 and 40, and its first 40 characters followed
  by `...` for 41 and 5000, exactly one message equals in full:
  - `trips` (via `simIssues({ trips: { [key]: {} } })`): `inputs.trips.<cut>: unknown node "<cut>"`;
  - `influenceCoverage` (via `simIssues({ influenceCoverage: { [key]: 1 } })`):
    `inputs.influenceCoverage.<cut>: unknown building "<cut>"`;
  - `nodeAmounts` (via `simIssues({ nodeAmounts: { [key]: 1 } })`): `inputs.nodeAmounts.<cut>: unknown node "<cut>"`;
  - `start.villagers` (via `messages(order([], { rally: 'sheep', villagers: { [key]: '6' } }))`, a long key paired
    with a non-number count so the count problem renders the key label):
    `start: start.villagers.<cut> must be a number`. The unknown-node message for the same key is not the asserted
    one.

  Matching is whole-message equality (`toContain` on the message list, or a filter on `===` with length 1), not
  `endsWith`, so the label prefix is checked. Break it must catch: reverting the `shortText` call in
  `checkSimInputs` makes the 41- and 5000-character `trips`, `influenceCoverage` and `nodeAmounts` rows fail;
  reverting the one in `startVillagersSchema` makes the 41- and 5000-character `start.villagers` rows fail.
- [ ] An issue whose key is 40 characters or fewer has the same message as before this change: every existing
  `schema.test.ts` and route test that pins an `inputs.` or `start.villagers.` message passes unedited.
- [ ] The `docs/aoe4-build-order.md` sentence on the 40-character cut names object keys in labels as well as quoted
  ids, and no doc states a measured value.
- [ ] `docs/aoe4-build-order.md` Validation section no longer says a message always names "the step or line".
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-06

- Underspecified: the `start.villagers` test row could not fail on a revert (the key label appears only in count
  problems), and the label table matched by `endsWith`, which skips the label prefix under change.
- Changed: Scope names the helper and input for each key site; criterion 3 pins whole messages, with the
  `start.villagers` row pairing a long key with a non-number count; criterion 2 adds a `jq` check on the 400
  description; On merge drops the BACKLOG deletion (bullets already archived).
- Branch work: none exists yet.
