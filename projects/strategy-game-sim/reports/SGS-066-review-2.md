# SGS-066 review 2 (rework 1 re-review)

Verdict: REQUEST CHANGES

Branch sgs-066-aoe4-workbench-tabs-editor, tip fb4ca86b9fc8452b883e52993828e6c994c40f16 (local branch). Stacked on the old sgs-059 tip 41e648d. Diff reviewed: `41e648d..fb4ca86`, with a focus on the rework delta `0d57ba1..fb4ca86`. Node 24.22.2. Review worktree: `worktrees/review-sgs-066` (removed afterwards).

All four rework-1 findings are fixed and verified. One new blocking test finding: the diff turns an untouched acceptance test into a flaky one, and it failed in my full-suite run.

## Blocking findings

1. `acceptance/aoe4-build-order-client-check.spec.ts:72-78` ("the issue list sits under the textarea")
   - Category: test.
   - What: the test reads `boundingBox()` of the textarea and then of `build-order-issues` in two separate round trips. On this branch the window is still smooth-scrolling when the test measures. Bootstrap sets `scroll-behavior: smooth` on `:root`, and after the fill shrinks the textarea, the page scrolls from 0 to about 92 px. So the two boxes are read at different scroll offsets.
   - Evidence:
     - Full `npm run acceptance` on port 3971: 630 passed, 1 failed, and this test was the failure (`Expected: >= 690.97, Received: 616.97`).
     - Running the file alone with `--repeat-each=10`: 1 failure out of 10 runs of this test.
     - A probe that logged `scrollY` around the two reads, over 60 runs on fb4ca86: the offset changed between reads in 31 of 60 runs (for example `s1:0, s2:92`). The same probe on 41e648d gave a constant `scrollY` (664) in all 60 runs.
     - In isolation the test passes 60 out of 60, so it fails only under parallel load. It is intermittent, but the diff caused it.
   - Why it matters: criterion "npm run acceptance passes" (and "every spec that ran before still passes") does not hold reliably. Every later agent's acceptance run can fail on it at random.
   - Direction: read both rects in one `page.evaluate` (two `getBoundingClientRect()` calls in the same frame), or compare document-relative tops (`rect.top + scrollY`), or wrap the comparison in `expect.poll`. Grep the other specs for the same two-`boundingBox()` pattern without a poll. New spec 2 already polls, so it is safe.

## Rework 1 findings: verification

1. **Results scroll offset (fixed).** `pages/apps/aoe4-build-order.tsx:73-79` now sets `panel.style.scrollMarginTop` from the run-bar form's `getBoundingClientRect().height` just before `scrollIntoView()`. The page no longer imports `workbench.module.css`, and the `.panel` rule is gone. I measured with my own probe spec, scrolling to the bottom before each run and waiting for the smooth scroll to settle:

   | width | bar bottom | heading top after the run | heading top after a second run on Results |
   |-------|------------|---------------------------|-------------------------------------------|
   | 1280 | 93.9 | 94.1 | 94.1 |
   | 768 | 186.8 | 186.5 | 186.5 |
   | 390 | 247.3 | 246.9 | 246.9 |

   - Differences under 1 px are subpixel rounding.
   - Resize cases (1280→390, 390→1280, 1280→768, 768→1280), with a run at the first width, a resize, a scroll to the bottom and a second run: in every case the heading lands at the new bar bottom (within 0.4 px), and the inline `scrollMarginTop` equals the new bar height. A stale margin does not stick, because the margin is recomputed on every 200.
   - Mutation: a fixed `144px` margin makes the 768 and 390 cases of spec 2 fail; 1280 passes.
2. **runThenFail pins (fixed).** `runThenFail` clicks `pin-run` after the 200, and the 400 and 500 specs assert Build is selected and `tab-results` is enabled.
   - Mutation: removing `setTab('build')` from both the `!response.ok` path and the `catch` path makes the 400 and 500 specs fail on `aria-selected`; the other 11 workbench specs pass.
   - Keep-pin mutation: adding `setPinned(null)` on the `!response.ok` path makes both the 400 and 500 specs fail on `toBeEnabled`.
3. **Docs (fixed).** `docs/aoe4-build-order.md:808-813` now says:
   - "Results is enabled while there is a shown result or a pinned run". This matches `resultsEnabled = result !== null || pinned !== null`.
   - The textarea "never scrolls vertically (a line longer than the box scrolls sideways)". This matches `overflow-y: hidden; overflow-x: auto; white-space: pre; wrap="off"`.
