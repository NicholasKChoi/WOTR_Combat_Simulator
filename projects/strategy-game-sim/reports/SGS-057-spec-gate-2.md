# SGS-057 spec gate 2

Verdict: NEEDS_SPEC (one small gap, same class as gate-1 gap 1)

Checked against origin/main. Gate-1 gaps 2 (trigger cases now JSON in schema.test.ts, `soon` no suggestion, `tme` suggests `time`) and 3 (`names` = lowest-age entry, consistent with sortedByAge) are closed. Gap 1 is mostly closed but incomplete (below).

## Gaps

1. Scope 2 / Scope 5 / criterion 2 - the shared-helper list omits two types the shared helpers depend on. `issue(code, where: Where, text)` takes the interface `Where` (validate.ts line 86) and `isRecord` returns `value is Fields` (`type Fields`, line 84). `Where` is also used by `stepWhere` and OrderChecker (lines 115, 268-374) and `Fields` by OrderChecker and the moved resolve* code (lines 314-337, 421-484). Both stay needed in both files, and neither is in the "exactly" list, so the implementer must either export extra names (breaking the stated exact list and the criterion 2 check), duplicate them (jscpd threshold 0), or guess. Fix: add the type exports `Where` and `Fields` to the Scope 2 list and the criterion 2 list (say type exports are included in "exactly"), and say validate.ts imports them with `import type`. Not owner-only.

## Verified

- Grounded: validate.ts (533 lines) names and lines 15-52, 128, 140, 417-533; the five-name grep prints 5 lines in validate.ts today (`INPUT_DEFAULTS` is a non-exported `const`, still matches); `StepOptions` fixtures in step-table-model.test.ts via stepOptions; contract spec `optional` map line 122 and `buildOrderIssue` record line 490; `BuildOrderIssue` in model.ts line 185; parse-text.ts exists and imports no `./data` value.
- Contracts: C2, C3, C4a names and signatures match design/M4.md and row 2a; Depends-on SGS-056 consistent with the strictNullChecks decision. Design row 2a lists fewer helper names than the ticket (no `issue` etc.); the ticket's wider list is the right one, update the design note when fixing.
- Open questions: none in the ticket or CONTEXT.md; decisions agree (strictNullChecks, z.ZodType<T> against model.ts).
- Invariants S3/A1/A3 named and not contradicted. Risk high is justified (public OpenAPI schema change, over 250 lines). Size over 400 is justified by design row 2a and stated.
- Diagrams: none required. Lessons: both LESSONS.md files are empty. On merge names CONTEXT Key surfaces and schemaLibrary. Docs: docs and README correctly deferred to SGS-075 (BuildOrderIssue.suggestion lives in openapi.json, which is in scope).
- Rule for existing tests is stated (no expectation changes; import-path edits only; implementer lists edits).

## Notes

- Criterion 2's grep `^import [^t].*` would also skip any `import type` form correctly; fine, but a `import { type X }` from `./data` would slip through, an unlikely route.
- Add `names` tie rule (equal lowest age with different names) is not specified; harmless since data has one entry per age.
