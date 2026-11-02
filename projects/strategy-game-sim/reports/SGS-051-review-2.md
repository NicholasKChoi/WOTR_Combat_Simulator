# SGS-051 review 2 (full re-review after rework 1)

Branch `sgs-051-aoe4-build-knight-longbow`, tip 3d46184 on base 835aceb. The diff is against 835aceb. The branch is local only (there is no `origin/sgs-051-...`). Reviewed in my own detached worktree `worktrees/review-sgs-051-r2`, now removed. I did not write to the implementer's worktree.
Diff: `data/aoe4-build-order/builds/english-knight-longbow.json` (new, 62 steps), `lib/aoe4-build-order/builds.ts`, `lib/aoe4-build-order/builds.test.ts`, `data/aoe4-build-order/README.md`.

**Verdict: REQUEST CHANGES** (one blocking README-only finding; the build itself is now right)

## Blocking findings

1. `data/aoe4-build-order/README.md` (new entry, the sentence "From 5:30 new villagers go to gold ...", and "each block starts at its time"). Category: **contract** (a doc sentence the diff adds that the code contradicts).
   - **What.** steps[16] `@5:30 rally capital-town-center -> gold` is queued behind steps[15], the second 5:15 farm. That farm starts at 347.1 s, so the rally arms and fires at **347.1 s (5:47)**, not at 5:30. Between 5:30 and 5:47, new villagers still go to wood.
     - This is the same class of problem as review 1's 14:00-farm finding (a timed step queued behind an earlier step), only smaller.
     - In the same entry, "each block starts at its time" holds exactly for 14:00, 16:00 and 18:00 (840.0, 960.0, 1080.0 s). The 10:00 block's first farm starts at 601.5 s (1.5 s on resources).
     - The implementer report repeats "since 5:30" in its Castle-gap cause, and that text feeds the PR body.
   - **Why it matters.** The README is the record of what the shipped build does. A reader checking it against the page's step timeline sees 5:47.
   - **Direction.** Either move the gold rally above the 5:15 farm steps so it fires at 5:30, or reword the README and the PR-body text to the measured 5:47. For the farm blocks, say "the 14:00, 16:00 and 18:00 blocks start at their times, and the 10:00 block starts at 10:01". No retune is needed. Re-run `builds.test.ts` if the JSON moves.

## Must act (not a finding against this tip)

- **Rebase onto current main.** `origin/main` is 0f290d8, which contains SGS-050 (`Add the ENG Spear/Longbow into MAA/Crossbow prebuilt build`) and b5c68d2 (the step timeline).
  - `git merge-tree` reports a content conflict in `lib/aoe4-build-order/builds.ts`.
  - AC1's ordering clause now applies.
- **Trial merge.** I resolved `BUILDS` as `[english1tc, englishSpearLongbowMaaCrossbow, englishKnightLongbow]` in a throwaway merge. On that merged tree:
  - `npx tsc --noEmit`: clean.
  - `npm run lint:dup`: 0 clones.
  - `npm test`: 38 files, 1012 passed, 8 skipped.
  - `npx next build`: OK.
  - `npm run acceptance`: 531 passed on port 3871.
  - The page's prebuilt select lists, in order: ENG 1TC, ENG Spear/Longbow into MAA/Crossbow, ENG Knight/Longbow (King's Palace).
- **README on rebase.** The README auto-merges with the knight entry *above* the spear entry, and with no blank line before it, while main's spear entry is set off by a blank line. Put the spear entry first to match `listBuilds()` and the design's order, and match the blank-line separation.

## Spec gaps

None.

## Required fixes from rework 1, verified by my own measurements

All figures are at default inputs with depletion on, from `simulateBuildOrder` and confirmed through `POST /api/aoe4-build-order/simulate` on `next dev`.

