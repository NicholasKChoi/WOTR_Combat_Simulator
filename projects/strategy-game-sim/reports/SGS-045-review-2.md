# SGS-045 review 2 (rework 1, delta)

Verdict: **APPROVE**

Branch `sgs-045-aoe4-severity-message-lists`, tip e68dc07. I reviewed the delta 5ecb2c8..e68dc07 (I fully reviewed 5ecb2c8 in round 1) in the detached worktree `worktrees/review-sgs-045-r2`, which is now removed. Base: origin/main 77fa279.

## Blocking findings

None.

## Spec gaps

None new. The open question about `error` severity is unchanged, and no criterion depends on it.

## Rework items

- **New test** `acceptance/aoe4-build-order.spec.ts:254-266` ("a successful run with no warning-severity messages shows no warnings element"): sound.
  - It patches a 200 response through `route.fetch()`. `warnings` holds only one `info` entry and `notes` is `[]`.
  - `expectChartsDrawn` waits until the results have rendered before the `simulation-warnings` count-0 assertion, so that assertion cannot pass just because the page has not rendered yet.
  - The `Show 1 info message` check confirms the patched body was the one rendered.
  - It does not use an unpatched RALLY_PASTE run.
  - Mutation: I deleted `if (messages.length === 0) return null` from `WarningMessages` (`message-lists.tsx:16`) and ran the warning tests. The new test failed at line 265 (`toHaveCount(0)`, received 1), and the other two still passed. I restored the file with `git checkout` and confirmed the tree was clean.
- **Persistence test** `:210-252`: sound.
  - A `runs` counter adds a third info message from the second response onward, and the final assertion is now `toHaveCount(3)`. That assertion can only match the second run's DOM, so the timing dependence is gone.
  - The first-run assertion `Show 2 info messages` still passes, which proves no earlier request reached the handler and bumped the counter.
- **`InfoMessagesProps`** (`message-lists.tsx:24-30`): behavior-neutral. The inline type became a named interface with the same three fields and the same destructuring. It now matches the siblings (`build-input.tsx:8`, `line-chart.tsx:6`, `results.tsx:7`).

## Acceptance criteria

All 10 original criteria pass, as in round 1. Criterion 2 is now fully covered: the patched successful run checks count 0 (line 265), and the mutation proves the test can fail. Both Rework 1 boxes pass. I ticked all of them in the ticket.

## Invariants touched

None by this delta: it changes only a test and a type declaration. Round 1's invariant assessment still holds.

## Checks (Node 24.22.2)

- `npx tsc --noEmit`: clean
- `npm run lint:dup`: 0 clones, exit 0
- `npm test`: 33 files, 759 tests passed
- `npm run acceptance -- acceptance/aoe4-build-order.spec.ts`: 18 passed
- `npx next build`: ok (REPO.md "Every diff" checklist)

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. There is no rules file.

## Non-blocking notes

- None. The commit message has no ticket ids or factory pointers.

## Coverage

Reviewed the full delta: `acceptance/aoe4-build-order.spec.ts` and `components/apps/aoe4-build-order/message-lists.tsx`. The rest of the branch was reviewed in round 1 and is unchanged. Nothing was left unreviewed. No processes or ports are left running.
