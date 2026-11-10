# SGS-102 implementer report, pass 1

- Ticket: SGS-102, "Wire auto-run into the AoE4 page; remove Run, scroll and stale; dim the last good run; rewrite the Run specs"
- Branch: `sgs-102-use-auto-run`, based on SGS-100 tip 53d5c37 (PR base `sgs-100-auto-run-controller`)
- Tip: ae7fec35bc1e33bd1580ee8e671c5d6d21fb5af7. Commits: e1e224a (the work) and ae7fec3 (adds a clock advance between the edits in the debounce spec)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-102-use-auto-run
- Diff vs base: 28 files, 938 insertions and 585 deletions. No tool noise. AGENTS.md and the lockfile are unchanged.

## Files touched

Source:
- pages/apps/aoe4-build-order.tsx: the page now runs through `useAutoRun`.
  - Removed: the Run button, the run handler, `stale`, scroll-into-view, and the auto-select of the Results tab.
  - Form submit (Enter) calls `flush()`. `selectBuild` calls `flush({text, duration, selected})`.
  - Shows the status line and the error. The retry button appears only in `failed`.
  - `dimmed` is set for invalid, rejected and failed.
- components/apps/aoe4-build-order/use-auto-run.ts (new): a React hook around `createAutoRunController`.
  - The controller is created in an effect.
  - First paint comes from `firstPaintState`.
  - `hold` is `!router.isReady`.
- components/apps/aoe4-build-order/auto-run-status.ts (new): maps a status to its message text.
- components/apps/aoe4-build-order/build-input.tsx: the Run button is gone. Adds `duration-error` with `aria-invalid` and `aria-describedby`, plus the status slot.
- components/apps/aoe4-build-order/issue-list.tsx: the summary counts settled issues. Server issues come with an omitted-count line.
- components/apps/aoe4-build-order/results.tsx: wraps the results in `results-last-good`, dimmed when needed, with `aria-describedby` pointing to the status. The stale banner is removed.
- components/apps/aoe4-build-order/workbench.module.css: adds the `.dimmed` style and removes the stale and run styles.
- docs/aoe4-build-order.md: describes auto-run, the status texts, dimming, the duration check and the pin name.

Tests:
- components/apps/aoe4-build-order/auto-run-status.test.ts (new): 14 rows.
- components/apps/aoe4-build-order/issue-list.test.ts: summary and omitted-line cases.
- acceptance/helpers.ts:
  - `openPage` waits for status `current`.
  - `waitForRun(page, action?, status = 'current')`. The `status` parameter is an addition to the ticket's signature.
  - New: `expectNoRun`, `expectInvalidNoRun`, `setDurationInPlace`, `scrollInstantly`, `settledScrollY`.
- acceptance/aoe4-auto-run.spec.ts (new): 14 cases, all on a paused clock where timing matters.
- Pre-existing specs rewritten (listed below): client-check, inline-issues, knight-longbow-page, m3-flow, m4-flow, pin-compare, run-errors, step-band, timeline-compare, chart-readability, gather-rates-per-villager, gathered-resources, narrow-layout, results-split, small-screen, step-table.

## Tests

**Unit** (`npm test`): 51 files, 1615 passed, 10 skipped (the skips were there before), 0 failed.
- auto-run-status.test.ts:
  - every status, with and without a result, maps to the exact text in the docs;
  - `current` maps to an empty string.
- issue-list.test.ts:
  - the summary wording for 1 and for N issues;
  - the summary shows only when there are issues;
  - the omitted line shows only when `omittedIssues > 0`.

**Acceptance** (`npm run acceptance -- --reporter=line`, clean tree, after the final commit): **753 passed, 0 failed** (1.5 min).

Invariants encoded in acceptance/aoe4-auto-run.spec.ts:
1. There is no Run control.
2. First load posts exactly once. The body is `{buildOrder, inputs}`, with `buildOrder` equal to `buildOrderFrom(textarea)` and duration 1200. Afterwards:
   - status is `current`;
   - the Build tab is selected;
   - Results is enabled;
   - the console logs no hydration warning.
3. One POST per settled text edit. The debounce restarts on every edit (checked on a paused clock: fill, wait 250 ms, fill, wait 499 ms gives 0 POSTs; 2 ms more gives 1 POST with the last text).
4. One POST per settled step-table edit and per settled duration edit.
5. An undo inside the debounce sends nothing. A comment-only edit sends nothing.
6. Enter in the duration field and choosing a prebuilt build both post at once.
   - Choosing a build posts that build's own `buildOrder`.
   - The pin label uses the build's name.
7. An invalid text edit dims the charts (opacity ≤ 0.5).
8. When the first load is invalid, there is no last-good result to dim and nothing is posted.
9. Invalid durations show the two messages and post nothing: 59, 3601, 61.5 and empty.
10. A 400 keeps the last result dimmed and shows the omitted count. The same request is not posted again.
11. A failure shows Try again, and retry posts again.
12. A newer request aborts the one in flight (`requestfailed`), and the superseded response never shows.
13. At 390 px wide, runs and invalid edits never scroll the page.
14. Choosing a build keeps open step rows open and opens the new rows that have optional fields.

