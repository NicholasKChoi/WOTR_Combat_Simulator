# SGS-094 spec gate 1

Verdict: READY

I checked the ticket against origin/main (d950413) using `git grep`.

- Grounded scope: every named hit exists on main.
  - `base.json:95-96` has 1750 and "7 deer x 250 food".
  - `data.test.ts:114`, `schema.test.ts:901`, `simulate-depletion.test.ts:115` and `simulate-triggers.test.ts:256` pin the old value.
  - `acceptance/aoe4-simulate-api-triggers.spec.ts:384` pins it.
  - `openapi.json` has two deer examples at lines 706 and 1705.
  - A grep for `1750` and `deer x` over lib, acceptance and app finds no other hit.
  - `docs/aoe4-build-order.md` mentions deer only generically, as the ticket says.
  - No shipped build in `data/aoe4-build-order/builds` mentions deer, so the item 5 premise holds.
- Testable criteria: each has an observable outcome. The `git grep` criterion holds in the end state. The `data.test.ts` per-node table fails if the value or source is reverted. The item 5 rule for failing pins is explicit. There is no stale count or list.
- Open questions: none. The owner answered the amount.
- Invariants, contracts and dependencies: no dependencies, and the engine reads the amount from data unchanged. Size is about 0 business-logic lines. No diagram is needed.
- Risk: standard is justified. No criticalPaths symbol changes.
- Docs: the openapi examples are in scope, and the doc grep is specified.
- Input validation: no new input.

## Notes (non-blocking)
- In `data.test.ts`, the shared `owner` constant says "(2026-11-01)" and the other nodes keep it. The deer source carries 2026-11-04, so the deer row needs its own literal string instead of the `${owner}` template. Item 2 says to change the value and the new source text, so an implementer can handle it.
- I did not check the ticket's `depletedAt` claims in the openapi examples. Both deer examples show `depletedAt: null`, so they stay valid.
