# SGS-074 ticket report 1

File: tickets/SGS-074-aoe4-m4-docs-audit-playwright.md
Title: Audit the M4 docs and OpenAPI against the code and add the M4 Playwright flow. Component aoe4-build-order, milestone M4 / M4.14, risk standard, base main. Size: 0 business logic, about 120 lines of test code plus audit fixes.
Depends on SGS-056..SGS-073. Diagrams: none (single-component test/prose).

Scope: (1) docs audit with greps (5 stale phrases found today, one each; Route section; bounds row; path check), (2) OpenAPI end-state jq checks (today 1.0.0, text present, no suggestion, 3 warning variants), (3) new acceptance/aoe4-build-order-m4-flow.spec.ts: flow test (tabs, info list, inline error with suggestion, pin survives reload) and a 390 px test.

design/M2.md: designer had not fixed line 222. I edited it directly on the state branch (uncommitted): 222 reworded to C5 behavior, plus stale line 210 ("Entry (age, tier) is fixed at payment") and line 76 (UnitSeries counts "cumulative, produced only"). Manager should commit it.

Open questions: designer, SGS-073 not on disk (no ticket file, no graph row), so the 390 px test is written without its Scope; implementer drops it if SGS-073 already asserts whole-page scrollWidth with pin and compare shown.
Overlap: SGS-066 (tabs), SGS-067 (inline error, info list), SGS-072 (pin reload), SGS-068 (390 px step cards) cover pieces; this spec is the cross-feature journey. Check commands run on origin/main d5c2549: the grep and jq values in the criteria. Mutation criterion not run (code not yet existing).
