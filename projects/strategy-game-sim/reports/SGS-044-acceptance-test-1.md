# SGS-044 acceptance-test 1

Commit 5231156 on sgs-044-aoe4-chart-marker-data (new file acceptance/aoe4-simulate-api-markers.spec.ts, 10 tests, all pass). Harness ran: markers + contract + edges specs, 99 passed (later markers spec alone 10 passed). tsc and lint:dup clean.

Result vs origin/main 77fa279 (both served, 7 requests incl. 200s horizon, 408s, 3600s, text input, extra research): every response field byte-identical after removing `markers`; the only difference is `markers`. (The 400 error case has no markers on either.)

Mutation checks (all undone, `git diff --exit-code -- lib` clean): drop age push (3 tests fail); drop research push (5 fail); blacksmith classified other (1 fails); research `at` + 1 (4 fail); drop `.sort(compareMarkers)` initially NOT caught (the shipped build's tie is already in label order), so I added the reversed-step-order test, which then fails under the break.
