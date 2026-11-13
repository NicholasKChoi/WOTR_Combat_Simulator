# SGS-147 spec gate 3

Verdict: READY. Risk `low` stays correct.

Read at origin/main after `git fetch origin`. The fetch printed a gc housekeeping notice but completed.

## Prior gap (gate 2)

Closed. The `recordCreated` criterion no longer claims the group equals `readMyBuilds`.
- Scope and criteria now state that the in-memory My builds group may differ from storage. It may keep an entry storage evicted, and it may drop a different one.
- The helper takes the selected key. The new entry and the selected entry are never dropped.
- The cap criterion covers a selected entry that is the oldest `mine` entry in list order.
- The two-tab case names two pages in one browser context.
- I found no contradiction among "oldest = last `mine` in list order", "never drop selected", and "at most 50". With a cap of 50, the new entry plus the selected entry can both be kept.

## Spot checks (all pass)

- `readStoredPin` calls `removeItem` on the unreadable path (pin-storage.ts line 24). `writeStoredPin` and `clearStoredPin` are separate, so Scope's "reads never throw" holds.
- The `reread` listener returns unless `event.key === MY_BUILDS_STORAGE_KEY` (page line ~219). A null key is therefore ignored today, as the ticket says.
- `recordCreated` prepends with `[entry, ...list.filter(...)]` and never trims (page line ~307). `MY_BUILDS_MAX = 50` is exported from `my-builds-storage.ts`.
- `recordUpdated` maps in place, keeping position, as the ticket says.
- Tests that depend on pin removal are named in Scope: `pin-storage.test.ts` line 33, and the acceptance loops at lines 623 and 793 of `acceptance/aoe4-build-order-pin-compare.spec.ts`. Rows whose value parses and is cleared by `clearStoredPin` are explicitly kept.
- Criteria are observable. Search criteria apply only to doc wording. The removal criterion is carried by tests.
- Open questions: none. Invariants: `none` is acceptable (no storage or pin invariant is touched; I did not find a Paths match). On merge: `none`. Unverified assumptions: `none` is fine. The null-key `storage` event is exercised by the real-browser two-tab case.
- Docs are in Scope: the pinned-run section and the Named builds section of `docs/aoe4-build-order.md`.
- Diagrams are not triggered. Size is about 40 LOC. There is no input validation boundary.

## Notes

- `recordCreated` should pass `selectedRef.current` as it was before `setSelected(entry.key)`. The ticket's "selectedRef's value" already implies this.
- The criterion that the two-tab case "fails at the base" is checkable, because the base ignores null-key events.
