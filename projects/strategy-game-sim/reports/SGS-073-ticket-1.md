# SGS-073 ticket report
File: tickets/SGS-073-aoe4-mobile-390.md. M4.13, risk low, aoe4-build-order, about 120 lines (CSS, no logic), depends on SGS-066..072.
Scope: workbench.module.css and results.module.css (step-table.module.css from SGS-068 stays), 390 px no-scroll rule, scroll boxes with min-width 30rem, new acceptance/aoe4-narrow-layout.spec.ts, docs Page paragraph.
No diagram. Open questions (designer): 30rem min-width and 768 breakpoint; whether all workbench classes or only narrow-layout ones move into modules.
Not run: criteria depend on code from unmerged tickets; the criteria commands that exist today (ls of module.css = none) were checked against origin/main.
