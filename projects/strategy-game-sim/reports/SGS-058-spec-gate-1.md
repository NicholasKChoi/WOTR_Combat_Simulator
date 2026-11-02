# SGS-058 spec gate 1

Verdict: READY

Checked against origin/main d5c2549. All 12 checks pass.

- Grounded: data.ts types (Snapshot, SnapshotSource, SnapshotEntry, SnapshotEffect, GatherNodeRules, BaseRules, CivData), model.ts (HandValue, OverlayEffect, GATHER_NODES, RESOURCE_KINDS) and the three JSON files exist. data.test.ts has exactly the 4 lines the removal grep expects (40-hex, startsWith('http'), typeof value.unverified, typeof value.source). zod is absent on main and is added by SGS-057, which is the stated dependency.
- Shipped data conforms: a script over english.json found zero entries that break the described shape (types, cost fields, effect and select shapes), so the success-parse criterion is satisfiable without data edits.
- Open questions: none. Contracts match design M4 C2 and the module table. Risk low is consistent: no strongModelTrigger or criticalPath applies (test-only module).
- Docs: grep claim of no doc naming data.test.ts is plausible; no stale doc.

Notes (non-blocking)
1. Defect list does not say which schema each hand-value defect (empty source, missing unverified, string value) runs against; implementer picks (e.g. base file for sheep.rate, civ file for the others). Could name one schema per defect.
2. The criterion 2 grep prints the `./model` value import by design; the ticket states the exception, but a reviewer must apply it by hand.
3. SGS-056 lists 6 strict-null errors in data.test.ts, so this ticket's data.test.ts edits will rebase over 056 changes; Scope already says line numbers are only locators.
