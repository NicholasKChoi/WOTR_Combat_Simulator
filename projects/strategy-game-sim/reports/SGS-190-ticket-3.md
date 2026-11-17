# SGS-190 ticket report 3 (re-spec 2)

**File**: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-190-steps-wait-for-free-building.md

## Summary

SGS-190 "Steps wait for a free building (produce and research)", component aoe4-build-order, M11, Feature, risk high, about 150 business-logic lines, depends on SGS-189. Re-spec 2 adds the one gap from spec-gate-2: `docs/aoe4-build-order-format.md`'s wait-reasons section goes untrue under the busy rule and no ticket owned it. Scope Docs now names its three statements (the `waitingOn` table's `prerequisite` row lists only a missing instance or above-age entry; the `resources` row says "this is the only reason that reserves"; and "The order is `prerequisite`, then `villagers` or `population`, then `resources`.") plus any other sentence in that section the rule makes untrue (examples: the lead-in listing why a step waits, "A handler checks in a fixed order"). Wording stays with the implementer. A new `(respec 2)` criterion requires: the `prerequisite` row names a busy target for `produce` and `research`; a search for `only reason that reserves` in that file finds nothing, and the section says a step waiting for a busy building reserves its cost; and the single fixed-order sentence is gone, or it now says the busy check comes after resources. Nothing else changed. A `## Re-spec 2 - 2026-11-16` section was appended.

## Verification

- Checked at origin/main 87f0cd7: `only reason that reserves` matches once (format doc line 470), and `` The order is `prerequisite`, then `` matches once (line 472). Both statements are in docs/aoe4-build-order-format.md only. The `prerequisite` row (line 467) reads as the gate described.
- The ticket-lint.py check passes (exit 0).

## Diagrams

The existing read/act/record flowchart for `offerSteps`/`startProduction` is unchanged.

## Open questions

none

## Overlap

SGS-200 (docs) line "Check, do not rewrite, the sentences the busy-building ... tickets already edited (... the format doc's ... wait-reasons table ...)" now matches: SGS-190 owns the edit, and SGS-200 checks it. SGS-200 needs no change. Gate note carried forward: SGS-189's re-spec should land before SGS-190 starts.
