# SGS-155 review 1

Verdict: APPROVE. Branch sgs-155-aoe4-data-freshness-workflow, tip bf73e7f, reviewed against merge-base 41b3ed3 (local `main` is stale, so `main...HEAD` shows unrelated history; the real diff is 6 files).

## Blocking findings
None.

## Acceptance criteria
1. Comparison fresh/stale per kind (added/removed/changed, each of 4 kinds): pass. `it.each(KINDS)` in `lib/aoe4-build-order/check-freshness.test.ts` asserts stale and that `differing` names only that kind. It would fail if a kind were skipped (`compareSnapshot` maps `KINDS`) or if only the sha were compared.
2. Different commit with identical English content is fresh, `fetchedAt` alone is fresh, order-only is stale: pass. The fake upstream adds a `fr` entry, so the filter is exercised. The order test reverses the units, and the mutation would be an order-insensitive compare.
3. Unreachable/non-OK gives exit 2 with the message "Could not check ...", distinct from stale (1) and fresh (0); content fetched at the sha from `commits/HEAD`: pass. Three cases are tabled (head non-OK, kind non-OK, thrown). The test asserts the exact raw URLs at `LATEST`.
4. Import purity and no writes: pass. The CLI block is guarded by `import.meta.url === pathToFileURL(argv[1]).href`; the tests import both modules; a source-text test bans write calls.
5. No local constants in either script, `refresh-snapshot.mjs` behavior unchanged: pass. The diff shows the constants and `getJson` removed from refresh and imported; the usage and arg check are untouched. The source-text regex test covers both scripts.
6. Tests are `.ts` under `lib/`, collected by vitest, `include` unchanged: pass (diff touches no vitest config). I did not run the tests. The implementer's reported counts are 19 in the file and 2523 passed overall.
7. Workflow YAML: pass by reading. The triggers are only `schedule` and `workflow_dispatch`, permissions are `contents: read`, Node 24, and GITHUB_TOKEN is passed. The implementer's PyYAML parse is recorded; actionlint was unavailable.
8. Post-merge `workflow_dispatch` run: unverified (cannot run pre-merge); the manager verifies the first run.
9. README: pass. It adds the table rows and the "Checking for staleness" section with the exit-code meaning, and no sentence claims there is no freshness signal. The README claims match the code: exit codes, `source` ignored, writes nothing, weekly plus dispatch.
10. `npx tsc --noEmit` and `npm run lint:dup`: pass (I ran them; 0 clones). `npm test` was not re-run by me (the implementer reported it passing).
11. Invariants: A1 holds. The check only reads `english.json`; no write calls.

## Type check (Chore)
No behavior the owner sees changes, and no pre-existing test is edited (diff adds only a new test file).

## Bot
No `reviewBot` CLI or rules file configured; skipped.

## Non-blocking notes
- `check-freshness.mjs`: the head lookup uses `snapshot.source.repo`, but the raw content URLs use the shared `REPO`. These agree today; if `source.repo` ever differed, the sha would come from one repo and the content from another. Consider `rawKindUrl(repo, commit, kind)` or deriving both from one value.
- `snapshot-source.mjs` `getJson`: the User-Agent changed from `refresh-snapshot` to `aoe4-snapshot`, and refresh now also sends `GITHUB_TOKEN` to api.github.com when set. This is harmless, but a small deviation from "behavior unchanged".
- The ticket's On merge item (REPO.md "CI behavior" and the `babysit` comment) is for the manager.

## Coverage
Read all 6 changed files in full. UI inspection n/a (no UI). Not run: the workflow, the live check (network sandboxed), and the tests (I relied on reading them plus the implementer's mutation record).
