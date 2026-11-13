# SGS-154 spec gate 6

Verdict: NEEDS_SPEC (one wording gap, item 6(b)). Risk `low` stays correct.

Method: `git fetch origin`; origin/main is still 41b3ed3 (unchanged since gates 4 and 5, so gate 4/5 probe results for items 1, 3 to 5, 6a, 6c, 7 still apply). I ran throwaway vitest probes (engine `run` from `lib/aoe4-build-order/test-helpers.ts`, as gate 5 did) in a detached worktree, now removed, for the items below.

## Gaps

1. Item 6(b) - Scope says "There is exactly one warning", but the run at base has 3 warnings in `result.warnings` (probe: `all 3` at every walk and horizon); only one of them is the berry `idle-arrival`. Read literally, an implementer asserts `warnings.length === 1` and the test fails, or guesses that the other two are bugs. The acceptance criterion (Item 6) already says "exactly one berry `idle-arrival` warning". Fix: reword the Scope sentence to "There is exactly one `idle-arrival` warning for berry" and do not assert on the total warning count.

## Verified at origin/main (pinned inputs)

- Item 6(b), count 2, start sheep 6 rally sheep, `autoHouses: false`, `nodeAmounts: { berry: 0 }`, at horizons 1200 and 3600 and `walkSeconds` 0, 1, 5, 10, 30, 100: exactly one berry `idle-arrival`, `at` = 20 + walkSeconds (above 0 even at walk 0), `idleVillagers` 3, villager series last count 3. So the precondition (last count at least 2) holds, `idleVillagers` is between 2 and 3, and the free `walkSeconds` does not break the rule.
- Item 2, every research step of `english-1tc.json` (horticulture, double-broadax, steeled-arrow, iron-undermesh), so the free choice of research step is safe: with before-horizon = ceil(completedAt) - 1 (at or after startedAt in all four; the shortest research lasts 45 s) the step is `in-progress` and no marker has the tech as label; at ceil(completedAt) it is `completed` and a marker with that label exists; every marker `at` is at most the horizon in both runs.
- Item 3, `english-knight-longbow.json` at 1800: exactly two longbowman series (tiers 2 and 3); `veteran-longbowmen` completes at 843.16; lower series 20 at the last sample before and 0 at every sample from completion on; upper series 0 before and 20 at the first sample at or after; the per-sample sum never decreases; its last value 72 equals the upper tier's last count.
- Carried from gate 5 at the same SHA (not re-run): item 1 (x3 order), 6(a) (stock 601), 6(c) (stocks 100 and 300), 7, at 1200 and 3600; items 4 and 5 from gate 4.

## Free inputs left

- None that break a rule over a plausible range. Item 6(b)'s `walkSeconds` ("small") was probed from 0 to 100 and holds; the horizon is free for 6(a), 6(c), 6(b) and holds at 1200 and 3600.

## Notes

- Item 2 says "for example `horticulture`"; fine as is since all four research steps pass. horticulture and double-broadax share a completion instant, which does not matter to the rule.
