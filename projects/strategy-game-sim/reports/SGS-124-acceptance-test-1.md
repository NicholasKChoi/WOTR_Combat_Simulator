# SGS-124 acceptance-test 1

- Branch `sgs-124-page-library`, tip **9733cdc** (test files only, on df9912a).
- Harness: Playwright (Chromium) with its own `next dev`; it ran. Setup was already provisioned.
- Verdict: PASS. No impl-defect, no spec-gap.

## Tests written

New file `acceptance/aoe4-my-builds.spec.ts` (25 tests):

| Group | Test | Pins |
| --- | --- | --- |
| select structure | label Build, one `Templates` group, option values `template:<name>` | label, group, entry-key values |
| select structure | seeded list (oldest first) shows `My builds` newest first, then `Templates` | grouping and sort |
| select structure | non-JSON stored value: no `My builds`, no `saved-build-error` / `save-build-error` | invalid storage |
| edited marker | with `page.clock` paused, one typed character gives `<name> (edited)` and `data-edited=true`; restoring clears it | live marker |
| edited marker | duration change leaves a template unedited | template duration never counts |
| edited marker | duration change on a stubbed `?b=` link gives `<name> (<id>) (edited)`; restoring clears it | opened-build duration counts |
| discard confirm | cancel: message `Discard your edits to "<name>"?`, text, duration and selected option kept, select focused, no POST | cancel path |
| discard confirm | accept: text becomes the other template's, marker cleared | accept path |
| discard confirm | unedited choose raises no dialog | confirm only when edited |
| unload guard | edited reload raises `beforeunload` (via `acceptBeforeUnload`), template text returns | guard on |
| unload guard | unedited reload, and edit-then-restore reload, raise none | guard off |
| `?n=` | unknown id: `<name> (shared)` under `Opened links`, text, duration, one POST, URL `?n=<id>` | shared load |
| `?n=` | seeded id: stored name under `My builds`, no `(shared)` | stored name wins |
| `?n=` | `n` and `b` together: n loads, no `b` GET, URL ends with `n` | n wins |
| `?n=` | 404 and 500 rows: the two `Showing the default build.` messages, default template kept, no `Opened links`, URL as typed | failures |
| `?n=` | gated stub: `loading`, controls disabled and `aria-busy`, no POST, then exactly one | hold |
| `?n=` | leaving through the landing link aborts the request (`requestfailed`), no console or page error | unmount abort |
| merge | gate opens only after the `My builds` group shows: both stored names plus `<name> (shared)` | merge by key |
| busy | `addInitScript` + `MutationObserver` from `DOMContentLoaded`: no `aria-busy=true` or `disabled` on the select until the first run ends | not busy before router ready |
| choose mine | gated: select, duration, text, Save disabled and busy, no POST; then stubbed text (asserted different first), selected, one POST, URL `?n=` | choose busy and load |
| choose mine | 404 and 500 rows: message, old text and option kept, next successful choose clears the message | choose failures |
| pinned label | pinning a stubbed `?b=` run reads `Pinned: Opened link, 20:00` (no id) | `runName` for a link |

Added to `acceptance/aoe4-save-open.spec.ts` (2 tests):
- `?b=<id>&utm=1` keeps `utm` and `b` after the load; choosing a template drops only `b`.
- a snapshot save on `?utm=1` gives a URL with `utm=1` and the new `b`.

The existing saved-name checks in the save-open tests are untouched. The pinned labels for an edited and an unedited template are already pinned by `aoe4-build-order-pin-compare.spec.ts`, so they are not repeated.

## Results

| Run | Result |
| --- | --- |
| `aoe4-my-builds` + `aoe4-save-open` | 70 passed |
| `aoe4-auto-run`, `-pin-compare`, `-step-table`, `-small-screen`, `-step-annotations`, `-build-order-m4-flow` | 107 passed |
| `npx tsc --noEmit`, `npm run lint:dup` | clean, 0 clones |
| `git grep` for `initialB` (`-w`), `urlBaseline`, `PrebuiltBuild`, `pinName`, `buildName`, `Prebuilt build</label>` in `pages` and `components` | no hits |

