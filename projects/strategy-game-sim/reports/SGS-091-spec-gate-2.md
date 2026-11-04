# SGS-091 spec gate 2

Verdict: READY (checked against origin/main b9481e3). Risk tier `standard` confirmed.

All five gate-1 gaps are closed.
1. Scope 1 now lists every echo site in schema.ts (nodeRefIssue reasons at lines 127-139, knownId 311, knownResource 320, triggerKindCheck 329, stepProblem 361, civ 516, unknownNode 634, influenceCoverage 649). My grep of schema.ts found no other site that quotes a user string. Line 307 echoes a catalog-validated id, and the ticket leaves it.
2. AC 65 requires a new simulate-level test with named inputs. The `PAUSE` and `run` helpers exist in simulate-depletion.test.ts, and a mutation check is given.
3. Scope 5 names the test to delete (`depletion.test.ts` "returns its warnings sorted by at", line 192). The `sortWarnings` describe at line 205 stays. depletion.ts line 174 is the only extra sort, and simulate.ts line 1036 keeps the one that remains.
4. Invariants names A3 and S3.
5. The source note and `farmIdleWarnings` are corrected.

Other checks:
- Scope 3 and 4 targets still exist: `'villager'` in gather.ts line 6, `RESOURCE_ORDER` in result-series.ts, and the handler `in` tests.
- The acceptance specs exist: `toContainText(id)` at narrow-layout line 74 and the 900000 test at api-checks line 127.
- No open questions. No contracts are introduced. Size is about 70 LOC. The ticket correctly needs no diagram and no On merge entry.
- Docs: Scope 7 covers `docs/aoe4-build-order.md`. My grep of docs/aoe4-build-order.md and docs/api/openapi.json found no "repeats the whole id" text, and Scope 7 still tells the implementer to grep.
- Input validation: no new fields.
- ACs hold in the end state. No stale counts are pinned; the only pinned numbers are the 40-character limit and the 65.4/65.5/59.6 rounding rows, which are design inputs.
- Existing-test rule: Scope 5 states the rule (delete tests asserting depletionResults time order) and names the one known case as a checked example, which is fine.

Risk: standard. No criticalPaths symbol changes behavior. The message change affects only ids over 40 characters.

Notes (non-blocking):
- gather.ts must import VILLAGER_ID from engine-common without creating an import cycle. Run tsc and lint:dup.
- AC 60 asserts "under 200 characters". That is a bound from the design, not a stale number.
