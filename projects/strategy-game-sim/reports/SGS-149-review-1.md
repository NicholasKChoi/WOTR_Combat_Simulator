# SGS-149 review 1

Verdict: APPROVE. Branch sgs-149-test-hardening-masked-assertions, tip 76390a0, merge-base 41b3ed3 (origin/main).

## Blocking findings
None.

## Acceptance criteria
- Auto-run wait (respec 1): pass. `HELD_RESPONSE_WAIT_MS = 1000` is a named constant. After the `running` status and text, the spec waits, re-asserts `running`, then asserts `answered` is empty, all before `release()`. The 300 ms mutation is below the constant. The report records the first failure as the still-`running` assertion, which is allowed by the criterion. I did not re-run it (acceptance is out of scope for review).
- Named constant exceeds mutation delay, unmutated passes: pass. The report records 6 acceptance specs passing on unmutated code.
- Memory store shared backing, six mutations: pass on the record. All six are listed with the failing test. Not re-run by me. The call-site mutations ran before the final export removal, which the report states changed no logic.
- Single-argument calls unchanged, two stores share nothing: pass. The default parameter builds a fresh backing, and the new test "gives each store without a shared backing its own storage" asserts it for both builds and counters. The existing env tests are unchanged and now run over a shared backing for memory (`build-store.test.ts` factories).
- Column swap first throws `expectInOrder`: pass. The rendered-chart assertion moved after the order assertions in both tests, and `lastChart`'s count assertion is gone. Mutation recorded.
- Caret before handle, including the last chart: pass. `walk` continues until both of the last chart's stops are seen. Handle-before-caret runs only when both indexes are >= 0, so it cannot pass vacuously.
- Removed section, handle or caret: pass. The assertion order in `expectChartControlsOrder` matches the ticket: caret stop, compare-collapse before handles, handle-before-caret, rendered, handle stops, caret stops. The walk never throws.
- Walk end cases: pass by reading. The loop ends on both stops seen, focus leaving after entering, or `MAX_PRESSES`, and returns the stops in every case.
- Pre-existing assertions kept, Chore: pass. `expectChartControlsOrder` was reordered with its assertions unchanged, and the only production edit is the optional parameter.
- INVARIANTS: none apply, and none are regressed.

## Linter
`npx tsc --noEmit` and `npm run lint:dup` are clean: 0 clones.

## Bot
No `reviewBot` CLI or rules file is configured. Nothing to reconcile.

## Non-blocking notes
- `build-store.test.ts` defines `emptyBacking` while `build-store.ts` has a private `newMemoryBacking` with the same body. The duplication is deliberate, since the runtime export names are pinned by `build-store.acceptance.test.ts`. Fine.
- The walk's `MAX_PRESSES` and focus-left end cases were not mutation-checked individually (the report says so). Focus-left is exercised by the missing-handle and missing-caret runs.
- When no chart section is rendered, `last` is null and `walk` runs to `MAX_PRESSES` without throwing. The rendered assertion then reports the missing sections, which is the specified behavior.

## Coverage
Read the full diff (4 files), the ticket, and the implementer report. Ran tsc and lint:dup only. Ran no acceptance or unit tests and did not re-run the mutations. UI inspection skipped because the diff changes no UI.
