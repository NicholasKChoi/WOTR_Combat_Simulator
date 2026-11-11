# SGS-116 spec gate, round 1

Verdict: NEEDS_SPEC

Read at origin/main after `git fetch origin`. No Depends-on.

## Gaps

1. **Acceptance criteria (the `git grep -n "Waited"` criterion) - it contradicts the tests Scope and the other criteria require.**
   - The criterion says `git grep -n "Waited" -- components/apps/aoe4-build-order` finds the label only in `step-annotation.tsx` and `build-text-editor.tsx`.
   - The path covers `step-annotation.test.ts`. The "pins the run cell markup" criterion makes that test assert `Waited` outside the value spans and `no Waited` for waiting runs. Any gutter-title unit test would also contain it.
   - End-state grep therefore returns test files too, and an implementer must guess whether to avoid the string in tests or to ignore the criterion.
   - Fix: restrict the search to non-test sources, for example `git grep -n "Waited" -- 'components/apps/aoe4-build-order/*.ts' 'components/apps/aoe4-build-order/*.tsx' ':!*.test.ts'`. Or state the rule as "no non-test source other than `step-annotation.tsx` and `build-text-editor.tsx` formats the wait". Use the pathspec exclusion, not a list of files.

No other blocking gaps.

## Checks that passed

- Grounded scope: every named file and function exists on main. `finishedText` is in `step-annotations.ts`. The `.table select { max-width: 7.5rem }` rule exists. `.table td { border: 0 }` is inside the 767.98px media block. `.kindBorder` is a single class, so it loses to `.table td` as the ticket says. `build-text-editor.tsx` has the `Waited ${formatMinSec(...)}` title and the `StepTimes` call.
- The existing layout case (`tableFits`, `panelFits`, `deletesInside`) is at `acceptance/aoe4-step-annotations.spec.ts` lines 226-232 and is handled by the stop-and-report rule.
- Open questions: none. Invariants: none, and no contradiction (display only, simulator unchanged). Contracts: they match design/M8.md C12 and the M8.5 row. CONTEXT.md has no conflicting Decisions.
- Risk low: no strongModelTriggers or criticalPaths touched. Size about 90 LOC. Diagrams: not required.
- Existing-test rule: Scope says "every test the change makes untrue is edited; the implementer lists them", which is a rule, not a list. Existing unit tests at `step-annotation.test.ts` line 102 (`StepTimes` without `labelled`) and the `toContain(times)` check will need edits, which the rule covers.
- Lessons: the criteria use Playwright computed styles, a single `page.evaluate`, and no CSS-module class assertions, matching LESSONS.md.
- Docs: the paragraphs in `docs/aoe4-build-order.md` lines 849-852 and 915-919 are named in Scope. No other doc mentions `Waited`.
- Criteria hold in the end state, and no counts or line numbers are pinned.
- On merge `none` is valid. Input validation: not applicable.

## Notes (non-blocking)

- The scrollLeft reset needs a way to tell the editor's own `onChange` from other text changes (for example a ref flag). Scope states the behavior and the two acceptance cases pin it, so the mechanism can be the implementer's choice.
- The 1280-wide "select wide enough" check is a browser measurement. The implementer should compare the select's own `scrollWidth` or an off-screen span against its `clientWidth`, with the select's padding and arrow included.
- The "existing not-reached case" cited in the run-cell acceptance criterion should be confirmed. The only `step-waited` assertion found in the spec is at line 117 (the completed no-wait case). If no not-reached case exists, the implementer adds one, which the criterion already covers.
