# SGS-183 spec gate 1

Verdict: NEEDS_SPEC (one small gap, no owner gap)

Read at origin/main after `git fetch origin`. No checkout made; file reads were enough. The ticket has no dependency, and no scratch checkout exists to remove.

## Gaps

1. Acceptance criteria, first bullet - it is a code search, and its typecheck half proves nothing - an implementer cannot tell what counts as done.
   - "No file ... imports or calls `showTab`, imports `TABS_VIEWPORT`, declares `PHONE`, or asserts `workbench-tabs`, `tab-build`, `tab-results` or tab `aria-selected`" is a search over code. The gate rule allows a search only for doc and comment wording.
   - The cited proof is "a typecheck with the unused imports removed passes". `tsconfig.json` at the base has no `noUnusedLocals`, so tsc passes whether or not an unused `showTab` or `TABS_VIEWPORT` import is left.
   - A leftover `tab-*` string assertion passes today at 1280 only if the tabs are absent. It would then fail once the later code ticket removes them, which is exactly the breakage this ticket exists to prevent.
   - Proposed fix: move "remove the imports and calls" into Scope as an instruction, which it already is. Replace the criterion with an observable outcome: "every case in the eleven listed files passes at its stated viewport with no tab step, and `acceptance/helpers.ts` is unchanged (diff empty)". Keep the grep only as a review aid in Notes, with no count.

## Checks that passed

- **Grounded scope.** All eleven files exist at origin/main.
  - The cases, describes and constants Scope names are present: the start-row case at step-table line 470, "labelled fields share a line", the tabs-layout view-toggle describe, `PHONE` and the 390 describe in marker-labels, the 1024x2800 describe, and the "on the tabs layout" describe with 6 cases.
  - `OPEN_STATE_BUILD`, `showView`, `textarea` and `WIDE_VIEWPORT` stay in use after the deletions, so no orphaned helper is left.
- **Other tickets.** Ownership matches the design inventory (design/M10.md, "Acceptance spec inventory") and SGS-179, SGS-180, SGS-181 and SGS-182. inline-issues belongs to SGS-179; the other listed specs belong to SGS-179 to SGS-182. No overlap with them.
- **Throwaway work.** The ticket touches no file that SGS-184 deletes.
- **Remaining tab references.** Every `showTab`, `TABS_VIEWPORT`, `tab-*`, `workbench-tabs` and `PHONE` hit in a non-listed file belongs to another step-1 ticket's set (the same files Scope lists as left alone). I found no unowned file.
- **Viewport criterion.** The specs of the six "drop showTab only" files carry no viewport set under 1200 px.
  - step-band is 1280x800; chart-readability and marker-labels are 1280x900 (marker-labels has the 390 describe, which is deleted); auto-run-contract, knight-longbow-page, m3-flow and gathered-resources use no viewport, so they run at the default 1280x720.
  - The kept chart-layout "with the build view" describe is 1280x800.
  - `playwright.config.ts` uses `devices['Desktop Chrome']`, which gives 1280x720.
- **Docs.** No doc or other non-acceptance file names the deleted or renamed cases. The grep found only the m4-flow title "tabs, info list, ..." in the spec itself.
- **Risk.** Low is correct: test-only, no `criticalPaths` or `strongModelTriggers` item.
- **Invariants.** `none` is right. No INVARIANTS.md `Paths:` glob matches `acceptance/**`. The one LESSONS rule for `acceptance/**` (read layout values in one `evaluate` under `expect.poll` or `toPass`) is already followed by the kept WIDE half of the start-row case.
- **Other fields.** Contracts, input validation, On merge (`none`), Unverified assumptions (`none`, nothing faked) and Open questions (`none`) are fine.
- **Decisions.** The body agrees with the design inventory row for each spec.
- **Quoted names.** The names the ticket quotes match the base. Examples: m4-flow `unpin-run` and `pinned-label`, and the run-errors titles "enables the results tab" and "on the build tab".

## Notes

- Criterion 2's "cases deleted are absent" is a diff-shaped check. It is fine as written because Scope names each case, but it is not something a test can fail.
- The drag-reorder move from 1024x2800 to 1280x2800 puts Results in a narrower two-column panel (the design inventory sets 1280x2800). Only `npm run acceptance` can confirm that the 4px-threshold and pointer-height drops still land. The ticket already requires that run.
- LOC "about 150 deleted, about 100 changed" and "about 7 showTab calls" are estimates in prose, not criteria. Harmless.
- Report name: `SGS-183-ticket-1.md` already exists in `reports/`. This is the first spec-gate report, so it is `-spec-gate-1`.
