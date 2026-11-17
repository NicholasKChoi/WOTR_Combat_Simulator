# SGS-193 ticket report

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-193-step-annotations-name-the-wait.md`

Summary: "Step annotations name the wait". Feature, M11, component aoe4-build-order, risk standard, about 50 lines of business logic in `components/apps/aoe4-build-order/step-annotations.ts` (`StepRun` gains `waits` and `waitingForText` and loses `waitBreakdown`; `formatWaitBreakdown` is deleted; `blockedByText` follows B-W10). Depends on SGS-192 (uses `waitDetailText`, `StepTiming.waitingFor` and `waitDetails`). The criteria cover the four B-W10 rows, entry order and zero-second omission, the unchanged `not-reached` text, the `StepRun` type change, the run cell and popover sharing `blockedBy`, the unchanged long-wait, flag and stale rules, and the three acceptance cases with API facts asserted first.

Diagrams: none (single component, outside the core loop).

Open questions: none.

Findings:
- The plan says the acceptance spec rewrites every `resources 0:30`-style assertion. At `origin/main` none exists in `acceptance/aoe4-step-annotations.spec.ts` (it asserts only `not reached (...)`, an empty Blocked by and the not-reached and no-wait popover forms), so the ticket states a rule for any such assertion instead of listing rows. The old-format text is pinned only in the unit tests (`step-annotations.test.ts`, `step-annotation.test.ts`), which the ticket lists as examples.
- The doc sentence in `docs/aoe4-build-order-ui.md` (`still waiting on <cause>`) is left to SGS-200 (K); this ticket does not touch it.
- No overlap with other M11 tickets: `step-annotations.ts` is not in the Scope of SGS-189..192 or SGS-194..197. The page-help ticket (J) edits `step-annotation.test.ts` lines for `step-kind-legend`, so it needs a textual rebase only against this ticket's fixture edit.
- Lint: `ticket-lint.py` passed with no output. No scratch checkout was made (file reads at `origin/main` were enough), so nothing to remove.
