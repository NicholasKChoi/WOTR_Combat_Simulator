# SGS-156 spec gate 3

Verdict: READY

Read at origin/main (e50e074, unchanged since gate 2). `git fetch origin` printed `failed to run reflog` / `task 'gc' failed` (sandbox); refs were fine.

## Gate-2 gap and note: closed

1. Permanent builder shortage (owner, Q92 A): Scope 2 and Scope 6 now release the hold when total villagers (gathering, walking, building; not idle) number fewer than `houseBuilders`, with the house not started either. They say the hold stays in every other case. A new criterion covers both sides: fewer villagers means the hold is not applied, and at least `houseBuilders` villagers all busy means the hold stays. Closed. The villager count is observable from engine state: `gatherers`, `walking` (builders count in `walking`, simulate.ts around line 459) and `idle` exist, and a helper at simulate.ts line 156 already sums `gatherers + idle + walking`. The implementer can build the count from these, excluding `idle`.
2. Docs note: Scope 7 now names the builder paragraph ("A house waits only when ... supply may block production meanwhile") and the headroom sentence ("finishes within the lead counts ... exactly at the lead"). The last criterion requires every lead-window statement to match lead plus gather time. I confirmed both passages exist in `docs/aoe4-build-order.md` (lines 310-333). Closed.

## Other checks

- Gates 1 and 2 results carry over, since the rest of the ticket is unchanged. The named functions, tests and docs sections exist.
- No conflict between Scope 2's builder-hold decision (re-spec 1) and the release (re-spec 3). Scope 2 and 6 state the release as the one exception to "no release for lack of builders".
- Criteria are testable. None pins a stale count or quotes an internal name as behavior. Names such as `planAutoHouse` and `HouseDemand` appear in Scope and not in the criteria.
- Risk `high` is right (`runInstant`, `orderNeed` and `nextWake` behavior change). Invariants A2 and A3 are named and not contradicted. Open questions are none. On merge is `none`, and Unverified assumptions `none` is fine for a pure engine. No input crosses a trust boundary. Size is about 220 LOC. The diagram matches Scope 3.

## Notes (non-blocking)

- Idle villagers at a farm with no free farm do not count toward the release threshold, per the owner answer. One could later be put on a new farm and gather, so in a rare setup the hold releases and then returns. A3 holds (deterministic), and the ticket says there is no hysteresis. No change needed.
- The release is re-evaluated only at the three house passes and the existing wakes. If villagers fall below `houseBuilders` mid-instant, the hold changes at the next pass. This is consistent with Scope 5.
