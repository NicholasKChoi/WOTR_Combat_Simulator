# SGS-067 review 2 (rework 1 re-review)

Branch sgs-067-aoe4-inline-issues-suggestions (local only), reviewed tip 46987c84fe525670b8a623305a059e7fc562b790 (commits c45738f, 46987c8 on 7db4db5fc2a5a840a509a06f3ebdbe84dfd5c161), base origin/main 12639c45aae0210beb9c0ac5037a1cbf138a3200. Review 1 bounced this ticket, so I ran the full gate. The delta `7db4db5..46987c8` got the closest look.

**Verdict: APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Rework 1 checks

1. **No-line scroll spec** (`acceptance/aoe4-build-order-inline-issues.spec.ts:114-123`). It fills 201 lines of 99 `x` characters, waits for the list, calls `scrollTo` (instant) to go to the top, and asserts that the list's top is below `innerHeight`. Then it runs `runRejected` and polls `expectInViewBelowRunBar`. **Mutation** (remove `target.scrollIntoView(...)` at `pages/apps/aoe4-build-order.tsx:95`): the test fails, along with the line-62, repeat, mid-text and table-view specs (5 failed, 7 passed). The below-fold assertion runs before Run, so the failure comes from the post-Run poll.
2. **Repeat-rejection spec** (`:125-135`). **Mutation** `setRejection(converted.issues[0])`, with the effect reading `rejection` directly: only this spec fails, and it fails at the second `expectInViewBelowRunBar` (`:134`), so the first rejection still scrolls and the repeat is what it catches.
3. **Mid-text spec** (`:137-146`, error on line 81 of 151). **Mutation**: drop `target.style.scrollMarginTop = marginTop` and use `block: 'start'`. Only this spec fails (the line-62 spec still passes, as review 1 noted).
4. **`expectInViewBelowRunBar` (`:25-39`)**:
   - **Reads are atomic:** the bar bottom and both target rects are read in one `page.evaluate`.
   - **Stillness:** the target's `top` must match before and after a 250 ms wait. A position counts only when it is unchanged, below the run bar and in the viewport, plus the whole item when a line is given. The explicit `wholeItem` parameter replaces the old `sel.includes('data-line')` sniff (review 1 note 3).
   - **False pass:** it could pass if the scroll had not started yet and the target already sat in the window. Each spec rules that out: the no-line spec asserts below-fold first, and the repeat spec polls `scrollY === 0` first. The line-62 and mid-text specs fail without the scroll, so their start positions are out of the window.
   - **Not flaky:** I ran the inline-issues spec with `--repeat-each=10` against one shared `next dev` (port 4071, throwaway config with `reuseExistingServer: true`), in parallel with `aoe4-build-order.spec.ts` plus `aoe4-build-order-client-check` `--repeat-each=2` (132 tests). Result: 120/120 passed.
   - **Not slow:** scroll spec durations under that load were line-62 2.2-2.4 s, no-line 2.8-3.1 s, repeat 3.2-3.5 s, mid-text 2.1-2.5 s and table 3.1-3.3 s. Each poll attempt costs at most 250 ms more.
5. **Production delta:** `git diff 7db4db5..46987c8 -- . ':!acceptance'` changes one line, `pages/apps/aoe4-build-order.tsx:91`. The selector `[data-line="${line}"]` became `[data-testid="build-order-line-number"][data-line="${line}"]`, and nothing else in production changed. The new selector matches the gutter contract (C8 test id plus `data-line`) and stays scoped to `editorBox`.

## Acceptance criteria (all ticked in the ticket)

Review 1 passed every criterion except #4. The production code is unchanged apart from the selector, so this pass re-checks criterion 4 and the gates.

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1-3, 5-9, 12, 13 | as in review 1 | pass | 12/12 inline-issues specs pass at the tip; the mutation results in review 1 still hold, since only the selector changed in production |
| 4 | line 62 is in the viewport below `run-bar`; a no-line rejection leaves the list in the viewport | pass | `:106` and `:114`, both fail when the scroll is removed (check 1) |
| 10 | `issueLines` rows; one-argument grep is empty | pass | grep is empty; 1287 unit tests pass |
| 11 | errorLines greps | pass (same literal deviation as review 1: `issueLines(clientIssues)`, intent met) | `errorLines={[]}` grep is empty; the pages grep prints one line, `:162` |
| 14 | mutations | pass | review 1 mutations plus the three rework mutations above |
| 15 | docs | pass | the docs grep is empty |
| 16 | tsc, lint:dup, npm test, acceptance | pass | tsc is clean; jscpd found 0 clones; 1287 passed / 10 skipped; full acceptance passed 661/661 (Node 24.22.2); `next build` is clean |
| 17 | no invariant regressions | pass | see below |
| Rework 1 items 1-5 | pass | checks 1-3 and 5; "No other change" holds: the delta is the spec file plus the one selector line |

## Invariants touched

- S1 holds: the delta adds no imports.
- S3 holds: the length cap is unchanged in `textToBuildOrder`, and the delta adds no network calls.
- A1-A3: the diff touches no simulation code.

## Conventions

The new specs follow the file's own helpers (`textarea`, `gutterItem`, `runRejected`, viewport set per test). `scrollToTop` has three call sites, so it is a justified helper. The helper comment at `:22-24` matches what the code does. No ids or factory pointers appear in the shipped files.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are both empty, so no bot ran.

## Non-blocking notes

1. The line-62 and mid-text specs do not call `scrollToTop` before Run, so their starting position is wherever `fill` leaves the page. Both fail without the scroll today, so this costs nothing now. An explicit start would make them robust to future layout changes.
2. Out of scope, pre-existing: `acceptance/aoe4-build-order.spec.ts:429` "marker labels stay apart and inside the plot at 768 px" failed once under the parallel load run (`:396`, plot offset 2.5 against a tolerance below 1). It then passed 20/20 on its own and within the full 661 run. This branch changes no chart code, so the cause is a load-sensitive layout measurement, not this ticket.

## Coverage

- **Files reviewed:** the full delta (spec file, page selector line), the page's scroll effect and Run handler, and the criteria greps at the tip.
- **REPO.md checklist:**
  - Every diff: `next build` ran, and the page flows were exercised through Playwright on `next dev`.
  - AoE4: no copied helper, no doc contradicted, no chart change.
- **Not present:** REVIEW.md does not exist, and the project LESSONS.md has no entries.
- **Cleanup:** the dev server on 4071 is stopped (port free, no next processes left), the throwaway config is removed from the worktree, and the review worktree is removed after this report.
