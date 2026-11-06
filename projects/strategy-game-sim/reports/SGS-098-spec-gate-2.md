# SGS-098 spec gate 2

Verdict: READY

Both gate-1 gaps are closed. The contract loop is narrowed to `['goldRunOut']` as the single permitted edit to a surviving test. The diff criteria no longer contradict each other (only that line plus import trims are added lines).

## Verified (origin/main 9328355)

- Contract spec: the loop `for (const name of Object.keys(requestExamples))` is at line 283. `requestExamples`, `okExamples` and `expect200` are used elsewhere (lines 94, 258-271, 320, 333, 393+), so keeping them is right.
- Spear/longbow spec: deleting the `[1200, 3600]` loop and the 1200 s gold test leaves `MAN_AT_ARMS_STEP`, `CASTLE_LANDMARK_SECONDS`, `MAN_AT_ARMS_START_SECONDS` and the `steps` member of `Result` unused, as the ticket says. `GOLD_NODES`, `WARM_UP_TIMEOUT_MS`, `simulate`, `postSimulate` and `beforeAll` are still used by the 3600 s test.
- `tsconfig.json` has no `noUnusedLocals`, so the grep rule in the acceptance criteria is needed and is stated.
- `INFINITE_NODES` and `buildOrderFrom` are used by surviving specs (depletion, edges, farm-slots and others). `postSimulate` is used widely.
- Criteria are observable: `npm run acceptance` passes, `playwright --list` content, a diff-shape rule, and a grep rule. None pins a stale count. The 28/734 figures appear only as Scope reproduction context, not as a criterion.
- Risk low, Invariants none, On merge none, Depends-on none, no open questions, no contracts, no docs touched, no input validation. All fit. Size is 0 business logic.

## Notes (non-blocking)

- Scope says `finalCount` is "also used by surviving specs". That is not true after the deletions. Its only users are timelines, veterancy-conversion (both deleted) and `spend-population` line 81, which sits inside a deleted test (line 68). So `finalCount` becomes unused: drop it from the `spend-population` import line and delete its export in `acceptance/helpers.ts` (lines ~89+). The grep criterion for `helpers.ts` exports already forces this, and Scope says "re-check with a search", so the implementer will resolve it. A one-line correction in Scope would avoid confusion.
- Deleting `finalCount` from `helpers.ts` is a whole-line removal, so it fits the diff-shape criterion.
