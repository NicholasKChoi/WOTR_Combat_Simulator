# SGS-175: Write docs/starcraft-helper.md

- **Type**: Docs
- **Component**: starcraft-helper
- **Milestone**: none
- **Priority**: medium
- **Risk**: standard
  <!-- CONTEXT.md's Design docs table names docs/starcraft-helper.md authoritative for the player list, map pool source, strike limits and edge states, so Risk is standard, not low. -->
- **Invariants**: H1 (a Randomize click never repeats the previous result), H2 (a struck map is never picked), H3 (shared `shuffle` stays an unbiased permutation); the doc describes behavior these guard
- **Unverified assumptions**: none
- **LOC estimate**: 0 (docs only; one new markdown file of roughly 60-100 lines, plus one README table cell)
- **Depends on**: none
- **On merge**: CONTEXT.md Design docs: change the StarCraft helper row's Doc cell from `docs/starcraft-helper.md` (deferred; app frozen) to the doc on `main` (SGS-175); CONTEXT.md Out of scope: reword the StarCraft Helper bullet so it no longer calls the doc deferred and keeps "no tickets touch `pages/apps/starcraft-helper.js`" except for doc-only changes; REPO.md Starcraft helper checklist: delete "(pending ticket)"; BACKLOG.md: delete the "Write `docs/starcraft-helper.md`" item. These are factory-state files outside the PR
- **Source**: BACKLOG.md "Write `docs/starcraft-helper.md`" (owner docs review, 2026-11-15); owner answer Q107 A)

## Context

`pages/apps/starcraft-helper.js` has no design doc, so reviews of the REPO.md Starcraft helper checklist
("confirm the result matches the doc") have no reference, and CONTEXT.md already names the doc authoritative
for player list, map pool source, strike limits and edge states. The owner's answer (Q107) fixes the rules
for writing it: the doc states what the code does; it says the map pool and player list source and season
are not recorded in the repo and invents none; and it says the all-struck case cannot be reached through the
UI. The app is frozen; the owner confirms this Docs-only ticket as the exception to "no tickets touch the
StarCraft helper". No code changes.

## Scope

Add `docs/starcraft-helper.md`. Describe only what `pages/apps/starcraft-helper.js` does at `origin/main`;
read the file before writing each claim. It covers:

- **Purpose.** Matchmaking for a small group of friends: a random 1v1 pairing and a random map pick from a
  map pool with strikes. Everything is client-side, route `/apps/starcraft-helper`, no API, no persistence:
  a reload clears the pairing, the strikes and the map.
- **Player list and map pool.** The data (`partnerArray`: matthew, nick, daniel; `mapArray`: the nine map
  names in the file) given as the doc's reference list. State plainly that the repo records no source, ladder
  season or date for either list, and that the doc does not supply one. Say how a list is updated (a data-only
  edit of the two arrays) without naming a source.
- **Controls and edge states**, one subsection per control:
  - Fighter Select "Randomize" (`GetNewPartners`, `GetVsText`): picks two of the three players, shows
    them sorted by name as "a vs. b" (so a pairing never appears in both orders); there are three possible
    pairings; a click never shows the same pairing as the one currently shown (the retry loop in
    `GetNewPartners`); the first click has no previous pairing (the state starts as the empty string).
    State that the retry loop ends because the list yields more than one pairing and each draw is random, so
    it ends with probability 1 rather than after a fixed number of draws, and that a pool with a single
    possible pairing would never end (INVARIANTS H1).
  - Map Strike (`handleCheck`): one checkbox per map, unchecked at start; checking strikes a map and
    unchecking restores it; once three are checked every unchecked box is disabled (the `disabled` rule), and
    unchecking one re-enables the rest, so at most 3 of the 9 maps are struck. The cap lives in the UI, not
    in the picker. Struck labels are styled (`checkedItem`); striking does not clear a map already shown.
  - Map Select "Randomize" (`getMapText`): picks uniformly among the maps that are neither struck nor equal
    to the map currently shown (the shown map is added to the banned list), so a click never repeats the
    shown map and never picks a struck map (INVARIANTS H1, H2); the first click has no previous map. Say that
    a map struck after it was picked stays on screen until the next click.
  - The all-struck case: `getMapText` returns the string `FAILURE` only when every map is banned. State that
    this is unreachable through the UI (at most 3 maps struck plus the shown one is 4 of 9, so at least 5
    stay eligible), that `FAILURE` is a code-level fallback and not a displayed message the user can meet, and
    that raising the strike cap to 8 or more would make it reachable and would need the "tell the user
    plainly" behavior INVARIANTS H2 requires.
