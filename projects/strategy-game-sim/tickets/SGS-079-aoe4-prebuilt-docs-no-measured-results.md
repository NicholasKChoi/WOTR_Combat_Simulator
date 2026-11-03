# SGS-079: Make the prebuilt build entries state choices and rules, not measured results

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner request 2026-11-02, to land before the next plan; not part of M4, whose criteria are all done)
- **Priority**: high
- **Risk**: low
  <!-- Docs only: one README section. No code, test, route, schema or data change; no adjacent invariant. -->
- **Invariants**: none adjacent
- **LOC estimate**: 0 business logic (about 40 changed lines in `data/aoe4-build-order/README.md`)
- **Depends on**: none (main `ee7ecb9`)
- **On merge**: none
- **Source**: owner request 2026-11-02, after a review of the rework history. SGS-050 rework 1 and SGS-051 reworks 1 to 3 were spent on README sentences that quote simulation results (run-out times, rally and farm start times) which every retune changed; SGS-051 rework 3 was a one-second rounding difference (10:01 against the page's 10:02). The README also had to be re-edited by SGS-063, SGS-064 and SGS-065 because their engine changes moved those numbers.

## Context

The "Prebuilt builds" entries in `data/aoe4-build-order/README.md` mix two kinds of statement: what the
build file does and why (transcription choices, step order, reactions), and what the simulation measured
when it was last tuned (when each gold deposit runs out, when a rally or farm block actually fires, how
long production is held). The second kind goes stale on any engine or build change, and keeping it exact
has cost more reworks than the builds themselves. The page already shows every measured value for a run.

## Scope

**`data/aoe4-build-order/README.md`, section "Prebuilt builds"** (from `## Prebuilt builds` to `## Hand-entered values`):

- Rule for each number in the three entries (`english-1tc`, `english-spear-longbow-maa-crossbow`,
  `english-knight-longbow`): a value written in the build's JSON file (a `time` trigger, a step's
  `@m:ss`, a villager count, the number of deposits and reactions, a guide step's time) is an input and
  stays. A value read from a simulation result (a `depletedAt`, a `startedAt`, a landmark's completion
  time, a warning's duration or start, "never reached by 3600 s") is a measured result and is removed;
  keep the rule or reason the sentence was making, without the number. Examples:
  - "Gold runs out at 1114 s (`gold`), 1709 s (`gold#2`) and 2303 s (`gold#3`) at default inputs, so the
    build has three reactions" becomes: three deposits run out by 3600 s at default inputs, so the build
    has three reactions (`gold` and `gold#2` move to the next deposit, `gold#3` moves to farms).
  - "From 5:47 new villagers go to gold (the 5:30 rally waits behind the 5:15 farms)" becomes: the 5:30
    rally to gold waits behind the 5:15 farm block, so it fires after 5:30.
  - "the 14:00, 16:00 and 18:00 blocks start at their times and the 10:00 block starts about 1.5 s after
    10:00 (10:02 as the page shows it)" is removed; "Farms are added in blocks of four at 10:00, 14:00,
    16:00 and 18:00" stays.
  - The `man-at-arms` trigger keeps its value (681 s, an input) and its reason (it must not start before
    Castle; re-check it when an earlier step changes), without the measured completion and start times.
  - The `auto-houses-held` sentence keeps that the run returns one such warning at default inputs and
    why (auto-houses stay off until the third explicit house starts), without its duration and start.
- Add one sentence to the section's opening paragraph: entries describe what each build file does and
  why; measured results (run-out times, when a step fires, warnings' times) are not listed because they
  change whenever the engine or the build is tuned, and the page shows them for any run.
- Keep each entry's structure: name, source, Omitted list, transcription choices. Change no other
  section of the README.

**Docs elsewhere**: `docs/aoe4-build-order.md` uses build times only inside paste-format examples and
message-format examples (for example the `auto-houses-held` message at its warnings section); those are
examples of a format and stay.

**Test rule:** docs only, so no test changes. If any test reads the README (none does on main), stop and
report `needs_spec`.

**Out of scope:** any change to a build JSON, `builds.ts`, a test, the engine or the page; the
paste-format and message-format examples in `docs/aoe4-build-order.md`; rewrapping lines the edit does
not touch; adding a docs line-width check.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] In the Prebuilt builds section (`awk '/^## Prebuilt builds/,/^## Hand-entered/' data/aoe4-build-order/README.md`), `grep -cE '[0-9]+\.[0-9]+ s'` prints 6 on main and 0 after.
- [ ] In that section, `grep -oE '15:32|24:37|33:43|42:48|51:54|16:38|5:47|10:02|7:42|1114 s|1709 s|2303 s|680\.3 s' | sort -u | wc -l` prints 13 on main and 0 after.
- [ ] Every input the entries state on main still appears: the 681 s `man-at-arms` trigger, the farm block times 10:00, 14:00, 16:00 and 18:00, the deposit and reaction counts of each build, and every guide step time in the ENG 1TC Omitted list.
- [ ] Each sentence changed still states the rule or reason it gave on main (listed in the implementer's Doc claims with the build JSON step or `lib/aoe4-build-order` symbol that makes it true).
- [ ] The section's opening paragraph says measured results are not listed and why.
- [ ] `git diff --stat main` shows only `data/aoe4-build-order/README.md`; the full unit suite, `npx tsc --noEmit` and `npm run lint:dup` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
