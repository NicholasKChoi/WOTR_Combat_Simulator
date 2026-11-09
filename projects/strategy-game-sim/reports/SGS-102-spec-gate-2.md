# SGS-102 spec gate, pass 2

**Verdict: NEEDS_SPEC** (3 gaps, all small, none needs the owner).

Checked against origin/main 1e6d6c2 (read with git show / git grep), design/M6.md C6, "Auto-run", "Page wiring",
"What each status shows", INVARIANTS.md, both LESSONS.md files, the SGS-100 ticket (dependency), and
reports/SGS-102-spec-gate-1.md. The five gate-1 gaps are closed (Run-control assertion, stale grep, postSimulation
grep, `onBuildSelect` seam, omitted-issues test id). Controller internals were not judged.

## Gaps

1. **Acceptance criteria, first bullet - two greps contradict the end state Scope requires.**
   - `git grep -nE "run-simulation|results-stale|runSimulation|runRejected" -- acceptance components pages docs`
     must find nothing, but the new `acceptance/aoe4-auto-run.spec.ts` "no Run control" case asserts
     `getByTestId('run-simulation')` has count 0, so the file contains that string. A correct build fails
     the criterion; an implementer would guess (rename the string, or drop the case).
   - `git grep -n "fetch(" -- components/apps/aoe4-build-order` "matches only in `simulate-client.ts`" can also
     match SGS-100's `simulate-client.test.ts` (it asserts `fetch` is called once with given args).
   - Proposed fix: add the pathspec `':!acceptance/aoe4-auto-run.spec.ts'` to the first grep (or name that file as
     the one allowed match), and restate the fetch rule as "no non-test file under
     `components/apps/aoe4-build-order/` other than `simulate-client.ts` calls `fetch(`"
     (`-- ':!*.test.ts'`).

2. **Scope, `useAutoRun` - the pre-controller state is only half specified.** Scope says that before the
   controller exists the hook returns status `loading` with `settled` equal to the first render's input. But
   `AutoRunState` also has `conversion: TextToBuildResult`, `durationError`, `request`, `result`, `resultRequestKey`,
   `shown`, `serverIssues`, `omittedIssues`, `errorMessage`, and the page reads `conversion` during the server render
   (`clientIssues = conversion.ok ? [] : conversion.issues`) and `durationError` for `BuildInput`. An implementer
   must guess where these come from (compute with `textToBuildOrder` and `durationError` in the hook; call
   `createAutoRunController` held with a no-op `onChange` and take `getState()`; or placeholders). The choice changes
   the prerendered HTML and hydration (issues in the first paint) and whether the rules exist in two places, which
   Scope forbids ("no other logic"). Proposed fix: state it, e.g. "the initial state is
   `createAutoRunController(deps, initial, true, () => {}).getState()` built once from the first render (a held
   controller sets no timer and posts nothing), so `conversion`, `durationError` and `request` come from the
   controller; it is replaced by the effect's controller state on mount." Also say whether the first-paint
   `loading` status shows the settled conversion's issues (it should, per "issues track the settled input at all times").

3. **Scope, Select change - which text setter.** "Set the text to the build's text" is ambiguous. Today the build
   select goes through `editText`, which calls `mergeExternalEdit` on `openRows` before `setText`. A bare
   `setText` silently drops the table's open-row flags after a build select. Proposed fix: say the page handler
   calls `editText(build.text)` (not `setText`), and that a name with no matching build does nothing beyond
   `setSelected`, as `selectBuild` does today.

## Notes (non-blocking)

- "an undo inside the debounce sends nothing" uses two real-time fills inside 500 ms. Using the paused clock (as the
  one-POST criterion does) removes the wall-clock dependence.
- Docs criterion requires "the 500 ms pause" and also "no measured timing". Say the 500 ms is the design constant
  `AUTO_RUN_DEBOUNCE_MS` (allowed), and that no observed durations appear.
- The "first load runs once" body check `buildOrderFrom(textarea value)` and the dim assertions read computed style,
  which matches common.md visual-state rules. Scroll assertions should use `expect.poll` or one `page.evaluate`
  (repo LESSONS: smooth scroll moves elements between reads).
- Rule 6 / Scope give the existing-tests rule and the grep that finds the affected specs; `15 specs` is qualified as
  "at the time of writing", so it is not a stale pin.

## Checks that passed

1. Grounded scope: every page symbol, `build-input.tsx` Run button/`running`/`onRun`, `results.tsx` `stale`,
   `issue-list.tsx` `rejected`, `.stale` CSS, `helpers.ts` `runSimulation`/`runRejected`, and the 15 specs exist on main;
   `use-auto-run.ts`, `auto-run-status.ts`, `aoe4-auto-run.spec.ts` are marked new. `ARCHITECTURE.md` does not list
   the component files. `docs/aoe4-build-order.md` has the quoted phrases at lines 845-965.
2. Criteria are observable; the existing-tests rule is stated; no stale pinned counts.
3. No open questions (ticket or CONTEXT.md).
4. Invariants S3, A3, S1 named; none contradicted.
5. Contracts: names, status values, test ids, both duration messages and both failure messages match C6 and the SGS-100
   ticket; `AutoRunDeps.post` adapter matches `postSimulation(buildOrder, durationSeconds, signal)`.
6. Dependency on SGS-100 stated (graph agrees); business logic ~200 lines.
7. Diagram present and matches.
8. Lessons: no entry predicts a failure here beyond the scroll-read note above.
9. Decisions: CONTEXT.md has none; the body matches design (tabs, scroll, pin, timeline rows, OD-6, OD-7).
10. On merge: none is right (no new command or design doc; the helpers are test code).
11. Risk `high` matches the strongModelTriggers reasoning; no criticalPaths symbol changes.
12. Docs: README has no mention; docs/aoe4-build-order.md paragraphs, `results.tsx` alert text and CSS are in Scope.
13. Input validation: the ticket adds no trust-boundary input of its own (the duration check is SGS-100's).