| Fix | Measured | Holds |
|---|---|---|
| Both ranges produce | Range 2 (steps[20]) completes at 487.0 s. steps[24] `produce longbowman from archery-range` starts at 512.0 s, and steps[18] completes at that instant (its order is replaced, per `simulate.ts` `produce`, `replaced`/`completeIfUncarried`). Removing steps[24] drops longbowmen at 1200 s from 54 to 35. | yes |
| Castle | `ages` age 3 `reachedAt` = **777.8 s (12:58)**, against the reference ~804 s | yes |
| Units at 1200 s | **knight 31**, **longbowman 54** (13 tier-2 + 41 tier-3 series), against the reference ~23 / ~54. At 3600 s: 39 / 66, pop cap 200 at 1302.9 s. | yes |
| Reactions last | The five `whenever ... runs out move all` steps are steps[57..61], the last five | yes |
| Farm start times | 10:00 block: 601.5 / 610.5 / 620.7 / 632.6 s. 14:00: 840.0-854.0 s. 16:00: 960.0-962.2 s. 18:00: all at 1080.0 s. The 14:00 farms no longer queue behind `produce knight`, because Castle (777.8 s) precedes 840 s. | yes (wording, finding 1) |
| Bar, both horizons | 0 `waiting`; every non-reaction step started; every `not-reached` step is a reaction on `trigger` | yes |
| No gold warning | Every gold warning is `info`, with 0 idle. The only `warning` is `node-depleted` on sheep at 997.9 s (4 idle), which the bar allows. | yes |
| Gold run-outs | `gold` 931.85, `gold#2` 1477.30, `gold#3` 2022.74, `gold#4` 2568.19, `gold#5` 3113.63 s. Each reaction's `startedAt` equals its `depletedAt`. Part 4 is now non-vacuous at 1200 s too. | yes |
| Upgrade gold | Snapshot gold costs: 4x125 (Feudal blacksmith) + 250 (`veteran-longbowmen`) + 4x250 (Castle blacksmith) = **1,750**. The last finishes at 1034.7 s (17:15). | yes |
| `builds.ts` one entry per line | yes | yes |
| Causes in README and report | The pass-1 causes are now correct (74/min gold until 670 s; one idle range; food never short). The new house claim is verified: without steps[21..23], pop sits at 40 from 660 s to 780 s, Castle is 764 s, and knight/longbow fall to 27/30. `houseDemand` counts `constructing` supply (`simulate.ts:554-555`) and `planAutoHouse` adds it to headroom (`houses.ts:22`). | yes, except the 5:30 wording |

## Mutations run by me (each restored; tree clean afterwards)

- Deleted steps[57] (the `gold` reaction). Three tests failed: the gold-move bar case at 1200 s and at 3600 s, and "runs several gold deposits dry by 3600 s".
- Moved the four Feudal blacksmith research steps before `build kings-palace`. "researches its blacksmith techs after the King's Palace starts" failed.
- Removed the three explicit houses (probe only): population stalls at the cap, as the README says.
- Removed the second `produce longbowman` (probe only): longbowmen fall from 54 to 35, confirming both ranges produce.

## Acceptance criteria

- **AC1, PASS at tip.** The file exists with the exact name and `civ: english`. `git grep -n english-knight-longbow -- lib/aoe4-build-order/builds.ts | wc -l` = 2. The ordering clause after SGS-050 was verified on the trial merge only; the rebase must keep spear before knight.
- **AC2, PASS.** `source` is `hand-authored for this simulator` and `start.rally` is `gold`. The shared "validates" and "round-trips" suites pass.
- **AC3, PASS.** Bar parts 1-5 at 1200 s and 3600 s: shared suites green, and my numbers above agree.
- **AC4, PASS.** Five gold refs run out by 3600 s, and the mutation fails the 3600 s bar case. The PR body does not exist yet; the implementer report carries the table for it.
- **AC5, PASS.** jq gives a min research index of 29, greater than the palace index of 27. The new test asserts index order and `startedAt` order, and the mutation fails it.
- **AC6, PASS.** The build has `build kings-palace`, `produce knight` from `stable`, `produce longbowman` from `archery-range`, and the four techs. jq `has("amount")` prints `false`. At 1200 s, age 3 is reached, with knight 31 and longbowman 54.
- **AC7, PASS for content** (no PR body yet). The implementer report gives Castle, the counts, Feudal landmark `abbey-of-kings`, N = 5 and the run-outs. Fix the "since 5:30" wording per finding 1.
- **AC8, PASS.**
  - `git diff --stat 835aceb...HEAD` shows the 4 allowed files.
  - At tip: `npm test` 37 files, 998 passed, 4 skipped; tsc clean; lint:dup 0 clones.
  - On the trial merge: `next build` OK and acceptance 531 passed.