- **Shared code.** `shuffle` comes from `utils/utils.ts` (INVARIANTS H3), and the page uses the shared
  `Layout`; the doc names them as dependencies and restates neither's rules.
- `DEFAULT_MAP_POSITION` is unused; the doc does not describe it as behavior.

- **README.md app table (respec 1).** The StarCraft helper row's Design doc cell reads `none`, which becomes
  untrue once the doc lands. Change that one cell to link the new doc, in the same form as the other rows. No
  other README text changes; ARCHITECTURE.md has no StarCraft text to fix. The README entry-point rewrite (a
  separate backlog item) is unaffected.

**Out of scope:** any change to `pages/apps/starcraft-helper.js` or `utils/utils.ts` (including making the
all-struck case reachable, adding a visible message, or removing the unused constant); inventing a source or
season for the map pool or player list; ARCHITECTURE.md and every doc other than the new doc and the one README cell above; any other README edit.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `docs/starcraft-helper.md` exists and every sentence in it is true of `pages/apps/starcraft-helper.js` at the branch tip.
- [ ] The doc lists the player list and the map pool exactly as the arrays hold them, and states that the repo records no source or season for either; it names no source or season.
- [ ] The doc describes each of the three controls with its edge states: repeated clicks never repeat the shown result, the first click has no previous result, strikes are capped at 3 of 9 maps with the other boxes disabled and unchecking re-enabling them.
- [ ] The doc says the all-struck case (`getMapText` returning `FAILURE`) cannot be reached through the UI, with the reason, and does not present `FAILURE` as a user-visible message.
- [ ] The doc says the Fighter Select retry ends only while more than one pairing is possible, and says nothing contradicting INVARIANTS H1-H3.
- [ ] (respec 1) The PR changes only `docs/starcraft-helper.md` and the StarCraft helper row's Design doc cell in `README.md`, which links the new doc; no code or test file changes.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-15

- Underspecified: README.md's app table lists the StarCraft helper's Design doc as `none`, which the new doc makes false; the ticket wrongly said README had nothing to fix.
- Changed: Scope now includes the one-cell README edit, the file-change criterion allows only the doc and that cell, and On merge notes its edits are factory-state files outside the PR.
- Standing: nothing was implemented yet; no branch work to carry over.

## Rework 1 - 2026-11-16 (review, text)

Findings (review report reports/SGS-175-review-1.md; tip 37f1d24e742e527d4d816086ead6c24bc03cd45e passed no earlier gate):

1. `docs/starcraft-helper.md:17-18` (text): "To update a list, edit the array; no other code changes." is true only at some list sizes.
2. `docs/starcraft-helper.md:31` (text): "A list with a single possible pairing would never end." is false for the first click (the initial state is `''`).

Required fixes:

- [x] In `docs/starcraft-helper.md`, replace the sentence "To update a list, edit the array; no other code changes." with exactly: "To update a list, edit the array; no other code changes, as long as the player list keeps at least 3 names and the map pool at least 5 maps. With fewer than 3 players there is a single pairing, so every Fighter Select click after the first would never end; with 4 or fewer maps, 3 strikes plus the shown map can ban every map, and Map Select shows `FAILURE`."
- [x] Replace "A list with a single possible pairing would never end." with exactly: "With a list that yields a single possible pairing, every click after the first would never end."
- [x] Change nothing else.
