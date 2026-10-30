# SGS-011 implementer report

- Ticket: SGS-011 (remove the accidental /api/models/army route)
- Branch: sgs-011-api-models-army-resolver-error (from origin/main 96d2602)
- Tip: 93363690d2766a13f468fc7838de098dc20ea368 (author choinickolas@gmail.com)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-011-api-models-army-resolver-error

## Files touched
- pages/api/models/army.ts: deleted (pages/api/models/ is now gone; only pages/api/fight.ts remains).
- docs/api/openapi.json: info.description is now "HTTP API of the strategy game simulator site."; paths unchanged (only /api/fight).
- ARCHITECTURE.md: "Existing code that predates this layout" keeps "logic and army model live in lib/combat-simulator/, and pages/api/fight.ts is its route handler."; dropped the re-export/served sentences.
- acceptance/fight-api-spec-surface.spec.ts: two description assertions replaced by `expect(spec.info.description).not.toContain('/api/models/army')`.
- acceptance/fight-api-caps.spec.ts: test retitled "the army model is not served as an API route", same request to '/api/models/army', expects 404.

## Checks
- `git grep -n "models/army" -- pages lib components acceptance docs ARCHITECTURE.md`: exactly two matches, each on one line: acceptance/fight-api-caps.spec.ts:132 (request URL) and acceptance/fight-api-spec-surface.spec.ts:26 (not-contain assertion). Caps test title has no path.
- codegen: not set in REPO.md.
- build (`npm ci && npx next build`): pass; route list shows only λ /api/fight under /api.
- lint (`npx tsc --noEmit`): pass, 0 errors.
- unit (`npm test`): 4 files, 57/57 pass. No unit tests added: the change deletes a handlerless file and edits docs/acceptance; there is no logic to unit test.
- acceptance (`npm run acceptance`): 209/209 pass, including the updated caps 404 test and spec-surface test.
- Manual: `npm run dev`, `curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/models/army` printed 404. Bodyless POST /api/fight returned 400 as before (validation path; full /api/fight behavior is covered by the passing acceptance suite). Dev server stopped; port 3000 confirmed free and no `next dev` process left.
- openapi.json parses as JSON; the spec-surface test confirms OpenAPI 3.1 and paths == ['/api/fight'].
- `git diff --stat origin/main`: only the 5 ticket-named files; no lockfile or stray changes.

## Invariants
- W1, W2: upheld. No file under lib/combat-simulator/ or pages/api/fight.ts changed.
- S3: upheld. Only the one army-route test in fight-api-caps.spec.ts changed; all other caps tests unchanged and passing.

## Not done (by instruction)
- On-merge factory-file edits (CONTEXT.md lines 22/34, INVARIANTS.md line 23, REPO.md Combat simulator Paths) left for the manager.
- Not pushed, no PR.

## Out-of-scope findings
- None.

## Status
needs_review
