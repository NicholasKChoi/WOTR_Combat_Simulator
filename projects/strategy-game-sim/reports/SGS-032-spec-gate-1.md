# SGS-032 spec gate 1

Ticket: tickets/SGS-032-aoe4-research-veterancy.md. Base: origin/main 68e004a. Read: common.md, REPO.md, both LESSONS.md (both empty), PROJECT.md, CONTEXT.md, INVARIANTS.md, design/M2.md, SGS-027/029/030/031 tickets, effects.ts, data.ts, model.ts, snapshot and rules JSON, docs/aoe4-build-order.md.

## Verdict: NEEDS_SPEC

All gaps are author-closable. No owner gaps. No open question decides main-path behavior (the ticket's Open questions is None and the two answered ones match design "Research target" and "Repeat research").

## Confirmed risk: high

Matches the ticket. Triggers hit: changes what a run computes (tier of produced units, income after a tech), order of operations (research shares the instance FIFO, A3), edits the core loop file `simulate.ts`, ~160 LOC is over the 150 line trigger. `criticalPaths` is empty. Size is well under 400.

## Gaps (author)

1. **Acceptance criteria / Scope - a merged SGS-030 test will fail and the ticket does not say to change it.** SGS-030's "Seam" criterion asserts that a `build`, `move` and `research` step each report `waiting` and block later steps. Registering `research: researchHandler` makes the `research` part false (SGS-031 will do the same for `build`/`move`). An implementer would either guess at the fix or leave a red suite. Fix: add to Scope section 2 that the SGS-030 seam test is edited in place so its no-handler example no longer uses `research` (use an action still without a handler, or a test-only handler removed in `finally`), and add "that test still passes" to the last criterion.

2. **Scope 2 - "both places" misses a third lookup site.** SGS-031 (parallel) computes `populationPerSecond` for `planAutoHouse` "over instances whose order ... unit entry is available at state.age" in `simulate.ts`. That is a produced-unit entry lookup. The Reuse criterion ("no remaining direct lowest-entry lookup for a produced unit") fails if SGS-031 lands first with a lowest-age lookup, and the ticket gives no rule for whoever merges second. Fix: name it. Either the demand computation also calls `resolveUnitEntry(order.unit, state)` (tier fixed at payment, but demand is read per instant, so the current resolution is the right estimate), or state it intentionally does not, and say who edits it on rebase. Also replace the `[0]` grep in the Reuse criterion (false hits on building lookups) with a statement that the only produced-unit lookup is inside `resolveUnitEntry`.

3. **Docs (Scope 3) - the research target rule is not in the docs list.** The design's "Research target" rule (candidates `[at]` else `producedBy` in snapshot order, lowest-numbered instance of the first candidate with one, queue length ignored, no `instance` field, empty `producedBy` and no `at` never starts) is the main new behavior, but the docs bullets only cover queue/tier/step life. The `research` row at docs l.262 and the Queues paragraph say nothing about which instance. Fix: add a docs bullet for it plus a check criterion, for example `git grep -niE "lowest-numbered" -- docs/aoe4-build-order.md` finds a line.

## Notes (non-blocking)

- Research target criterion: the result has no per-instance output, so say how the test sees the target (for example villager count series differences between runs, or calling `researchHandler` on a hand-built `EngineState` and reading `instances.get(...)[k].paid`). Same for the starting `start.rally` the test data needs for the two town centers.
- A2 criterion "unreached age (`research veteran-spearmen` at age 2)": the test data needs a starting `barracks`, else the step waits for the missing target and not the age. State it.
- AC1 gives "enough food and gold" but spearman also costs 20 wood; say wood is sufficient.
- `researchNotes` on a `rejected` classification is unspecified (unreachable after validation). Say "no note" so it does not throw. `classifyTech` throws for non-tech entries, which validation also precludes.
- `completedAt = startedAt + 90 / multiplier` holds only on an idle target (true for the mill case); the sentence could say so.
- `textiles` carries `hitpoints` (ignored), so the Research target tests also produce a `tech-effect-ignored` note; harmless, only matters if a test asserts empty notes.
- "SGS-031's notes, if any": SGS-031 puts notes out of scope; drop the clause.

## Checks passed

1. Grounded scope: `classifyTech`, `IGNORED_EFFECT_PROPERTIES`, `data.upgradeTargets` (`ReadonlyMap<string, HandValue<string>>`), `BuildOrderNote`, `TechSupport` exist on 68e004a with the stated shapes. `modifiedValue`/`EffectState`/`ModifierTarget` are SGS-027 (not yet merged) and match its ticket (`researched: ReadonlySet<string>`, `producer?`). SGS-030 seam names (`PaidItem.complete(state, at)`, `StepHandler`, `StepStart`, `EngineState.researched/steps/resources`) match. Snapshot facts used by the criteria hold: `spearman-2/3/4`, `veteran-spearmen-3` (barracks, 100 food 250 gold, 60 s), `textiles-2` (50 food 100 gold 20 s; capital-town-center, kings-palace, town-center), `wheelbarrow-1` (mill, 50 wood 150 gold, 90 s), `bloomery-2` (meleeAttack), `shaft-mining-3` (no effects), `upgrade-king-3/4` (empty `producedBy`).
2. Criteria testable; hand-calculated timings in AC1 (research 15..75, next spearman paid at 75, 60 s later than baseline) and AC2 (paid 0, 70; tier fixed at payment) are consistent with SGS-030's phase order.
3. Open questions: none.
4. Invariants: A1, A2, A3 named; criteria do not contradict them.
5. Contracts: match design Contracts and SGS-030/027/029 (no repeat check in engine; SGS-029 check 8 covers it).
6. Dependencies stated; size ~160.
7. Diagrams present (queue state machine, read/act/record).
8. Lessons: both files empty.
9. Decisions: body agrees with design "Research target" and "Repeat research" and wave5 answers 1 and 2.
10. On merge: none is correct.
11. Risk: high, correct.
12. Docs: tier/queue paragraph (l.131-139) extended not contradicted; no README hit contradicted. Gap 3 above covers the missing item.
