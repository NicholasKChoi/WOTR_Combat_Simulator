# SGS-081 spec-gate 5

Verdict: READY.

## Spec-gate 4 gaps
1. Floors home: RESOLVED. New `lib/aoe4-build-order/production-floors.ts` (constants only, no vitest/Playwright import) exports PRODUCTION_FLOORS and MAX_FLOATING_AT_1200; builds.test.ts and the prebuilt-farms spec import it; `test-helpers.ts` stays untouched; the file is named in the `git diff --stat` allowed list and in the first criterion (grep for "production-floors" lists two files). The module does not exist yet at 2fc9593 (expected, it is new).
2. 1TC frozen steps: RESOLVED. Checked the file at 2fc9593: 25 steps, [22] research steeled-arrow time 420, [23] research iron-undermesh with no trigger, [24] depleted gold move all gold -> gold#2 reaction, and it is the first reaction (findIndex = 24). Ticket now matches exactly. Frozen set is slice(0,24); gold reaction keeps content, not position; added non-reaction steps go before it, added reactions after; each added step needs time >= 420 or is a reaction. The criterion is a script-checkable deep-equal.
3. Floor-reasoning prose: RESOLVED. The Scope 2 table is declared authoritative and the implementer must not recompute from the prose; the prose is trimmed to the food derivation (which checked out in gate 4) and measured 2fc9593/main values.

## New ambiguity from re-spec 7
None blocking. Checked: `sampleIndex` and `countAt` are exported from test-helpers.ts; `simulateTo` exists in builds.test.ts; MAX_SPEAR_LONGBOW_STEPS currently has 2 hits in acceptance (matches criterion); the 1TC "first reaction" case needs no edit; Scope 3 covers specs indexing from `english1tc.steps.length`. Risk (standard), invariants, deps, docs, README and zod/schemaLibrary (no new boundary input) are all fine; no open questions.

## Notes (non-blocking)
- Index 23 (iron-undermesh) is untriggered, so added post-guide steps with a time trigger of 420 s or later may be reached while 23 is still waiting on resources; the implementer finds this when simulating, and the existing "no step waiting" bar will catch it.
- The `lint:dup` bar applies to the new floors case and the API spec; the ticket already says to loop over the row.
- Implementer escape hatch (report needs_spec if a floor is unreachable) is clear.
