# StarCraft Helper: page behavior

The StarCraft helper is matchmaking for a small group of friends: a random 1v1 pairing, and a random map
pick from a map pool with strikes. The page is `/apps/starcraft-helper`, implemented in
`pages/apps/starcraft-helper.js`. Everything runs in the browser: there is no API and nothing is saved, so a
reload clears the pairing, the strikes and the shown map. This doc is the reference for what the page does.

## Player list and map pool

The page holds two hard-coded lists, `partnerArray` and `mapArray`.

Players (`partnerArray`): matthew, nick, daniel.

Maps (`mapArray`): Alcyone, Amphion, Crimson Court, Dynasty, Ghost River, Goldenaura, Oceanborn, Post-Youth,
Site Delta.

The repo records no source, ladder season or date for either list, and this doc supplies none. To update a
list, edit the array; no other code changes, as long as the player list keeps at least 3 names and the map
pool at least 5 maps. With fewer than 3 players there is a single pairing, so every Fighter Select click
after the first would never end; with 4 or fewer maps, 3 strikes plus the shown map can ban every map, and
Map Select shows `FAILURE`.

## Fighter Select

The Randomize button in the Fighter Select card (`GetNewPartners`, `GetVsText`) draws two of the three
players and shows them sorted by name as `a vs. b`, so a pairing never appears in both orders. There are
three possible pairings.

A click never shows the same pairing as the one currently shown: `GetNewPartners` draws again until the draw
differs. The first click has no previous pairing, because the shown text starts as the empty string.

The draw repeats until it differs, with no cap on the number of draws. It ends because the list yields more
than one pairing and each draw is random, so it ends with probability 1 rather than after a fixed number of
draws. With a list that yields a single possible pairing, every click after the first would never end.

## Map Strike

The Map Strike card (`handleCheck`) has one checkbox per map, all unchecked at the start. Checking a box
strikes the map and its label is shown struck through (`checkedItem`); unchecking restores it.

Once three boxes are checked, every unchecked box is disabled; unchecking one re-enables the rest. So at most
3 of the 9 maps are struck. The cap is in the card's `disabled` rule, not in the map picker.

Striking a map does not clear a map already shown in the Map Select card.

## Map Select

The Randomize button in the Map Select card (`getMapText`) picks uniformly among the maps that are neither
struck nor equal to the map currently shown: the shown map is added to the banned list. So a click never
repeats the shown map and never picks a struck map. The first click has no previous map, because the shown
text starts as the empty string.

A map struck after it was picked stays on screen until the next click.

### All maps banned

`getMapText` returns the string `FAILURE` only when every map is banned. The page cannot reach this: at most
3 maps are struck, and with the shown map that bans at most 4 of the 9, so at least 5 stay eligible.
`FAILURE` is a code-level fallback, not a message a user can meet.

Raising the strike cap to 8 or more would make the case reachable. The page would then have to tell the user
plainly that no map is left, instead of showing `FAILURE`.

## Shared code

The picks use `shuffle` from `utils/utils.ts`, and the page renders inside the shared `Layout` component.
Their behavior is defined where they live, not here.
