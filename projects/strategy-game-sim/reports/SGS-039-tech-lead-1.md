# SGS-039 tech-lead review (pass 1)

## Decision

No blockers. Opened one draft PR.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/55
  - base: `main`
  - head: `sgs-039-aoe4-triggers-reactions-default-amounts` at 72ed7214a6501eed87cfa9d3c016a0bd14c9f5f6
  - draft
  - no stack footer, because this is a single PR
  - The body was set with `gh api -X PATCH`.

## Reviewed

- **Commits:** 2665e94..72ed721, two commits: c1d71a5 and 72ed721.
  - Both commits are authored by choinickolas@gmail.com.
  - Neither commit message contains a ticket id.
  - origin/main is at a2e3ade. `git merge-tree` against it is clean, so no rebase is needed.
- **Stack check:** one branch whose diff contains only this task.
- **Files:** 26 files, +1309/-158 in total. The reviewable hand-written logic is +148/-39:
  - `simulate.ts` +83/-25
  - `validate.ts` +53/-10
  - `model.ts` +9/-4
  - `depletion.ts` +3/-0
  - plus `base.json` +30
- **Read in full:** the logic diff, with `-W` for the criticalPaths symbols. Those are `offerSteps`, `nextWake` and `simulateBuildOrder`, plus the call order in `runInstant`.
- **Also read:** every edited pre-existing test, unit and acceptance.
- **Checked:** the consumers of `formatBuildOrderText` and the page's `getStaticProps`.

## Invariant and blocker checks

- **A1:** the amounts exist only in `base.json`, each with a source.
- **A2:** a reaction never sets `engine.reserve`, because only the cursor branch assigns it. Handlers still check affordability. The bank trigger only reads the bank.
- **A3:** the bank wake is arithmetic on event times.
- **S3:** `triggerAtLeast` is enforced in `validate.ts`.
- **Other categories:** no concurrency, no security surface, and nothing irreversible (a revert restores infinite defaults). No open question is answered unilaterally (CONTEXT.md has none).
- **Request schema:** widened in a backward-compatible way.

## Merge risk
**high** - changes what existing consumers read: every request without `nodeAmounts` (the page's default run included) now gets finite depletions, run-out warnings and lower post-run-out income, and it reorders the critical-path step loop (`offerSteps`, `nextWake`).

## Review focus
- [`lib/aoe4-build-order/simulate.ts:436-488`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/55/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R436-R488) - `offerSteps` clears `engine.reserve` and then offers reactions before the cursor step. A reaction that set `engine.reserve`, or that started twice across the two `offerSteps` calls in `runInstant`, would hold back villager production for the rest of the run or double-spend. Check that only the cursor branch assigns `engine.reserve`, that the `startedAt` guard keeps a reaction to one start, and that a reaction may take the bank the cursor step was saving (intended: the reaction goes first).
- [`lib/aoe4-build-order/simulate.ts:215-227`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/55/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R215-R227) - `triggerWakeAt` gives a bank trigger's crossing time from the current income. If its `shortfall > RESOURCE_TOLERANCE` test drifts from the `bank + RESOURCE_TOLERANCE >= atLeast` test in `triggerHolds`, the step misses its exact instant and arms only at the next sample, or a wake is filtered out because it is not later than now. Check that the two tolerances agree, and that `nextWake` (`:707-722`) only asks for the wake of an unarmed cursor step.
- [`lib/aoe4-build-order/simulate.ts:826-829`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/55/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R826-R829) - `waitingSteps` charges wait time to every armed, unstarted step. The cursor invariant (at most one armed, unstarted non-reaction step) is what keeps this from charging a step twice or charging a step behind the cursor. Check that the horizon `waitingOn` rule at `:903` gives `trigger`, never `earlier-step`, to every unarmed reaction.

## Non-blocking notes

- **Paste-text formatter:** `formatBuildOrderText` (`lib/aoe4-build-order/parse-text.ts:299-308`) silently drops `depleted` and `bank` triggers and the `reaction` flag.
  - Not reachable today: the page formats only the prebuilt builds, and none uses them.
  - It becomes reachable once SGS-040 adds the ENG 1TC gold reaction, which SGS-040 owns.
- **Bank wake precision:** a bank wake whose shortfall/income is below float resolution at the current time is filtered out by `time > engine.time`. The step then arms at the next sample instead of the exact instant.
  - It is still deterministic.
  - It is practically unreachable, because the shortfall must exceed `RESOURCE_TOLERANCE`.
- **User-visible change:** default page runs of the English build now show a sheep `node-depleted` warning (6 idle villagers, 782.85 s) and lower food income after it, within the default 1200 s horizon.
  - This is intended.
  - The PR body states it so the owner sees it when undrafting.
- **Process artifact:** the push ran `git push -u`, which set the branch's upstream in the shared repo config.
