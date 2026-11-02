# SGS-059 review 2 (delta re-review after rework 1)

Verdict: **REQUEST CHANGES** (one rework item ticked but not done; everything else passes)

Branch `sgs-059-aoe4-page-posts-build-order`, tip `f4eaeae45d74ffe12f7e83f33d7242134e92a601` (local only:
`origin/sgs-059-aoe4-page-posts-build-order` does not exist, so I reviewed the local ref). Stacked on
sgs-075 `7037d4819545d5544629a298cfd94c8f26d0b8ed`. Delta reviewed: `git diff 77b501b..f4eaeae`, one commit,
3 files, +5/-4.

## Blocking findings

- `docs/aoe4-build-order.md:826` - contract (rework 1 item) - the line "as an extra selected `<id> (unknown)`
  choice that the table leaves alone, and Run reports it as an issue under the textarea. Number fields" is
  still 138 characters; the rest of the paragraph wraps at 110 or less (lines 811-833 are 47-110). The rework
  item "keep line ~826 within the paragraph's wrap width" is ticked in the ticket, but the delta does not
  touch line 826. Direction: reflow lines 826-829 to the paragraph's width of about 110 (for example, move
  "as an issue under the textarea. Number fields" to the next line and rewrap the lines after it). Docs only,
  no code or test change.

## Rework 1 items

| Item | Result | Evidence |
|---|---|---|
| Notes test asserts the fly issue | PASS | `acceptance/aoe4-build-order.spec.ts:325` calls `expectFlySyntaxIssue(page)` after `runRejected`. The helper (`acceptance/helpers.ts:106-113`) asserts exactly one `build-order-issue`, `data-line="2"`, `data-code="syntax"`, text containing `fly`, and a `simulation-error` count of 0. Mutation: changing the notes test's paste to `start -> sheep\nproduce knigt from stable` (rejected with `unknown-id`) makes the test fail at `toHaveAttribute('data-code','syntax')` (received `unknown-id`). Control: the same mutation with the new line removed (the 77b501b state) passes, so the new assertion is what catches it. |
| Rename the two "a 400 run" titles | PASS | `aoe4-build-order-pin-compare.spec.ts:187` "a rejected paste removes charts and table but keeps the pin; the next valid run restores both" and `aoe4-build-order.spec.ts:677` "a rejected paste and a start-only run show no timeline". Only the titles change; the bodies are byte-identical. Both titles match what the tests assert: no POST, compare table and charts removed, pin kept, timeline removed. |
| Docs: drop "as before" | PASS | Line 813 now says "Server 400 issues and network or HTTP failures show in the error list." It states the behaviour directly with no process history. The rewrapped lines 813-814 are 107 and 47 characters. |
| Docs: line ~826 within wrap width | **FAIL** | See the blocking finding above. |
| No page-code change | PASS | `git diff --quiet 77b501b..f4eaeae -- pages components lib` is clean, and the whole delta is limited to `acceptance/` and `docs/`. |

## Acceptance criteria

All criteria passed in review 1 on 77b501b, apart from the test findings, and the page code has not changed
since. Re-run on f4eaeae with Node 24.22.2:
- `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones, exit 0. `npm test`: 41 files, 1221 passed and 8
  skipped. `npm run acceptance` (ACCEPTANCE_PORT=3859): 605 passed.
- The criteria were not ticked because the verdict is not APPROVE.

## Invariants touched

- S3: holds. There is no code change in the delta.
- A1-A3: not touched (no `lib/` change).

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. `rulesFile` is empty.

## Non-blocking notes

- The branch tip is not pushed to origin. Push it before the PR or rebase steps.

## Coverage

- Reviewed the full delta in the 3 files, plus the helper `expectFlySyntaxIssue` and the surrounding test
  bodies.
- Every-diff checklist: I did not re-run `npx next build` because the page code is byte-identical to
  77b501b. The acceptance run started `next dev` and loaded the page in every test.
- The worktree and the Playwright server were stopped and removed. Nothing is listening on port 3859.
