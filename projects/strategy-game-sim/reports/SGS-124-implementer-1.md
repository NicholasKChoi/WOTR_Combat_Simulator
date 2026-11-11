# SGS-124 implementer report 1

- Ticket: SGS-124 (risk high, M8)
- Branch: `sgs-124-page-library`, base `a440406` (origin/main at fetch; origin/main has since gained #132 and #133, not merged in)
- Tip: `36cab45c98c4db386dd6a574dc51f0b7506ae3fb`
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-124-page-library`
- Worktree note: `git worktree add -b` failed on a stale `.git/config.lock` in the main checkout (left alone; it may belong to another process). The branch was created, and the worktree was added with `git worktree add <path> sgs-124-page-library`.

## Files touched

- `pages/apps/aoe4-build-order.tsx`: library state (`entries`, key `selected`), the `initialQuery` effect for `?n=`/`?b=`, `chooseEntry` with confirm and named loads, `busy`/`hold`, `useDiscardGuard`, the URL following the entry, and `runName`. `initialB`, `urlBaseline`, `selectBuild` and `pinName` use are removed.
- `components/apps/aoe4-build-order/build-input.tsx`: `PrebuiltBuild` deleted. Props are now `entries`/`selected` key/`edited`/`onBuildSelect(key)`. The label reads "Build", options are grouped into optgroups and labelled by `entryLabel`, and the select gets `data-edited`.
- `components/apps/aoe4-build-order/build-library.ts`: adds `linkEntry`, `namedEntry`, `withMyBuilds` and `withLoadedEntry`.
- `components/apps/aoe4-build-order/pin-name.ts`: `pinName` deleted. `savedBuildName` retyped to `(entries, text, selectedKey)`.
- `components/apps/aoe4-build-order/saved-build-loader.ts`: `savedBuildOption` deleted.
- `components/apps/aoe4-build-order/save-build.tsx`: takes `entries` instead of `builds`.
- `components/apps/aoe4-build-order/build-library.test.ts`: new rows for the builders and merges.
- `components/apps/aoe4-build-order/pin-name.test.ts`: rewritten as a `savedBuildName` table.
- `components/apps/aoe4-build-order/save-build.test.ts`: passes `entries`; expectations unchanged.
- `components/apps/aoe4-build-order/saved-build-loader.test.ts`: the `savedBuildOption` describe and its imports removed.
- `acceptance/helpers.ts`: adds `acceptBeforeUnload(page)`.
- `acceptance/aoe4-save-open.spec.ts`: existing tests updated per the ticket's existing-tests rule (listed below).
- `acceptance/aoe4-build-order-pin-compare.spec.ts`: existing tests updated per the same rule (listed below).
- `docs/aoe4-build-order.md`: the "Page" and "Saving a build and opening it by link" sections.

## Not done: new acceptance spec work

I did **not** author the new `acceptance/aoe4-my-builds.spec.ts`. I also did not add the new `aoe4-save-open.spec.ts` cases:
- `?b=<id>&utm=1` keeps `utm` and `b`
- a template choice drops `b` and keeps `utm`
- a save on `?utm=1` keeps `utm`

The implementer role says "Do not author acceptance-harness tests; a separate gate owns those." The acceptance criteria that rest only on those new specs are therefore open for the acceptance gate:
- select structure
- edited marker
- discard confirm
- unload guard
- `?n=` cases
- choose-mine gate
- not busy before ready
- list merge
- unmount abort
- the pinned label of a stubbed `?b=` run

I did what the ticket assigns to the implementer:
- added the helper
- updated existing tests
- ran the listed existing specs

A throwaway probe spec (deleted, not committed) confirmed in Chromium:
- Reloading an edited page raises a `beforeunload` dialog, and `acceptBeforeUnload` lets the reload proceed with the template text back.
- Choosing another entry while edited raises `confirm` with exactly `Discard your edits to "ENG 1TC"?`. While edited, the selected option read `ENG 1TC (edited)`.
- Dismissing the confirm keeps the select value and the text, and leaves focus on `build-order-select`.

## Deviation from the Scope's literal rule (savedBuildName)

Scope says `savedBuildName` takes "the first entry with `loaded?.text === text`". The page now appends opened entries after the templates (main prepended them). A `?b=` build whose text equals a template's therefore re-saved under the template name. That broke the existing `aoe4-save-open.spec.ts` test "an unchanged opened build re-saves to the same id and an edit saves as edited" (received `ENG 1TC`). It also contradicted the Scope line "its behavior is otherwise unchanged".

`savedBuildName` now checks the selected entry first: if the selected entry's loaded text equals the text, its name wins. Otherwise it falls back to the first match. This is the same order `runName` uses, and the Scope states that order for run names: "the selected one's name wins".

A new `pin-name.test.ts` row pins this. The re-save test passes with the change. The reviewer should confirm this reading.

## Tests

- `npx vitest run` on the four touched unit files: 66 passed. After the extra `savedBuildName` row: build-library 41, pin-name 10, save-build 9.
- `npm test` (full suite): 71 files, 2180 passed, 13 skipped, 0 failed.
- Acceptance (Playwright, Chromium, run via `run.sh`):
  - `aoe4-save-open.spec.ts`: 43/43 pass. The first run had 1 failure (see the deviation above); test :192 passed after the fix.
  - `aoe4-auto-run`, `aoe4-step-table`, `aoe4-small-screen`: all pass.
  - `aoe4-build-order-pin-compare`: 40/40 pass after the dialog handlers. Before the edits, 2 tests timed out waiting for a run: Playwright dismissed the confirm and nothing was chosen.
  - Combined second run of the listed specs: 89 passed; the 2 failures were the pin-compare cases fixed afterwards.
  - `aoe4-my-builds`: not run (not authored; see above).

Invariants encoded by the unit tests:
- `linkEntry`
  - Key `link:<id>`, kind `link`, the stored name, duration as `String(durationSeconds)`, revision `null`, and text equal to `formatBuildOrderText`.
  - The text converts back to the saved steps.
- `namedEntry(mine|shared)`: key `named:<id>`, the kind passed, the build's revision and the formatted text.
- Merges
  - `withLoadedEntry(withMyBuilds(t, mine), loadedB)` deep-equals `withMyBuilds(withLoadedEntry(t, loadedB), mine)`. In both, B keeps its stored name, kind `mine` and `loadedB.loaded`.
  - My builds stay in stored order (A then B), whichever result lands first.
  - A shared entry already listed is replaced whole.
  - A new key is appended last.
  - `withMyBuilds` keeps link and shared entries it does not name.
- `savedBuildName`
  - Template unchanged, template edited.
  - An opened link's stored name wins over the select label.
  - The selected link's name wins over a template with the same text.
  - A link edited gets ` (edited)`.
  - ` (edited)` does not stack.
  - A 100-char name gives 91 chars + ` (edited)`.
  - An unknown key gives `Custom build`, and so do empty entries.
  - A `loaded: null` entry is never matched.
  - Every result is at most 100 chars.
- `runName` `Custom build` rows (unknown key, empty entries) already existed in `build-library.test.ts` from SGS-123. I left them unchanged.

## Pre-existing tests edited

Unit tests:
- `save-build.test.ts` (all cases): `builds` prop replaced by `entries` (`templateEntries`), and the settled `selected` became the entry key. The rule is the Scope line "`save-build.test.ts` passes `entries` ... with otherwise unchanged expectations".
- `saved-build-loader.test.ts:savedBuildOption` describe: removed. The rule is "The `savedBuildOption` test ... is removed with the function".
- `pin-name.test.ts` (all): rewritten for `savedBuildName(entries, text, selectedKey)` and the `pinName` rows deleted. The rule is the acceptance criterion that rewrites it.

`aoe4-save-open.spec.ts`:
- `after a save > {a text edit, a duration edit, a build selection} ...`
  - A new `keepsB` column: text and duration edits now expect `?b=<id>` kept after the settled change, and the build selection still expects no query.
  - The title changed to say which applies.
  - Rule: "`b` dropped by the first settled edit" is old behavior and gets the new expected value. Criterion: "A settled text edit after a load no longer removes `b` (changed expectation); a build selection does."
- `opening a link > <row> shows the message, runs the default build once and keeps b after a settled edit` (4 rows)
  - The select value is now `template:<default name>`; rule: "the select's value being a build name".
  - After a settled edit the URL keeps `?b=<query>` instead of losing its query; rule: "`b` dropped by the first settled edit". Scope: on a failed load "the URL is left as it is", and the URL follows the selected entry.
  - The title changed to match.

`aoe4-build-order-pin-compare.spec.ts`:
- Rule "a build selected after an edit with no dialog handler":
  - `the pin survives a text edit and a prebuilt change, and the overlay stays`: `page.once('dialog', accept)` before choosing index 0 while edited.
  - `the label names the prebuilt, marks an edit, and is fixed when pinned`: the same handler before both selects made while edited (index 1, then index 0). All its label assertions are unchanged.
- Rule "a test that leaves a page that is edited at that moment, by `page.reload()`":
  - `pin and unpin write through to localStorage`: `acceptBeforeUnload(page)` before the reload. The text and duration were edited by `runOk`.

I inspected every other `reload`/`goto` in the listed specs: each happens on an unedited page (fresh load, `openPage`, `storePin` only).

## Doc claims

All in `docs/aoe4-build-order.md`.

Page section:
- "holds the build select (labelled Build, see below)": `build-input.tsx` `<label htmlFor="build-order-select">Build</label>`.
- "The select groups its entries as My builds (the builds this browser saved, newest first), Opened links (builds opened by a `?n=` or `?b=` link, in the order they were opened; a shared build reads `<name> (shared)` and a `?b=` build `<name> (<id>)`) and Templates (the shipped builds); an empty group is not shown."
  - `build-library.ts` `LIBRARY_GROUPS` and `entryLabel`.
  - `mineEntries` sorts by `updatedAt` descending (an existing test row).
  - `withLoadedEntry` appends.
  - `build-input.tsx` returns `null` for an empty group.
- "Choosing a template replaces the text with its paste text and keeps the duration; choosing an opened `?b=` build restores its text and duration": `pages/apps/aoe4-build-order.tsx` `showEntry` (`entry.loaded?.duration ?? duration`; the template `loaded.duration` is `null` per `templateEntries`).
- "choosing one of My builds or a shared build fetches its latest version, and the select, duration, text editor, step table and Save build are disabled while it loads, with no run until it ends": `chooseEntry` → `loadNamedEntry`, `setChoosing(true)`, `busy = initialLoadInFlight || choosing`, and `busy` passed to `BuildInput`/editor/`StepTable`. No input edit happens until the load resolves.
- "A failed fetch keeps the text, duration and selection and shows `That build was not found. The current build is unchanged.` or `That build could not be loaded. The current build is unchanged.`; the next choice clears it.": `CHOOSE_ERRORS`, and `setLoadError(null)` at the start of `chooseEntry`.
- "the selected option reads `<label> (edited)` and the select has `data-edited="true"` (otherwise `"false"`); ... (a template's duration never counts)": `build-library.ts` `isEdited` (duration compared only when `loaded.duration !== null`), plus `build-input.tsx`.
- "the marker follows typing, not the 500 ms pause": `edited = isEdited(selectedEntry, { text, duration })` over the live state. The probe saw `data-edited="true"` right after `fill`.
- "Choosing another entry while edited asks `Discard your edits to "<label>"?`, and cancelling keeps the text, the duration and the selection.": `confirmDiscard`, and `chooseEntry` returns before any state change. Probe confirmed.
- "Reloading or closing an edited page asks the browser to confirm; an unedited page leaves without asking.": `use-discard-guard.ts` `useDiscardGuard(edited)`. The probe confirmed the edited case; the pin-compare reloads of unedited pages raise no dialog.

Pinned label:
- "the name of the entry selected when that input was sent if its text equals the input exactly, else the name of the first entry whose text does (an opened build by its stored name, without the ` (<id>)` of its select label), else `<name> (edited)` for the selected entry, and `Custom build` when no entry is selected.": `build-library.ts` `runName`.

Saving section:
- "The saved name is that of the selected build when its text equals the saved text, else of the first build whose text it equals, or else ...": `pin-name.ts` `savedBuildName`.
- "The link and any save error go away on the first settled change ...; the `b` in the address bar does not, since the address follows the selected entry, not the edits. A save puts its `b` in the address and keeps the other query keys.":
  - `urlBaseline` is removed.
  - `recordSave` → `replaceBuildQuery({kind:'link', id})` → `nextBuildQuery(router.query, ...)`.
  - The save-open "keeps b" rows pass.
- "`<name> (<id>)` under Opened links that is selected": `linkEntry` and `LIBRARY_GROUPS`.
- "`?n=<id>` opens a named build the same way: one of My builds keeps its stored name, any other loads as `<name> (shared)` under Opened links.": `loadInitialEntry` → `readMyBuilds` and `loadNamedEntry('mine'|'shared')`, plus `withLoadedEntry`, which keeps a mine name.
- "When both are present `n` wins and `b` is not fetched. The first `n` or `b` in the address is the only one read, and a later change of either (back or forward) loads nothing.": `build-query.ts` `initialBuildQuery`, and the `[router.isReady]` effect runs once.
- "After a load or a choice the address follows the selected entry: `n=<id>` for My builds and shared builds, `b=<id>` for an opened `?b=` build, and neither for a template; other query keys are kept. A load that fails leaves the address as it was.": `showEntry` → `replaceBuildQuery` → `nextBuildQuery`. On failure only `setLoadError` runs.
- "For either key, an unknown or malformed id shows `That saved build was not found. ...`": `LOAD_ERRORS[loaded.status]` for both branches of `loadInitialEntry`.

`acceptance/helpers.ts`:
- Comment "Call just before reloading or leaving an edited page: Playwright dismisses an unhandled dialog, which cancels the unload.": `acceptBeforeUnload`. Observed: the pin-compare select tests timed out without a handler because the confirm was dismissed.

## Pinned outputs

None. No value is pinned from the engine.

## Mutation checks

Each break was applied in the scratchpad script, the named test run, and the file restored. `git status` was clean afterwards.

| Break (file:line) | Failing test (assertion that names it) |
|---|---|
| `build-library.ts` linkEntry `revision: null` → `0` | `builders > linkEntry keys by the link id ...` (toEqual) |
| linkEntry `entryKey.link` → `entryKey.named` | same |
| linkEntry text → `''` | same, and `linkEntry text converts back to the saved steps` |
| linkEntry duration → `'1200'` | `linkEntry keys by the link id ...` |
| namedEntry `kind` → `'shared'` | `namedEntry(mine) ...` only |
| namedEntry revision → `null` | `namedEntry(mine)` and `namedEntry(shared)` |
| withMyBuilds `loaded` → `entry.loaded` (drops listed) | `gives the same list whichever ... lands first` |
| withMyBuilds keeps only templates | `keeps link and shared entries the My builds read does not name` |
| withMyBuilds reverses mine | `keeps My builds in stored order (read first/load first)` |
| withLoadedEntry shared merged instead of replaced | `replaces a listed shared entry whole` |
| withLoadedEntry mine replaced whole | `gives the same list ...` and `stored order (read first)` |
| withLoadedEntry prepends | `appends an entry whose key is not listed` |
| `pin-name.ts` selected-first check removed | `an opened link with a template's text keeps its own name while selected` |
| first-match return removed | `a template unchanged ...`, `the same text as an opened link ...`, and the selected-link row |
| cut `- EDITED_SUFFIX.length` → `- 7` | `a 100-character name is cut to fit the suffix` |
| un-stacking disabled | `an edited stored name edited again does not stack` |
| `'Custom build'` → `'Custom build (edited)'` | `a selected key that is no entry ...` and `no entries ...` |
| null `loaded` matched as `''` | `an unloaded entry never matches empty text` |
| `save-build.tsx` passes `''` as the selected key | **no unit test fails** |

On the last row: `save-build.test.ts` does not assert the saved name, and its expectations are unchanged by ticket rule. The name is covered by the `pin-name.test.ts` rows and by `aoe4-save-open.spec.ts` :192, which failed while the name rule was wrong.

## Build stages

- codegen: not set in REPO.md (empty).
- build: `npx next build` succeeds and `/apps/aoe4-build-order` is SSG. `bash $FACTORY_DIR/bin/link-node-modules.sh .` was skipped because `$FACTORY_DIR` was unset inside `run.sh`; `node_modules` was already present in the worktree.
- lint: `npx tsc --noEmit` reports 0 errors; `npm run lint:dup` finds 0 clones.

End-state greps in `pages` and `components`:
- `PrebuiltBuild`, `pinName`, `buildName`, `urlBaseline` and `Prebuilt build</label>`: no matches.
- `-w initialB`: no matches.
- `.current =` in the page appears only at:
  - `chooseAbort`, lines 242/249/253, inside `chooseEntry` and its promise callback (an event handler)
  - `pinTouched`, lines 268/275, inside the pin handlers
- The cleanup `chooseAbort.current?.abort()` is in an effect.

Diff review against the base:
- Only the 14 files listed are changed.
- No lockfile changes.
- No AGENTS.md block added.
- No `test-results`.

## Invariant check

- A3 (`selected` is never sent to simulate): upheld. `selected` is now an entry key passed only to `useAutoRun` as the opaque `LiveInput.selected`. `auto-run.ts` and `use-auto-run.ts` are unedited, and the request body still carries only `buildOrder` and `inputs.durationSeconds`. The save-open spec checks the posted inputs equal `{ durationSeconds: 1200 }`.
- S3 (duration check): untouched.
- Other expectations:
  - Ref writes stay out of render.
  - `busy` is false while `initialQuery` is `null`, and `hold` covers that window.
  - Every `entries` update is functional through `withMyBuilds` or `withLoadedEntry` (the initial `useState` from `templateEntries` aside).

## Out-of-scope findings

- origin/main moved past the base (#132, #133). #133 edits the same page region (the heading and `runBarRef`) and will need a rebase or merge before landing. I did not merge it (not my branch's base).
- `/home/choin/git/WOTR_Combat_Simulator/.git/config.lock` exists and blocks `git worktree add -b` and other config writes from the main checkout.

## Status

`needs_review`. The new acceptance spec (`aoe4-my-builds.spec.ts`) and the three new `aoe4-save-open.spec.ts` cases are left to the acceptance gate per the implementer role. Review should also confirm the `savedBuildName` selected-first deviation.
