# SGS-122 spec gate, round 2 (after re-spec 1)

**Verdict: READY**

## Checked
- Fetched origin. Read `design/M8.md` C1, C4 and C4a against the ticket: signatures, status tables, message mapping and `namedBuildBodySchema` all match. C4 says only "validates against the NamedBuild shape", so the ticket's explicit strip-mode ruling adds to the design and does not contradict it. C1 GET row 6 (no `secretHash` in the body) is cited accurately.
- Re-spec fix: Scope now states default strip mode and its tradeoff, and the `loadNamedBuild` criterion pins `ok` with no `secretHash` key via `toStrictEqual`. Scope and criterion agree. The criterion also names a mutation (`.passthrough()`) that fails it, so it can fail for a real reason.
- Branch `sgs-122-named-build-client` (local): `named-build-client.ts` declares `namedBuildBodySchema` as in Scope (non-strict), the failure mapping is written once, and the create and update checks are module-local. `build-fetch.ts` and `fetch-test-helpers.ts` exist. SGS-119 branch is local and holds the C1 names.
- Round-1 conclusions still hold: grounded scope, observable criteria, no stale pinned counts, no open questions, Invariants `none`, `On merge: none`, Risk `standard`, size about 120 lines, no diagram trigger, no doc to update, no trust-boundary input over the threshold.
- `fetch-test-helpers.ts` is in Scope and in criterion 2, with the reason (jscpd at threshold 0), and a "no production import" rule.

## Gaps
None.

## Notes (non-blocking)
1. Carried from round 1: the `loadSavedBuild` criterion does not list the request URL and signal case as kept; add it so `/builds/<id>` stays pinned.
2. The "module-local check" strictness (revision equals 1 for create, integer for update) is still unstated; the branch uses exactly that and no criterion contradicts it.
3. `design/M8.md` Layouts and the M8.1 shared-code row do not list `fetch-test-helpers.ts`. The ticket is the authority; the designer may add it when next touching the design.
