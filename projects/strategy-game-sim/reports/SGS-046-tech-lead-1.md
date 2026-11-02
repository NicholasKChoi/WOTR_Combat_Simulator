# SGS-046 tech-lead 1

**Decision: no blockers. Draft PR opened.**

PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/59 (draft, base `main`, head `sgs-046-aoe4-step-table-editor` at ff407d0). It is a single PR, so there is no stack footer. The body was set with `gh api -X PATCH`, and a grep of the body found no ticket ids and no `#n` references.

## Merge risk
**low** - new UI and a pure options builder; no API, schema, CLI or config change, no critical simulation or payment code touched, a revert fully undoes it, and unit and Playwright tests pin the behavior.

## Review focus
No hotspots: the change is additive and only reads the existing text state. The table can only write text by way of `formatBuildOrderText`, and a browser check found no option pick that makes the table disappear. Results are unaffected because Run captures the text before its request (unchanged code).

## Reviewed
- **Commit range:** origin/main 0f290d8..ff407d0 (4 commits, all authored by choinickolas@gmail.com).
- **Files:** 8 files, +1156/-8.
- **Hand-written production code:** +517/-4 in `step-table-model.ts` (133), `step-table.tsx` (278), `step-options.ts` (87) and the page (+19/-4). Docs are +20/-4.
- **Tests:** only new test files: `step-table-model.test.ts`, `step-options.test.ts` and `acceptance/aoe4-step-table.spec.ts`. `--diff-filter=M` lists only the docs and the page, so no existing test was edited.
- **Checked against:** INVARIANTS (S1, S3, A1, A2, A3), CONTEXT open questions (none) and the REPO.md criticalPaths.
  - No criticalPaths symbol is touched.
  - **A1:** the only literals are the form defaults the ticket permits.
  - **A3:** everything is pure and sorted by a total order.
  - **S1:** no import from another app.
  - **A2 and S3:** no engine change and no new server input.
- **In-flight edit criterion:** `runSimulation` captures `runText = text` before the fetch (unchanged code on main), so a table edit during a run cannot change the displayed result. A test does not pin this.

## Non-blocking notes
- `withoutField`, `setTriggerNumber` and `offersEmptyChoice` are exported beyond the four helpers the ticket names. This came from review; it is harmless.
- `step-options.ts` classifies every entry of a tech baseId, not only entries of tech type. This is latent: the English snapshot has no mixed-type baseIds.
- The ticket's mutation check "formatBuildOrderText drops reaction fails the Playwright every-step-form test" was not run as written. Acceptance instead ran "reaction checked false", which failed that same test. The PR body states the mutations that were actually run.
- No test covers the acceptance criterion "edit during an in-flight run". The PR body says so.
- "Choosing another prebuilt build" was added by suite as an acceptance test, according to the suite report.
