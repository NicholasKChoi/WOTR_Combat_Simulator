# SGS-011 acceptance: PASS

Branch sgs-011-api-models-army-resolver-error at 9336369 (checked out as sgs-011-acc in own worktree). No commit added.

No new tests: the branch's caps 404 test and spec-surface tests (OpenAPI 3.1, paths == ['/api/fight'], description not containing the path) already cover every criterion observable through the HTTP boundary. Adding more would either duplicate them or require a new file containing the path string (forbidden by AC1).

Verified directly:
- pages/api/models/ gone; `git grep models/army` over pages lib components acceptance docs ARCHITECTURE.md: exactly 2 matches (caps spec:132 request URL, spec-surface:26 not-contain). Caps title is path-free.
- Diff vs 96d2602: only ARCHITECTURE.md, 2 acceptance specs, docs/api/openapi.json, deleted army.ts. Nothing under lib/ or pages/api/fight.ts.
- npx tsc --noEmit: clean. npm test: 57 pass. npm run acceptance: 209 pass (Playwright starts its own server; no dev server left running).
- Not run: manual curl against npm run dev (covered by the caps test under Playwright).

Failures: none.