4. **cn (fixed).** `workbench-tabs.tsx:25,37` use `cn('nav-link', active === ... && 'active')`. The import style matches `build-input.tsx:2`.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Load state | pass | New spec 1 passes. |
| 2 | 200 selects Results below the bar; both panels stay mounted | pass | Spec 2 runs at 1280, 768 and 390; my probe confirms the positions (table above). |
| 3 | Rejection, 400 and 500 select Build and keep the pin | pass | Both mutations above fail the specs. |
| 4 | Unpin with no result | pass | The spec passes. |
| 5 | Sticky bar holds the five controls | pass | The spec passes, and I checked the controls in code. |
| 6 | Gutter, `{text, onChange}` only, no `data-error` | pass | Unchanged since review 1. |
| 7 | rows = max(8, n); no inner vertical scroll | pass | Unchanged since review 1. |
| 8 | Toggle | pass | Unchanged since review 1. |
| 9 | `lineCount` unit rows | pass | 4 rows. |
| 10 | Mutation of `lineCount` | pass | Checked in review 1; no change since. |
| 11 | Greps for `rows={16}` and `build-order-text` | pass | `rows={16}`: none. `build-order-text`: one hit, `build-text-editor.tsx:26`. |
| 12 | `IssueList` grep | pass | No hit in `build-input.tsx`. |
| 13 | Old specs pass; `tab-build` and `editor-view-table` counts; edited tests listed | **fail** | The counts are fine (9, 3, 2, and 9 in the step-table spec). But the client-check test above is now flaky. As in review 1, the edited-test list is only in the implementer reports, not in the ticket. |
| 14 | Docs rewritten; the old-wording grep is empty | pass | The grep is empty and the sentences are accurate. |
| 15 | tsc, lint:dup, npm test, acceptance | **fail** | tsc is clean; lint:dup finds 0 clones; unit: 1225 passed, 8 skipped; `npx next build` OK. Full acceptance: 630 passed, 1 failed (blocking finding 1). |
| 16 | No invariant regressions | pass | See below. |

I ticked no criteria, because the verdict is not APPROVE.

Invariants:
- S1 holds: new components import only `./` modules and `classnames`.
- S2 holds: the page is still inside `Layout`, and the landing link is untouched.
- S3 holds: the Run path, the POST body and the duration handling are unchanged.
- A1-A3 are not touched.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. `rulesFile` is empty.

## Non-blocking notes

- `pages/apps/aoe4-build-order.tsx:76`: `panel.closest('section')?.querySelector('form')` finds the run bar as "the first form in the enclosing section". It is the only `querySelector`/`closest` in `components/` and `pages/`; the siblings use refs (`resultsTop` in the same file, `line-chart.tsx:176`). If a form is ever added above the bar, or the wrapper stops being a `section`, the offset silently drops to 0. In React 19, `ref` is a plain prop on function components, so passing a ref to `BuildInput`'s `<form>` would be a small change.
- `docs/aoe4-build-order.md:812`: the edited line is about 170 characters long, while the rest of the section wraps at about 110. Cosmetic.
- No spec covers the `catch` (network failure) path's `setTab('build')`: the mocked 500 goes through `!response.ok`. The ticket asks only for a mocked 500, so this is not a finding.
- These carry over from review 1 as still optional: `showTab`/`showView` are used unevenly, and some lines in `aoe4-step-table.spec.ts` have trailing whitespace.

## Coverage

- Reviewed the delta `0d57ba1..fb4ca86` in full (page, CSS module, `workbench-tabs.tsx`, docs, `aoe4-build-order.spec.ts`), plus the files around it: `build-input.tsx`, `build-text-editor.tsx` and the client-check spec.
- Checks run on port 3971:
  - workbench specs with `--repeat-each=5`: 65 of 65 passed;
  - full acceptance once: 630 passed, 1 failed;
  - `aoe4-build-order.spec.ts` plus the client-check spec with `--repeat-each=3`, twice: 192 of 192 passed both times;
  - three probe specs: scroll offsets, resizes, and `scrollY` during the client-check measurement, on both fb4ca86 and 41e648d.
- REPO.md checklist:
  - "Every diff": `next build` ran; the page was loaded through Playwright at 1280, 768 and 390.
  - "AoE4 build order": no copied helpers or constants; this is not a chart change.
- Mutations run, each reverted afterwards: no `setTab('build')` on failure; drop the pin on failure; fixed 144 px margin.
- Probe specs deleted, worktree clean, nothing listening on 3971.