- **AC9, PASS with finding 1.** The README entry names the landmark, the blacksmith ordering, N = 5 and each run-out (`git grep -c` gives 1; 0 on 835aceb).
- **AC10, PASS.** No invariant regression.

Boxes are not ticked: the verdict is not APPROVE.

## Invariants touched

- **A1, holds.** No `amount` key and no restated cost, rate or duration. Only time triggers, villager counts and builder counts appear.
- **A2, holds.** No step is waiting at either horizon. No engine code changed.
- **A3, holds.** Data only. The in-process and API runs gave identical numbers.
- **S1-S3, W\*, H\***: not touched.

## Spec checklist

- Key surfaces: no API or schema change.
- Out of scope: no engine, validation, parser, OpenAPI, ENG 1TC or default change. Nothing under `golang/`.
- No invented constant answers an open question; the trigger times are tuning the ticket allows.
- A1-A3 as above.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty. There is no bot.

## Non-blocking notes

- **README run-out times are truncated; the page rounds.** `formatMinSec` rounds, so the page shows 15:32, 33:43 and 51:54 where the README says 15:31, 33:42 and 51:53. Main's spear entry uses whole seconds ("1218 s"). Consider matching it.
- **Idle sheep villagers.** Four villagers sit idle on depleted sheep from 997.9 s to the horizon (`node-depleted` `warning`). The bar allows this. A `whenever sheep runs out move all sheep to farm` reaction would recover them. This is the implementer's call.
- **Source search.** The implementer did not search for a public guide (no web access). The PR body should say so plainly.
- **Owner shape.** The owner's "12 villagers moved to gold at the switch" is replaced by rallying new villagers to gold from 5:47 to 9:13. This is reference shape only, and the README describes it.
- **Test layout.** The two new cases use `it.runIf(build.name.includes('King'))` inside `describe.each`, the same pattern as the 1TC cases (`builds.test.ts:50`, `:84`). Main's SGS-050 case uses a separate `describe` with `inputsFor` from `test-helpers.ts`. Both patterns exist; no change needed.
- **Out-of-scope engine finding, confirmed.** `houseDemand` (`simulate.ts:554-555`) feeds supply from buildings under construction into `planAutoHouse` headroom (`houses.ts:22`). A 220 s King's Palace under construction therefore suppresses auto-houses, and population stalls at the cap. It belongs in BACKLOG (count pending supply only from items finishing within the house lead time).

## Coverage

- **Reviewed:** all four changed files, the full step list with per-step timings at both horizons, and the formatted paste text.
- **Engine paths read:** `simulate.ts` `targetInstances`, `writeRally`, `produce`, `houseDemand`, `houseGateOpen`, `startAutoHouses`; `houses.ts` `planAutoHouse`; `format-time.ts`.
- **Docs read:** `design/M3.md` (M3.7, gold reaction layout, prebuilt bar), `docs/aoe4-build-order.md` (the prebuilt paragraph lists no build names, so no edit is needed), ARCHITECTURE.md, and main's SGS-050 README and test additions.
- **Commands run:**
  - At tip: lint, unit, and mutations.
  - On the trial merge with main: tsc, lint:dup, unit, `next build`, full `npm run acceptance` (531 passed, port 3871), and `next dev` on port 3872 with page HTML (select order) and POST simulate at 1200 s and 3600 s.
  - All servers stopped; no listener is left on 3871 or 3872.
- **REPO.md checklist:**
  - "Every diff": done (build, page loaded, API exercised).
  - "AoE4 build order": no copied helper or constant, no engine rule change, no chart change.
  - REVIEW.md does not exist. Repo and project LESSONS.md are empty.
