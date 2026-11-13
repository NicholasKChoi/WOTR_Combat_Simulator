# SGS-147 spec gate 2

Verdict: NEEDS_SPEC (one gap, not owner-only). Risk `low` stays correct.

Read at origin/main after `git fetch origin`.

## Prior gaps

Both gate-1 gaps are closed. The Tests scope is now a rule. It covers `pin-storage.test.ts` and the two unreadable-pin loops in `acceptance/aoe4-build-order-pin-compare.spec.ts`, at lines 618-631 and 788-801. It keeps the null assertion for rows whose pin parses (length cap, route-rejected duration, text that no longer converts). `m4-flow.spec.ts` line 90 asserts null only after the user's own Unpin, so it is unaffected. A left-in-place and overwrite criterion exists. The create criterion now has a helper test path.

## Gaps

1. Acceptance criterion "`recordCreated` builds the new entry list only through that helper ... the My builds group after a create equals what `readMyBuilds` returns for the stored list" - contradicts Scope and breaks on a real case.
   - The helper drops the oldest `mine` entries "in list order, since they are newest first". The list is not reliably in that order.
     - `readMyBuilds` and `upsertMyBuild` order by `Date.parse(updatedAt)`, descending (`newestFirst` in `my-builds-storage.ts`).
     - `recordUpdated` keeps an updated build at its old list position. Its Out of scope line says it is not reordered, even though storage bumps `updatedAt`.
     - So with 50 builds, after an update in this tab, a create drops a different entry from the list than storage drops.
   - Scope also says the selected entry is never dropped. Storage may evict that same entry, so the list and `readMyBuilds` again differ.
   - An implementer cannot satisfy "equals `readMyBuilds`", "the oldest are the last `mine` entries in list order", and "never drop the selected" together. They would guess which one gives way.
   - Proposed fix, pick one:
     (a) Drop the equality claim. State only the helper properties: count is at most `MY_BUILDS_MAX`, the new entry is kept, and the selected entry is kept. Add that the in-memory list may keep a selected entry that storage evicted.
     (b) Keep equality. After a successful `upsertMyBuild`, build the group from the returned `builds`, and make the helper take that stored order. Then drop the selected-entry rule, or state that it wins over equality.
   - Option (a) is smaller and matches the ~40 LOC estimate.

## Checks that passed

- Grounded: `readStoredPin`, `reread`, `recordCreated`, `withRereadMyBuilds`, `withMyBuilds`, `withLoadedEntry`, `MY_BUILDS_MAX`, and the doc seams at lines 1041 and 1111-1113 all exist and match the quoted text.
- `withRereadMyBuilds` already keeps the selected build on an empty store, as Scope states.
- The tests that depend on pin removal are covered. No other unit or acceptance test asserts removal of an unreadable pin.
- `schemaLibrary` and input validation: not applicable, since no new boundary input.
- Open questions: none. On merge: `none`. Unverified assumptions: `none` is fine. A real browser fires `storage` with a null key on `clear()`, and the two-tab acceptance case exercises it.
- Diagrams: not triggered.
- No overlap with other open tickets. TASK-GRAPH shows SGS-149, SGS-151 and SGS-153 as test-only or script-only. I did not open them to check whether they touch the pin loops in the pin-compare spec.

## Notes

- The two-tab criterion should name that the acceptance test uses two pages in one browser context, so both share `localStorage`.
- The helper needs a selected-key parameter. `recordCreated` already has `selectedRef`, so it can pass that.
