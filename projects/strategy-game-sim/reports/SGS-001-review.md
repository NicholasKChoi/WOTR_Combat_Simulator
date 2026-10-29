# SGS-001 review (first pass, full)

- Verdict: **APPROVE**
- Branch: sgs-001-wotr-combat-design-doc @ 47c8931, base origin/main d54af2e
- Diff: `A docs/combat-simulator.md` (168 lines). No other file changed.
- Worktree: I reviewed in the existing task worktree, read-only
  (/home/choin/git/WOTR_Combat_Simulator-factory/worktrees/sgs-001-wotr-combat-design-doc). The branch is not pushed, so
  `origin/<branch>` doesn't exist and I didn't create a separate review worktree.

## Blocking findings

None.

## Spec gaps

None blocking. See non-blocking notes 1 and 2.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | All ten sections present | pass | Headings at docs/combat-simulator.md:10, 19, 29, 72, 89, 108, 117, 126, 151, 164 |
| 2 | Round-order rules | pass | :33 dice min(r+e,5); :34 hit on 6 only (matches `threshold` 5, `> threshold`, fight.ts:119/124); :35-36 rerolls min(misses, leaders, 5); :37-39 at most 5 hits; :40-42 simultaneous; :44 loop; :46-50 three outcomes |
| 3 | Mermaid flowchart matches and parses | pass | :56-70. I parsed it myself with mermaid 11 `mermaid.parse` under jsdom and got `{"diagramType":"flowchart-v2"}`. A copy with one edge label broken returned `false`, so the check can fail. The nodes match steps 1-7, both caps, the loop condition after casualties, and the three outcomes. I did not view the GitHub render (branch not pushed). |
| 4 | Casualty rule + Current code note | pass | :77-83 rule (>5: remove regular, or downgrade an elite at 0 regulars; <=5: downgrade elite else remove regular; excess discarded; leaders never). :85-87 note. Checked against army.ts `takeHit`: the `> 5` branch always runs `regulars--` |
| 5 | Input bounds | pass | :93-95 r+e <= 10, leaders 0-5 not counted, 0 invalid; :97-99 rejection; :101-102 UI 0-10/0-10/0-5; :104-106 note. Checked against army.js: `i < 10` gives 0-9, leaders `< 6` |
| 6 | N | pass | :110-113 default 1000, max 100,000, 100,000 within 10 s |
| 7 | Outcome reporting, no field names, no "proposal"/"owner to confirm" | pass | :132-145. Nearest-rank method at :136-138. `survivor`/`n/a` appear only in the Current code note at :147-149. The rule text defines tie in words. Neither tag appears in this section |
| 8 | Current code notes for every rule not yet followed | pass | dice/reroll cap and 5-hit ceiling :52-54; casualty :85-87; bounds, 0-unit and UI :104-106; N :115; independence :122-124; statistics :147-149. Intro :6-8 says a note is never a rule |
| 9 | Departures tagged; Nazgul not tagged | pass | :156-162 each "(owner to confirm)"; :166-168 not tagged |
| 10 | Hygiene grep | pass | `grep -E 'SGS-|M1\.|W1|W2|S3|CONTEXT\.md|INVARIANTS\.md'` exit 1. I also grepped "ticket", "respec", and "factory": no matches |
| 11 | Only the doc added | pass | `git diff --name-status d54af2e...HEAD` gives `A docs/combat-simulator.md` |
| 12 | No invariant regressions | pass | see below |

I ticked all 12 criteria in the ticket file.

## Current-code accuracy (checked against d54af2e)

- Dice with no cap: `rollDice(attack.getCombatStrength())` at fight.ts:141/144. Correct.
- Rerolls `Math.min(misses, leaders)` at fight.ts:148/151. Correct.
- Negative regulars at >5 units with 0 regulars: army.ts `takeHit`. Correct, including the "6 or more elites only" example.
- A 0-unit side gives 0 rounds and non-numeric averages: `isArmyAlive` is false, so the loop never runs, and `getStats` computes 0/0 = NaN (serialized as null). Correct.
- In-place mutation: `Battle` uses `form.attackArmy`/`defendArmy` directly. Correct.
- Response contents (rounds, survivor attack/defend/n/a, average hits, final armies): `getStats`/`getSurvivor`. Correct.
- Shadow/Free hard-coded: results.js:80/87. Correct.

## Consistency with downstream tickets

