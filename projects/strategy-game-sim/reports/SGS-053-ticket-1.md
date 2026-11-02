# SGS-053 ticket author report

File: projects/strategy-game-sim/tickets/SGS-053-aoe4-m2-doc-wording.md

Docs-only root ticket, component aoe4-build-order, no dependencies, risk low, ~36 lines of prose, 0 business logic.
Covers all eight docs/aoe4-build-order.md items and four design/M2.md items from the design's "Left to tickets" M3.8 list.
Each item was checked against main (f078c11) code; cites in Scope.

Findings during exploration:
- design/M2.md is state-branch only (not in origin/main), so the PR cannot carry it. Handled via On merge: manager applies the four M2.md edits on code-factory-state.
- "shaft-mining" is wrong as an unmodeled example because it has an overlay row (supported); admiralty is the unmodeled one, per existing tests.
- The doc already states "JSON start issue carries neither" in the Issues paragraph; the gap is the Route 400 bullet, which omits start cases.
- "Any other failure" is inaccurate: thrown fetch/parse errors show a different text (page :63).
- openapi.json issue-location text is already correct; left out of scope.

Criteria with commands were run against current files: shaft-mining 1/admiralty 0 in doc; 'any other HTTP failure' 0; diagram edge 0; M2.md shaft-mining 1, EffectState 0, "start: {}" 1.
Diagrams: none (single-component, doc only). Open questions: none. Overlap: later M3 tickets edit the same doc, hence root ordering.
