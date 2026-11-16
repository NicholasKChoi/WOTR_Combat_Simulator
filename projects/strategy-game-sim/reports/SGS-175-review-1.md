# SGS-175 review 1

- Branch: sgs-175-starcraft-helper-design-doc, tip 37f1d24e742e527d4d816086ead6c24bc03cd45e, base origin/main. Full review.
- Ticket type: Docs.
- **Verdict: REQUEST CHANGES** (two text-only fixes, both `(text)`)

## Blocking findings

1. `docs/starcraft-helper.md:17-18` - contract (text) - "To update a list, edit the array; no other code changes." claims that any edit to an array is enough. The code only supports that at some list sizes. `GetNewPartners` (`pages/apps/starcraft-helper.js:43`) loops until the pairing differs. With fewer than 3 players there is one possible pairing, so the second Fighter Select click never returns and the page hangs. The strike cap is the literal `checked.length > 2` (`:105`), and `getMapText([...checked, map])` (`:126`) bans the struck maps plus the shown one. So with 4 or fewer maps, three strikes plus the shown map ban every map, and the footer shows `FAILURE` (`:37`). That breaks H2 and makes the doc's own "The page cannot reach this" section false. This matters because the doc is the reference for the REPO.md Starcraft checklist, which treats map-pool and player-list updates as data-only changes that need no logic review. The sentence as written would pass a pool shrink that ships `FAILURE` or a hang. Direction: replace the sentence "To update a list, edit the array; no other code changes." with exactly:
   "To update a list, edit the array; no other code changes, as long as the player list keeps at least 3 names and the map pool at least 5 maps. With fewer than 3 players there is a single pairing, so every Fighter Select click after the first would never end; with 4 or fewer maps, 3 strikes plus the shown map can ban every map, and Map Select shows `FAILURE`."
   Facts kept: a list is updated by editing its array; no other code changes (now qualified by size). Checked against the code: 3 players give 3 pairings (fine). 2 players give 1 pairing, and so does 1 player (`"x vs. undefined"` every draw), so the second click loops forever. 5 maps leave at least 1 eligible map after 3 struck plus 1 shown. 4 maps leave 0.

2. `docs/starcraft-helper.md:31` - contract (text) - "A list with a single possible pairing would never end." is false for the first click. On the first click `partners` is `''` (`pages/apps/starcraft-helper.js:65`), so any draw differs and `GetNewPartners` returns. Only clicks after the first loop forever. The doc's previous paragraph says the first click has no previous pairing, so this sentence contradicts it and suggests the page hangs at once. Direction: replace "A list with a single possible pairing would never end." with exactly:
   "With a list that yields a single possible pairing, every click after the first would never end."
   Facts kept: with a single possible pairing the loop does not end (now limited to the clicks where it is true).

## Spec gaps

None.

## Acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Doc exists and every sentence is true of `pages/apps/starcraft-helper.js` at the tip | **fail** | Doc exists. Lines 17-18 and 31 say more than the code makes true (findings 1 and 2). I checked every other sentence against the code and found it true. Uniform pick: `getMapText` returns the first non-banned entry of a Fisher-Yates `shuffle` (`utils/utils.ts:1-18`, correct bounds). Sorted pairing: `.slice(0, 2).sort()` (`:14`). Disabled rule: `:105`. Struck-through label: `styles/utils.module.css:60-62` `text-decoration: line-through`. Shown map banned: `:126`. Strikes leave the shown `map` state alone: `handleCheck` only sets `checked`. Raising the cap to 8 makes the case reachable: 8 struck plus 1 shown = 9. |
| Player list and map pool exactly as the arrays; no source or season named | pass | Doc lines 12-15 match `:11` and `:18-22` in order and spelling. Line 17 says the repo records no source, season or date, and the doc names none. |
| Each control described with its edge states | pass | Fighter Select: no repeat, empty initial state (lines 26-27). Map Strike: unchecked at start, cap 3 of 9, others disabled, unchecking re-enables (lines 35-39). Map Select: no repeat, no struck pick, empty initial state (lines 45-48). |
| All-struck `FAILURE` unreachable through the UI, with the reason; not presented as a user-visible message | pass | Lines 54-59: at most 3 struck plus 1 shown = 4 of 9, so at least 5 stay eligible. "a code-level fallback, not a message a user can meet." True for the 9-map pool at the tip. |
| Fighter Select retry ends only while more than one pairing is possible; nothing contradicting H1-H3 | pass (wording fix in finding 2) | Lines 29-31 say the draw ends with probability 1 because there is more than one pairing. Lines 58-59 restate H2's "tell the user plainly". Line 45 "uniformly" matches H3. The overstatement in finding 2 is about click timing, not H1. |
| (respec 1) PR changes only the doc and the README StarCraft Design doc cell, linking the doc | pass | `git diff --stat origin/main...HEAD`: `README.md` 1 line changed (row at line 14, same `[docs/x.md](docs/x.md)` form as the other rows) and `docs/starcraft-helper.md` new. No code or test files. |
| No INVARIANTS.md regressions | pass | No code changed. |

