# SGS-193 acceptance-test 8

Verdict: PASS. Tip a84332a347505df974d5c36e87a4e7921d388bb0, no commit made (no new tests needed).

The implementer's three acceptance cases in `acceptance/aoe4-step-annotations.spec.ts` (lines 535-582) cover the ticket's three cases. They assert API facts first, build the expected text from them, and check the Table cell and the Text-view popover. I added nothing.

## Tests (all pass)
- Knight at Dark Age: API `waiting`, `waitingFor` is `age` with text `Castle Age`, non-zero entries exist. Cell and popover equal entries then `still waiting for Castle Age`.
- Man-at-arms with no barracks: same with a `building` `waitingFor` (`a Barracks`).
- Villager behind a scout at the town center: exactly one non-zero entry, `building-busy`. Cell equals `a free <name sans "The "> <m:ss>`.

## Run
Setup ran (`link-node-modules.sh`, `playwright install chromium`). `npx playwright test acceptance/aoe4-step-annotations.spec.ts acceptance/aoe4-simulate-api-wait-details.spec.ts` ran 27 tests, all passed. The second path matches no file, and the spec for the waits API is `aoe4-simulate-api-waits.spec.ts`, which was not run. `npx tsc --noEmit` is clean.

## Mutation checks (all undone, `git diff --exit-code` clean)
- `step-annotations.ts` `blockedByText`: `still waiting for` changed to `still waiting on`. The cases for the knight and the barracks failed on `toHaveText` (`... still waiting on Castle Age`, `... on a Barracks`). The busy case passed, as expected.
- `step-annotations.ts` `blockedByText`: dropped entries when `waitingFor` is set. The knight and barracks cases failed (received `still waiting for Castle Age`, entry missing).
- `step-annotations.ts` `blockedByText`: stripped `a free ` from entry text. The busy case failed (expected `a free Capital Town Center 0:23`, received `Capital Town Center 0:23`).

## Notes
- The popover assertion runs only in the two waiting cases. The busy case checks the cell only, as the ticket specifies.
- Out-of-scope observation: the busy case asserts the API through `waitBreakdown.prerequisite`, which SGS-192 keeps. No problem.

No failures; no criteria inexpressible in the harness.
