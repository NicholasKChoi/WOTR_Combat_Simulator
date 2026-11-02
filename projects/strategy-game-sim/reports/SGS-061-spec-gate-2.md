# SGS-061 spec gate 2

Verdict: NEEDS_SPEC (three small gaps, none needs the owner)

Checked against origin/main f11e0c5 (read via git in /home/choin/git/WOTR_Combat_Simulator).

## Verified
- Route `pages/api/aoe4-build-order/simulate.ts` still has the SGS-075 temporary `text` branch: `checkOrder` rejects both/neither (`request: send exactly one of text and buildOrder`), `text: must be a string`, and calls `textToBuildOrder`. It imports `checkBuildOrder`, `checkSimInputs`, `buildOrderCatalog`, `MAX_REPORTED_ISSUES`. It does not import `SIM_INPUT_BOUNDS` (the "if only the text cap used it" clause is moot).
- `api.ts` has `text?: string; buildOrder?: BuildOrder`.
- Page `pages/apps/aoe4-build-order.tsx` posts `{ buildOrder: converted.order, inputs }`, no `text` (SGS-059 done). No other non-test caller of the route.
- `git grep -nE "\btext *[:,}]" 'acceptance/aoe4-simulate-api*.spec.ts'` = 24 lines (api 6, contract 5, edges 3, waits 2, checks 5, issue-shape 3). Every named line/test exists with the stated content (knigt paste cases, 20001/20000 cases, 900,000 test, 1 MB test, contract pastedStep/pasteSyntax/exactlyOne, `text: true` map, maxLength test, both-text test).
- OpenAPI: info.version `1.0.0`; SimulateRequest `[null,null,true,["buildOrder","inputs","text"]]` with oneOf text/buildOrder; 11 stale strings (jq count 11); request examples `buildOrder,text`; 400 examples `exactlyOne,notAnObject,pasteSyntax,pastedStep,stepAndInputs`; `line` description says "pasted text"; SimulateError.issues says "(text or buildOrder)". All match.
- `git grep -nE "exactly one of|text: null|send exactly"` = 6 hits (docs 665, 669; openapi 191, 622, 626, 1031), as the ticket says.
- Docs: Route section, Issues paragraph, the `text / steps` table row (line 55), "apply to JSON and paste input alike" (line 51) and the data-flow diagram all exist and are untrue after the change (the diagram still routes `parse -->|order + lines| validate`).
- Names match design and dependencies; invariants S3/A3 consistent; risk high correct; diagram present; no open questions.

## Gaps
1. Scope 5 / issue-shape - `acceptance/aoe4-simulate-api-issue-shape.spec.ts:16` asserts `expect(spec.info.version).toBe('1.0.0')` in test "suggestion is an optional string property and the document version is unchanged". The 2.0.0 bump breaks it and it is not a `text` line, so Scope 5 never names it; the title would also become false. An implementer finds it only when acceptance fails, then guesses the title. Fix: add to Scope 5 for that file: expect `'2.0.0'` and rename the title to drop "the document version is unchanged" (for example "... and the document version is 2.0.0").
2. Acceptance criterion 10 (the `text` grep) - end state is stated wrongly. "The remaining hits are only those tests [removedText cases and the 1 MB test]" is false: Scope keeps `aoe4-simulate-api-waits.spec.ts` unedited (2 hits: the `text: string` parameter and the `simulate(request, text, ...)` call), and keeps the edges rows `text null alone` / `a numeric text`. Fix: rewrite to "after this ticket the remaining hits are: the removedText and text-rejection tests of Scope 5, the 1 MB 413 test, the edges `request shape` rows, and the 2 non-body lines in `waits`; no request body sending `text` expects a 200; none in `checks` or `issue-shape`", or give the expected count.
3. Scope 5 / checks - the fifth `text` line in `acceptance/aoe4-simulate-api-checks.spec.ts` (line 147, test "a 20001-character text still reports its inputs issues after the text issue", `text` plus `inputs.durationSeconds: 59`) is not named; the ticket lists "the 20001 and 20000 text-length cases" and the 5 lines are knigt (29), 140-142 (one test) and 147 (second test). Say explicitly this second test is deleted too (its removed-`text`-then-inputs order is covered by the new two-issue case in `aoe4-simulate-api.spec.ts`), or the implementer may convert it.

## Notes (non-blocking)
- Docs line references are stale: ticket says Route section line 626, Issues 564, diagram 612 "on origin/main"; on f11e0c5 they are 662, 584 and about 645 (the table row 55 is right). Replace with section names (`## Route`, `**Issues.**`, the mermaid block under it); the ticket already says to find by name.
- The Context claim "SGS-075, SGS-057, SGS-059/060 merged" holds; "Line numbers are from origin/main d5c2549" in Scope is outdated (now f11e0c5), same remedy.
- Docs "Page" section (line 891, "each names its line or step") stays true because the page conversion still sets `line`; no change needed.