## Pre-existing specs edited (rule numbers from the ticket)

- client-check:
  - `expectPostedChecked` wraps `waitForRun`. Prebuilt builds fill 900 and then select (rule 1).
  - Paste and table edits run as actions (rule 1). A table-view test reads the text after `showView(text)`, because the textarea is not rendered in table view.
  - `runRejected` → `expectInvalidNoRun` (rule 2).
  - Server-400 tests check the rejected IssueList (rule 6).
  - "client issues clear an earlier server error" now uses a route 500 and status `failed` (rule 6).
  - "Run stays enabled" → "repeated invalid edits post nothing and a corrected edit runs" (rule 6).
- inline-issues:
  - Scroll tests deleted (rule 7).
  - The table-view test keeps the table view and no longer checks scroll (rule 7).
  - Issues and the summary are expected once the text settles (rule 6).
  - `runRejected` → `expectInvalidNoRun` (rule 2).
  - "check issues show after a valid run" (rule 1).
  - "a live issue never clears the shown result" no longer clicks Run (rule 1).
  - The server 400 list is shown under the editor via goto (rule 6).
  - The gold test is `waitForRun` of fill 1800 plus select, then `showTab` (rules 1 and 4).
- run-errors:
  - New `loadWithStatus`.
  - The success test fills 300 inside `waitForRun`; Build stays selected; then `showTab` (rules 1 and 4).
  - 400 shows items and no simulation-error (rule 6).
  - Unreadable rows → status failed (rule 6).
  - Network abort → unroute and `waitForRun` with 1000 (rule 6).
  - Non-JSON 200 → failed (rule 6).
- m4-flow:
  - Results is enabled after load (rule 4).
  - results-stale → invalid status plus opacity (rule 3).
  - Reselecting an unchanged build → status current (rule 1).
  - The final check is current, Unpin disabled and label count 0 (rules 4 and 6).
- pin-compare:
  - `holdSimulate`, `restoreStored` (900 s), `routeRestore`, `isRestore` and `trackPosts` (rule 5).
  - Unchanged runs → `showTab` (rule 1).
  - An invalid paste dims and keeps the pin; pin-run stays enabled (rules 2, 3 and 6).
  - The stale test → a dim/undim test (rule 3).
  - A reload counts 2 POSTs (rule 5).
- step-table:
  - "table edits made inside the pause post once" (rules 5 and 6).
  - The step-add test posts via `waitForRun` (rule 1).
  - "opened row stays open ... through a run" (rule 1).
  - The Text/Table disabled test uses `showTab` (rule 4).
- small-screen:
  - The 360 px test is "a run does not scroll the page by itself" (rule 7).
  - The 768/1280 test is "stays sticky at the top"; its `scrollMarginTop` check was removed, as the ticket says (rule 7).
  - Arrow-key and one-tab-stop tests (rule 4).
  - Results disabled via a route 500 (rules 4 and 6).
- timeline-compare: `runWith` and `loadResult` = `waitForRun(goto)` + `showTab` (rules 1 and 4).
- step-band:
  - `waitForRun(goto)` for the default build (rule 1).
  - "a new run clears the band" now runs via duration 900 (rule 1).
- Smaller specs:
  - gather-rates-per-villager (rule 4) and chart-readability, knight-longbow-page and m3-flow (rules 1 and 4): `waitForRun` + `showTab`.
  - gathered-resources: dropped the unchanged run (rule 1).
  - narrow-layout (rules 1, 2 and 4).
  - results-split (rule 1).

## Doc claims (docs/aoe4-build-order.md and one code comment)

- "There is no run button: the page re-runs the simulation on edit."
  - The Run button is removed from build-input.tsx.
  - `useAutoRun` effect 2 → `controller.input`.
- "Results is enabled while there is a result or a pinned run."
  - Source: the page's tab `disabled` prop; checked by the m4-flow and small-screen specs.
- "No run selects a tab, and the page never scrolls by itself."
  - The page's only `setTab` is the tab list's `onSelect` (pages/apps/aoe4-build-order.tsx:178).
  - No scroll call remains in the page.
- "The input settles 500 ms (`AUTO_RUN_DEBOUNCE_MS`) after the last edit ... Enter ... and choosing a prebuilt build settle the input at once."
  - `auto-run.ts` `AUTO_RUN_DEBOUNCE_MS` = 500.
  - page `onSubmit={() => autoRun.flush()}` (line 170).
  - `selectBuild` → `autoRun.flush({...})` (line 134).
- "On load the default build settles and runs once."
  - The controller is created with `hold` = `!router.isReady`, and `release()` flushes. Checked by auto-run case 2.
