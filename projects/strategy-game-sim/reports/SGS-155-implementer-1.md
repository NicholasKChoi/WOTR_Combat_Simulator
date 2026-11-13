# SGS-155 implementer report 1

- Ticket SGS-155, branch `sgs-155-aoe4-data-freshness-workflow`, tip `bf73e7ff43b1683a60340dbc788477665fa5bca5` (base origin/main 41b3ed3), worktree `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-155-aoe4-data-freshness-workflow`.
- Status: needs_review

## Files
- `data/aoe4-build-order/snapshot-source.mjs` (new): REPO, KINDS, CIV, `filterEnglish`, `getJson(url, fetchImpl = fetch)` (User-Agent, non-OK throws, `GITHUB_TOKEN` sent only to `https://api.github.com/`), `rawKindUrl`.
- `data/aoe4-build-order/check-freshness.mjs` (new): pure `compareSnapshot`, `checkFreshness(snapshot, fetch)` returning `{code, message}`; CLI only when run directly. Exit 0 fresh, 1 stale, 2 unreachable/error. Reads english.json, never writes.
- `data/aoe4-build-order/refresh-snapshot.mjs`: imports shared constants/helpers; flow, args, output unchanged.
- `.github/workflows/aoe4-data-freshness.yml` (new): schedule (`0 9 * * 1`) + workflow_dispatch, `contents: read`, checkout, Node 24, runs the script with GITHUB_TOKEN.
- `data/aoe4-build-order/README.md`: file table rows for both new files, new "Checking for staleness" section with exit codes.
- `lib/aoe4-build-order/check-freshness.test.ts` (new): 19 tests, collected by vitest; `include` unchanged.

## Tests
- `npx vitest run lib/aoe4-build-order/check-freshness.test.ts`: 19 passed. `npm test`: 82 files passed, 1 skipped; 2523 passed, 15 skipped, 0 failed.
- Invariants encoded: added/removed/changed entry in each of the 4 kinds is stale and names the kind; ids added/removed/changed reported; order-only is stale; `fetchedAt` and commit sha ignored; different upstream commit with identical English content is fresh; content fetched at the sha from `commits/HEAD`; non-OK head, non-OK kind, and thrown network error give code 2 (not fresh/stale); stale message holds both shas, the differing kind only, README pointer; `filterEnglish` keeps only `en`; token only to api.github.com; check script and shared module contain no write calls; both scripts import from `snapshot-source.mjs` and do not define the constants (source-text test).
- Importing both `.mjs` modules in the test is the no-side-effect proof (no exit/network/write).
- Pre-existing tests edited: none.

## Mutation checks (all undone, tree clean afterward)
- `check-freshness.mjs` `KINDS.map` to `KINDS.slice(0,3).map`: failed "is stale naming upgrades ... upgrades added".
- `isDeepStrictEqual(committed, upstream)` made order-insensitive: failed "is stale when only the order of a kind changes".
- `rawKindUrl(latest, kind)` to `"main"`: failed the fetch-at-returned-sha test.
- catch returns `EXIT_FRESH`: 3 unreachable-code tests failed (expected +0 to be 2).
- stale decided by `latest !== commit`: failed the identical-content-fresh test.
- token header sent to every URL: failed "sends the token only to the GitHub API".
- `filterEnglish` returns all: failed filter, stale-message and fresh tests.
- The "no write calls" and "imports shared source" text tests were not mutated individually (the latter was failing once on first run because a usage comment mentioned the repo; regex narrowed to the quoted constant).

## Doc claims
- README "Checking for staleness": resolves latest commit via `check-freshness.mjs:checkFreshness` (`commits/HEAD`), compares per kind via `compareSnapshot` (`isDeepStrictEqual`, `source` unused); "It writes nothing" (no write calls, test-checked); exit codes 0/1/2 from `EXIT_*`; "runs it weekly and on manual dispatch" from the workflow triggers.
- README table rows: "read-only comparison", "not imported by the app" (no app import; grep).
- Code comments: `snapshot-source.mjs` header, `check-freshness.mjs` usage/exit codes and the `compareSnapshot` doc line ("`source` and commit shas are ignored": `diffKind` only reads kinds).

## Checks
- codegen: not set. `npx next build`: passes. `npx tsc --noEmit` and `npm run lint:dup`: pass (0 clones). `npm test`: pass.
- Refresh script with no args: prints the same usage line, exit 1 (run).
- Check script CLI in this sandbox: network is blocked, printed `Could not check aoe4world/data for updates: fetch failed`, exit 2 (a live fresh/stale run could not be reproduced here).
- Workflow YAML: parsed with PyYAML; triggers are exactly `schedule` and `workflow_dispatch`, permissions `{contents: read}`. `actionlint` not installed.
- The workflow cannot run before merge; manager to dispatch it once after merge and confirm it passes (fresh) or reports a real diff.

## Invariants
- A1 upheld: the check only reads `english.json`; no game numbers added.

## Unverified assumptions (already in ticket; no additions)
- GitHub API and raw.githubusercontent.com unauthenticated reads, faked by `fakeFetch` in the test. `GITHUB_TOKEN` Authorization on the API call is also faked, not verified live.

## Out-of-scope findings
- None. Note for the manager's On merge step: REPO.md CI behavior and the `babysit` comment still need the rewording the ticket lists.
