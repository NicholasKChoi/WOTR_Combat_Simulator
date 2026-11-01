# SGS-033 acceptance-test 1

Result: PASS. New branch tip 16ca3be (on top of 94377ca), local only, not pushed.

Harness: Playwright over a real `next dev` (Node 24.22.2). `npm run acceptance`: 326 passed, 0 failed (includes the implementer's 45 HTTP and 48 contract tests). `npx tsc --noEmit` clean (REPO.md `lint`; there is no ESLint config).

## Tests written
`acceptance/aoe4-simulate-api-edges.spec.ts`, 24 tests, all pass, no duplication of the implementer's specs:
- Villager-only order returns every result field, JSON content-type, `times` aligned to duration/sample, every series length equal to `times`, 3 villagers at the end.
- Research step: two step timings and a `tech-effect-ignored` note on step 1.
- Research order via paste vs JSON deep-equal (steps, units, times, notes); repeat request identical.
- CRLF text equals LF text.
- `inputs: null` equals absent; `inputs: 'x'` is one syntax issue; a sheep trip override changes `gatherRates`; unknown trips key is `unknown-id`; durationSeconds 60/3600 accepted, 3601 out-of-range; 60.5 out-of-range, '60' syntax; unknown body/inputs properties ignored.
- `{}`, `text: null`, `buildOrder: null`, numeric text, array buildOrder are each a single `syntax` issue with no `line`; neither-key issue names both keys; civ `french` is `unknown-id`; 200-step JSON order accepted; `text/plain` body and bare-string body are one syntax issue (400, not 500).
- PATCH is 405 with `Allow: POST` and the method in the message; truncated JSON is the plain-text `Invalid JSON` 400; a 900 KB text (under 1 MB) reaches the handler cap as `out-of-range`, not the 413.

## Mutation checks (each undone with `git checkout --`; `git diff --exit-code` on non-test files clean)
- Route drops `inputs` (`request.inputs ?? {}` to `{}`): 5 tests failed.
- Route skips `textChars` check: the 900 KB text test failed.
- Route drops `Allow` header: PATCH test failed.
- Route drops the `typeof text` string check: `text: null` and numeric-text tests failed.
- Engine `sampleSeconds` doubled: result-shape test failed.
- Research note code changed (`research.ts:82`): research note test failed.

## Failures
None against production code. Two first-run failures were my own test defects (a trip override on nodes with no gatherers; a missing content-type header on Next's plain-text 400), fixed before commit.

## Observations (not failures)
- On this base a `research` at `mill` or `textiles` stays `waiting` (no mill built, age not reached), as the brief expected; no research step completes over HTTP here, so completed-research timing is not pinned.
- `inputs.sampleSeconds` is silently ignored (unknown property), consistent with the spec.
- A `buildOrder` with a bad `civ` and no `name` returns two issues (`unknown-id`, then `syntax name`), consistent with validator behavior.

## Not expressed
- Completed research and `build`/`move` over HTTP (need SGS-031).
- The ticket's PR-recorded 413 status check and mutation-in-throwaway-worktree items are the implementer's/PR's; the implementer's 413 test passes in this run.
