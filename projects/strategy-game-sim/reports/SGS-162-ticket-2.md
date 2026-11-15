# SGS-162 ticket 2 (re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-162-aoe4-my-builds-reread-availability-check.md

## Summary

"Check My builds availability before the storage listener rereads" (Chore, aoe4-build-order, Milestone none, Risk low, ~5 business-logic lines in the `reread` listener in `pages/apps/aoe4-build-order.tsx`, no dependencies). Re-spec folds in spec-gate 1:

- Scope now states the order inside `reread`: the key filter returns first, then `myBuildsAvailable` runs. The reason is in Scope: the probe in `components/apps/aoe4-build-order/my-builds-storage.ts` (`myBuildsAvailable`, setItem/removeItem of a probe key) fires `storage` events in other tabs, so probing first could loop between tabs. With the filter first, the probe-key event is filtered out.
- New criterion (respec 1): a `storage` event for a key other than the My builds key or null causes no storage write in the receiving tab. A test fails if the probe or any other write runs before the filter.
- Criterion 1 (respec 1) now observes only the My builds list (no group appears on a write-blocked page after another tab stores builds). That list stands for entries and secrets both, because the page does not show secrets.
- The pre-existing criterion that a usable page still rereads on My-builds-key and null-key events and ignores unrelated keys is unchanged.

Checked at origin/main: `reread` currently tests `storage === null` together with the key filter. The mount effect uses `storage === null || !myBuildsAvailable(storage)`. `blockStorageWrites` overrides only `setItem`. No task branch for SGS-162 exists.

Diagrams: none (single component, not a core loop).
Open questions: none.
Overlap: none found. The id collision with the unrelated `SGS-162-rca.md` / `SGS-162-debugger-1.md` was accepted by the manager, and the id is kept.
ticket-lint: clean.
