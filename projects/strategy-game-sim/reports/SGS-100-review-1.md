# SGS-100 review 1

- Branch: `sgs-100-auto-run-controller`, tip `77f1a6c5d2ab26250986409315192e08c61656cb` (local branch; not on origin yet, so the review worktree was created from the SHA)
- Base: origin/main `1e6d6c2`
- Mode: full review, first pass

## Verdict: REQUEST CHANGES

The controller code reads correctly against the design's auto-run table and the ticket's settled details. I found no correctness, invariant or contract defect in production code. One acceptance criterion (dispose) is only half tested: two of the four "after dispose" guards can be deleted and every test still passes.

## Blocking findings

1. `components/apps/aoe4-build-order/auto-run.test.ts:612-625` - test - The test `dispose > ignores every later call` claims that every later call is ignored. It starts from `withRejection()`, so the controller is not held and its status is `rejected`. In that state `release()` and `retry()` are no-ops whether or not the controller is disposed, so the test cannot catch a missing `disposed` guard on either one. I checked this by deleting `disposed ||` from `release` (`auto-run.ts:230`) and from `retry` (`auto-run.ts:236`): all 71 tests still pass. These are real failure modes. A hook that unmounts during a `?b=` load (held) and then gets a `release`, or that unmounts in `failed` and then gets a `retry`, would POST and call `onChange` after unmount. The acceptance criterion requires that "`input`, `flush`, `release` and `retry` after `dispose` post nothing and call no `onChange`". - Direction: make it a table (`it.each`). Each row is a starting harness plus the call to make after `dispose()`: `['input', withResult, c => c.input(live(OTHER))]`, `['flush', withResult, c => c.flush(live(THIRD))]`, `['release', () => setup(live(), true), c => c.release()]`, `['retry', withFailure, c => c.retry()]`. Add a `withFailure()` helper next to `withResult`/`withRejection` (`withResult()`, then `flush(live(OTHER))` answered with `reply(500, {})`, ending in `failed`). Each row disposes, makes the call, advances `AUTO_RUN_DEBOUNCE_MS`, and then asserts that the post count is unchanged, `state()` is the same object, and `history` has not grown. To confirm, each row must fail when the matching `disposed ||` guard is removed.

## Spec gaps

None.

## Questions from the manager

- **Rule-order rows the public API cannot reach. Acceptable, not a gap.** I traced both:
  - *Key equals both `inflightKey` and `resultRequestKey`.* A request goes in flight only through rule 5 or `retry`. Rule 5 runs only when the key is not `resultRequestKey`, because rule 3 matches first. `retry` posts the settled key of a `failed` run, and that key was itself posted by rule 5. While a request is in flight, `resultRequestKey` changes only on a 200 from that same request, and the 200 clears `inflight` (`auto-run.ts:166`). So the two keys are never equal while a request is in flight.
  - *Key equals both `resultRequestKey` and `rejectedKey`.* `rejectedKey` is set only by a readable 400 for a key posted by rule 5, so that key is not `resultRequestKey`. Every later change to `resultRequestKey` (a 200) comes after a `post()`, and `post()` clears `rejectedKey` (`auto-run.ts:172`).
  - Even so, `fire()` (`auto-run.ts:183-202`) checks the rules in the specified order (rule 1, then `inflight`, then `resultRequestKey`, then `rejectedKey`, then post), so both rows would resolve as specified. The reachable ordering cases are tested: rule 1 before rule 2 (`:398`), rule 2 before rule 5 (`:296`), rule 3 aborting a request for a different key (`:334`), and rule 5 with and without a result (`:405`). Suggest that a later re-spec drop those two rows or mark them "by inspection".
- **Dropping `Number.isInteger` from `durationError`. Equivalent mutant, acceptable.** `SIM_INPUT_BOUNDS.durationSeconds` is `bound(60, 3600)` with `integer` defaulting to `true` (`lib/aoe4-build-order/schema.ts:26,35`), and `outOfRange` rejects non-integers (`schema.ts:103`). Keep the explicit check, because the ticket and design name it. The `'61.5'` row would catch it if the bound ever stopped being an integer bound.

## Acceptance criteria

| Criterion | Result | Evidence |
|---|---|---|
| Exports and no react/next/window/document | pass | All names are exported with the C6 shapes (`auto-run.ts:7-61,105`, `simulate-client.ts`). The grep command from the criterion finds nothing. |
| `durationError` table | pass | `auto-run.test.ts:94-110`. The expected text is built from `SIM_INPUT_BOUNDS`. |
| `requestKey` / key | pass | `:112-135` |
| create, held / no `onChange` during create | pass | `:138-155`. `notify` stays false until create returns (`auto-run.ts:213-214`). |
| create, not held | pass | `:157-162` |
| input, not held (trailing, restarting) | pass | `:166-188` |
| input with an equal `live` | pass | `:190-204` |
| input, held | pass | `:206-213` |
| flush, not held | pass | `:217-244` |
| flush, held | pass | `:246-251` |
| release held / not held | pass | `:255-278` |
| fire rule 1 | pass | `:282-294` |
| fire rule 2 | pass | `:296-308` |
| fire rule 3 | pass | `:310-344` |
| fire rule 4 | pass | `:346-357` |
| `rejectedKey` lifetime (a), (b) | pass | `:359-395` |
| rule 5 and ordering | pass, partly by inspection | The reachable rows are tested (see above). The two unreachable rows are verified by reading `fire()`. The rows are separate tests rather than one table, which is acceptable because they need different setups. |
| late response dropped | pass | `:427-456` |
| AbortError (stale and unrequested) | pass | `:458-478` |
| body read dropped | pass | `:480-503` (200 and 400 bodies; edit and dispose) |
| response 200, latest | pass | `:505-519` |
| response 400, latest | pass | `:521-528` |
| failure rows | pass | `:530-546` |
| retry | pass | `:549-587` |
| dispose | **fail** | The timer and in-flight cases pass (`:590-610`). `release` and `retry` after dispose are not verified (blocking finding 1). |
| `simulate-client.test.ts` | pass | `:20-80` |
| Page behavior unchanged | pass | `function postSimulation` exists only in `simulate-client.ts`, and the page has no `fetch(`. Nothing under `acceptance/` changed. `errorMessages` produces the same output (the old `catch {}` on a `null` or non-JSON body maps to `readRejection` returning `null`, which gives the same HTTP-n message). I ran 116 acceptance tests from the AoE4 page and pin specs, and all passed. |
| tsc, lint:dup, npm test | pass | Rerun here: tsc is clean, jscpd found 0 clones, and the unit suite passed with 1595 passed and 10 skipped. |
| No INVARIANTS.md regressions | pass | See below. |

