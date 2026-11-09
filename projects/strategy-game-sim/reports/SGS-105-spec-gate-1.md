# SGS-105 spec gate 1

Verdict: NEEDS_SPEC (two small, mechanical gaps; no owner questions)

Checked against: the ticket, design/M6.md (C6 saved name, Save and link, `?b=` load, OD-5/6/8), SGS-099/100/102/103 tickets, INVARIANTS.md, LESSONS.md, PROJECT.md strongModelTriggers, and the repo files.

## Gaps

1. **Acceptance criteria, "Wiring holds in the end state" - the greps contradict the end state Scope requires.**
   Scope item 11 requires `saved-build-loader.test.ts` and `save-build-client.test.ts` in `components/apps/aoe4-build-order/`. Both must assert the literal `/api/aoe4-build-order/builds` URL (the loader test "requests `/api/aoe4-build-order/builds/<id>`"). The criterion `git grep -n "/api/aoe4-build-order/builds" -- components pages/apps` must find matches only in `saved-build-loader.ts` and `save-build-client.ts`, so it fails on the test files. An implementer must either break the criterion or drop the URL assertions. The `from 'next|from 'react` grep is limited to the two source files and is fine.
   Fix: say "in non-test files" and use `':!*.test.ts'` on the `/api/aoe4-build-order/builds` and `navigator.clipboard` greps. Alternatively list the two test files as allowed matches.

2. **Scope item 8 (URL baseline) - the mechanism for "the interim render must not count as a change" is left to the implementer.**
   The ticket says the render between the load ending and the controller releasing still shows the default input as settled, and that this must not drop `b`. But the baseline after a load is the loaded input, and settled equals the default for that one render, so the literal rule "first differs from the baseline" fires. A bare comparison drops `b`, which the "save, copy, open in a fresh context" criterion catches only after the work is built. Specify one rule, for example: the page compares only once the status is not `loading` after the load ended, or the check arms after settled has first equaled the baseline (the default build's input for the failed-load case, which equals settled from the start).
   Also state what happens when the settled input changes while a save is in flight. `onSaved` would set `b` and the baseline to the saved input, while settled already differs. Suggested rule: a response whose input differs from the current settled input shows no panel and does not call `replace`. Otherwise the URL claims a link for content the page no longer shows (OD-5 (a)). This is an edge case with a stated default, so it can be a one-line addition.

## Passed checks

- Grounded scope: `build-input.tsx`, `pin-name.ts` (`pinName`), `build-text-editor.tsx`, `step-table.tsx`, `pages/apps/aoe4-build-order.tsx`, `acceptance/helpers.ts` and `docs/aoe4-build-order.md` exist. `PrebuiltBuild` is in `build-input.tsx`. Docs lines 816 (select holds prebuilt builds) and 823 ("a reload starts on Build") exist, so the Docs grep targets are real. New files are marked new. `SAVED_NAME_MAX_CHARS`, `isSavedBuildId`, `SaveBuildResponse`, `savedBuildPath`, and the SGS-103 helpers (`BUILDS_PATH`, `buildPath`, `postBuild`, `uniqueClient`) match the dependency tickets. `useAutoRun` args and `hold`/`release` match SGS-102.
- Contracts: `savedBuildName` rules and samples match design C6 verbatim, including the 91 + 9 arithmetic. The `saveFailureMessage` cases follow design C6 (wording is left to the ticket there). The `?b=` and Save rows match design.
- Browser-safety of the imports: SGS-099 states `saved-builds.ts` uses Web Crypto and has no `node:` imports. SGS-103 moves `englishCatalog` to a server-only file.
- Open questions: none; designer answers are folded in.
- Invariants S1, S3, A3 named, with no contradiction.
- Diagram present (the hold gate state machine). Dependencies stated. LOC ~205 is under 400.
- Stale-number check: no match counts or line numbers. The bundle string has a replacement rule. The 40% and 390 px values are design constants.
- Lessons: layout checks read all rects in one `page.evaluate` - the layout criterion does this.
- On merge: none is correct (no new factory command or CONTEXT.md Decisions, which is "None").
- Input validation: the page trusts nothing new at a boundary except the GET body, and it goes through `savedBuildSchema.safeParse`. The POST body is validated server-side by SGS-103. OK.
- Docs: in Scope with the stale-sentence greps, and ARCHITECTURE.md is checked by grep first.

## Notes (non-blocking)

- Risk: `standard` is defensible (~205 LOC, under the 250 trigger). The `hold`/release ordering and the URL baseline are order-of-operations logic adjacent to A3, but they decide which request fires, not what a run computes. If the owner reads strongModelTriggers item 2 broadly, `high`. SGS-102, which owns the controller, is already `high`.
- Item 4's `conversion` prop is "the settled conversion", but its type may be `ok | not ok`. Say that Save reads `conversion.order` only when `status === 'current'` (type narrowing), so no cast is needed.
- The existing-tests rule is stated only as an acceptance criterion ("keeps its expected value; the report lists each test edited"). Consider restating it in Scope in one line. Existing narrow-layout and run-bar height specs (`acceptance/aoe4-narrow-layout.spec.ts`) are the likeliest to be touched by the new Save button.
- Parallel work with SGS-104 on the same page areas is acknowledged, with a rebase rule. No action.
