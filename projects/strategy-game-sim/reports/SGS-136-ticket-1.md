# SGS-136 ticket report

File: tickets/SGS-136-simulate-production-buildings-series.md (lint clean)

Summary: "Emit production buildings over time from the simulator (OpenAPI 2.6.0)", component aoe4-build-order, Task, risk high (criticalPaths `simulateBuildOrder`, public response and OpenAPI bump), about 80 business lines, depends on SGS-128, On merge none. Scope: `BuildingSeries` and `SimulationResult.productionBuildings` in `model.ts`, new `production-buildings.ts` (C9), snapshot of `engine.buildings` in the `simulateBuildOrder` sampling loop, OpenAPI 2.6.0 with examples, `acceptance/openapi-schemas.ts`, the version-pin specs (builds, named-builds, gathered-resources, issue-shape), the contract spec key list, fixtures that build a `SimulationResult`, and the docs result-field list. Criteria cover the ID set, series shape and length, completion timing, variants, ordering and tie-break, no series for never-built, determinism (A3), the API contract, docs, and no change to existing series.

Diagram: one flowchart (read, act, record) of the sampling loop.

Open questions: none. Design questions 8 and 9 in the plan (name rule across variants, minor-bump argument) are answered by design C9 and the Behavior rules, so they are folded in.

Overlap: SGS-137-or-later view ticket (outline J) reads this field; it is out of scope here. No overlap with other tickets found. Specs pinning 2.5.0 are also touched by any other ticket that bumps the version; none known.