Not run: `npm test` (the implementer's), `next build`.

## Mutation checks

Each break was made in production code, the spec rerun, then `git checkout -- components pages` and `git diff --exit-code` on non-test files (clean after every batch). Several independent breaks were applied per run; each row is the assertion that failed for that test.

| Test | Break | Failing assertion |
| --- | --- | --- |
| label and values | `build-input.tsx` label text to "Prebuilt build"; `<option value>` to `entry.name` | `toHaveText('Build')`; `values` equal `template:<name>` |
| My builds order | `my-builds-storage.ts` `newestFirst` to identity; `LIBRARY_GROUPS` order swapped | `groupOptions('My builds')` order; `groupLabels` poll |
| invalid JSON | page adds a bogus `mine` entry when a stored value existed | `groupLabels` equals `['Templates']` |
| live marker | `isEdited` fed `settled.text` and `settled.duration` | option text `<name> (edited)` |
| template duration | `isEdited` counts a null `loaded.duration` | `data-edited` `false` |
| link duration | `isEdited` ignores duration | `<name> (<id>) (edited)` |
| cancel | `chooseEntry` does not return after a cancelled confirm; `.focus()` removed | select value `template:<name>`; `toBeFocused` |
| accept | `showEntry` keeps the old text | `toHaveValue(OTHER.text)` |
| no dialog when unedited | `edited &&` dropped from the confirm condition | `dialogs` equals `[]` |
| guard on | `useDiscardGuard` made a no-op | `dialogs` equals `['beforeunload']` |
| guard off (unedited, restored) | guard always on; listener cleanup removed | `dialogs` equals `[]` (both) |
| shared load | `entryLabel` drops ` (shared)` | `Shared one (shared)` |
| stored name wins | `withLoadedEntry` replaces a `mine` entry whole | `Newer stored build` |
| n wins | `initialBuildQuery` prefers `b` | `Shared one (shared)` |
| 404 / 500 messages | `LOAD_ERRORS` texts shortened | `toHaveText(message)` |
| hold | `hold` ignores `initialLoadInFlight` | posts length 0 (and `loading`) |
| unmount abort | initial-effect cleanup no longer aborts | `requestfailed` poll equals one `named-builds/<id>` |
| merge | `withLoadedEntry` returns `[entry]` for a new key | `My builds` options text |
| not busy before router | `busy` true while `initialQuery` is null | records show `aria-busy=true` |
| choose busy | `busy` drops `choosing` | `toBeDisabled` |
| choose failures | `setLoadError(null)` removed from `chooseEntry`; | `loadError` `toHaveCount(0)` |
| pinned label | `runName` returns name with `(<id>)` for a link | `Pinned: Opened link, 20:00` |
| utm kept, template drops b | `nextBuildQuery` copies `b` through; and drops other keys | `has('b')` false; `utm` and `b` pair |
| snapshot save keeps utm | `replaceBuildQuery` uses `{}` as the base query | `utm` equals `1` |

Notes from the checks:
- The unload-guard, "unedited raises no dialog" and `?n=` abort tests first failed on a timeout or an earlier assertion. I changed them: dialogs are accepted so the failing line is the `dialogs` assertion, the abort test polls recorded `requestfailed` events instead of `waitForEvent`, and the accept test asserts the textarea directly instead of waiting for a run.
- A break that only changes `loadInitialEntry`'s `mine` or `shared` kind does not fail the "stored name wins" test: `withLoadedEntry` keeps the listed `mine` entry anyway. The test is pinned by the `withLoadedEntry` break above, not by that one.

## Failures

None.

## Criteria not expressed in this harness

- `build-library.test.ts` and `pin-name.test.ts` rows, `withMyBuilds` / `withLoadedEntry` order independence: unit criteria (implementer's), not run here.
- "Every `.current =` is in a handler or an effect": review check; the greps above find no `initialB` or `urlBaseline`.
- Existing-test edit list is the implementer's (reports implementer-1 and -2); I added no edits to existing tests beyond the two new cases in save-open.

## State

No processes left running. Worktree clean at 9733cdc.
