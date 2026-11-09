# SGS-102 spec gate, pass 1

**Verdict: NEEDS_SPEC** (3 blocking gaps, all small and fixable by the ticket agent; none needs the owner).

Checked against origin/main 1e6d6c2 (the checkout in the repo root is stale), design/M6.md C6 and
"Auto-run", "Page wiring", "What each status shows", INVARIANTS.md, both LESSONS.md files, and the
SGS-100 ticket (the dependency; no report for it yet, so its names were taken from the ticket and C6).

## Gaps

1. **Acceptance criteria, "no Run control" - contradicts the end state.** The criterion asserts
   `getByRole('button', { name: /run/i })` has count 0. `compare-panel.tsx` keeps the `pin-run`
   button, whose text is `Pin this run` (and Scope keeps the pin controls unchanged). The case would
   fail on a correct implementation, or push the implementer to rename the pin button, which Scope
   does not allow. Proposed fix: assert `getByTestId('run-simulation')` has count 0 and
   `getByRole('button', { name: /^run\b/i })` has count 0 (or name `Run simulation` exactly).

2. **Acceptance criteria, first bullet (`git grep -niE "stale" -- components pages` finds no
   match) - can collide with SGS-100's files.** SGS-100 puts `auto-run.ts` and `auto-run.test.ts`
   under `components/`, and its own Scope says a dropped response is "stale" (the controller's
   late-response rule). A comment or test title there using that word makes this criterion fail
   although this ticket did nothing wrong, so the implementer must guess whether to reword SGS-100's
   code. Proposed fix: narrow it to the thing this ticket removes, e.g.
   `git grep -nE "results-stale|styles\.stale|\.stale\b|stale=" -- components pages` finds no match.

3. **Acceptance criteria, first bullet (`postSimulation` matches only in four named files) - a
   closed list that goes stale.** Any doc comment in `auto-run.ts` or its test that names
   `postSimulation` (the C6 text itself says "the hook passes postSimulation") breaks it. Proposed
   rule instead: no `components/` or `pages/` file other than `simulate-client.ts`,
   `use-auto-run.ts`, the page and their tests calls `postSimulation`; or "the page has no local
   `function postSimulation`, and `fetch(` appears in `components/apps/aoe4-build-order/` only in
   `simulate-client.ts`".

4. **Scope, Select change - the seam is unspecified.** Today `BuildInput.selectBuild` calls
   `onSelectedChange(name)` then `onTextChange(build.text)`. The ticket says what the page does
   (`setSelected`, set text, `flush({ text: build.text, duration, selected: name })`) but not which
   `BuildInput` prop carries it or whether `selectBuild` still calls both existing props. An
   implementer can wire `flush` in `onSelectedChange` (flush with stale text) or double-set text.
   Proposed fix: state that `BuildInput`'s `onSelectedChange`/`onTextChange` pair is replaced by one
   `onBuildSelect(name)` (or that the page's `onSelectedChange` does all three steps and `selectBuild`
   stops calling `onTextChange`), and that `build-input.tsx` is edited accordingly.

5. **Scope, IssueList - omitted-issues item unspecified.** It does not say whether the added
   `N more issues not shown.` `<li>` carries `data-testid="build-order-issue"`. Existing specs count
   that test id per issue and the 400 spec expects one issue plus the omitted line. Proposed fix:
   say the omitted item has no `build-order-issue` test id (give it `build-order-issues-omitted`), and
   that the `Fix N issues` summary N counts the listed issues only, not the omitted ones.

## Notes (non-blocking)

- Criterion "one POST per settled text edit" asserts "status is not `running`" while under 500 ms
  after the second fill. That is a wall-clock assertion and can flake on a slow dev server. Use
  Playwright's paused clock (the ticket already uses it for Enter/select) and advance it to 499 ms.
- Criterion "the rewritten specs" says "its three `results-stale` assertions"; the parenthetical
  "(and any added since)" saves it, but "every `results-stale` assertion" is the stable wording.
- The small-screen spec also has a test "stays sticky at the top and offsets the results scroll by
  its height" (checks `scrollMarginTop`). Rule 6/7 cover it, but name it in the report list so it is
  removed or rewritten on purpose; the scroll-margin code it checks is deleted.
- "a first invalid load state has no target": the held first response must be fulfilled or aborted
  at the end of the test so the dev server request does not leak into the next test.
- `useAutoRun` must create the controller in an effect (not during render), or a client-side
  navigation with `router.isReady` already true would POST during render. The ticket's "before the
  controller exists (server render, first client render) it is status loading" implies this; say so
  in one line.

## Checks that passed

1. Grounded scope: page symbols (`runSimulation`, `errorMessages`, `stickyBarHeight`, `resultsTop`,
   `editorBox`, `issuesBox`, `resultsShownCount`, `stale`, `converted`, `checked`, `rejection`,
   `Run`, `Pin`, `pinName`), `build-input.tsx` Run button, `results.tsx` `stale` and `results-stale`,
   `issue-list.tsx` `rejected`, CSS `.stale` selector, `acceptance/helpers.ts` `runSimulation` and
   `runRejected`, and the 15 specs from the grep all exist on main. `MAN_AT_ARMS_STEP` is absent, as
   the ticket says. `ARCHITECTURE.md` does not list the component files, as the ticket says.
3. No open questions in the ticket or CONTEXT.md.
4. Invariants S3, A3, S1 named; none contradicted.
5. Contracts: names and shapes match design C6 and the SGS-100 ticket (`useAutoRun`, `AutoRunState`,
   `flush`, `retry`, test ids, status values, both failure messages, `durationError` wording from
   SGS-100).
6. Dependency stated (SGS-100); business logic ~200 lines.
7. Diagram present and matches the change.
8. No LESSONS.md entry is walked into (the layout-read lesson is not touched; no layout checks added).
9. Body agrees with the design, including OD-6 (a), OD-7 (a); `savedLoadInFlight` and split layout are
   explicitly deferred.
10. `On merge: none` is right (no command, harness or design doc added for factory use; the
    `acceptance/helpers.ts` change is in-repo).
11. Risk `high` is correct (order of operations a shown result depends on; removes scroll/stale
    behavior callers depend on). None of the `criticalPaths` symbols change.
12. Docs: the stale phrases in `docs/aoe4-build-order.md` (lines ~846-965) are all named; `openapi.json`
    correctly untouched; no README mention.
13. Input validation: no new trust-boundary input (the page reads its own route's 400 via SGS-100's
    `readRejection`).