- SGS-003 (validation): field ranges 0-10/0-10/0-5, r+e <= 10 with leaders not counted, r+e >= 1, and negatives and non-integers rejected. These match doc :91-99. SGS-003's stricter string-encoding rules belong to the API, and the doc doesn't contradict them.
- SGS-004 (caps and casualty): `MAX_COMBAT_DICE = 5` and `MAX_LEADER_REROLLS = 5`, a hit on 6 only, and downgrading an elite at >5 units with 0 regulars. These match :33-39 and :79-80. SGS-004 cites "the casualty section of docs/combat-simulator.md", which exists at :72.
- SGS-005 (Monte Carlo): it defines outcomes (attacker/defender/tie) and rounds over all N with ties included. Its nearest-rank rank `ceil(p*N/100)` equals the doc's `ceil(p/100 × N)`. Survivors are (regulars, elites) per winning side, kept separate, with ties contributing none. hitsPerRound is a 6-slot share of all pooled rounds. Default 1000 and max 100,000. All of these match the doc. SGS-005 goes further than the doc in two places (notes 1 and 2). Neither contradicts it.

## Invariants touched

- W1 (combat follows the doc): holds. This doc is W1's rule source. No code changed, and every place the code differs is marked with a Current code note.
- W2 (independent battles): holds. :119-124 states it and notes today's mutation.
- S3 (bounded work): holds. Army caps :93-99 and N max :110-111 are stated. No code changed.
- S1, S2, H1-H3, A1-A3: not touched.

## Spec checklist

- Contracts: the doc names no response fields. It mentions the six form fields only implicitly ("three whole numbers per side"). No conflict with Key surfaces.
- Scope: no `golang/` change. Out-of-scope Nazgul leadership is listed as not modeled, not implemented. No open question (AoE4 only) is answered.
- Naming: n/a (prose).
- W1/W2/S3: see above. The other sections are not touched.

## Linter

`npx tsc --noEmit` in the worktree: exit 0, no output. The diff is Markdown only, so tsc doesn't cover it.

## Review bot

`reviewBot.cli` and `rulesFile` are empty, so I didn't run a bot. Nothing to reconcile.

## Conventions

- Placement follows ARCHITECTURE.md "Where files go": `docs/<app>.md` with the app slug `combat-simulator`, matching `pages/apps/combat-simulator.js`.
- Content covers ARCHITECTURE.md "Adding an app" step 1: purpose, rules, inputs and limits, and outputs.
- No sibling docs exist under `docs/` to compare against. Tone and line wrapping (~105 cols) match ARCHITECTURE.md.
- No REVIEW.md. Both LESSONS.md files are empty.

## REPO.md review checklist

- Every diff: no page or component touched, so there's no page to load. I did not run `npx next build` myself; the implementer reports it passed. A Markdown-only diff can't affect the build.
- Combat simulator: no form field, dice, or casualty code changed, so the round-trip trace and the curl/fight-run checks have nothing to exercise. I checked the Current code claims by reading the code (above) instead.
- Starcraft helper, Shared code, golang/: not touched.

## Non-blocking notes

1. docs/combat-simulator.md:110-111: the N section gives the max but not the minimum (1), and doesn't say what happens to an out-of-range N. SGS-005 pins 1 to 100,000 and rejects anything else with 400. SGS-005 may not edit this doc, so that rule will live only in the code and the OpenAPI spec. ARCHITECTURE.md's rule says "a maximum that is checked before the work starts". Suggestion: add one line, "N is a whole number from 1 to 100,000; a request outside that range is rejected and no battle runs", either now or as a follow-up doc touch after SGS-005. This doesn't block, because CONTEXT.md Decisions only fixes the default and max, and the doc doesn't contradict SGS-005.
2. :140-142: the doc reports survivor counts only. SGS-005 also reports `frequency` as a share of that side's wins, which is the ticket's open question 2 and still owner-confirm. Once the owner confirms, the doc could add "and as a share of that side's wins". It doesn't contradict anything now.
3. :129-130: `docs/api/openapi.json` doesn't exist until SGS-006. The ticket permits the reference, and it's a code span, not a link, so nothing is broken.
4. :161-162: the Shadow/Free departure describes results.js, which SGS-005 rewrites. If SGS-005 drops the hard-coded labels, this item and its tag go stale. Whoever reviews SGS-005 should check it.

## Coverage

- Reviewed: docs/combat-simulator.md (all), plus the code it describes at d54af2e: pages/api/fight.ts, pages/api/models/army.ts, components/apps/combat-simulator/army.js, components/apps/combat-simulator/results.js. Also ARCHITECTURE.md, the SGS-003/004/005 tickets (Scope), and CONTEXT.md Decisions.
- Not reviewed: the GitHub-rendered Mermaid (not pushed; parse checked locally with mermaid 11). I did not run `next build` myself.
