# SGS-152 ticket report

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-152-docs-pinned-color-and-blob-importers.md
Title: SGS-152: Fix two inexact doc statements (pinned line colour, @vercel/blob importers)
Type Chore, Risk low, Component aoe4-build-order, Depends on none, Milestone none, On merge none.

Both wording issues still exist at origin/main (neither was fixed by SGS-138/141):
- docs/aoe4-build-order.md pinned-run paragraph still says "in the same color as the current series with that key"; pinnedColor in chart-rows.ts falls back to a palette colour for pinned-only series.
- ARCHITECTURE.md storage row still says blob-build-store.ts is "the only file that imports @vercel/blob"; four test files in lib/aoe4-build-order/ import it too.

Docs-only, ~0 LOC, no diagram, no open questions. Lint passes.
