# SGS-147 review 1

Verdict: REQUEST CHANGES
Branch tip reviewed: ba02b5537e4da178c43665a2a889c8322e50e531 (worktree sgs-147-browser-storage-edge-cases, read only; no new worktree made)

## Blocking findings

1. acceptance/aoe4-my-builds.spec.ts (new test "another tab changing an unrelated key leaves My builds, and clearing storage there removes them", the `unrelated-key` half) - test - the unrelated-key assertion cannot fail. Storage still holds both builds when the other tab sets `unrelated-key`, so a listener that rereads on every key (`if (storage === null) return`) produces the same `[NEWER.name, OLDER.name]`. The ticket criterion "a case where another key changes still leaves the list as it was" is therefore unchecked. Direction: make the in-memory list differ from storage before the unrelated event, so an over-eager reread is visible. After `openPage(page)` and the first `toHaveText`, run `page.evaluate(() => localStorage.removeItem(<MY_BUILDS_STORAGE_KEY value>))` in the first tab (a same-tab write fires no `storage` event in it). Then have `other` set `unrelated-key` and assert the first tab still lists `[NEWER.name, OLDER.name]`. That fails if the guard in `pages/apps/aoe4-build-order.tsx:221` is loosened to ignore the key (before: list present with storage empty; after the unrelated event: still present; a loosened guard empties it). Replace the fixed 300 ms `setTimeout` with `expect.poll`/a settled condition, or keep it only as the negative wait. Keep the `clear()` half as is (verified to fail at base by the implementer's mutation).

## Acceptance criteria
- readStoredPin null for 4 unreadable cases and value left: pass (pin-storage.test.ts rows assert raw value remains; `removeItem` is gone from pin-storage.ts).
- writeStoredPin replaces unreadable, read returns the written pin: pass.
- Acceptance unreadable pin: no pin, no request, raw value kept, later Pin overwrites; valid-parsing rejected pins still cleared: pass by reading (loop at ~620 and split loops at ~790). Not run (gate rule).
- Pin functions never throw on throwing storage: pass (try/catch retained; existing test untouched).
- Two-tab case: partial. The clear half is a real failing case; the other-key half cannot fail (finding 1).
- Helper unit test placement: pass. Same-key replace: pass. Cap, new entry kept, selected oldest kept: pass.
- recordCreated only via helper with selected key: pass (page diff: single `withCreatedEntry(list, entry, selectedBefore)`; no prepend or trim). The helper also applies when storage fails since it is independent of storage.
- Docs: pass. Pinned-run sentence and Named builds sentences match the code; grep found no other statement that an invalid pin is removed.
- No INVARIANTS regressions: pass (ticket lists none; A1 to A3 untouched).

## Contract and correctness
- `withCreatedEntry` (build-library.ts:83-97): dedupe, first-mine placement, cap loop from the end skipping the selected key. Traced: at 51 mine entries the new entry is first mine, so the loop reaches at least one other droppable entry before it. Correct. `reread` null key branch correct; other keys still ignored.
- Chore/Bug rule for edited tests: edits to `pin-storage.test.ts` and the two pin-compare loops match the ticket's Tests scope. Bug regression-at-base record: implementer shows the two-tab clear case fails at base and reverts of the helper fail unit tests.
- Doc claims checked against code: all hold.

## Lint
`npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.

## Bot
No `reviewBot` cli configured; skipped.

## Conventions
Helper placement and style match `withMyBuilds`/`withLoadedEntry` in the same file; test layout matches the sibling `describe` blocks. No shipped ids or process history in code or docs.

## Non-blocking notes
- `replaces an unreadable value on the next write` (pin-storage.test.ts) would also pass if `removeItem` returned, which the implementer noted; the `leaves the stored value` rows cover that, so no action.
- `reread` does not check storage availability (pre-existing).

## Coverage
Reviewed all changed files (pin-storage.ts, build-library.ts, page, docs, 4 test files). No UI change that alters rendering; UI inspection not run. No tests run per gate rules beyond lint.
