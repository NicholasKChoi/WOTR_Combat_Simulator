# SGS-209 acceptance-test 9

Verdict: PASS. Commit 2a9e65189b1651dbab881e761abe6e3c2cb7f176 on sgs-209-rename-api-patch-named-builds (was eba21ef). Harness ran (Playwright, Chromium, real next dev).

## Tests written: acceptance/aoe4-named-builds-rename-rules.spec.ts (6 tests, all pass)
1. changes only the name, revision and updatedAt, and ignores an extra body key: criterion 1 (other fields unchanged, updatedAt advanced) and extra-key criterion.
2. a rename to the same name writes the next revision.
3. a name of exactly the cap succeeds and one over the cap gives 400: cap boundary, 400 body validates as SimulateError.
4. a name that is missing, not a string, or empty once trimmed, gives 400 and writes nothing.
5. an earlier failing check wins over a later one: method, id form, secret form, If-Match, body, exists, secret, revision; revision stays 1 after all of them; 405 Allow `GET, PUT, PATCH, DELETE`.
6. a rename spends a slot: after 30 writes (create plus 29 renames) the next rename is 429 with Retry-After and nothing changes.

Not duplicated: aoe4-named-builds-rename.spec.ts (the diff's spec, 4 tests, pass: create, wrong secret 403, rename 200/ETag "2"/GET, stale 412) and the contract spec's rename 400/401/404/405/428 examples.

## Run
Setup, then rename.spec, rename-rules.spec, named-builds-api, -api-contract, -create, -version-saves: 44 of 45 passed first run; the one failure was my own wrong schema name (BuildsError, should be SimulateError); fixed. Final: rules + rename specs 10/10; earlier existing specs all passed. `npx tsc --noEmit && npm run lint:dup` exit 0.

## Mutation checks (each undone with git checkout, git diff --exit-code clean on lib/components/docs)
- named-builds-routes.ts:168 name from stored not checked: fails test 1 (name 'Fresh'), rename.spec, test 3.
- :168 drop `...stored.buildOrder`: stored-schema 500, fails test 1 (TypeError on read) and test 2.
- :116 createdAt overwritten: fails test 1 deep-equal of unchanged fields.
- :116 updatedAt kept: fails test 1 `updatedAt not.toBe`.
- :168 spread request body into record: fails test 1 (read gives 500 via stored schema).
- :150 no trim: fails test 4 row `{name:'   '}` (200).
- :151 no empty check: fails test 4 same row.
- :149 string check removed: fails test 4 row `{name:5}` (500) and test 5 body-before-exists.
- :152 length check skipped: fails test 3 over-cap (200).
- saved-builds.ts nameLengthIssue `<=` to `<`: fails test 3 exact-cap (400).
- :116 same-name keeps revision: fails test 2 (revision 1).
- :110 `!==` to `<`: fails test 5 'stale revision' (200).
- :165-166 write before returning 400: fails test 4 `revision 1` assertion; test 3.
- :111 write before returning 412: fails test 5 final `revision 1` assertion.
- :177-179 swap method and id form: fails test 5 'method before id form'.
- :161-164 swap 401/428: fails 'secret form before If-Match and body' (after I changed that probe to send neither header; before it could not fail, so the probe was changed).
- body check moved before 401: fails same assertion. Body check moved before 428: fails 'If-Match before body'.
- :109/110 swap secret and revision: fails 'secret before revision' (412 vs 403).
- :75 not-found returns 403: fails 'exists before secret'.
- 'body before exists': failed by the string-check removal (500 vs 400) above.
- api-route.ts Allow join `,`: fails test 5 Allow assertion.
- :105 rename uses a separate client key: fails test 6 (200 instead of 429).
- :106 429 path also writes: fails test 6 final revision/name assertion.
- Removed as dead: a `[]` row in test 4 (400 either way; contract spec covers notAnObject).
- Retry-After assertion in test 6 not separately broken; it is also pinned by the existing budget spec.

## Failures
None. No impl-defect or spec-gap found.

## Not expressible
Compare-and-swap `conflict` (race between read and replace), stored-schema 500, storage 503, production DELETE 405: need store fakes or env control; unit tests cover them.
