# SGS-190 spec gate 3

**Verdict: READY**

## Gaps

None.

## Checked

- Gate 2 gap closed: Scope Docs now covers `docs/aoe4-build-order-format.md` wait-reasons, and a criterion pins it. Search strings verified against origin/main 87f0cd7: `only reason that reserves` (line 470), the `The order is \`prerequisite\`, then` sentence (line 472) and "A handler checks in a fixed order" (line 462) all match at base. The `prerequisite` row (line 467) lists no busy cause today.
- Model doc searches still match at base: `Queue length is not consulted` (210), `replaces its order (a switch)` (187), `While it waits on resources` (177), `short of resources alone` (223), `occupies its building's queue` (229). Lines 203 and 221 (switch lets paid units finish, research appended behind a unit already paid) fall under the listed paragraph rules.
- Grounding: `research.ts:9` comment says queue length is not consulted; `engine-common.ts` type-imports `EngineState` from `./simulate` (consistent with C7c); `startingWith` and `tierCountAt` are local to `research.test.ts` only; the four Castle research techs exist in the Spear/Longbow build JSON (lines 516 to 528).
- Contracts, diagram, risk high, invariants A1 to A3, On merge format, Unverified assumptions none, open questions none: unchanged from gate 2 and still correct. SGS-192 extends these handlers after this ticket and SGS-200 only checks docs this ticket edits, so no overlap or throwaway work.

## Notes

- SGS-189 is still `needs_spec` in TASK-GRAPH (re-gate in flight). SGS-190 re-pins the Knight/Longbow tier test by rule and does not assume SGS-189's (840, 845] window, so it works with either outcome; do not start SGS-190 before SGS-189 lands.
- The M11 design text for M11.5a still says the veteran-longbowmen completion is 841.2 s in (840, 845]; the ticket treats it as non-binding, which is correct.
