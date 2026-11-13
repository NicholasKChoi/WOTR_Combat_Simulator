# SGS-147: Keep an unreadable pin, pick up a cross-tab clear, cap My builds on create

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: ~40 (`pin-storage.ts` `readStoredPin`; the `storage` listener and `recordCreated` in `pages/apps/aoe4-build-order.tsx`; one list helper in `build-library.ts`; business logic only)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 (approved 2026-11-12): three BACKLOG bullets (SGS-131 review, SGS-125 review 1, batch13 tech-lead). Only the `recordCreated` half of the Named-builds bullet is in scope; the unmount-before-201 half is dropped.

## Context

Three browser-storage edges are wrong at `origin/main`. Each is small and low-stakes, and all sit on the AoE4 build page's storage handling.

- `readStoredPin` in `components/apps/aoe4-build-order/pin-storage.ts` calls `removeItem` on a stored pin that does not parse or validate. SGS-131 removed that pattern from `my-builds-storage.ts` (an unreadable value is never deleted by reading it). The pin holds no secret, so the stakes are low, but the two stores disagree.
- The `storage` listener in `pages/apps/aoe4-build-order.tsx` (the `reread` function) returns unless `event.key` equals `MY_BUILDS_STORAGE_KEY`. A `localStorage.clear()` in another tab fires a `storage` event whose `key` is `null`, so this tab never rereads and keeps listing builds the store no longer holds until reload. A single-key removal already works.
- `recordCreated` in the same page prepends the new entry to the whole `entries` list and never trims My builds. `upsertMyBuild` keeps the newest `MY_BUILDS_MAX` (50) in storage, so after a create the tab can list more than 50 My builds until reload. The prepend also puts the entry ahead of non-My-builds entries; the select groups by kind (`LIBRARY_GROUPS`), so this is invisible today but wrong for any consumer of list order.

Why the tests did not catch it: `pin-storage.test.ts` asserts the key is removed (it pins the old behavior); no test dispatches a `storage` event with a null key; `recordCreated` lives in the page, which no unit test reaches, and the acceptance My-builds specs do not create 50+ builds in one tab.

## Scope

- `readStoredPin` (`pin-storage.ts`): an unreadable or invalid stored value returns `null` and is left in storage; it must not call `removeItem`. The next `writeStoredPin` overwrites it. Reads never throw (existing behavior stays).
- `reread` in the page's `storage` listener: also reread when the event's `key` is `null` (storage cleared), not only when it equals `MY_BUILDS_STORAGE_KEY`. Events for other keys are still ignored. After a clear, the My builds group holds only what `withRereadMyBuilds` keeps today for an empty store (the selected build stays so the edited marker and Save are unchanged).
- `recordCreated` (page) and a pure helper in `build-library.ts` (the module that already holds `withMyBuilds` and `withLoadedEntry` and has unit tests): the new entry becomes the first entry of kind `mine`, the relative order of every other entry is unchanged, an entry with the same key is replaced rather than duplicated, and the number of `mine` entries is capped at `MY_BUILDS_MAX` (import it from `my-builds-storage.ts`) by dropping the oldest, which are the last `mine` entries in list order since they are newest first. When the cap drops entries, the new entry and the selected entry are never the ones dropped. Put the placement and cap in the helper so a unit test can reach them.
- Docs made untrue, fix in this ticket: `docs/aoe4-build-order.md`, pinned run section: the sentence saying a stored value that is not valid drops the pin (the stored value is now left in place and ignored; the other drops, a text that no longer converts and a non-ok re-run response, stay as they are). Same file, Named builds section: the sentence that a save in another tab updates this tab's My builds should also cover another tab clearing the storage. Also the 50 cap sentence should hold for this tab's list immediately, not only after a reload. Grep the doc and code comments at these seams for other statements about them.
- Tests: any unit or acceptance test that asserts an unreadable stored pin is removed from storage gets the new expectation: the raw value is still in storage, no pin is shown, and no restore request is made. Examples the search found: `pin-storage.test.ts` (`drops %s and removes the key`) and the two loops in `acceptance/aoe4-build-order-pin-compare.spec.ts` (`a stored pin with ${name} is dropped`, and `... is dropped and shows no pin`, whose unreadable rows end with a null-storage assertion). Rows whose stored value parses as a valid pin and is cleared by the page's own `clearStoredPin` (a text over the length cap, a duration the route rejects, a text that no longer converts) keep their null-storage assertion. Any other test keeps its assertions.

**Out of scope:** the unmount-before-201 case (the edit secret is never stored when the page unmounts before the create response arrives; the design accepts it, owner triage dropped it). The page's own `clearStoredPin` calls when a pin's text no longer converts or the re-run answers non-ok. Reordering `recordUpdated`. Picking up a cross-tab change to the pinned run (the pin is held in memory after load, not synced).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `readStoredPin` returns `null` for an invalid-JSON value, a non-object, a wrong version, and a wrong-typed field, and the stored value is still present afterwards. A test fails if any of those cases removes the key.
- [ ] After an unreadable pin is left in place, `writeStoredPin` replaces it and `readStoredPin` then returns the written pin. (respec 1)
- [ ] Acceptance: loading the page with an unreadable stored pin (invalid JSON, a wrong version, a missing or wrong-typed field) shows no pin and makes no restore request, the raw stored value is still present afterwards, and a later Pin overwrites it with the new pin. A valid-parsing pin the page itself rejects is still cleared. (respec 1)
- [ ] `readStoredPin` and the other pin functions still never throw on a storage whose methods throw.
- [ ] In a two-tab acceptance case, with the first tab listing a saved build under My builds, `localStorage.clear()` in the second tab removes that build from the first tab's My builds without a reload. A case where another key changes still leaves the list as it was. The case fails at the base.
- [ ] A unit test of the new `build-library.ts` helper: given a list holding templates, opened links, and several `mine` entries in mixed positions, adding a new entry makes it the first `mine` entry, leaves every other entry's relative order unchanged, and does not move it ahead of non-`mine` entries that preceded the first `mine` entry. It fails if the entry is prepended to the whole list.
- [ ] The same helper, given a key already in the list, replaces that entry without adding a second one.
- [ ] The same helper, given a list already holding `MY_BUILDS_MAX` `mine` entries, ends with exactly `MY_BUILDS_MAX`, keeps the new entry, and keeps the selected entry when it is not the oldest. A test fails if the count grows past the cap or the new entry is the one dropped.
- [ ] `recordCreated` builds the new entry list only through that helper (no separate prepend or trim in the page); a reviewer confirms this in the diff, and the helper's unit tests above carry the behavior. When the browser can store the list, the My builds group after a create equals what `readMyBuilds` returns for the stored list; when storage fails (`my-builds-unavailable`) the helper's placement and cap still apply to the in-memory list. (respec 1)
- [ ] No README or doc section still says an invalid stored pin is dropped from storage, and `docs/aoe4-build-order.md` states that another tab clearing storage updates this tab's My builds.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-12

- Underspecified: "other tests keep their assertions" missed the two unreadable-pin loops in `aoe4-build-order-pin-compare.spec.ts`; the `recordCreated` criterion had no test path and ignored failing storage.
- Changed: Tests scope is now a rule with examples; added an acceptance criterion for the left-in-place pin; the create criterion is helper-tested plus a diff-confirmed property scoped to working storage; cap drops the oldest `mine` entries.
- Stands: all other scope and criteria; no branch work existed.
