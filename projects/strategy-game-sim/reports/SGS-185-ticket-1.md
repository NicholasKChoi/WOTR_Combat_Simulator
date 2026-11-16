# SGS-185 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-185-docs-desktop-only-page.md (ticket-lint clean)

Summary: "Document the desktop-only AoE4 page, its supported width and below-minimum behavior". Docs, M10, aoe4-build-order, Risk low, about 60 lines of prose, depends on SGS-184. Scope lists each untrue statement in `docs/aoe4-build-order-ui.md` (768 px run-bar breakpoint, tabs and their keyboard model, live layout switch, tabs first paint, "Narrow layout:" paragraph, 768 px editor compactness, step-row cards, tabs clause in open flags, 400 "Results enabled only by a pinned run", wrapping save row, `?b=` Results-selected sentence), the new below-minimum statement, and one `ARCHITECTURE.md` Rules bullet. Criteria cover the doc end state, the below-minimum text (including the centered `Layout` container with the section overflowing right and the viewport-wide header, per the SGS-184 report), resize and server-render statements, docs-only diff, and a rule that claims follow the code at SGS-184's tip.

On merge: REPO.md "AoE4 build order" review-checklist replacement (screenshots 1200/1280/1800, 390 only for below-minimum; sticky at least 60% of 1200x800 and 1280x720; editor at least 50% at 1200 and 1280; layout and chart checks at 1200/1280/1800; drop the 360x760, 390, 700, 768 checks).

Diagrams: none. Open questions: none. Overlap: none; it only follows SGS-184 (which leaves docs to it).

Notes:
- Doc grep at origin/main 6411526: the only "first paint" hits are the tabs sentence (to fix) and the chart-layout localStorage sentence (true, kept). "narrow" also appears for the annotation gutter ("narrow annotation column"), which stays. The ticket's grep criterion spells out both exceptions.
- The tabs/768 statements sit only in `docs/aoe4-build-order-ui.md`; `ARCHITECTURE.md` has no such statement, only the new bullet is added. Other docs hold none.
- The REPO.md edit is a factory file applied by the manager on merge; the ticket does not touch it.
- Did not read SGS-184's branch tip (not built yet); the ticket tells the implementer to verify claims there. Commands run: git fetch origin, reads at origin/main, ticket-lint. No scratch checkout made.
