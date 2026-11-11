# SGS-124 ticket 2 (Re-spec 3)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-124-page-library-select-edited-marker-discard-guard.md

## Summary

SGS-124 "Wire the build library into the page: grouped select, edited marker, discard guard and `?n=` / `?b=` loading". Component aoe4-build-order, risk high, about 355 business-logic lines (was 340; +15 for two list merges), depends on SGS-114, SGS-122 and SGS-123. Covers M8.1 client, M8.6 and M8.9. Re-spec 3 folds in spec-gate-2.

## Changes

- Gap 1 (merge precedence): Scope now names two pure functions in `build-library.ts`. `withMyBuilds(list, mine)` keeps non-mine entries, then the `mine` entries in stored order, each taking `loaded` from a listed entry with the same key, so it never nulls a fetched `loaded`; the stored name and kind `mine` win. `withLoadedEntry(list, entry)` replaces in place (a listed `mine` entry changes only `loaded`) or appends. Applying them in either order gives deep-equal lists. A new `(respec 3)` unit criterion in `build-library.test.ts` checks both orders, stored order, a shared entry being replaced whole, appending, and that link and shared entries are kept. The existing gated-after acceptance case stays. The names are recorded in CONTEXT.md Key surfaces because they are not in design C6.
- Gap 2 (beforeunload and existing tests): a new `acceptBeforeUnload(page)` in `acceptance/helpers.ts`. It uses `page.once('dialog')`, throws on any dialog type other than `beforeunload`, and accepts that one. The existing-tests rule now covers tests that reload, `goto` or do a full-page link load while the page is edited: they call the helper or restore the input first. The implementer lists each one, with `aoe4-build-order-pin-compare.spec.ts` reloads as examples. New `(respec 3)` criterion added; the unload-guard criterion uses the helper. To coordinate with SGS-118, both tickets add separate exports to helpers.ts and neither is a dependency. Gated stubs in specs wait on an inline promise, never a local `function hold...`, because SGS-118's search forbids that.
- Opened links order: "open order" per design "Library, select and edits" `select` row. A new opened entry goes last (`withLoadedEntry` appends). "Prepended" is removed. Behavior is the same in this ticket because only one opened entry can exist.
- Non-blocking notes: the `readMyBuilds` write side effect in the `?n=` branch is noted in Scope as harmless. The Docs bullet now says to read every `?b=` and select hit in the two sections.

## Checks

- `ticket-lint.py`: no errors.
- `git grep -nw initialB origin/main -- pages components` matches only `pages/apps/aoe4-build-order.tsx`, which Scope edits. `withMyBuilds`, `withLoadedEntry` and `acceptBeforeUnload` do not exist on main yet.
- No local SGS-124 branch exists, so no branch work is affected.

## Diagrams

The existing state diagram is unchanged. The merge rules change no transition.

## Open questions

None.

## Overlap

- SGS-118 also edits `acceptance/helpers.ts` (`holdNextSimulate`). The exports are separate and either can merge first.
- SGS-125 depends on this ticket. It adds `savedMineEntry` "first in My builds (replacing by key)" with its own placement rule and does not use `withLoadedEntry`. It extends `aoe4-my-builds.spec.ts` and can reuse `acceptBeforeUnload`.
