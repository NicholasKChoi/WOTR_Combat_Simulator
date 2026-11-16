# SGS-175 review 2 (delta)

- Branch: sgs-175-starcraft-helper-design-doc, tip ec0bb7c391bd8ad7c8887d303433090763b28ed6, delta from 37f1d24e (text-only Rework 1).
- **Verdict: APPROVE**

## Delta check
`git diff --stat 37f1d24e..ec0bb7c3`: one file, `docs/starcraft-helper.md`, 5 insertions and 2 deletions. Nothing else changed.

1. Lines 17-21: the replacement matches the Rework 1 text word for word. Only the line wrapping differs. It reads "To update a list, edit the array; no other code changes, as long as the player list keeps at least 3 names and the map pool at least 5 maps. With fewer than 3 players there is a single pairing, so every Fighter Select click after the first would never end; with 4 or fewer maps, 3 strikes plus the shown map can ban every map, and Map Select shows `FAILURE`." The original fact (edit the array, no other code changes) is kept and now qualified by size.
2. Line 34: the replacement matches word for word: "With a list that yields a single possible pairing, every click after the first would never end."

## Truth against `pages/apps/starcraft-helper.js`
- Fighter Select: `GetNewPartners` (`:41-48`) loops while the new pairing equals `lastPartners`. The first click has `partners === ''` (`:65`), so any draw differs and the first click returns. With 2 players, `GetVsText` always returns the same sorted pair, so every later click never ends. With 1 player it always returns "x vs. undefined", so the same holds. 3 players give 3 pairings, so the loop ends.
- Map Select: the strike cap is `checked.length > 2` (`:105`), so at most 3 maps are struck. `getMapText([...checked, map])` (`:126`) bans the struck maps plus the shown one. With 5 maps, at least 1 stays eligible. With 4 or fewer, 3 struck plus 1 shown can cover every map, and `getMapText` returns "FAILURE" (`:37`).
- Both sentences are true, and so is the surrounding text.

## Other checks
- Blocking findings: none.
- Spec gaps: none.
- Acceptance criteria: the criterion that failed in review 1, "every sentence is true of the code", now passes. The other criteria are unchanged and still hold.
- Invariants: no code changed, so H1-H3 are unaffected.
- Lint: not re-run. The diff is Markdown only.
- Test files: none in the branch diff.

## Non-blocking note
The doc's "3 of the 9" and "at least 5 stay eligible" figures are tied to the current pool size and cap, as noted in review 1.

## Coverage
Delta diff, `docs/starcraft-helper.md`, and `pages/apps/starcraft-helper.js`. No UI inspection, since the diff is docs only.
