# SGS-176 spec gate 2

**Verdict: READY**

All gate-1 gaps are closed by the respec:
- Criterion 1 now carries the two exemptions (re-exports, symbols whose adjacent comment already states the job) and a verification recipe.
- Criterion 3 allows edits or removals of comment lines above exports only, with no code line changed.
- The file set is a rule, with the three test-support modules named as out of scope.
- Multi-name statements and overload groups have a stated rule.
- Counts are labeled snapshots.
- The INVARIANTS criterion is gone.
- Criterion 2 requires quoted headings to exist verbatim in the docs.

## Checked at origin/main
- `lib/` holds only `combat-simulator/` and `aoe4-build-order/`, so the Scope directories match the `lib/**/*.ts` file set. There is no `export default` and no `export *`.
- The files named in Scope exist, and `docs/combat-simulator.md` and `docs/aoe4-build-order.md` exist.
- No `SGS-` or `INVARIANT` text sits in `lib/` today.
- The size is about 280 one-line comments, which is under the ~400-line limit. There is no business logic.
- Risk `low` holds: comments only, no behavior change.
- Unverified assumptions `none`, On merge `none`, Open questions `none` and Depends on `none` are consistent.
- No doc, diagram or input-validation work is triggered.

## Notes (non-blocking)
- Context says `parse-text.ts` and `named-builds-routes.ts` have "many exports". At the base they have 4 and 2. It is labeled a snapshot and affects no criterion, so the implementer should rely on the search rule and not on the Context.
- The file-count criterion check does not catch a comment that cites the wrong section. Review judges criterion 2 by reading.