- "posted ... only when the input is valid and differs from both the shown result's input and the one in flight; a newer request aborts the one in flight, and only the newest response is shown."
  - `auto-run.ts` `fire()` (null → invalid; same key in flight; key = `resultRequestKey`; key = `rejectedKey`), `post()` aborts, and `send` drops stale responses by seq.
- The two duration messages, `duration-error`, `aria-invalid` and `aria-describedby`:
  - `auto-run.ts` `durationError`;
  - build-input.tsx:72-76.
- The status texts: auto-run-status.ts `autoRunStatusMessage`, quoted exactly.
- "An invalid, rejected (400) or failed input keeps the last good result on Results, dimmed ... a failure adds a `Try again` button (`simulation-retry`) that sends the same request again."
  - Page line 227 sets `dimmed`; results.tsx:33.
  - Page line 204 renders the retry button only in failed; the controller's `retry()` re-posts the request.
- "The pin name is that of the shown result's input." / "(the build selected when that input was sent)"
  - The pin reads `autoRun.shown.selected`.
  - See out-of-scope finding 1 for one narrow lag.
- "The issues list ... tracks the settled input at all times" and "Server 400 issues take its place ... until the next settled input."
  - IssueList is fed `conversion` and `serverIssues` from the controller state. `serverIssues` is cleared on the next `input()`.
- "Bounds are checked when the input settles, not in the table." / "An edit while a run is in flight keeps the shown result until a newer run lands."
  - `result` is only replaced in `send` on success.
- "The shown result is dimmed (`results-last-good`) while the input is invalid, rejected or failed."
  - results.tsx:33; page line 227.
- 400 paragraph, "keeps any earlier result on Results, dimmed; that rejected request is not sent again".
  - `rejectedKey` in `fire()`.
- Code comment in use-auto-run.ts: "The controller is created in an effect, never during render, so the prerendered HTML and the first client render come from firstPaintState alone and nothing is posted before hydration."
  - `useEffect` creates the controller.
  - `snapshot` falls back to `firstPaintState` while `state` is null.
  - Checked against `next build` HTML (data-status="loading", no issues, duration-error, results-last-good or simulation-error).
  - A JS-disabled load against `next start` posted nothing.

## Pinned outputs

None. The ticket does not ask to pin engine values.

## Mutation checks

Each mutation was applied, the named test failed, and the code was restored. The tree was verified clean afterwards.

Acceptance:

| Mutation | Test that failed |
|---|---|
| Run button kept | no Run control |
| Effect selects the results tab | first load runs once |
| Leading-edge debounce | one POST per settled text edit |
| Debounce not restarted on edit | one POST per settled text edit (after the clock-advance fix in ae7fec3) |
| Duration change does not re-run | step-table and duration edit |
| Unchanged input is re-posted | undo inside the debounce |
| Enter does not flush | Enter and build select |
| `selectBuild` flushes the old text | Enter and build select |
| No dimming | invalid text dims the charts; pin-compare dim tests (2 failed) |
| `hasResult` ignored | first invalid load |
| `aria-describedby` dropped | invalid duration |
| No dimming in rejected | a 400 keeps the last result |
| No dimming in failed | failure shows a retry |
| Retry shown always | failure shows a retry |
| No abort | superseded request |
| Scroll on run | 390 px never scrolls; small-screen "does not scroll the page by itself" |
| Bare `setText` in `selectBuild` | select keeps open rows |

Unit:

| Mutation | Result |
|---|---|
| auto-run-status: `case 'rejected'` dropped | 2 failed |
| auto-run-status: updating text changed | 2 failed |
| auto-run-status: loading → '' | 2 failed |
| issue-list: `omittedIssues >= 0` | 5 failed |
| issue-list: omitted line never shown | 1 failed |
| issue-list: 1-issue wording changed | 2 failed |
| issue-list: summary test id gated on `issues.length > 1` | 2 failed |

## Gates

- Codegen: not set for this repo.
- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `npx next build`: OK. The page is SSG.
- `npm test`: 1615 passed, 10 skipped.
- Full acceptance: 753/753 passed.

An earlier full run had 3 failures. That run was contaminated: I mutated source while it was running and the dev server failed to parse. It was rerun clean.

No servers were left running.

## Invariant check

- The page posts only through the controller. The one other caller is the pin restore, which uses `postSimulation`.
- The page has no timers. All timing lives in the controller.
- Imports stay inside the app. There are no ticket or invariant ids in code, tests or commits.

## Out-of-scope findings

1. In the SGS-100 controller, when `fire()` matches the same key as the in-flight request, it updates fields only, so `shown.selected` keeps the in-flight value.
   - Example: the user re-selects a different build name whose text is identical, while a run is in flight.
   - The pin name can then lag by one input until the next run.
   - This is controller behaviour, not changed here.

## Status

needs_review
