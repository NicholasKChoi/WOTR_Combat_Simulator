# SGS-178 spec gate 1

**Verdict: READY**

Checked at origin/main (after git fetch):
- `lib/aoe4-build-order/named-builds.ts` line 7 is `export const NAMED_BUILD_VERSION = 1;` with the one-line doc comment on line 6 ("The format version of a named build."). Scope matches.
- `git grep -i -E "named.?build.?version"` over origin/main finds only that definition. The ticket's claim holds.
- Criteria are testable: the typecheck proves no reference remains, existing tests are covered by the "unchanged and pass" rule (no list of tests), and the diff scope is stated as behavior. No search over code is used as a criterion.
- No design contracts, open questions, dependencies, or docs are affected. Risk low is correct (not in criticalPaths or strongModelTriggers). On merge `none` is correctly formed. Unverified assumptions `none` is right (no external service).
- Invariants: A1 to A3 match the path only, and none concerns this constant. "none" is acceptable.
- No overlapping open ticket was found in the checks made (a constant removal in a file that the ticket does not otherwise edit).

## Gaps
None.

## Notes
- The ticket says to delete the BACKLOG bullet's source only implicitly. The manager may remove the "`NAMED_BUILD_VERSION` unreferenced" bullet from BACKLOG.md when the ticket merges.