## Invariants touched

- H1 (Randomize never repeats; bounded when only one result is possible): code unchanged. The doc describes the unbounded loop honestly and does not claim H1 holds for a single-pairing list. Holds as far as the docs-only diff goes.
- H2 (struck map never picked; plain message when all struck): the doc states the `FAILURE` fallback is unreachable at the current cap and pool size, and says what a reachable case would need. Finding 1 adds the pool-size condition the doc leaves out.
- H3 (uniform randomness): the doc points to the shared `shuffle` and does not restate its rules. `shuffle` is a correct Fisher-Yates.

## Scope and spec checklist

- Out of scope: CONTEXT.md marks the StarCraft helper frozen. The ticket records the owner's exception for this Docs-only change (Q107). No code under `pages/apps/starcraft-helper.js` or `utils/` changed, and nothing touches `golang/`.
- spec-checklist: the Scope and Naming items apply and pass. No invented constant: no source or season was supplied. The Contracts, Site-wide, and H1-H3 sections are keyed to code paths the diff does not touch.
- Docs type: the diff contains no code change.

## Lint

`npx tsc --noEmit && npm run lint:dup` was run in the scratch checkout after `link-node-modules.sh`. tsc was clean and jscpd found 0 clones. No findings.

## Bot reconciliation

No `reviewBot.cli` and no `rulesFile` in REPO.md. Section skipped.

## Conventions

- Doc shape matches its siblings. The title follows the `<App>: page behavior` form of `docs/aoe4-build-order-ui.md:1`. The intro ends with a "This doc is the reference for what the page does" sentence, as at `docs/aoe4-build-order-ui.md:6`, and uses short sections like `docs/combat-simulator.md`.
- The README cell uses the same link form as rows 12-13. No shipped-artifact hygiene problems: no ticket ids, invariant numbers, or factory pointers in the doc or the commit message.

## Non-blocking notes

- The doc's "3 of the 9" and "at least 5 stay eligible" figures are tied to the current pool size. Whoever edits `mapArray` must update them too. Finding 1's text covers the behavior, not this bookkeeping.
- Out of scope, already in the implementer's report: `getMapText` bans the initial `''` map value, which is harmless. `DEFAULT_MAP_POSITION` is unused, and the doc correctly leaves it out.

## Coverage

- Reviewed: `docs/starcraft-helper.md` (all 64 lines, each sentence against the code), the `README.md` diff, `pages/apps/starcraft-helper.js`, `utils/utils.ts`, and `styles/utils.module.css` (`.checkedItem`).
- Checked against: INVARIANTS H1-H3, spec-checklist, LESSONS (no entry matches these paths), CONTEXT Design docs and Out of scope, the REPO.md Review checklist (Every diff, Starcraft helper), and the implementer's Doc claims list (`SGS-175-docs-1.md`).
- Not run: the REPO.md "Every diff" `next build` and page load. The diff changes only Markdown, so no page or component output can change. The UI inspection did not run for the same reason. The Starcraft helper checklist's click-through was done by reading the code, since the code is unchanged.
