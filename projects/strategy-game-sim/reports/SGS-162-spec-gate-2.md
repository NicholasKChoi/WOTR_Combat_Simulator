# SGS-162 spec gate 2

Verdict: READY

Gate 1's gap (key filter must run before the probe) is closed: Scope fixes the order and explains the cross-tab loop, and a new criterion requires no storage write for an unrelated-key event. Criterion 1 now observes only the My builds list.

## Checked (origin/main)

- Grounding: the `reread` effect in `pages/apps/aoe4-build-order.tsx` checks only `(key !== null && key !== MY_BUILDS_STORAGE_KEY) || storage === null`. The mount effect uses `storage === null || !myBuildsAvailable(storage)`. `myBuildsAvailable` does `setItem(PROBE_KEY)` then `removeItem`, as the ticket says. `blockStorageWrites` in `acceptance/helpers.ts` replaces `Storage.prototype.setItem` with a throwing stub. The `storage unavailable` describe and the two-tab test (line ~921) exist. The doc sentence is at `docs/aoe4-build-order.md` ~1138.
- Testability: a blocked page plus a second unblocked page seeding the key can observe an empty My builds group, and it fails before the fix. Criterion 2 can be observed by counting `setItem`/`removeItem` calls through an init-script wrapper. No existing test combines `blockStorageWrites` with storage events, so existing tests are unaffected.
- Risk low, Invariants none, no contracts, schema or diagram triggers, no overlapping open ticket in TASK-GRAPH, On merge `none`, Unverified assumptions `none` is fine (storage-event behavior is already covered by existing acceptance tests).
- Docs: the ticket leaves the doc edit to the implementer's judgment ("edit only if it reads as untrue"). That is acceptable, since the sentence stays true where storage works.

## Notes

- The `[selected]` dependency list means the listener re-registers on selection changes. That does not matter here.
- The id SGS-162 collides with the older `reports/SGS-162-rca.md` and `SGS-162-debugger-1.md` (unrelated debug item). The manager should confirm the id (carried from gate 1).
