# SGS-107 acceptance-test 1

Verdict: PASS, no new tests written, nothing committed (tip adde412 unchanged).

Why no new tests: the ticket adds a pure client-side model (alignSteps, buildAnnotations, StepRun, finishedText, resultsStale) that no page, API, or CLI calls yet. The ticket says so explicitly (no UI, not wired). The Playwright harness can only drive a boundary, and none of the new surface reaches one. Testing these functions directly is pure-function testing, which is the implementer's job and out of scope for this gate. The implementer's tests in step-annotations.test.ts and auto-run.test.ts already cover the table criteria.

Criteria not expressible in the harness: alignSteps table, buildAnnotations table, StepRun cases, finishedText, resultsStale table, stepSpan table (all pure functions, unit-covered only).

Criterion that is boundary-observable: "No behavior change in the app" (Results highlight and timeline unchanged). Ran existing acceptance specs for the touched component after `npm ci` and `npm run acceptance:setup`:
step-band, timeline-compare, m3-flow, knight-longbow-page, results-split. 26 passed, 0 failed. Harness ran (Chromium, per-checkout port).

Mutation check (of existing coverage, since I wrote no tests): changed `result.durationSeconds` to `result.durationSeconds - 5` at components/apps/aoe4-build-order/results.tsx:29. aoe4-build-order-step-band.spec.ts:77 "hovering a step shades exactly its span on each of the four charts, to the run end when in progress" failed on the expected-versus-received span. Undone with `git checkout --`; `git diff --exit-code` clean.

Also confirmed: `git grep step-timeline-rows -- . ':!.claude'` matches nothing.

Failures: none. Processes: Playwright's webServer stopped itself; nothing left running.
