# SGS-089 spec gate 1

Verdict: NEEDS_SPEC. Risk `high` confirmed (edits in `simulate.ts`, a criticalPaths file; high is the safe tier even though no listed symbol changes, and the owner instructed it).

Checked against origin/main b9481e3 (local `main` is stale at ee7ecb9; the ticket says it was verified on cc9bb04).

## Gaps

1. Scope, `productionSeconds` - "`startHead` is the only caller, so the check fires when production starts, never for a unit that is merely queued" is false. `houseDemand` (b9481e3 `simulate.ts` ~line 626) also calls `productionSeconds` for every instance with an order and `remaining !== 0`, whether or not the unit has started. It runs on the auto-house path (`planAutoHouse(..., houseDemand(engine))`). An implementer who puts the throw in `productionSeconds` as written makes a bad time throw from `houseDemand` too, so a zero-time unit that is only ordered now throws earlier than the ticket says. A time of 0 today yields `Infinity` population per second and no throw. Proposed fix: state which behavior is wanted. Either (a) the guard stays in `productionSeconds` and the ticket says it also fires from `houseDemand` whenever an order exists and `autoHouses` is on, with the sentence about queued units removed; or (b) the guard moves into `startHead`, with `houseDemand` guarded against dividing by a non-positive time. Add a test row for the `houseDemand` path (`autoHouses` true and false) so the error and the no-hang behavior hold in both.
2. Acceptance criteria (hang row) - the "does not hang" criterion depends on the previous gap. With the default `autoHouses`, the first throw may come from `houseDemand`, not `startHead`. Say which entry point the test uses so it can fail for a real reason. Proposed fix: run the `time: 0` row with `autoHouses` both true and false.
3. Scope, stale base facts (non-blocking, but the implementer will notice) - `simulate.ts` changed by about 80 lines between cc9bb04/ee7ecb9 and b9481e3. The ticket cites no line numbers, but the Source line says "verified against main cc9bb04". Re-verify on b9481e3. I confirmed `at.rally!`, the `produce` handler population return without a reserve, and the doc sentence on rally still exist.

## Checks that pass

- Grounded scope: `productionSeconds`, `spawnUnit`, `withHandler` (`test-helpers.ts`), the supply-wait test (`simulate.test.ts` line 491), the rally sentence (`docs/aoe4-build-order.md` line ~275), and the CivRules table all exist. The `productionSpeed` test at line 649 shows the editGameData effect helper exists, so the "if a helper exists" hedge can be dropped: push `productionSpeed` with `multiply` 0.
- Open questions: the one `designer` item is edge behavior (API handling of a thrown Error), and the ticket says what to do meanwhile. OK.
- Invariants A1, A2, A3 are named and not contradicted. A3 is checked by the `cmp` of shipped builds, which is a property, not a pinned count. The text lists the three build names, which is a closed list but is tied to `listBuilds()`, so it is fine.
- The `exports exactly the seam names` source-shape test is not affected, since no export is added.
- Docs: the rally sentence and the CivRules table are in Scope, with a grep for any others. OK.
- Input validation: no trust-boundary input added.
- Size is about 25 LOC; Depends on none; On merge none is appropriate. Diagrams are correctly marked as not triggered. No LESSONS entry applies (the only lesson is about Playwright).

## Notes

- Criterion 103 second clause ("a `villagerProducer` hook that adds a producer with no rally to inherit") needs a start building other than the capital town center; name it (for example `mill`) so the test does not guess.
- Criterion 105 requires comparing against `main` before the change. Say "origin/main at the base commit", since local `main` is behind.
