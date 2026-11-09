# SGS-102 ticket author report 1

Ticket: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-102-wire-auto-run.md`

## Summary

"Wire auto-run into the AoE4 page; remove Run, scroll and stale; dim the last good run; rewrite the Run specs."
Component aoe4-build-order, Risk high, ~200 business-logic lines (page ~70 net, `use-auto-run.ts` ~60,
`auto-run-status.ts` ~20, `build-input.tsx` ~30, `results.tsx` ~10, `issue-list.tsx` ~10) plus a large acceptance and
docs diff. Depends on SGS-100 only. Criteria M6.1, M6.3, M6.9 (re-run spec, Run-spec rewrite, docs for re-run).
Written against `origin/main` 1e6d6c2 (local `main` is stale at ee7ecb9; I read the code at origin/main in a detached worktree and removed it).
Builds on SGS-100's exact names; SGS-100's end state is described, not `main`'s.

Diagram: one Mermaid flowchart (read / act / record) of the page, hook, controller and simulate route.

## Recount on main

`git grep -cE "runSimulation|runRejected|run-simulation|results-stale" -- acceptance` still gives the design's numbers:
15 specs, 78 lines (inline-issues 19, client-check 16, pin-compare 5, timeline-compare 5, m3-flow 4, m4-flow 4, step-band 4,
step-table 4, gathered-resources 3, narrow-layout 3, results-split 3, knight-longbow-page 2, small-screen 2,
chart-readability 2, gather-rates-per-villager 2) plus 4 in `helpers.ts`; three `results-stale` asserts. The ticket states
rewrite rules and a grep, not the counts.

## Deviations the manager should know

- The spear-longbow `MAN_AT_ARMS_STEP` fold-in is moot: SGS-098 (#106) deleted the tests that used it, and no step-index
  constant is left in that spec on `main`. The ticket says nothing to change, and tells the implementer to use an
  `action` + `unit` lookup if it finds one in a spec it touches. Plan row E and design text still mention it.
- The adapter is `post: (request, signal) => postSimulation(request.buildOrder, request.inputs?.durationSeconds ?? 0, signal)`
  (the `?? 0` only satisfies the optional `SimulateRequest.inputs` type; the controller always sets it).
- The pin restore is untouched except for importing `postSimulation` from `simulate-client.ts`. A load with a stored pin now
  sends two POSTs (auto-run and restore); rewrite rule 5 covers specs that count POSTs (pin-compare "posts toHaveLength(1)").
- Status wording was left to tickets by the design; I fixed exact texts (table in Scope) so criteria can be exact.
- `viewDisabled` stays `shownTab === 'results'` (the split-mode variant belongs to outline F).

## Open questions

None.

## Shared symbols, test ids and helpers this ticket defines

- Hook: `components/apps/aoe4-build-order/use-auto-run.ts`: `useAutoRun(args: { text; duration; selected; catalog; hold }): AutoRunState & { flush(live?: LiveInput): void; retry(): void }`.
- Pure helper: `components/apps/aoe4-build-order/auto-run-status.ts`: `autoRunStatusMessage(status: AutoRunStatus, hasResult: boolean): string`. Texts: `Loading the build.`, `Computing the simulation.`, empty for `current`, `Updating the results.`, `The charts show the last valid build.` (invalid/rejected with a result), `No valid build to simulate yet.` (invalid/rejected without), `The simulation failed.`
- Unit test file: `components/apps/aoe4-build-order/auto-run-status.test.ts`; edited `issue-list.test.ts`.
- Test ids: `auto-run-status` (also `id="auto-run-status"`, `role="status"`, `data-status=<AutoRunStatus>`), `results-last-good` (Results root; `aria-describedby="auto-run-status"` when dimmed), `duration-error` (`id="duration-error"`; input gets `aria-invalid`, `aria-describedby="duration-error"`), `simulation-retry` (button text `Try again`, only in `failed`). Removed: `run-simulation`, `results-stale`.
- Component props: `Results` `dimmed: boolean` (replaces `stale`); `IssueList` loses `rejected`, gains `omittedIssues?: number` (last item `N more issues not shown.`; summary `Fix N issues to run the simulation.` / `Fix 1 issue to run the simulation.` always shown); `BuildInput` loses `running`/`onRun`, gains `status`, `hasResult`, `durationError`, `onSubmit`.
- Acceptance helpers in `acceptance/helpers.ts`: `waitForRun(page: Page, action?: () => Promise<void>): Promise<Response>`, `expectNoRun(page: Page, action?: () => Promise<void>): Promise<void>`; `openPage` now also waits for `auto-run-status` `data-status` `current`. `runSimulation` and `runRejected` removed.
- New spec: `acceptance/aoe4-auto-run.spec.ts` with cases: no Run control; first load runs once; one POST per settled text edit; one POST per step-table and duration edit; an undo inside the debounce sends nothing; Enter and build select skip the pause; an invalid text edit dims the charts; a first invalid load state has no target; an invalid duration; a 400 keeps the last result; a failure shows a retry; a superseded request is aborted and its response never shows; the page never scrolls by itself.
- Duration messages used (from SGS-100): `Duration is required.` and `Duration must be a whole number of seconds from 60 to 3600.`; failure messages `The simulation could not be run (HTTP 500).` and `The simulation could not be run. Please try again.`

## Criteria I ran

Against `origin/main` (today, before the change): the removal greps match what Scope implies (`run-simulation`,
`results-stale`, `runSimulation`, `runRejected`, `scrollIntoView|scrollMarginTop` in `pages`, `stale` in `results.tsx`,
the css and the page, `errorMessages` in the page, `\bRun\b([^-]|$)` on lines 855-965 of the doc, none on the "Run-out"
lines). The `scrollIntoView` criterion is limited to `components pages` because specs legitimately scroll elements.
The end-state forms hold against every Scope line (no Scope line adds a match). No mutation criterion applies (no
existing check to mutate; the new specs carry their own "break caught" statements, none run here).

## Overlap

SGS-100 (dependency): the page's `errorMessages` removal and the `postSimulation` adapter are handed to this ticket, as it states. SGS-099 is unrelated. Later outlines F (split layout; edits the page, run bar, `showTab`) and G (Save, `?b=`, `hold`) both build on this ticket's `hold = !router.isReady`, `flush` and helpers; F still has to fix every spec that clicks `tab-*` at 1280 px.
