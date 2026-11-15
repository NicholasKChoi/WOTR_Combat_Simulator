# SGS-162 spec gate 1

Verdict: NEEDS_SPEC

## Gaps

1. Scope (listener) - the order of the key filter and the availability check is not stated - `myBuildsAvailable` writes and removes a probe key (`setItem`/`removeItem` in `my-builds-storage.ts`), and each write fires a `storage` event in every other tab. If the implementer probes before the key filter, tab A's probe wakes tab B's listener, B probes, that wakes A, and so on without end. The ticket says "keep the key filter" but never says it runs first - proposed fix: Scope states that the unrelated-key return runs before `myBuildsAvailable` is called, so the listener never probes on an event for another key (including the probe key). Add a criterion: a storage event for an unrelated key causes no storage write in this tab.

## Checked and fine

- Grounding: the `reread` effect (line ~219) and the mount effect check (`storage === null || !myBuildsAvailable(storage)`, line 207) exist as described. The `storage unavailable` describe, `blockStorageWrites` and the two-tab test exist. The docs sentence is at `docs/aoe4-build-order.md` ~1138.
- No existing test combines `blockStorageWrites` with storage events, so existing tests are unaffected. A new test can seed the key from another tab and assert the blocked page's My builds group stays empty. Before the fix it fills, so the test can fail.
- Risk low, Invariants none, no contract, schema, validation or diagram triggers, no overlapping open ticket found by reading. Unverified assumptions `none` is acceptable, since the browser storage-event behavior is already exercised by existing acceptance tests.

## Notes

- Criterion 1 says "known secrets" do not change. Secrets are not directly visible in the UI. Name an observable proxy, or let the My builds list stand for both.
- The ticket report flagged that the SGS-162 id collides with the existing `reports/SGS-162-rca.md` and `SGS-162-debugger-1.md` (an unrelated debug item). The manager should confirm the id.
- The `[selected]` dependency list of the effect stays as is. The extra probe write per event is cheap.
