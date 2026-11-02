# SGS-059 acceptance-test 1: PASS

Tip tested 4ec4b15; new commit 41e648d (test-only) on sgs-059-aoe4-page-posts-build-order. Not pushed.
New file acceptance/aoe4-build-order-client-check.spec.ts, 13 tests, all pass; 65/65 with --repeat-each=5. tsc and lint:dup clean.

Tests: (a) posted body keys are exactly buildOrder+inputs and buildOrder == buildOrderFrom(textarea) for each of 3 prebuilt builds (+duration 900), a pasted build, a table edit; (b) two unknown-id issues carry data-code/data-line in order, cleared by next valid run; no data-line when issue has no line; list sits below textarea; (c) mocked server 400 -> simulation-error, build-order-issues count 0; server 400 after a client rejection replaces the list; client rejection clears earlier server 400; (d) Run enabled after rejection, second Run rejects again, then corrected text posts 200; (e) prebuilt table view offers catalog unit options and an edit rewrites the textarea.

Mutations (all reverted, git diff clean): add text key -> 7 fail; issues also pushed to simulation-error -> #11 fails; rejection branch posts anyway -> 6 fail; client issues not cleared -> 2 fail; running left true on rejection -> 3 fail; server errors not cleared -> #11 fails; unitsByProducer emptied in catalog -> #13 fails; data-line removed -> #6 fails. (First catalog mutation, `units: []`, did not fail: that key is unused by the table; replaced with unitsByProducer.)

No failures; no impl-defects or spec-gaps. All criteria expressible in this harness.
