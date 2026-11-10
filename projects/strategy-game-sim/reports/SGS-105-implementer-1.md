# SGS-105 implementer report 1

- Ticket SGS-105, branch `sgs-105-save-and-open-by-link`, tip `66a9a18671fa567e0cf4b8fa1a976d1b4591692b`, base main 5b29e9e.
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-105-save-and-open-by-link`
- Status: needs_review

## Files touched
- `components/apps/aoe4-build-order/save-build-client.ts` (new): `postSavedBuild`, `saveFailureMessage`.
- `components/apps/aoe4-build-order/saved-build-loader.ts` (new): `loadSavedBuild`, `savedBuildOption`.
- `components/apps/aoe4-build-order/save-build.tsx` (new): `SaveBuild` (button, link panel, copy, escape, error, late-response guard).
- `components/apps/aoe4-build-order/pin-name.ts`: `savedBuildName`.
- `components/apps/aoe4-build-order/build-input.tsx`: `PrebuiltBuild.buildName`, props `settled`, `conversion`, `busy`, `onSaved`; select and duration disabled while busy; hosts `SaveBuild`.
- `components/apps/aoe4-build-order/build-text-editor.tsx`, `step-table.tsx` (`<fieldset disabled>` wrapper), `step-table.module.css`, `workbench.module.css`: `disabled` and styles.
- `pages/apps/aoe4-build-order.tsx`: `builds` state, `?b=` read and load, hold derivation, tab after load, URL baseline and removal, `recordSave`, `saved-build-error`.
- `acceptance/helpers.ts`: `openSavedBuild`.
- `docs/aoe4-build-order.md`: new "Saving a build and opening it by link" subsection and the three `?b=` exceptions.
- Tests (new): `save-build-client.test.ts`, `saved-build-loader.test.ts`, `save-build.test.ts`; `pin-name.test.ts` extended.

## Tests
- Vitest full suite: 62 files, 1857 passed, 10 skipped (the skips pre-exist), 0 failed.
- Invariants encoded: unchanged loaded build keeps its stored name (not the ` (<id>)` label); no stacked ` (edited)`; name at most 100 characters; no fetch for a malformed id; 404 is not-found and 500/503 are failed; 429 minutes round up and 60 s is `1 minute`; Save disabled for every status except `current` and while `busy`.
- Existing acceptance UI specs run (168 tests across aoe4 page specs including narrow-layout, small-screen, step-table, pin-compare, auto-run, results-split): all passed with no edits.
- Not run in this pass: the API/fight acceptance specs (untouched code) and the full `npm run acceptance`.

## Acceptance specs
`acceptance/aoe4-save-open.spec.ts` is NOT written. The implementer rule says not to author acceptance-harness tests (a separate gate owns them), which conflicts with Scope item 12; I added only the `openSavedBuild` helper the ticket names. To check behavior I ran a throwaway Playwright spec (4 tests, deleted before commit, all passed) covering: save then link value, focus and full selection, `b` in the URL, second save same link, fresh context open with one simulate POST, select label and duration, unchanged re-save answered 200, edit drops `b` and `?`, malformed and 404 ids with one default run and `b` kept until an edit, GET held with controls disabled and `aria-busy`, no POST during the hold and one after, `tab-results` after load at 390 px, `tab-build` with no `b`, scrollWidth at most 390 with the link shown, run bar at most 40% height at 768 and 1280, Copy and `Copied` with clipboard text, Escape returning focus to Save, a saved build with `knigt` ending `invalid` on Build with issues, and a 429 with `Retry-After: 90` message. Not covered by the throwaway spec: paused-clock debounce cases, late save response, back navigation, abort on leave, Copy rejection hint, `history.replaceState` spy.

## Existing tests edited
None changed an assertion. `pin-name.test.ts` only gained a `describe` block.

## Doc claims
All in `docs/aoe4-build-order.md` Page section: Save enabled only for status `current` and not busy or saving (`save-build.tsx:disabled`); name rule (`pin-name.ts:savedBuildName`); link is origin plus path (`save-build.tsx:setSaved`); focus and select (`save-build.tsx` effect on `saved`); Escape returns focus to Save (`onKeyDown`); link, error and `b` go on the first settled change (`save-build.tsx` clearing effect, page `urlBaseline` effect); late save response shows no link (`sameInput(input, settledNow.current)`); `?b=` load, option label, disabled controls (`pages/apps/aoe4-build-order.tsx`, `build-input.tsx`); first `b` only (`initialB` ref); error texts (`LOAD_ERRORS`, `saveFailureMessage`). Tab exception wording ("selects Results on a narrow screen after its first successful run") matches the `awaitingLoadTab` effect. The doc contains no measured timing and no rate-limit number.

## Pinned outputs
None.

## Mutation checks (all undone, tree clean before commit)
- `pin-name.ts` `same.buildName ?? same.name` to `same.name`: failed "loaded unchanged keeps its stored name, not the select label".
- `pin-name.ts` dropping the trailing-suffix removal: failed "an edited stored name edited again does not stack".
- `pin-name.ts` cap `SAVED_NAME_MAX_CHARS - EDITED_SUFFIX.length` to `SAVED_NAME_MAX_CHARS`: failed "a 100-character stored name is cut to fit the suffix".
- `saved-build-loader.ts` 404 check changed to 500: failed the 404 and 500 rows.
- `saved-build-loader.ts` removing the `isSavedBuildId` guard: failed the three malformed-id rows.
- `save-build-client.ts` `ceil` to `floor`: failed "429 with 61 seconds rounds minutes up" and the 90 s `postSavedBuild` test.
- `save-build-client.ts` `seconds < 60` to `< 61`: failed "429 with 60 seconds".
- `save-build.tsx` dropping `status !== 'current'`: failed the six status rows; dropping `busy`: failed the busy row.
(Loader test titles were reordered after the mutation run; titles only.)

## Checks
- `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones. `npx next build`: passes; the page prerenders (SSG).
- Bundle: `grep -rlF unit_workshop_ram_3_eng .next/static` lists nothing; `.next/server` lists chunk files (found).
- Wiring greps: `router.replace` only in the page; `navigator.clipboard` only in `save-build.tsx`; the builds URL only in `save-build-client.ts` and `saved-build-loader.ts`; no forbidden server-module imports under `components` or `pages/apps`; no `next` or `react` imports in the loader and client.
- No codegen configured.

