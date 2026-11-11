# SGS-124 implementer 2 (Rework 1)

- Ticket: SGS-124 (rework pass for "Rework 1 - 2026-11-10 (review)")
- Branch: `sgs-124-page-library`
- Tip: df9912a (the rebased feature commit is d27707d, on top of origin/main 156bf30)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-124-page-library

## Rebase onto origin/main (156bf30)

Main gained the changes from #132 (route replies) and #133 (split scroll, heading, `runBarRef`). There were conflicts in three files. Each was resolved so that both sides keep their behavior:

- `components/apps/aoe4-build-order/build-input.tsx`: the `BuildInput` signature now takes this branch's `entries`, `selected` (key), `edited` and `onBuildSelect(key)`, plus main's `runBarRef`. Main's `ref={runBarRef}` on the form was auto-merged.
- `pages/apps/aoe4-build-order.tsx`:
  - Both imports are kept (`useRunBarHeight` and `useDiscardGuard`).
  - The kept state is main's `runBarRef` and `useRunBarHeight(runBarRef)` plus this branch's `chooseAbort`, `initialLoadInFlight`, `busy` and `hold`. Main's render-time `initialB` write and `savedLoadInFlight` are dropped, as Scope requires.
  - `BuildInput` gets `runBarRef={runBarRef}` and `entries={entries}`.
  - The text editor gets `disabled={busy}` and main's `labelledBy="build-order-heading"`.
- `docs/aoe4-build-order.md`, Page section: main's paragraph is kept, including its new split-scroll and heading sentences. This branch's change to the select parenthetical, "(labelled Build, see below)", is applied to it.

After the rebase, the grep end state is clean: `initialB` (`-w`), `urlBaseline`, `PrebuiltBuild`, `pinName`, `buildName` and `savedLoadInFlight` find nothing in `pages` or `components`.

## Required fixes (all ticked in the ticket)

- [x] Added `page.once('dialog', (dialog) => dialog.accept())` before the select change in two specs:
  - `acceptance/aoe4-step-annotations.spec.ts`, "choosing another build in the select scrolls the text back to the left".
  - `acceptance/aoe4-build-order-m4-flow.spec.ts`, before the `OTHER_BUILD` select. The following `KNIGHT_LONGBOW` select starts from an unedited template and needs no handler.
- [x] docs, "No run selects a tab (one exception: opening a `?n=` or `?b=` link, see below)".
- [x] docs, "except that after opening a `?n=` or `?b=` link, Results is selected after its first successful run when the page shows the Build and Results tabs".
- [x] docs, "with a `?n=` or `?b=` link the opened build runs instead, once its load ends (the default build runs if the load fails)".
- [x] docs, "while no save and no build load is in flight".

The docs fixes were applied verbatim. Line numbers moved by about 4 after the rebase.

## Files touched in this pass

- `acceptance/aoe4-step-annotations.spec.ts`: confirm handler added before the select change.
- `acceptance/aoe4-build-order-m4-flow.spec.ts`: confirm handler added before the first select change.
- `docs/aoe4-build-order.md`: the four sentences above, plus the rebase merge of the Page paragraph.
- `components/apps/aoe4-build-order/build-input.tsx`, `pages/apps/aoe4-build-order.tsx`: conflict resolution only.

## Existing tests edited in this pass

- `acceptance/aoe4-step-annotations.spec.ts`: "choosing another build in the select scrolls the text back to the left". It gets a dialog handler that accepts the confirm. The rule for existing tests: "a build selected after an edit with no dialog handler gets a dialog handler" (rework 1 criterion). Its other expectations are unchanged.
- `acceptance/aoe4-build-order-m4-flow.spec.ts`: the M4 flow test that selects `OTHER_BUILD` after an invalid edit. Same reason and same change, and its other expectations are unchanged.

## Doc claims

- "opening a `?n=` or `?b=` link": the initial-load effect in `pages/apps/aoe4-build-order.tsx` calls `setAwaitingLoadTab(true)` on an ok load for both the `named` and `link` kinds.
- "with a `?n=` or `?b=` link the opened build runs instead, once its load ends": `hold: initialQuery === null || initialLoadInFlight`, where `initialLoadInFlight` covers any non-`none` query.
- "while no save and no build load is in flight": `busy = initialLoadInFlight || choosing`, which is passed to `BuildInput`/`SaveBuild` as `busy`.

## Tests run

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | clean |
| `npm run lint:dup` | 0 clones |
| `npm test` (vitest) | 71 files, 2209 passed, 13 skipped, 0 failed |
| Playwright: `aoe4-step-annotations`, `aoe4-build-order-m4-flow`, `aoe4-save-open`, `aoe4-split-scroll` | 70 passed |
| Playwright: `aoe4-build-order-pin-compare`, `aoe4-auto-run`, `aoe4-step-table`, `aoe4-small-screen` | 90 passed |

About the acceptance runs:
- `aoe4-split-scroll` was run because the rebase brought it in with #133 and it covers the page area where the conflicts were.
- The spec changes from #132 are API-only (`aoe4-builds-api*`), and this branch does not touch those routes, so they were not run.
- `aoe4-my-builds.spec.ts` does not exist on the branch. It is an acceptance-harness spec that the acceptance-test gate owns, so it was not run here.

`next build` was not run in this pass. No unit tests were written in this pass, so there are no mutation checks. The two spec edits add a handler only. Review 1 established that both tests fail without the handler: Playwright dismisses the confirm, so `toHaveValue` fails.

## Invariant check

- A3: upheld. Neither `selected` nor the entry key reaches the simulate request, and this pass does not change that.
- S1-S3: untouched.

## Out-of-scope findings

None new. Review 1's non-blocking notes still stand: the select focus goes through `getElementById`, the pin-compare dialog handlers do not check the type, and some fixtures in `build-library.test.ts` repeat.

## Status

`needs_review`
