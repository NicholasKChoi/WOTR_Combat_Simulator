# SGS-167 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-167-move-linendys-to-acceptance-helpers.md

Summary: Chore, component aoe4-build-order, Milestone none, Priority low, Risk low, about 60 lines of test code, no dependencies. Moves `lineEndYs` from `acceptance/aoe4-chart-views.spec.ts` into `acceptance/helpers.ts`, adds one general one-evaluate layout reader, and applies it where specs compare layout values read in separate calls. Sites found (examples): pin-compare (two `boundingBox` width reads, one inside `expect.poll`), chart-views (`drawn` pairs), gathered-resources (two `getAttribute('d')`), compact-view (legend bottom vs textarea top). Reads split around an action keep two reads, each one evaluate. Criteria: typecheck/dup lint, same-evaluate rule, assertions unchanged, affected specs pass under `npm run acceptance`, Buildings tests unchanged.

Diagrams: none (single-component, outside core loop).
Open questions: none.
On merge: update REPO.md exemplars entry for chart-views, which cites `lineEndYs` as spec-local.
Overlap: none found with open tickets (SGS-163 touches an acceptance test but a different one; not checked in depth).
Lint: ticket-lint.py passed. No scratch checkout made, no commands run against the code beyond reading origin/main.
