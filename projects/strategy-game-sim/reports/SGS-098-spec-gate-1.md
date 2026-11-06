# SGS-098 spec gate 1

Verdict: NEEDS_SPEC

## Gaps

1. Scope, contract spec (`acceptance/aoe4-simulate-api-contract.spec.ts`, test 1 of 28) - The listed title "examples › the buildOrder request example returns the documented 200 body" is not a standalone `test(...)` block. It is one row of `for (const name of Object.keys(requestExamples))` (line 283), and `docs/api/openapi.json` has two request examples, `buildOrder` and `goldRunOut`. Only `buildOrder` fails, and `goldRunOut` passes. The ticket's deletion rule covers a loop only "when every generated row fails", and the "byte-identical remaining tests" criterion forbids editing the loop. An implementer must therefore guess among three options. They could delete the whole loop, which removes the passing `goldRunOut` row and breaks "delete exactly the failing cases". They could edit the loop to skip `buildOrder`, which modifies a remaining test. They could leave the test in place, which leaves the suite red. Proposed fix: state the rule. For example: "Keep the loop and change its iteration to `['goldRunOut']` (the only passing row), i.e. the one allowed edit to a remaining test", or "delete the loop and record the lost `goldRunOut` coverage in the follow-up". Pick one, and relax criteria 2 and 3 to allow that edit. Owner decision only if the owner cares whether `goldRunOut` coverage survives. Otherwise the ticket agent can choose the first option.

2. Acceptance criteria 2 vs 3 - Criterion 2 says the diff "only removes lines", and criterion 3 allows re-indentation from removing a wrapper. Re-indentation adds lines, so the two criteria contradict each other. No listed deletion removes a wrapper around a surviving test, so re-indentation is likely moot. Proposed fix: drop the re-indentation allowance, or reword criterion 2 to "no added lines other than the one allowed in the contract spec".

## Verified

- All 11 spec files and the listed titles exist on origin/main (9328355). Titles that come from loops are consistent: the spear/longbow `[1200, 3600]` loop, the house-lead-time `shipped` loop (the whole file is deleted), and the contract loop above.
- The counts add up to 28 (1+6+1+4+1+1+3+2+2+4+2+3).
- `finalCount`, `INFINITE_NODES` and `buildOrderFrom` are used by surviving specs, so they stay in `helpers.ts`. Verified by grep on origin/main.
- No factory, repo doc or code file outside `acceptance/` references the three files to be deleted.
- Risk `low`: test-only deletion, no `criticalPaths` symbol or `strongModelTriggers` item.
- Invariants `none` fits: no product paths change.
- Open questions: none. CONTEXT.md has no open questions or Decisions entries that touch this ticket.
- Contracts: no new names are introduced.
- Diagrams: none are needed.
- Docs: nothing stale. On merge `none` is fine.
- Input validation: n/a.
- No LESSONS entry applies.

## Notes

- Criterion 7 ("a search finds no declared-but-unused name") is vague. Prefer "`npx tsc --noEmit` passes with `noUnusedLocals` semantics, or a grep for each removed-from file's top-level `const`/`import` names shows a remaining use". Check whether tsconfig enables `noUnusedLocals`. If not, tsc will not catch unused names, and the reviewer needs the grep rule.
- In the spear/longbow spec, deleting the loop and the 1200 s test leaves `MAN_AT_ARMS_STEP`, `CASTLE_LANDMARK_SECONDS` and `MAN_AT_ARMS_START_SECONDS` unused. The Scope rule covers them, but the ticket could name them as an example.
