# SGS-061 spec gate 3 (re-gate after re-spec 4)

Verdict: READY

Base checked: origin/main f11e0c5.

## Verified
- Grep today (`\btext *[:,}]` over `acceptance/aoe4-simulate-api*.spec.ts`) = 24: api 6 (103,104,105,149,160,264), contract 5 (277,278,400,438,446), edges 3 (142,144,204), waits 2 (28,248), checks 5 (29,140,141,142,147), issue-shape 3 (29,44,47). Matches the ticket.
- End state = 16, consistent with Scope 5:
  - api 8: four syntaxCases rows (text alone, text null beside buildOrder, 42, ''), two-issue case, valid-buildOrder-beside-text, 20,001 `{ text }`, 1 MB 413 test. The 20,000-accepted test (line 160) is deleted. The raw `'{"text":'` string does not match the grep.
  - contract 3: removedText error request, schema-invalid text request, `both text and buildOrder` request. pastedStep/pasteSyntax (277/278) go, and the type map line 446 loses `text: true`.
  - edges 3: `text null alone`, `a numeric text`, the 900,000-character test. All kept; no conflict with the "neither-key" rewrite (that test uses `{}`, not in the grep).
  - waits 2 unedited (parameter and call).
  - checks 0: line 29 converts to a JSON buildOrder; 140-142 and 147 are deleted.
  - issue-shape 0: line 29 converts; 44 and 47 are deleted.
  - 8+3+3+2 = 16. No keep, convert or delete decision contradicts another.
- Version assertion: `expect(spec.info.version).toBe('1.0.0')` is in the test titled "suggestion is an optional string property and the document version is unchanged" (issue-shape, line ~16). The ticket's title and the new '2.0.0' value are correct.
- Deleted checks test "a 20001-character text still reports its inputs issues after the text issue" (line 146-152) expected [out-of-range(text), out-of-range(inputs.durationSeconds)], i.e. order issue then inputs issue. The new api.spec two-issue case asserts [removed-text, inputs.durationSeconds out-of-range] in order, so the order is covered.
- Other facts hold on origin/main: OpenAPI `SimulateRequest` today `[null,null,true,[buildOrder,inputs,text]]`; 11 matching strings; 6 hits for the `exactly one of|text: null|send exactly` grep; the 20000 accepted / 20001 cases exist in `text-to-build.test.ts`.

## Notes (non-blocking)
- checks.spec: the converted pasted-`knigt` case (post one step naming knigt, assert step/suggestion) near-duplicates the next test, "a JSON unknown unit carries the nearest unit as a suggestion on its step". The test rule is to write each test once. Consider deleting the pasted case instead of converting it, or keep it with a distinct step index and an exact `toEqual` that proves no `line` key. The grep end state is unchanged either way.
- edges `request shape` row titles say "a single syntax issue" but the loop only asserts `issues[0].code` and no `line`. The rows are kept as is and the scope says only that; harmless.
