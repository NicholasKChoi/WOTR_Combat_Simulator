# SGS-164 review 1

- Branch: sgs-164-combat-doc-stale-notes, tip a5490af8584fbb2a98c399f6f20c07d94e0060c7, base origin/main.
- Type: Docs. Mode: full review (first review).
- Verdict: **APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Docs check (every changed sentence against the code at the tip)

Diff: `docs/combat-simulator.md` only, 1 insertion, 13 deletions, one commit.

- Added: "Each section states a rule, and the code follows it." (line 6). Checked each rule section
  against the code at the tip:
  - Round order / dice: `resolveRound` (lib/combat-simulator/battle.ts:124-146) rolls
    min(strength, 5), hits on >= 5 (`MIN_HIT_FACE` = 5), re-rolls min(misses, leaders, 5), takes hits
    for both sides after both have rolled, records the round; `Battle` loops until `shouldStop`
    (either side at strength 0). Outcomes from `battleOutcome` (battle.ts:12-25) match attacker win /
    defender win / tie.
  - Casualties: `BaseArmy.takeHit`/`takeHits` (lib/combat-simulator/army.ts) match: >5 units removes a
    regular or downgrades an elite when 0 regulars; <=5 downgrades an elite first, else removes a
    regular; excess hits discarded; leaders untouched.
  - Input bounds: pages/api/fight.ts `validateFightForm` (non-negative whole numbers, regs/elts <= 10,
    leaders <= 5, regs+elts in 1..10, 400 before `simulateBattles`). Form: components/apps/combat-simulator/army.js:4-5,29,44
    offers 0-10/0-10/0-5 and disables options over 10 combined.
  - N: `DEFAULT_BATTLES` = 1000, `MAX_BATTLES` = 100000 (lib/combat-simulator/simulate.ts:5-6),
    `validateBattles` (fight.ts:54-63).
  - Independence: `simulateBattles` builds fresh `BaseArmy` per side per battle (simulate.ts:160-163).
  - Outcome reporting: `OutcomeAccumulator.summary` (simulate.ts:104-137): counts and shares, mean and
    nearest-rank p10/median/p90 (`nearestRank` = sorted[ceil(p*N/100)-1]), survivors only for winning
    sides keyed by (regulars, elites), hits-per-round shares over total rounds.
  - Departures: results.js:8-9 labels attacker Shadow, defender Free.
  - Extension points: `shouldStop`, `BattleOptions = {}`, `OUTCOME_KINDS` exist (battle.ts:3,149,151).
  The sentence holds. The "within 10 seconds" performance requirement was not measured (no test
  runs in review); it is a requirement rather than a description of current behavior, and unchanged.
- Removed: intro sentences on Current code notes; the three notes (N not accepted; army objects mutated
  in place; one-battle response). Each is false at the tip (fight.ts `validateBattles`; simulate.ts:160-163;
  `FightResponse` in fight-api.ts). Removal is correct and leaves no dangling reference.
- No code change in the diff.

## Acceptance criteria

1. No Current code note; intro no longer mentions such notes or a planned change; `git grep -n "Current code" -- docs` finds nothing. **pass** (grep run in scratch: no matches; also no "planned change"/"today's code" in docs, README.md, ARCHITECTURE.md, lib, components, pages).
2. Every rule unchanged; diff touches only intro wording and removed notes. **pass** (diff hunks at lines 3-9, 99-112, 125-133 are only the intro and the three notes; Round order, Casualties, Input bounds, N default/cap, Independence rule, Outcome definitions, Departures, Extension points, Not modeled untouched).
3. No claim of one battle per request, mutated armies across battles, or single-battle response. **pass** (read the full doc at the tip).
4. Mermaid flowchart unchanged. **pass** (no hunk in lines 50-64).
5. No code, test, or openapi.json in the diff. **pass** (`git diff --stat`: docs/combat-simulator.md only).
6. No INVARIANTS.md regressions. **pass** (see below).

## Invariants touched

- W1 (combat follows docs/combat-simulator.md): holds. No rule text changed; the doc's rules match the code as listed above.
- W2 (N independent battles): holds. The Independence rule text is intact and true of `simulateBattles`; the removed note contradicted it.

spec-checklist: W1/W2 items apply (doc path); both satisfied. Contracts item: paths not touched.

## Lint

`npx tsc --noEmit && npm run lint:dup` run in the scratch (node_modules linked): tsc clean, jscpd 0 clones. Neither checks Markdown.

## Bot reconciliation

`reviewBot.cli` empty, no `rulesFile`: section skipped.

## Conventions

Docs-only; prose matches the surrounding doc style. No shipped-artifact hygiene issues (no ticket ids, no factory pointers). Commit message has no PR number.

## Non-blocking notes

- docs/combat-simulator.md:150-152 (pre-existing, not in the diff): "Support for them is planned for a later release" is a roadmap statement, not a rule. Implementer flagged it too. Owner's call whether to keep it; candidate BACKLOG item.
- docs/combat-simulator.md:6: "Each section states a rule" is loose for "Purpose and model" and "Not modeled", which describe rather than rule. Not material; no reader is misled about code behavior.

## Coverage

- Reviewed: the full diff; the whole of docs/combat-simulator.md at the tip; lib/combat-simulator/battle.ts, army.ts, simulate.ts, fight-api.ts; pages/api/fight.ts; components/apps/combat-simulator/army.js and results.js (grep for bounds and labels); INVARIANTS.md W1/W2; spec-checklist.md; implementer report SGS-164-docs-1.md.
- REPO.md Review checklist "Every diff" (next build, load pages) and "Combat simulator" (curl /api/fight, run fights): not applied, the diff changes no code, page, or route. Vercel preview builds the PR.
- UI inspection: not run; the diff changes no UI.
- No LSP use: no symbols changed.
