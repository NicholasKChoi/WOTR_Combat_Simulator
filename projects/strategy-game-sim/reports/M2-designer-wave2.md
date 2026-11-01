# M2 designer: wave 2 contract gaps (SGS-028, SGS-029)

Additive edits to design/M2.md (Line map block, Issue codes `invalid` row, new "Producer capability" subsection after
Rally and start, Paste format formatter paragraph). Line-map edits kept. No owner decision needed.

1. Paste `ok: true` order: `civ: 'english'`, `name: 'Pasted build order'` (literal), no `source`; formatter drops `civ`, `name`, `source`. Later civs add a `civ` paste line or parse option.
2. `formatBuildOrderText` is total and rounds nothing: a decimal prints as `String(n)` (`walk 4.5s`, which re-parses as `syntax`); round trip is guaranteed only for paste-representable orders (all numbers non-negative integers); every prebuilt build must be paste-representable (builds ticket tests the round trip).
3. Yes, reject, as `invalid`: `produce` whose `producer` is not in the union of `producedBy` over the unit's entries (`produce villager from house`); `research` with `at` not in the union of the tech's `producedBy` (`research wheelbarrow at house` fails, `at mill` passes). No check without `at`. Runs only after ids resolve. Message names step/line, producer/building and unit/tech. Engine may assume both hold.
4. No named types: validate.ts keeps four exports; return shapes now fixed in the design (`{ ok: true; order } | { ok: false; issues }`, `{ ok: true; inputs } | { ok: false; issues }`), route narrows on `ok`.

Re-spec: SGS-028 (answers 1, 2; close open questions), SGS-029 (two more `invalid` rules, now eight, with test cases; close open question), SGS-033 (route: `invalid` cases include producer capability), builds ticket (round-trip test of prebuilt builds). SGS-030/SGS-032: note only (may assume producer capability; no runtime check).
