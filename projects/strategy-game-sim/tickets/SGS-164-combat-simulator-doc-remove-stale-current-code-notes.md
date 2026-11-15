# SGS-164: Remove the stale "Current code" notes from the combat simulator doc

- **Type**: Docs
- **Component**: wotr-combat-simulator
- **Milestone**: none
- **Priority**: medium
- **Risk**: standard
- **Invariants**: W1 (combat follows docs/combat-simulator.md; the doc is the authority review judges against, so its rules must not change); W2 (the Independence section states this invariant)
- **Unverified assumptions**: none
- **LOC estimate**: 0 (docs only: `docs/combat-simulator.md`, about 25 lines removed or reworded)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md item "Combat simulator doc: remove stale "Current code" notes" (discovery docs 2026-11-13). CONTEXT.md names this doc authoritative for dice, leaders, casualties, round loop, input bounds, and outcome reporting, hence Risk standard.

## Context

`docs/combat-simulator.md` was written when the code ran one battle per request and labels three sections with a **Current code** note describing that old behavior. The code now runs N battles, so each note is false, and review, which judges the simulator against this doc, can flag shipped behavior as a defect. No rule changes; only the notes and the intro that introduces them go.

## Scope

Edit only `docs/combat-simulator.md`. Each claim below is checked against the code at `origin/main`.

- **Intro (second paragraph, and the sentence after it)**: says that where "today's code does something different" a **Current code** note records it and "a planned change brings the code in line with the rule". Once the notes go this describes nothing. Reword the intro so it says the doc states the rules and the code follows them, with no mention of Current code notes. Keep the first paragraph (what the doc is and that reviews judge against it).
- **Number of battles N**: the note "each request runs exactly one battle, and N is not accepted" is false. Described code: `validateBattles` in `pages/api/fight.ts` accepts an optional `battles` (default `DEFAULT_BATTLES`, a whole number 1 to `MAX_BATTLES`, rejected with 400 otherwise) and `simulateBattles` in `lib/combat-simulator/simulate.ts` runs that many. Delete the note. The rule text above it (default 1000, at most 100,000) already matches the code values; leave it.
- **Independence of battles**: the note that the battle mutates the parsed army objects in place is false. Described code: `simulateBattles` builds a fresh `BaseArmy` per side for every battle from the submitted counts. Delete the note; the rule text stays.
- **Outcome reporting**: the note that the response describes one battle (`survivor` value, average hits, both armies at the end) is false. Described code: the response is `FightResponse` in `lib/combat-simulator/fight-api.ts` (`battles`, `outcomes`, `rounds`, `survivors`, `hitsPerRound`), built by `OutcomeAccumulator.summary` in `lib/combat-simulator/simulate.ts`. Delete the note. The section already defers field names to `docs/api/openapi.json`; do not copy field names into it.
- **Re-read the whole doc** against `lib/combat-simulator/battle.ts`, `lib/combat-simulator/simulate.ts` and `pages/api/fight.ts` for any other statement of old or planned behavior. The "Extension points" section was checked: `shouldStop`, `BattleOptions`, and `OUTCOME_KINDS` exist in `battle.ts` as described, so it stays. Any other stale statement found is fixed here and listed in the implementer's report; a statement that would need a rule decision is reported, not rewritten.
- **Other docs**: `git grep -n "Current code"` over `docs`, `README.md`, `ARCHITECTURE.md`, `lib`, `components`, `pages` found only this doc. Re-run it before editing; fix any other doc that refers to those notes.

**Out of scope:** any change to a rule, input bound, departure, or extension point; any code, test, or `docs/api/openapi.json` change; documenting response field names in this doc.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `docs/combat-simulator.md` has no **Current code** note, and its intro no longer says notes of that kind exist or that a planned change will bring the code in line. A search of `docs/` for `Current code` finds nothing (a search scoped to doc paths, stating end state).
- [ ] Every rule in the doc is unchanged: the diff of the doc touches only the intro wording and the removed notes (and any other stale statement the implementer lists), with the Round order, Casualties, Input bounds, N default and cap, Independence rule, Outcome reporting definitions, Departures, Extension points, and Not modeled text intact.
- [ ] The doc makes no claim that a request runs one battle, that the army objects are mutated across battles, or that the response describes a single battle.
- [ ] The Mermaid flowchart in the doc is unchanged.
- [ ] No code, test, or `docs/api/openapi.json` file is in the diff.
- [ ] No INVARIANTS.md regressions

## Open questions

none
