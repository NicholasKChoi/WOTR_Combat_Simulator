# SGS-147 acceptance-test 1

Verdict: PASS. Tip 6bb1297 on sgs-147-browser-storage-edge-cases. No tests written and nothing committed: the implementer's acceptance specs already cover the criteria, and every one can fail.

## Harness
`acceptance:setup` ran (node_modules linked, Chromium installed). I ran `npx playwright test` on three files: `acceptance/aoe4-my-builds.spec.ts`, `acceptance/aoe4-build-order-pin-compare.spec.ts` and `acceptance/aoe4-my-builds-unreadable.spec.ts`. Result: 127 passed.

## Specs the diff adds or edits, and what each pins
- `aoe4-my-builds.spec.ts:921`, "another tab changing an unrelated key leaves My builds, and clearing storage there removes them" (two pages in one context). It pins the two-tab criterion: an unrelated-key event leaves the list, and `localStorage.clear()` in the other tab empties My builds while Templates stay. The test first polls until the event with key `unrelated-key` has reached the tab, so the "leaves the list" assertion cannot pass before the event arrives. It fails at the base.
- `aoe4-build-order-pin-compare.spec.ts:623` (rows: invalid JSON, version 2, missing field). It pins the unreadable-pin criteria: no pin shown, no restore request, the raw value still in storage, and a later Pin overwrites it with the valid pin.
- `aoe4-build-order-pin-compare.spec.ts:794` (rows: numeric name, null duration). It pins a wrong-typed field: shown nowhere, no request, left in storage.
- The existing rows for a text over the cap and a duration the route rejects keep their null-storage assertions, which matches the ticket.

## Mutation checks (all undone, `git diff --exit-code` clean)
1. `pages/apps/aoe4-build-order.tsx` `reread` guard, reverted to `event.key !== MY_BUILDS_STORAGE_KEY || storage === null`. The two-tab test failed at line 943: `toHaveCount(0)` expected 0, received 2.
2. The same guard, widened to reread on every key (`if (storage === null) return`). The two-tab test failed at line 940: the My builds `toHaveText` got an empty list instead of `[NEWER, OLDER]`.
3. `components/apps/aoe4-build-order/pin-storage.ts`, `removeItem` re-added after the inner catch. All 5 pin tests failed on `expect(storedPin).toBe(raw)`, with Received: null. The failing tests were the invalid JSON, version 2, missing field, numeric name and null duration rows.

## Failures
None.

## Not expressed in this harness
- The `recordCreated` placement and cap. The ticket assigns these to the `withCreatedEntry` unit tests in `build-library.test.ts`, and the review confirmed the page calls the helper. I ran no unit tests (out of scope).

## Process hygiene
Playwright's `webServer` started and stopped its own dev server. I started nothing by hand.
