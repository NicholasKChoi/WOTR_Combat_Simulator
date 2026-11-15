# SGS-166 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-166-doc-acceptance-hover-focus-scroll-rule.md

Summary: Docs ticket, component site, about 4 lines, no dependencies. Adds one bullet to the Rules section of ARCHITECTURE.md (a styleSource that already names acceptance/ and acceptance/helpers.ts). The bullet states that acceptance tests scroll hover and focus targets into view instantly before the sequence, because Playwright hover()/focus() smooth-scroll and late pointerenter events change state after an assertion passed. It names scrollInstantly in acceptance/helpers.ts and acceptance/aoe4-build-order-step-band.spec.ts as the examples; both exist at origin/main. A repo doc is possible, so a ticket was written.

Diagrams: none (one-line statement). Open questions: none. Lint: ticket-lint printed no errors. Overlap: none; LESSONS.md already holds a related rect-reading entry, which is untouched. BACKLOG.md and TASK-GRAPH.md not edited. No scratch checkout was made.