## Invariants
- S1: imports are within the app's folders, `saved-builds.ts` and `api.ts` types only.
- S3: Save posts only for status `current`, built from the settled input, never the live text; the opened record goes through `useAutoRun` and its `textToBuildOrder` check before any simulate request.
- A3: no timing state added; the page URL logic compares the settled input only, skipping status `loading`.

## Design notes
- The initial `b` is captured once in a ref during the first render where `router.isReady` is true (never read again), so `hold` stays true in that same render and a later `query.b` change loads nothing. The GET effect keys on `router.isReady`.
- `router.replace` calls pass `pathname: router.pathname` explicitly, so the path is kept without relying on Next's handling of a query-only object.
- Test ids added beyond the ticket: `copy-saved-link-hint` for the copy-failure hint.
- Tab-after-load uses an `awaitingLoadTab` flag; it waits through `loading`, `running` and `updating`, then sets Results only for `current`.

## Out-of-scope findings
- Pre-existing `router.replace` is the page's alone; nothing found outside scope.
- SGS-104 will conflict textually in `pages/apps/aoe4-build-order.tsx` (props, tab state) and `docs/aoe4-build-order.md`; whichever lands second rebases.

## Prerequisites
Node 24 through `run.sh` shellSetup; `npm ci` run in the worktree; no missing tools. No server left running.
