# SGS-217 review 4

Verdict: APPROVE (tip 89bdb014ca94570fde38b041906f57a3b12e921d, Chore, one file changed)

## Blocking findings
None.

## Spec gaps
None.

## Acceptance criteria
- Extended spec runs green alone, existing assertions kept, run and case-3 window recorded: pass. The implementer's report records 10 passed (5 existing, 5 new) and the read window 936 to 1188 with cap 1094.94. The diff shows only the import lines changed among existing lines. I ran no acceptance test, per the gate rules.
- Markers control lists exactly the run's kinds, no cap entry: pass. Compared against `CHART_MARKER_KINDS` filtered by `result.markers`, and kind, text and aria-label are checked. Recorded breaks (extra cap `<li>`, renamed kind, cap label text) all fail it.
- Pinned run reached cap, current 600 s run did not: pass. The test asserts the null cap from the response, zero marks, and the pinned m:ss and "not reached" in the `pop-cap` row. The rejected alternative (`timeMark(pinned ?? result)`) is recorded as failing.
- Unzoomed line x and zoomed line x and label side: pass. The test asserts cap inside the window, span < cap, and the label fitting by `estimateLabelWidth`. It also asserts exactly one mark, the line x against a window-spanning axis, and the label right of the line and inside the grid. Recorded breaks cover the side judged without the origin, the wrong zoomed or unzoomed domain, and a duplicate mark.
- Reset after an outside window: pass. The window end < cap is asserted from the read window, then no mark, then reset gives one mark with the same `data-at` and unzoomed x. Recorded breaks include a sticky-hidden mark and a no-op reset.
- Pointer-down on label starts a selection and release zooms: pass. The break that ignores pointer-downs on text fails it, as do no-zoom-on-release and a never-set selection.
- Each case asserts its precondition first: pass. `setup` asserts the default cap non-null. The pinned and 600 s cases assert it per run. The window and span checks, the label-fit check, and the not-zoomed check for the pointer case are all present.
- No production code, no other test file: pass. `git diff --stat` shows only `acceptance/aoe4-population-cap-mark.spec.ts`.
- No INVARIANTS.md regressions: holds. No entry's Paths glob matches the file.

## Chore check
No owner-visible behavior change. No pre-existing assertion changed (the only edited existing lines are the import lines). Pre-existing tests edited: none.

## Mutation record
Every new test, helper-backed assertion and table-less case has a failing break in implementer report 3. The `present.length > 0` guard is a data precondition that no production break reaches, which the implementer states. I accept it as the data-precondition assertion common.md requires. Deleted assertions are listed in the report. Deletions cannot add a failing path.

## Linter
`npx tsc --noEmit` clean and `npm run lint:dup` reports 0 clones, run in the review scratch.

## Bot reconciliation
`reviewBot` is a bot-login-only entry with no `cli` or `rulesFile`. Skipped.

## Conventions
New helpers `readMark`, `zoomWindow` and `axisX` read layout in one evaluate under `toPass` (LESSONS.md and the `aoe4-chart-views.spec.ts` exemplar). Shared helpers come from `acceptance/helpers.ts`. Each case is its own test with a distinct setup, so no table or helper is missed. No ticket ids or factory pointers appear in the spec.

## Non-blocking notes
- The implementer notes that the label does not block the pointer at base, so the pointer test guards a regression rather than a current defect. That matches the ticket's intent.
- The 0.78 to 0.99 window in case 3 depends on a 504 px plot at the 1200 px wide viewport. The label-fits precondition asserts this loudly if it drifts.

## Coverage
Reviewed the full diff, the ticket, implementer report 3, REPO.md, LESSONS.md and spec-checklist.md. UI inspection skipped: the diff changes no UI, only an acceptance spec. Acceptance tests not run, per the gate rules.
