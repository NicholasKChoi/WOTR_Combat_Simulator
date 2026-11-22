Title: ticket.md: the existing-tests search misses tests that pin a whole set the change adds to

## Problem

`agents/ticket.md` (Write, the "Search the unit and acceptance tests for what the change alters"
bullet) lists what to search for: a default, a testid, a storage key, an exported function, a route, a
message, or a layout or size property. Every item is a thing the change alters by name. A change that
adds a member to a set (a key in a bounds object, a method in an `Allow` list, a button in a row, an
enum value) breaks the tests that pin the whole set (`toEqual` on a list, a `Record<keyof typeof X>`, a
count). Those tests never mention the new member, so a search for the changed names misses them, and
the ticket then states a rule ("every other test keeps its assertions") that contradicts the change.

## Evidence (WOTR_Combat_Simulator, project strategy-game-sim, 2026-11-18)

Three of the five M12 tickets bounced at spec-gate on exactly this:
- SGS-208 (spec-gate 2, gap 1): adding `SIM_INPUT_BOUNDS.repeat` breaks `schema.test.ts` (a closed
  `rows` list with `toEqual`) and `aoe4-simulate-api-contract.spec.ts`
  (`Record<keyof typeof SIM_INPUT_BOUNDS, ...>`). The ticket's rule covered only the `StepTiming` key
  lists.
- SGS-209 (spec-gate 2, gap 1): adding `PATCH` to the id route's methods changes `Allow: GET, PUT` and
  the 405 message pinned by the DELETE-in-production unit test, and the contract spec's `patchOnId`
  405 probe. The ticket's rule covered only tests "that used `PATCH` as the disallowed method".
- SGS-212 (spec-gate 2, gap 3): adding a Rename button to the save row breaks
  `aoe4-save-status.spec.ts`, which pins the whole row with `toEqual` on `rowIds`. The ticket said that
  spec keeps working "through the unchanged `save-copy-*` ids".
Earlier windows, same shape: SGS-195 RS1 and SGS-199 RS2 (a spec that counted every `h3` on the page).

Each bounce cost an opus re-spec and a spec-gate rerun (~$0.5-0.9 and a round). At `low` risk, where
no spec-gate runs, it would reach the implementer.

## Suggested edit

`agents/ticket.md`, the existing-tests bullet:
```diff
-- Search the unit and acceptance tests for what the change alters (a default, a testid, storage key,
-  exported function, route, message, or layout or size property) and for behavior they assert is
-  absent that the change adds. When a test depends on it, Scope states a rule for existing tests
+- Search the unit and acceptance tests for what the change alters (a default, a testid, storage key,
+  exported function, route, message, or layout or size property) and for behavior they assert is
+  absent that the change adds. When the change adds a member to a set (a key of an exported object, a
+  method in an `Allow` list, a control in a row, an enum value, a list a response returns), also search
+  for the set's name and its siblings: a test that pins the whole set (`toEqual` on a list, a
+  `Record<keyof ...>`, a count, an ordered id list) depends on the change. When a test depends on it,
+  Scope states a rule for existing tests
```
`agents/spec-gate.md` item 2 needs no change; it caught all three.

Source: retro 2026-11-21 (WOTR_Combat_Simulator, strategy-game-sim, M12 close), pattern 3. Report:
`.claude/code-factory/projects/strategy-game-sim/reports/retro-20261121.md`.
