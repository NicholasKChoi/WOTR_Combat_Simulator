# SGS-121 acceptance-test report 1

Verdict: PASS. No impl-defects, no spec-gaps.

- Branch `sgs-121-named-build-routes`, tested at 0ff9f81, new tip 172b7cec8396ed68fad54ec5333de4565898f6df (one commit adding one test file).
- Harness: Playwright via `npm run acceptance`, `acceptance:setup` run first. The harness ran (real `next dev`).

## Coverage review of the implementer's two specs

`aoe4-named-builds-api.spec.ts` (live) and `aoe4-named-builds-api-contract.spec.ts` (contract) cover the live-spec, budget, contract, version-pin and path-set criteria. Not covered live: create 400 and 413, collection 405 `Allow: POST` (only as a contract example), distinct ids and secrets on a repeated create, and reads and deletes costing no slot.

## Tests written

New file `acceptance/aoe4-named-builds-create.spec.ts` (5 tests):

- Same body posted twice gives different ids and different secrets, both valid `CreateNamedBuildResponse`, `path` is the page link.
- Create with a non-save body gives 400 `SimulateError`.
- Create body over 128 kb gives 413.
- `GET` on the collection gives 405 with `Allow: POST`.
- 30 GETs and DELETEs by one client do not stop that client's next create and PUT (no slot cost for reads or deletes).

I first wrote the `path` expectation as the API URL; it is `/apps/aoe4-build-order?n=<id>` (`namedBuildPath`). That was my error, fixed in the test; the code is correct.

## Run results (all green)

Run: both new named-builds specs, my spec, `aoe4-builds-api`, `aoe4-builds-api-contract`, `aoe4-builds-api-refusals`, `fight-api-spec-surface`, `aoe4-gathered-resources`, `aoe4-simulate-api-issue-shape`. Result: 114 passed, 1 failed (my wrong `path` expectation). After the fix, my spec alone: 5 passed (6 before I dropped one test, below). `npx tsc --noEmit` and `npm run lint:dup` clean (0 clones).

## Mutation checks (each undone; `git diff --exit-code` printed RESTORED)

- `named-builds-routes.ts:34-35`, id made constant: "two different ids" failed (`Expected: true, Received: false`).
- `:43`, 405 check disabled: collection 405 test failed (Expected 405, Received 400).
- `:45`, 400 status changed to 418: create 400 test failed (Expected 400, Received 418).
- `namedBuildReply` GET branch, slot taken before the read: "do not stop a following create" failed (Expected 201, Received 429).
- `named-builds/index.ts`, `sizeLimit` 128kb to 10mb: 413 test failed (Expected 413, Received 400).
- `named-builds.ts:70`, `?n=` to `?x=`: `path` assertion failed on the value.
- `:55`, editSecret added to the stored JSON: my test "edit secret absent from a later GET" still passed (GET strips unknown fields), so it could not fail for its named behavior. Deleted it. The stored-record-without-secret property stays pinned by the implementer's unit test.

## Not expressible in this harness

- Stored record contents (secret not stored): no store read through the HTTP boundary; covered by unit tests.
- Create 429 and a PUT 429 with a wrong secret ordering beyond the implementer's budget spec: not re-mutated by me; the implementer reports the live key-change mutation fails it.

## Findings

None. Worktree clean after commit; no processes left running.
