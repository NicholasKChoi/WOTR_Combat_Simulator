# SGS-044 ticket report (ticket-1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-044-aoe4-chart-marker-data.md

Summary: "Add chart marker data to the simulation result", component aoe4-build-order, about 70 business-logic lines,
depends on SGS-041 (G). Covers M3.10 engine side: types in model.ts, new markers.ts (researchMarkerKind, researchMarker,
ageMarker, compareMarkers), pushes in completeConstruction and the research item completion, sorted result.markers,
OpenAPI schemas, and the docs bullet. Criteria cover classification of 12 snapshot techs (checked against english.json
with a throwaway script, all match exactly one row), priority, ties, unfinished work, horizon bound, no other result
field changing, contract check, grep counts (run today: ages.push 1 site, researched.add 1 site, "markers" absent from docs)
and mutation checks (no existing check to mutate, so they are new-test mutations).

Risk: high. The plan said low, but REPO.md criticalPaths `lib/**` applies to markers.ts/simulate.ts/research.ts; the template
makes that high. Manager may overrule.
On merge: none.
Diagrams: one Mermaid read/act/record flowchart (completion path).
Open questions: none.
Overlap: research.ts line with G (SGS-041) and H (SGS-042), simulate.ts with A, C, D, H, I: rebase only. J's push reads the
entry from G's researchEntry; before G the ticket says use byBaseId[0]. SGS-049 consumes the type and field.
Notes: main is still at M2 state (f078c11), so line numbers cited are pre-A/G/D; names are the design's. The ticket's
"no other field changes" criterion's fixture wording is loose; implementer chooses the assertion form.
