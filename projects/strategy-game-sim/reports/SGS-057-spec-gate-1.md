# SGS-057 spec gate 1

Verdict: NEEDS_SPEC

Checked against origin/main. Grounded: validate.ts names/lines, step-options.ts, parse-text.ts, contract spec lines 122/490, step-table-model.test.ts use stepOptions(ENGLISH). Open questions none, invariants S3/A1/A3 fine, contracts match design C2/C3/C4a, risk high is consistent, docs deferral to SGS-075 is stated.

## Gaps

1. Scope 2 vs Scope 5 - "exports exactly the C2 list (plus nodeRefIssue, NodeRefProblem)" conflicts with "a helper both files need lives only in schema.ts". validate.ts's OrderChecker uses `issue`, `outOfRange`, `isRecord`, `BoundKey`/`isBoundKey` (all built on SIM_INPUT_BOUNDS) and the moved code uses the same; the implementer must either export extra names (violating "exactly", and the criterion 2 export check) or duplicate them (jscpd threshold 0 fails). Fix: name which shared helpers schema.ts exports (e.g. `outOfRange`, `isRecord`, `BoundKey`) and say the "exactly" list is C2 plus those and the two moved names, or say validate.ts keeps its own copies of non-moved helpers and list them as an allowed jscpd exception.
2. Acceptance criterion 6 (`trigger kind soon`) - the paste grammar cannot produce an unknown trigger kind (parse-text.ts builds only time, villagers, depleted, bank), so "textToBuildOrder of a paste with trigger kind soon" is untestable and the implementer would guess. Also "suggestion or none" is not a testable outcome: nearestId("soon", [time, villagers, depleted, bank]) has distance over max(1, floor(4/3)) = 1, so the result is no suggestion. Fix: move the case to `schema.test.ts` as JSON `{kind: "soon"}` asserting `unknown-trigger-kind` and no `suggestion`, and add a case with a near miss (e.g. `"tme"` suggests `time`). Same for Scope 3's "every case that can be written as paste" (fine) but the criterion must name the JSON location.
3. Scope 4 `names` - `byBaseId` maps a baseId to several age-tier entries whose `name` can differ; "the entry's display name" does not say which. Fix: state it (e.g. the lowest-age entry of the matching type, consistent with `sortedByAge`) and what the knight test expects.

## Notes

- Scope 5's `TRIP_FIELDS`-only-used-by-moved-code is right (used by resolveTrips); `inputIssue`, `readNumber`, `readRecord`, `resolveTrips`, `resolveNodeAmounts`, `resolveInfluence` also move; the LOC estimate (-150) may undercount deletions (lines 338-533 of validate.ts).
- Criterion 3's grep: after the change `NodeRefProblem` must stay an `interface` declaration in schema.ts or the "5 lines" count breaks (C2 writes it as `export { type NodeRefProblem }`); say so.
- Criterion 5 "with `lines`" is fine; consider also asserting `lines` absent on parse-failure.
