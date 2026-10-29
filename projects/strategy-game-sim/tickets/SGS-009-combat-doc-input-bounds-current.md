# SGS-009: Update combat-simulator doc input-bounds text to the merged validation behavior

- **Type**: Task
- **Component**: wotr-combat-simulator
- **Milestone / criteria**: M1 / (no fit; M1.1 is already done and M1.5 is covered by SGS-003)
- **Priority**: low
- **Risk**: low
  <!-- docs only, one file, no public surface change, no code, no invariant text altered -->
- **LOC estimate**: ~6 lines of prose changed in `docs/combat-simulator.md` (no business logic; very small)
- **Depends on**: SGS-003
- **On merge**: none
- **Source**: reports/SGS-003-review.md, finding 1 (design-doc drift); SGS-003 forbade edits under `docs/`, and SGS-001, which wrote the doc, is integrated.

## Context

Once SGS-003 merges, two statements in the "Input bounds" section of `docs/combat-simulator.md` describe
behavior that no longer exists. The doc is the standard reviewers judge combat changes against, so stale
"Current code" notes mislead them. Base is origin/main; the post-change behavior is read from branch
`sgs-003-validate-fight-inputs` (tip 018b3f4).

## Scope

Edit only `docs/combat-simulator.md`, "Input bounds" section (lines ~101-106 on main):

1. Lines ~101-102: replace "The form does not stop a combination the server rejects, such as 10 regulars
   and 10 elites." with a statement of the merged behavior: the form disables options that would take a
   side over 10 regulars + elites (for example, with 6 regulars selected, elites 5 to 10 are disabled), and
   leaders stay 0 to 5. Source: `components/apps/combat-simulator/army.js` and
   `acceptance/combat-simulator-validation.spec.ts` on the SGS-003 branch.
2. Lines ~104-106: delete the "Current code" note (form offers 0-9, server checks no bounds, 0-unit side
   gives 0 rounds and non-numeric averages). On the SGS-003 branch the form offers 0-10 / 0-10 / 0-5 and
   `pages/api/fight.ts` validates all six fields, returning 400 with an `error` string for a rejected
   request and 405 with `Allow: POST` for non-POST methods. Keep the sentence about rejected requests
   running no battle; optionally name the 400 status there if it reads naturally.

Do not touch the other "Current code" notes (N battles, independence, casualty defect); they are still
true.

**Out of scope:** any rule in the doc (bounds at ~91-99, combat rules, N, independence); any code, test,
or acceptance file; documenting the request/response shapes (SGS-006); form-encoded body handling (SGS-006
per the SGS-003 review).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The sentence saying the form does not stop server-rejected combinations is gone; the doc says the form disables options that would exceed 10 regulars + elites per side and offers leaders 0 to 5.
- [ ] The "Current code" note under "Input bounds" is removed; no remaining text in the doc says the server checks no bounds or that it returns non-numeric averages for an empty side.
- [ ] `git diff origin/main -- docs/combat-simulator.md` touches only lines inside the "Input bounds" section after the bounds list, and the bounds list (regulars/elites at most 10 combined, leaders 0-5, 0 fighters invalid) is byte-identical.
- [ ] The other "Current code" notes (N battles, independence, casualties) are unchanged.
- [ ] No file other than `docs/combat-simulator.md` changes.
- [ ] No INVARIANTS.md regressions

## Open questions

None for the owner. Note for the manager: if SGS-004, SGS-005, or SGS-006 also edit this doc, they touch other sections; the merge conflict risk is limited to adjacent lines.
