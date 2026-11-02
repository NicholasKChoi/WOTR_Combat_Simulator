# SGS-042 ticket report (outline H)

File: tickets/SGS-042-aoe4-step-wait-step-stuck.md

Summary: aoe4-build-order, ~130 business-logic lines, depends on SGS-037 (transitively SGS-035). Adds StepTiming.waitingOn and waitBreakdown, handlers return the first failing reason, per-interval accrual through an exported helper (owner decision 10, reused by SGS-039), horizon waitingOn values, step-stuck warnings. Also changes openapi StepTiming and examples, the contract spec's Record<keyof StepTiming>, two toEqual fixtures in simulate.test.ts, and docs/aoe4-build-order.md. 13 criteria, one Mermaid read/act/record diagram (core loop).

Risk: high (lib/** criticalPath; offerSteps and main loop). The plan said medium.

Findings from exploration:
- houses.ts has no StepHandler (auto-houses are not steps), so the outline's "houses handlers return their reason" is dropped.
- Grep check run: `git grep -nF "{ started: false }" lib/aoe4-build-order (non-test)` = 5 sites today; the criterion expects 0.
- Existing fixtures give concrete cases (build-move.acceptance.test.ts:178-190: prerequisite 119 s).
- Overlap: SGS-038 changes the build/move villager check to availableAt in the same handlers (rebase only); SGS-041 touches research.ts.

Open questions (all designer): helper name/signature (proposed accrueWait); step-stuck message step numbering and description text (formatBuildStep arrives in SGS-040); where the shared m:ss formatter lives (formatMinSec is in components, parse-text has an inline copy; C/D need it too); waitingOn for an action with no registered handler.
No owner questions. On merge: none.
