# SGS-147 spec gate 1

Verdict: NEEDS_SPEC. Risk `low` confirmed: no strongModelTriggers or critical path is touched. The change is local browser-storage handling on one page.

Read at origin/main after `git fetch origin`.

## Gaps

1. Scope, Tests, and acceptance criteria - "Other tests keep their assertions" is false.
   - `acceptance/aoe4-build-order-pin-compare.spec.ts` asserts the stored pin key is removed for unreadable stored pins:
     - the `a stored pin with ${name} is dropped` loop (about lines 618-631: invalid JSON, version 2, a missing field) ends with `await expect.poll(() => storedPin(page)).toBeNull()`;
     - the `a stored pin with ${name} is dropped and shows no pin` loop (about lines 788-801) has rows `a numeric name` and `a null duration`. Those are unreadable and will fail the same assertion. Its other two rows, `a text over the length cap` and `a duration the route rejects`, parse as valid pins and are cleared by the page's own `clearStoredPin`, so they stay null.
   - After the change these tests fail on the storage assertion, while the "no pin shown, no restore request" assertions still hold.
   - Why an implementer would guess: Scope names only `pin-storage.test.ts`. The implementer does not know whether to edit the acceptance specs or to keep removing the key somewhere else.
   - Fix: Scope's test rule should read "any unit or acceptance test that asserts an unreadable stored pin is removed (`pin-storage.test.ts`; the two loops in `aoe4-build-order-pin-compare.spec.ts`) gets the new expectation: the raw value is still in storage, no pin is shown, and no restore request is made. Rows whose value parses as a valid pin, which the page's own clear removes, keep the null assertion." Do not list today's tests as the rule. Also add a criterion that after such a load the stored value is still present and a later Pin overwrites it.
2. Acceptance criterion "Creating a build in the page uses that helper ... no more than MY_BUILDS_MAX builds, matching what readMyBuilds returns" has no observable test path.
   - No unit test reaches the page, and the ticket admits the acceptance specs do not create 50+ builds.
   - Proposed rewrite: state it as a reviewer-confirmable property ("`recordCreated` builds the new list only through the helper") plus the helper's unit tests, or name an acceptance case that seeds `localStorage` with 50 builds and then creates one.
   - The "matching readMyBuilds" claim also breaks when the browser cannot store the list (`my-builds-unavailable`). State that the claim applies when storage works.

## Checks that passed

- Grounded scope: `readStoredPin`, `reread`, `recordCreated`, `withRereadMyBuilds`, `withMyBuilds`, `withLoadedEntry`, `MY_BUILDS_MAX = 50`, and the `drops %s and removes the key` test all exist as described.
- Doc seams exist: `docs/aoe4-build-order.md` line 1041 ("A stored value that is not valid, a text that no longer converts, or a response that is not ok ... drops it") and line 1114 ("A save in another tab updates this tab's My builds").
- Open questions: none.
- Invariants: `none` is plausible; this report did not check INVARIANTS.md `Paths:` globs.
- On merge: `none`.
- Unverified assumptions: `none` is acceptable. The `storage` event with `key === null` on `clear()` is real browser behavior, and the two-tab acceptance case exercises it in a real browser.
- No throwaway-work overlap: not checked against TASK-GRAPH.md open tickets.

## Notes

- The "pinned run" doc sentence should be split. Only the invalid-stored-value clause changes. The other two drops, a text that no longer converts and a non-ok re-run, stay.
- Make clear the cap drops the oldest `mine` entries, meaning the last mine entries in list order, since mine entries are newest first.
