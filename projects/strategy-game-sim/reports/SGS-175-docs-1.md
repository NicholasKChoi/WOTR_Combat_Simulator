# SGS-175 docs report 1

- Ticket: SGS-175. Branch: sgs-175-starcraft-helper-design-doc. Tip: 37f1d24e742e527d4d816086ead6c24bc03cd45e
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-175-starcraft-helper-design-doc
- Status: needs_review

## Docs touched
- docs/starcraft-helper.md (new, 64 lines)
- README.md: StarCraft helper row Design doc cell `none` -> link to the new doc

## Doc claims (all from pages/apps/starcraft-helper.js unless noted)
- "no API and nothing is saved ... reload clears": only useState, no fetch/storage (whole file).
- Lists: `partnerArray`, `mapArray` as quoted (verbatim order).
- "To update a list, edit the array; no other code changes": strike cap uses a literal `checked.length > 2`, not the array length. The strike cap and the "3 of 9" claim would need a change if the map count changed.
- "sorted by name as `a vs. b`": `GetVsText` slice(0,2).sort(), template string.
- "three possible pairings": 3 players choose 2.
- "never shows the same pairing ... draws again": `GetNewPartners` while loop.
- "first click ... empty string": `useState('')` for partners and map.
- "no cap on draws ... probability 1 ... single pairing would never end": while loop has no counter; `shuffle` is random.
- "one checkbox per map, unchecked at start; struck through (`checkedItem`)": mapArray.map, `useState([])`, styles/utils.module.css `.checkedItem { text-decoration: line-through }`.
- "Once three are checked every unchecked box is disabled": `disabled={checked.length > 2 && !checked.includes(item)}`.
- "cap is in the disabled rule, not in the picker": `getMapText` has no count check.
- "Striking does not clear a shown map": handleCheck touches only `checked`.
- Map Select: `getMapText([...checked, map])` bans struck plus shown; picks first non-banned of a shuffle (uniform via utils/utils.ts `shuffle`, Fisher-Yates).
- "`FAILURE` only when every map is banned; at least 5 of 9 stay eligible": return after loop; 3 struck + 1 shown = 4.
- "Raising cap to 8 or more": 8 struck + shown = 9 banned.
- "page renders inside shared Layout", `shuffle` from utils/utils.ts: imports.

## Removed claims
None (new doc; README `none` replaced).

## Not described
`DEFAULT_MAP_POSITION` (unused), per ticket.

## CONTEXT.md Design docs rows
StarCraft helper row: Doc cell -> `docs/starcraft-helper.md` on main (no longer deferred). Plus the other On merge items in the ticket (CONTEXT Out of scope, REPO.md checklist, BACKLOG item).

## Checks
- commands.lint (tsc + jscpd) not run: only Markdown changed. codegen: none configured.
- Links: README link `docs/starcraft-helper.md` resolves (file exists in the diff). The doc has no other links.
- `git diff --stat origin/main...HEAD`: only README.md (1 line) and docs/starcraft-helper.md.

## Out-of-scope findings
- INVARIANTS H2 says the app must tell the user plainly when every map is struck, and the code returns "FAILURE"; the doc records this as unreachable at the 3-strike cap. Unreachable, so not a live bug.
- Map Select adds the shown map (initially `''`) to the banned list, harmless.