Tickets are not ticked, because the verdict is not APPROVE.

## Invariants touched

- **S1 (apps are independent): holds.** The new files import only from `lib/aoe4-build-order/` and their own directory.
- **S3 (bounded requests): holds.** A request is built only when `conversion.ok && durationError === null` (`auto-run.ts:76`). `durationError` uses `outOfRange` against `SIM_INPUT_BOUNDS`, so an invalid duration is never posted (rule 1). The server keeps its own cap.
- **A3 (determinism): holds.** No `Date.now`, no randomness. Staleness is decided by `seq`, never by timing. The only timer is `setTimeout(AUTO_RUN_DEBOUNCE_MS)`.
- A1 and A2 are not touched.

## spec-checklist.md

- Contracts: no surface in CONTEXT.md Key surfaces changes. The request shape and URL are the same.
- Scope: no `use-auto-run.ts`, no React, no page wiring, no CSS, no acceptance specs, no `golang/`. No invented constants: `AUTO_RUN_DEBOUNCE_MS = 500` comes from C6.
- Naming: fine. No dead enum values: every `AutoRunStatus` value is produced.
- S1, S3 and A3: see above.

## Lint

`npx tsc --noEmit && npm run lint:dup`: clean (0 clones).

## Bot reconciliation

`reviewBot.cli` and `reviewBot.rulesFile` are empty in REPO.md, so no bot ran and there is nothing to reconcile.

## Doc claims

- `auto-run.ts:154`, "Staleness is by seq, not by AbortError: a post that ignores its signal still resolves." This holds. `send` checks `seq === mine` after `post` settles and after the body read (`:160,165`). `abortInflight` increments `seq` (`:140`). The tests at `:444-456` use a `post` that ignores its signal.
- No docs changed. ARCHITECTURE.md has no per-file entries for this directory.

## Conventions

Compared against `components/apps/aoe4-build-order/pin-storage.ts` and `pin-storage.test.ts`, and the page. New files follow the directory's 4-space, no-semicolon style. `catch {}` and the `it.each` table style match `pin-storage.test.ts:35`. Shared setup lives in helpers (`setup`, `deferred`, `reply`, `withResult`, `withRejection`), as the ticket asks.

## Non-blocking notes

1. `auto-run.ts:125`: the no-op guard in `update` is untested. Deleting it leaves all 71 tests passing, and then the timer firing an equal input (rule 2 or 3 with unchanged fields) calls `onChange` with a state whose content is unchanged. The ticket says `input` "calls `onChange` only when the timer fires and changes state". Suggest adding `expect(history).toHaveLength(changes)` around the final equal-input fire in `auto-run.test.ts:200-203`.
2. Rule 2 settles a new `selected` (`update(fields)`, `auto-run.ts:191`), but the in-flight request's captured `shown` keeps the old `selected`. When the response arrives, `shown.selected` differs from `settled.selected` until the next fire. This matches the spec ("shown from the input captured when the request was sent"), and `auto-run.test.ts:505` pins it. The hook ticket may want to know that the pin name can lag in this case.
3. `auto-run.test.ts:9` builds the catalog from `loadGameData('english')`, while `lib/aoe4-build-order/test-helpers.ts:11` exports `ENGLISH`. The ticket named the `loadGameData` form, so this is fine either way.

## Coverage

- Reviewed every file in the diff: `auto-run.ts`, `simulate-client.ts`, both test files, and `pages/apps/aoe4-build-order.tsx`.
- Ran mutation probes on `release`/`retry` after dispose and on the `update` no-op guard. All were reverted, and the review worktree was left clean.
- REPO.md checklist:
  - "Every diff": `npx next build` passed. Instead of loading the page by hand in `npm run dev`, I ran 116 Playwright tests (simulate API, pin-compare including restore, M3 and M4 flows, inline issues, client check), which drive the page's Run and restore flows. All passed. No acceptance spec asserts the HTTP-n or network error text, so I verified those by reading the code: the strings are byte-identical to the originals.
  - "AoE4 build order": no helper or constant copied from `lib/aoe4-build-order/` (`outOfRange` and `SIM_INPUT_BOUNDS` are imported). No engine rule change. No UI change, so no screenshots.
- Not reviewed: the full acceptance suite (the implementer reports 734 passed).
