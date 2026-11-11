# SGS-116 review 1

Branch sgs-116-step-table-readability, tip f685e48, full diff vs main. Verdict: **APPROVE**

## Blocking findings
None.

## Acceptance criteria
- waitedText exported, table test with 4 statuses at 75 s (step-annotations.test.ts): pass. Fails if waiting formats a time or in-progress returns still waiting.
- step-annotation.test.ts run-cell markup (labels outside spans, bare values, still waiting with no `Waited`, labelled true/false): pass. Fails if labelled is ignored or the label stays on a waiting step.
- (respec 1) Acceptance table view, completed labels and not-reached `still waiting` with no `Waited`: pass by reading (extends the named not-reached case; new completed-labels case). Existing no-wait case unchanged.
- Acceptance text view gutter titles and no Started/Finished text: pass by reading (`^Still waiting. Blocked by: not reached (`, `Waited 0:00. Blocked by: nothing`, no `Waited` title on waiting/not-reached).
- (respec 1) 1280 badge nowrap and select width incl. `Capital Town Center`: pass by reading. Padding and border are measured, and the arrow space sits inside Bootstrap's form-select padding-right. The check fails with `nowrap` removed or the cap restored.
- 390 px kind border 4px and legend colour: pass by reading. `tbody > tr > td.kindBorder` has specificity (0,1,3), beating `.table td` (0,1,1).
- (respec 2) Layout case: `panelFits` kept, `tableFits` dropped, `deletesInside` measured against the scroll box scrolled fully right, `overflow-x: auto` asserted, all in one `page.evaluate`: pass. The text-view check is untouched.
- (respec 2) Scroll reset (select case) and typing case with caret in the visible part, `scrollLeft` unchanged: pass by reading. Preconditions are asserted in `scrolledLongText` and before the typing. The typing case fails if the effect resets on every text change, because `typedText.current === text` is then ignored. The select case fails if the reset never runs.
- (respec 1) Grep for `Waited` outside tests: only step-annotation.tsx:78 and build-text-editor.tsx:43. Pass.
- Docs paragraphs (run cell, gutter, scroll reset, narrow border; no measured numbers; the side-by-side and kind Other sentences kept): pass.
- tsc, lint:dup and vitest (aoe4-build-order, 19 files, 541 tests): I ran them, all pass. The full `npm test` was not run, only the app's directory. The implementer's tests-edited list is in the implementer report.
- No INVARIANTS regressions: ticket lists none; display-only change, simulator untouched. Holds.

## Linter
`npx tsc --noEmit` clean. `npm run lint:dup` found 0 clones.

## Bot
`reviewBot.cli` is empty, so there is no bot and no rules file.

## Non-blocking notes
- build-text-editor.tsx:43 nests a template literal inside a ternary inside a template literal. It is correct but dense. A small local `const waitedTitle = ...` would read better.
- build-text-editor.tsx:~128 `typedText` compares by value. If a programmatic change sets the text to exactly the string last typed, the reset is skipped. This is an edge case and needs a differing intermediate text, so I did not block on it.
- step-annotation.test.ts: the `it.each<[boolean, boolean]>` rows are `labelled === expected`, so the title is redundant. It is harmless.
- The `STILL_WAITING` constant is exported and the editor branches on it. This is fine and keeps the rule in one place.

## Coverage
Reviewed all 9 changed files. Conventions checked against the sibling code in step-annotation.tsx, step-annotations.ts and the existing spec style. The UI inspection (Playwright) did not run: I judged the CSS from code, and the acceptance cases cover it. Acceptance tests were not run, per the gate rules. The REPO.md "load the page with next dev and screenshot at 360/768/1280" step was not performed. Review worktree: worktrees/review-sgs-116 (remove may be deferred by the sandbox).
