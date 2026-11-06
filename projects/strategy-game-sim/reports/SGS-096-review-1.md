# SGS-096 review 1

Verdict: APPROVE. Tip 1097a882d808ae2e9ca899e127400555e820f3a0 (local branch only; no origin ref, reviewed at the SHA). Diff base 9274372.

Blocking findings: none.

## Acceptance criteria
- [x] New case "the current legend item toggles only the current line" asserts every listed point: no `food` line, `pinned:food` drawn, `food` item opacity 0.5, exactly one `aria-pressed=true`, `pinned:food` item opacity 1, and `food` restored on the second click. chart-legend.tsx:26-27 confirms opacity 0.5 and aria-pressed come from `hidden.has(item.key)`. It can fail: line-chart.tsx:144 `hide={hidden.has(pinnedKey(s.key))}` is the line it guards. The implementer reports mutating that line and seeing the case fail.
- [x] Existing pinned-item case is untouched (the diff only adds lines).
- [x] `git grep "follows its current|pinned series' item"` in docs, README and ARCHITECTURE finds nothing. The doc now states the independent-key behavior, which matches line-chart.tsx:144.
- [x] Only docs/aoe4-build-order.md and the acceptance spec change. No component file changes.
- Unverified by me: tsc, npm test, lint:dup and the spec run. I did not run them. The implementer reports all clean (spec 36 passed, 1495 unit tests passed).
- [x] INVARIANTS: none touched.

## Linter, bot, conventions
- Lint not run by me (see above). No review bot is configured (`reviewBot.cli` is empty).
- The new case follows the existing sibling case's locators and helpers (spec lines 80-104). It is the second near-copy, not the third, so the table/helper bar is not met.
- The doc sentence is accurate against the code, with no ticket ids or process history. It is one long line, like its neighbours.

## Non-blocking notes
- The REPO.md "Every diff" steps (`next build`, load the page) were not run. The diff is docs plus a test only and touches no UI code. The Playwright spec exercises the page.
- Manager follow-up from the ticket's On merge: delete the BACKLOG bullets listed as Source, and move the SGS-066 resize bullet under M6.

## Coverage
Reviewed the full diff (2 files), chart-legend.tsx:20-30, line-chart.tsx:138-148, and the neighbouring spec case. The review worktree is removed after this report.
