# SGS-124 ticket (re-spec 2)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-124-page-library-select-edited-marker-discard-guard.md

## Summary

SGS-124 "Wire the build library into the page: grouped select, edited marker, discard guard and `?n=` / `?b=` loading", component aoe4-build-order, about 340 business-logic lines, Risk high, depends on SGS-114, SGS-122, SGS-123. Covers M8.1 client, M8.6 (no ref write during render, `?b=` keeps other keys) and M8.9. Rewritten in place for spec-gate 1:

- Blocking gap fixed: the `initialB` search criterion is now `git grep -nw "initialB" -- pages components` (word match, so `initialBuildQuery` from Scope does not hit), plus a rule that every `.current =` in the page is in an event handler or effect (review check). Checked at origin/main: `-w` finds the `initialB` ref lines today; the only other `.current =` writes are `pinTouched` in `pinShownRun` and `unpin` (handlers).
- Note 1 (busy before ready): Scope now says `busy` is false while `initialQuery` is `null`, matching main's `savedLoadInFlight`. `hold` still covers `null`. New `(respec 2)` spec criterion: a no-query page never shows `aria-busy="true"` or `disabled` on the select (checked at DOMContentLoaded and through a MutationObserver until the first run ends).
- Note 2 (effect ordering): new Scope bullet saying every `entries` change is a functional update that adds or replaces by key. New `(respec 2)` spec criterion: a gated `?n=` shared load released after the seeded My builds group shows leaves both groups intact.
- Design revision read: C6 now lists `templateEntries` and `mineEntries` builder rows (`mine` entries have `loaded: null` until fetched), and `readMyBuilds` sorts by instant. Both match the ticket as written. The other revisions (ids, split scroll, Save as copy rows) do not touch this ticket.
- Appended `## Re-spec 2 - 2026-11-10`. Lint passes.

## Diagrams

One state diagram for the select and load flow, unchanged.

## Open questions

None.

## Overlap

SGS-125 (Save panel rewrite) extends `aoe4-my-builds.spec.ts` and may add page refs. The new handler-or-effect rule for refs applies to whichever ticket merges first, so it does not conflict.
