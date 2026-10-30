# SGS-011 ticket report

Path: tickets/SGS-011-api-models-army-resolver-error.md
Risk: standard. Dependencies: none. Size: ~0 logic lines (delete 2-line file, edit docs and two acceptance tests).
Finding: the model already lives in lib/combat-simulator/army.ts and nothing imports pages/api/models/army.ts, so deleting it is enough. Only references: openapi.json description, ARCHITECTURE.md, and two acceptance tests (caps expects 500, spec-surface expects the description to mention the path). Factory files also need edits after merge.
Open questions: none; note CONTEXT.md decision "stays where it is" is superseded, owner should be told.
