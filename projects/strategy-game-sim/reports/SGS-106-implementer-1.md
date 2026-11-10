# SGS-106 implementer report 1

Status: needs_review
Branch: sgs-106-smoke-preview, tip 5bdd00ad3cca9baaf314fd641c65046eaae90414 (one commit on origin/main 66354ac)
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-106-smoke-preview

## Files
- scripts/smoke-preview.mjs (new, 186 lines): the smoke script.
- package.json: `smoke:preview` script beside `acceptance`.
- ARCHITECTURE.md: one `Scripts` row.
- docs/aoe4-build-order.md: "Saving a build from a script" and "Checking a deployment with the smoke test" (####, after "Saving a build and opening it by link").
- acceptance/smoke-preview.spec.ts (new): 15 cases, stub servers in the test process, script run via execFile.
- No lib/, components/, pages/, data/, openapi, or package-lock change. No `agent` or "only from the page" sentence in the doc needed fixing (grep found none).

## Tests
- `npx playwright test acceptance/smoke-preview.spec.ts`: 15 passed.
- Full `npm run acceptance`: 863 passed. `npm test`: 1857 passed, 10 skipped. `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones. `npx next build`: ok.
- Spec uses the absolute script path (not the relative one in the ticket) because one row runs from a temp cwd.
- Every row runs with the sentinel secret except the two "secret unset" rows, and one afterEach asserts neither stdout nor stderr of any run contains it.
- The ticket's "second request-log" criteria are pinned via `summary()` (favicon filtered).

## Mutation checks (scripts/smoke-preview.mjs, each reverted; file restored byte-for-byte)
- `newContext({ extraHTTPHeaders })`: "secret set is sent" failed on `expect(assets header).toBeUndefined()` (got the sentinel).
- compare drops `durationSeconds`: "read back differs" failed on exit code (expected 1, got 0).
- `!secret &&` removed from the 401/403 check: "secret unset, first response 401" failed (expected exit 2, got 1).
- finally-delete removed: "read back differs" failed on the request log (no DELETE).
- re-read after delete removed: "delete leaves the build" failed (expected 1, got 0).
- selected-option check removed: "open fails" failed (expected 1, got 0).
- fixture path via cwd: "runs from another directory" failed (expected 0, got 1).
- 200 treated as failure: "repeat run" failed (expected 0, got 1).
- protocol check removed: "a non-http url" failed (expected 2, got 1).
- duration 900: "all steps pass" failed on the posted-body deep-equal.
- 405 branch removed: "delete refused in production" failed on the line list.

## Local verification (real output)
Dev server on port 3777 with `BUILDS_LOCAL_DIR` set to a fresh `mktemp -d`; `npm run smoke:preview -- http://localhost:3777`:
```
PASS save: 201 8NZwU5Ld_D5
PASS read back
PASS open
PASS delete
exit=0
```
Read back passes with english-1tc.json unchanged (no stripped or defaulted field).

Second run directly after: also exit 0 with `PASS save: 201 8NZwU5Ld_D5` (same id), NOT 200. The first run deleted the build, so the second run creates it again. The ticket's "second run shows status 200" only holds when the build still exists. To show the 200 path I saved the same build first (curl), then ran the smoke: `PASS save: 200 8NZwU5Ld_D5`, four PASS lines, exit 0. The doc says only "a second run saves the same content, so it reuses the same link" (true: same id), and the spec's "repeat run" uses a stub that answers 200 as the ticket's criterion describes. The ticket criterion wording needs a correction by the manager (see findings).

The dev server was stopped after each run (serve.sh stop; port 3777 free). The throwaway dir held only `development/rate-limit/*.json` counters, no `builds/` record. The curl example from the docs ran unchanged (against port 3777) and returned `{"id":"8NZwU5Ld_D5","path":"/apps/aoe4-build-order?b=8NZwU5Ld_D5"}`; the Node one-liner printed `http://localhost:3777/apps/aoe4-build-order?b=8NZwU5Ld_D5`.

## Doc claims
- ARCHITECTURE.md `Scripts` row: text given in the ticket; `scripts/smoke-preview.mjs` imports only `node:*` and `@playwright/test`.
- "`durationSeconds` is an integer in the simulate route's bound (60 to 3600)": docs/aoe4-build-order.md line 58 table (`durationSeconds` int 60..3600).
- Status table (201/200/400/413/429/503) matches docs/api/openapi.json saveBuild responses (checked descriptions; 429 `Retry-After`).
- "sends it as the header `x-vercel-protection-bypass` to the deployment's origin only, and never prints it": `routeBypassToOrigin` (origin equality check) and `authHeaders` in scripts/smoke-preview.mjs; fetch uses the same header; no code prints the secret.
- Exit codes 0/1/2 and "A run that fails after the save still deletes the build it saved": `main` and `cleanUp`; narrowed by the 405 case, where the delete is refused and the build stays (doc says so in the production paragraph).
- "Each run costs one save of the rate limit": one POST per run (`save`); a repeat save takes a slot per the existing Builds routes section.

## Notes
- `FAIL production deployment: delete is disabled` is thrown with a null step so `report` prints it verbatim; in the `finally` cleanup a 405 prints `FAIL delete: status 405` (only reachable if step 4 did not run its own delete).
- The common.md "no curl" rule was set aside for the one docs-example verification the ticket requires.
- Environment: `npm ci` was needed in the new worktree (TMPDIR npm cache); existing Chromium 1248 worked. Background servers die between Bash calls in this sandbox, so verification ran inside one script call per server lifetime.

## Findings / for the manager
- Ticket criterion "running it a second time ... `save` line shows status 200 and the same id" cannot hold literally: the smoke deletes the build, so back-to-back runs give 201 twice. Suggest rewording for the owner's M6.8 expectation (the owner will see 201 on a repeat run, 200 only if the build was left behind).
- design/M6.md line 627 still mentions `extraHTTPHeaders` (already noted in Re-spec 3).
- The PR body must contain "Do not merge until the owner's smoke passes on this preview" and the local verification output above (not opened or pushed here).

## Stages
codegen: none set. build, lint (tsc + lint:dup), unit, full acceptance: all passed as above. Nothing left running; no processes of mine are listening.
