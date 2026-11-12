# SGS-131 ticket author 2 (re-spec 1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-131-my-builds-no-wipe-and-backup.md

## Summary

SGS-131, "Never wipe my-builds on a parse failure; back up the unreadable value before overwriting it". Component aoe4-build-order, about 50 business-logic lines in `my-builds-storage.ts`. Depends on SGS-128. Covers M9.10 (my-builds half). Both blocking gaps from SGS-131-spec-gate-1 are folded in:

1. Existing-test contradiction: confirmed at origin/main that the `it.each` 'returns [] and removes the key for %s' test in `my-builds-storage.test.ts` asserts the key is null after a read. Scope now gives a rule instead of "existing tests keep their assertions": a test asserting `readMyBuilds` removes the stored value is changed so the same rows assert the stored string is unchanged; every other existing test keeps its assertions; the implementer lists every test it edits. The first criterion (respec 1) adds that no existing test still asserts removal.
2. Throwing `getItem` in `upsertMyBuild`: committed to the gate's rule. No backup is attempted (backup key neither read nor written), the list is written as before, and `persisted` follows the list write. New criterion (respec 1): storage with throwing `getItem` and working `setItem` gives no backup key, the list written, `persisted: true`, and the new entry in `builds`.

The gate's non-blocking note was also applied: test storages that record write order or throw on one key or on `getItem` wrap the shared `fakeStorage` rather than defining a new `Storage` fake (jscpd gate).

Root cause of the bounce: the ticket was written without reading the existing removal test's assertions, and it deferred a behavior choice to a design table that does not cover it.

## Diagrams

None (single component, outside the core control loop).

## Open questions

none

## Overlap

None new. The gate found no overlap (SGS-132 and SGS-141 mention my-builds only in passing; SGS-130 is the Blob seam). No SGS-131 branch exists, so there is no branch work to keep.

## Lint

`ticket-lint.py` reports no errors.
