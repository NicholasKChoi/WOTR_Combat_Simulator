# SGS-100 review 2

- Branch: `sgs-100-auto-run-controller`, tip `f07e3dce807637f9f17c9a51ca7182447968e842`. The branch is local only, so I built the review worktree from the SHA.
- Base: origin/main `1e6d6c2`
- Mode: full review. I bounced pass 1 at `77f1a6c` (`reports/SGS-100-review-1.md`), so this pass focuses on the Rework 1 Required fixes.

## Verdict: APPROVE

The rework is test-only. `git diff 77f1a6c..HEAD` touches only `auto-run.test.ts` (+18/-8). Production code (`auto-run.ts`, `simulate-client.ts`, `pages/apps/aoe4-build-order.tsx`) has not changed since review 1, which found no defect in it. I read `auto-run.ts` again in full and still found no correctness, invariant or contract issue.

## Required fixes (Rework 1)

- **Met.** `dispose > ignores a later %s` (`auto-run.test.ts:619-635`) is now an `it.each` table with one row per call. Each row starts from a state where that call would otherwise post:
  - `input` and `flush` start from `withResult()`, then switch to `live(OTHER)`, a different key.
  - `release` starts from `setup(live(), true)`, a held controller.
  - `retry` starts from the new `withFailure()` helper (`:86-91`), which ends in `failed`.

  Each row records the POST count, the state reference and `history.length`. It then disposes, makes the call and advances `AUTO_RUN_DEBOUNCE_MS`. Finally it asserts all three are unchanged, using `toBe` for the state.
- **Mutation confirmed (I reran this myself).** I removed each guard one at a time in `auto-run.ts`:
  - `disposed ||` from `release` (`:230`): only `ignores a later release` fails (1 failed, 73 passed).
  - `disposed ||` from `retry` (`:236`): only `ignores a later retry` fails.
  - `if (disposed) return` from `input` (`:218`): only `ignores a later input` fails.
  - `if (disposed) return` from `flush` (`:223`): only `ignores a later flush` fails.

  I reverted every mutation and left the worktree clean.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

All criteria pass. The evidence for every criterion except dispose is in review 1. Production code and the tests those criteria cite have not changed since then, and I re-verified the grep criteria and the commands at this tip.

| Criterion | Result | Evidence |
|---|---|---|
| Exports, no react/next/window/document | pass | The criterion's grep finds no match at `f07e3dc`. |
| `durationError` table | pass | review 1 |
| `requestKey` / key | pass | review 1 |
| create, held / no `onChange` during create | pass | review 1 |
| create, not held | pass | review 1 |
| input, not held | pass | review 1 |
| input with an equal `live` | pass | review 1 |
| input, held | pass | review 1 |
| flush, not held | pass | review 1 |
| flush, held | pass | review 1 |
| release, held / not held | pass | review 1 |
| fire rule 1 | pass | review 1 |
| fire rule 2 | pass | review 1 |
| fire rule 3 | pass | review 1 |
| fire rule 4 | pass | review 1 |
| `rejectedKey` lifetime (a), (b) | pass | review 1 |
| rule 5 and ordering | pass | The reachable rows are tested. The two unreachable rows were checked by reading `fire()` (review 1). |
| late response dropped | pass | review 1 |
| AbortError | pass | review 1 |
| body read dropped | pass | review 1 |
| response 200, latest | pass | review 1 |
| response 400, latest | pass | review 1 |
| failure rows | pass | review 1 |
| retry | pass | review 1 |
| dispose (rework 1) | **pass** | Timer and in-flight cases: `:597-617`. Post-dispose calls: `:619-635`. Each row starts from the required state, and all four mutations are killed (see above). |
| `simulate-client.test.ts` | pass | review 1 |
| Page behavior unchanged | pass | `function postSimulation` exists only in `simulate-client.ts`. The page has no `fetch(`. Nothing under `acceptance/` changed. The page is unchanged since review 1, which ran 116 AoE4 and pin acceptance tests (all passed). |
| tsc, lint:dup, npm test | pass | Rerun at this tip: tsc is clean, jscpd found 0 clones, and the unit suite passed with 50 files, 1598 passed and 10 skipped. The implementer report lists the edited test, which was added on this branch and is not on main. |
| No INVARIANTS.md regressions | pass | See below. |

I ticked every criterion in the ticket.

## Invariants touched

There is no production change since review 1, so the conclusions there still hold:
- **S1:** holds. The new files import only from `lib/aoe4-build-order/` and their own directory.
- **S3:** holds. A request is built only when `conversion.ok && durationError === null` (`auto-run.ts:76`).
- **A3:** holds. Staleness is decided by `seq`. The only timer is `setTimeout`. There is no `Date.now` and no randomness.
- A1 and A2 are not touched.

## Lint

`npx tsc --noEmit && npm run lint:dup`: clean (0 clones).

## Bot reconciliation

`reviewBot.cli` and `reviewBot.rulesFile` are empty in REPO.md. No bot ran, so there is nothing to reconcile.

## Doc claims

The rework adds or edits none. The one comment in production code (`auto-run.ts:154`) was verified in review 1 and has not changed.

## Conventions

- `withFailure()` follows the shape of its siblings `withResult` and `withRejection` (`:72-84`): a harness, one answered call, and an assertion on the status.
- The table follows the `it.each` tuple style already used in this file and in `pin-storage.test.ts:35`.
- The test name `ignores a later %s` matches what the test asserts: no POST, the same state and no `onChange`.
- The commit author is `choinickolas@gmail.com`. The commit message contains no ticket ids.

## Non-blocking notes

1. Carried over from review 1, still open: the no-op guard in `update` (`auto-run.ts:125`) is untested. If I delete it, all 74 tests still pass, and `onChange` would then fire on a content-equal re-fire. Suggest asserting `history` length around the equal-input fire at `auto-run.test.ts:197-210`.
2. Style nit: the row factories `async () => withResult()` and `async () => withFailure()` could pass `withResult` and `withFailure` directly. The wrapper keeps the row types uniform with the synchronous `setup(...)` row, so it is fine either way.

## Coverage

- Reviewed: the full rework delta, and `auto-run.ts` read again in full. The rest of the five-file diff was reviewed in review 1 and has not changed.
- Ran at this tip:
  - `npm ci`, `npx tsc --noEmit` and `npm run lint:dup`
  - `npm test`
  - `npx next build`, which passed
  - 5 mutation probes
- REPO.md checklist:
  - "Every diff": the build passed. I did not reload the page in `npm run dev` this pass, because the page and production code are byte-identical to `77f1a6c`, where review 1 ran 116 page acceptance tests.
  - "AoE4 build order": no copied helper or constant, no engine change, no UI change.
- Not reviewed: the full acceptance suite was not rerun. This rework changes no page code.
