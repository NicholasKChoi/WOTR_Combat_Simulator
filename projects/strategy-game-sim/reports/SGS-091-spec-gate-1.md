# SGS-091 spec gate 1

Verdict: NEEDS_SPEC (checked against b9481e3). Risk tier `standard` confirmed.

## Gaps
1. Scope 1 - the list of echo sites is incomplete while the lead sentence says "every place". Unlisted sites that echo user text in schema.ts: `nodeRefIssue` deposit reasons ("deposit 1 is written gold", "deposit number is outside 2..N"), `triggerKindCheck` (`unknown trigger kind "${kind}"`), `stepProblem` (`unknown action "${action}"`). A 900,000-char action or trigger kind would still give a huge message. The implementer must guess whether to cut them. Fix: add them to the list (or name them as deliberately left, with a backlog item), and add table rows in the AC.
2. AC 58 - it points at "the existing ordering test in simulate-depletion.test.ts or simulate-house-warnings.test.ts named in the report". On b9481e3 no simulate-level test pins node, farm-idle, step-stuck and auto-house order at one instant (grep found none; only the unit-level `sortWarnings` table in depletion.test.ts). The criterion rests on a test that may not exist. Fix: either require a new simulateBuildOrder-level test (name the file) with a build that produces those warnings at one instant, or restate the AC as "removing the sort inside depletionResults leaves simulateBuildOrder warnings identical", checked by the new test.
3. Scope 5 - "the implementer lists each test edited" is acceptable as a rule, but name the known candidates so the rule is checkable: `depletion.test.ts` "returns its warnings sorted by at" (about line 192) and the multi-warning `toEqual`/`toMatchObject` cases near 152 and 197. The "sorted by at" test should be deleted or moved to simulate level, not wrapped.
4. Invariants field - says "none adjacent", but scope 5 touches the order that A3 (deterministic timings) results depend on, and scope 1 and AC 54 touch the S3 oversized-input bound. Name A3 and S3 so the reviewer checks them.
5. Header - "Verified against main at cc9bb04"; base is now b9481e3. Line 1034-1036 of simulate.ts also merges `farmIdleWarnings`, which Scope 5 does not mention. Update the source note; harmless otherwise.

## Checked and fine
- Files and symbols exist: `nodeRefIssue`, `knownId`, `knownResource`, `orderSchema`, `buildOrderSchema`, `checkBuildOrder`, `VILLAGER_ID`, `RESOURCE_KINDS` (model.ts), `RESOURCE_ORDER`, handler `in` tests, `depletionResults`, `formatTrigger`/`formatMinSec`, narrow-layout spec (`toContainText(id)`), API checks spec (900000 test).
- Both `checkBuildOrder` and `checkSimInputs` return an `ok` discriminant, so scope 4 is grounded.
- Rounding rows are right: formatMinSec uses Math.round; 65.4 -> 1:05, 65.5 -> 1:06, 59.6 -> 1:00.
- No open questions; no LESSONS entry hit (the narrow-layout change keeps the existing single-evaluate scroll check); no contracts introduced; no dependencies; size is well under 400; no diagram trigger; On merge none is right. The docs line (docs/aoe4-build-order.md line 523) is in scope; openapi.json has no repeat-the-id text.
- Input validation: no new fields.

## Risk
`standard` is right. No criticalPaths symbol changes behavior (`depletionResults` and the handler are not listed; `simulateBuildOrder` is untouched). strongModelTriggers: the message text change affects only ids over 40 characters, so it is not a contract callers depend on. Owner could argue trigger 3 (API response) makes it high; I do not.

## Notes
- AC 56 `git grep "'villager'"` is fine, but gather.ts must still import VILLAGER_ID without a cycle; engine-common is already imported elsewhere.
- AC 52 "one row per message kind" is a rule, good.
