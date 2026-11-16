# Simplify SGS-169 (pass 1)

Result: no change. Tip stays 372f015b2be340b989b9da76d7bd7a3a0fe5b799.

Reviewed the diff against origin/main (11 files: Severity/SEVERITIES, research.ts severities, tests, docs, openapi).
Loaded common.md, LESSONS.md (Playwright-only rule, not touched), styleSources (ARCHITECTURE.md, tsconfig.json).

- Reuse: nothing duplicated; messages.ts already filters on warning/info so debug drops out with no code change.
- Simplification: the diff is minimal, with no new helpers or abstractions.
- Comments: none added in code; doc text states each fact once.
- Tests: three new messages tests each cover a distinct failure (list filtering, empty render, toggle count); no cases to merge.
- Unit tests run (messages, research, model): 3 files, 65 passed. No browser or e2e tests run.
