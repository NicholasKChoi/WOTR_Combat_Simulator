# SGS-100 acceptance-test 1

Verdict: PASS. New tip 53d5c37e361bf1508044fcb8be9d9359a45f6353 (was f07e3dc), branch sgs-100-auto-run-controller.

Harness: Playwright (real next dev, Chromium) ran. Controller criteria are Vitest cases the implementer wrote; not duplicated here. Scope: the page behavior the extracted client must preserve.

## Tests written (acceptance/aoe4-build-order-run-errors.spec.ts, 9 tests, all pass)
- successful run: POST to simulate path, JSON content type, body keys buildOrder+inputs, inputs.durationSeconds from the field, results chart shown, no error box.
- 400 with 2 issues and omittedIssues 7: messages listed, then "7 more issues not shown."
- 400 with omittedIssues 0: no count line.
- 500, 404, 400 non-JSON, 400 with empty issues (table): "The simulation could not be run (HTTP n)." and build tab selected.
- network abort: "The simulation could not be run. Please try again."; a later good run clears it and shows results.
- 200 with non-JSON body: same try-again message.

## Existing specs rerun
client-check, inline-issues, pin-compare, m3-flow: 69 passed. tsc --noEmit clean, lint:dup 0 clones.

## Mutation checks (each reverted with git checkout; tree clean afterward except the new spec)
- readRejection omittedIssues forced to 0: omitted-count test failed.
- "(HTTP n)" text changed: all four status-row tests failed.
- try-again text changed: network and non-JSON-200 tests failed.
- postSimulation body durationSeconds hard-coded: success and network tests failed.
- readRejection empty-issues guard removed: empty-issues row failed.
- page `omittedIssues > 0` changed to `>= 0`: zero-omitted test failed.
- readRejection non-JSON returns empty issues: non-JSON 400 row failed.

## Failures
None.

## Not expressed in this harness
Controller state-machine criteria (no wiring into the page yet) are covered by Vitest only. `npm run acceptance` full suite not run; only the related AoE4 page specs above. No file under acceptance/ other than the new spec changed.
