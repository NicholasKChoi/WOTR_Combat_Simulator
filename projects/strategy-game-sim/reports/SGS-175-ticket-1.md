# SGS-175 ticket author report 1

Verdict: no ticket written. The item needs a decision that no code states. No file at tickets/SGS-175-starcraft-helper-design-doc.md.

## Why

The BACKLOG.md item asks the doc to cover "the map pool and player list and their source/season". `pages/apps/starcraft-helper.js` at origin/main has hard-coded `partnerArray` (matthew, nick, daniel) and `mapArray` (9 maps: Alcyone, Amphion, Crimson Court, Dynasty, Ghost River, Goldenaura, Oceanborn, Post-Youth, Site Delta). It records no source, ladder season, or date. Nothing in the repo, the PROJECT.md Purpose line, or CONTEXT.md supplies one. The doc would have to invent the source (a ticket must not answer an open question with an invented value), and REPO.md's checklist says "check the list against the source the ticket cites", so the source matters to reviews.

Risk would be standard, not low: CONTEXT.md Design docs names `docs/starcraft-helper.md` "Authoritative for player list, map pool source, strike limits, edge states".

## Owner questions to settle before a ticket can be written

1. Source and season of the map pool, and the source of the player list (a named ladder season, or "the group's own picks"). Answer is recorded in the doc and in the ticket.
2. Is the doc authoritative over the code in the cases where today's code and INVARIANTS H1-H3 disagree, or does it describe code as is? The cases:
   - H2 says no "FAILURE" placeholder. `getMapText` returns the string "FAILURE" when no map is eligible. The UI caps strikes at 3 of 9 maps (checkbox `disabled` when `checked.length > 2` and the item is not checked), so the case cannot be reached from the UI. The doc must say "all maps struck" is unreachable, or the cap is changed.
   - Map Select excludes the previous result by adding `map` to the banned list, and the Fighter Select loop retries until the pairing differs (H1). Only 3 pairings exist among 3 players, so it terminates; the doc must say this relies on at least 2 pairings.
   - The "Map Strike" label sorts names only for display (`sort()` on the 2 chosen names).
3. Staleness cleanup on merge: CONTEXT.md Design docs row (says "deferred; app frozen"), the Out of scope StarCraft bullet, and the REPO.md Starcraft helper checklist line ("pending ticket"). The ticket would list these under On merge; PROJECT.md and CONTEXT.md say the app is frozen, which allows a Docs ticket (no code change) but the owner should confirm this exception to "no tickets touch the StarCraft helper".

## Facts the ticket would rest on (read at origin/main)

- Controls: Fighter Select "Randomize" (`GetNewPartners`, repeats until the result differs from the last), Map Strike checkboxes (`handleCheck`, other boxes disabled once 3 are checked, unchecking re-enables), Map Select "Randomize" (`getMapText([...checked, map])`, skips struck maps and the previous result).
- First click has no previous result (`partners` and `map` start as the empty string).
- `DEFAULT_MAP_POSITION` is unused. `shuffle` comes from `utils/utils` (H3).
- Docs listed in no other doc: ARCHITECTURE.md has no StarCraft mention; no `docs/starcraft-helper.md` exists.

## Overlap

None with open tickets. The BACKLOG items that touch README.md (entry point rewrite) link a StarCraft design doc, so they depend on this doc's path. No scratch checkout made, no files edited besides this report.
