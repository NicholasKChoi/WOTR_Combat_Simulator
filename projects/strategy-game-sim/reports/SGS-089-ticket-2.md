# SGS-089 ticket report 2 (re-spec 1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-089-aoe4-engine-guard-crashes-hangs.md
Risk high (unchanged). Depends on none. On merge none. Base origin/main b9481e3.

## Gaps resolved

1. Guard location: stays in `productionSeconds`, so it fires from both callers (`startHead` and `houseDemand`). The false "merely queued" sentence is gone; Scope states the error is thrown from `houseDemand` when an instance holds an order for a bad-time unit while auto houses are planned (autoHouses on, house gate open), and from `startHead` otherwise.
2. New finding while verifying: research items also pass through `startHead` -> `productionSeconds` (`researchHandler` pushes onto `paid`), and `research.test.ts` "leaves the units at the highest tier when two upgrades complete at one instant..." pins a zero-time upgrade as valid. An all-entries guard fails that test (checked). The guard is therefore limited to `entry.type === 'unit'`; research time guarding is out of scope. Criterion added: that test passes unedited; dropping the unit condition makes it fail (checked).
3. Hang rows: time-0 villager and zero-cost/zero-pop/time-0 villager, each with autoHouses true and false. Re-verified on b9481e3: time 0 alone no longer hangs (returns); the zero-cost villager still hangs with both settings (process killed by `timeout`).
4. houseDemand pair: villager time 0, food 0, `start: { rally: 'sheep', villagers: {} }`: autoHouses true throws (only houseDemand reaches the guard), autoHouses false returns with no units. Checked with the guard in productionSeconds (throws / ok) and with a startHead-only mutation (true row returns ok, so the test fails as intended).
5. Wording: base facts re-verified on b9481e3 (hooks 0/-5/NaN return with no error; `start: {}` gives the walkSeconds TypeError; `at.rally!` present); second rally row names `mill` (starting buildings set via editGameData, `villagerProducer` true only for mill; throws naming mill instance 1, checked); productionSpeed hedge dropped (multiply 0 gives `got Infinity`, checked); A3 comparison is against origin/main at the branch base.

Also: the supply-wait test's kept assertion is `result.steps[0].status === 'waiting'` (what the test checks today) instead of `waitingOn`.

With the unit-only guard applied in the throwaway worktree, the full `lib/aoe4-build-order` suite passed (1073 passed, 10 skipped). Worktree removed.

Diagrams: none (two throw sites, no new transition).
Open questions: designer (API handling of a thrown Error) unchanged. No owner questions.
Overlap: none found.
