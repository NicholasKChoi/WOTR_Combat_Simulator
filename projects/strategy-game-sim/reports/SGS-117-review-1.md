# SGS-117 review 1

Verdict: APPROVE. Branch `sgs-117-unit-test-debt`, tip afd034c, base main.

## Blocking findings
None.

## Acceptance criteria
- vitest `test.css` setting: pass (`vitest.config.mts:6`). The implementer's report says the suite passed unchanged, so no test was edited for it. I did not rerun `npm test`.
- `.stale` mutation: pass. The existing tone-keys case asserts both keys are strings and different, so an undefined key fails. The implementer's report records the mutation and the failure.
- Equal-input case: pass. `auto-run.test.ts` records `history.length` after the answer and asserts it is unchanged. The `Object.is`-guard mutation is named in the implementer's report.
- Loader abort: pass. The stub rejects only when `init.signal.aborted` and otherwise resolves `saved`. A live signal gives `ok` in the same case. `stubFetch` passes `init` to `respond`, and the other cases are unchanged.
- Identity branch: pass. The new case has distinct `startedAt` values 1, 11 and 21, equal text and a different `selected`. It asserts the preconditions, then each row's `startedAt`.
- House gate: pass. `population(on, 595) > population(off, 595)` replaces the by-construction assertion. The test is renamed to "gives an order without build-house steps auto-houses at 120, 220 and 320 s". The `done.slice` assertion is gone. `housesDone` is defined once in `test-helpers.ts` and used by both files (a third copy in the maxPopCap test was also replaced).
- `settledFields` and `initialAutoRunState`: pass. Both are exported from `auto-run.ts`, the controller and the hook use `initialAutoRunState`, and `use-auto-run.ts` no longer imports `textToBuildOrder` or `durationError`. The comment names `initialAutoRunState`. `CLEARED` stays private, and `serverIssues` is an empty array either way, so there is no behaviour change. I ran `npx tsc --noEmit` and `npm run lint:dup` in the task worktree: both clean.
- README: pass. I checked `english-knight-longbow.json` myself. The rallies are `capital-town-center` to sheep, wood, gold, wood and wood, plus `kings-palace` to wood, and none goes to farm. The only reaction that sends villagers to farm is the sheep one, so the new sentence is true. The implementer's report records the other claims as compared against the JSON.
- No INVARIANTS regressions: pass. The ticket lists none, and the diff touches only tests, the README and a pure refactor.

## Bot, conventions and correctness
- No `reviewBot` was run, because I did not check whether one is configured. This is not a blocker.
- Sibling comparison: the new tests follow their files' existing helper and test styles. `housesDone` sits next to `run` in `test-helpers.ts`.
- Nothing in the diff leaks ticket ids or factory pointers.
- Correctness: `stubFetch` still passes the URL through its mock, and the `_url` parameter is unused only to give the signature. The `initialAutoRunState` spread order is the same as the old literal, with `CLEARED` last.

## Non-blocking notes
- I did not rerun the mutation checks. I relied on the implementer's recorded failures, which match the code paths I read.
- I did not run `npm test` (the full suite), and I did not run the UI inspection, because the diff changes no UI.

## Coverage
Reviewed all 10 changed files. I did not run the suite or the mutations.
