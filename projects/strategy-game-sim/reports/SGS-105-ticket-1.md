# SGS-105 ticket author report 1

Ticket: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-105-save-and-open-by-link.md`

## Summary

SGS-105, "Add the Save button, the copyable link and the `?b=<id>` load to the AoE4 page". Component aoe4-build-order, risk standard, about 190 business-logic lines (the plan's ~250 included UI markup). Depends on SGS-103 and SGS-102. Criteria M6.5 and M6.9 (save-then-open spec, save/open docs). OD-1 to OD-8 are applied as (a) and not reopened. It is written against main + SGS-102 + SGS-103 and says that whichever of it and SGS-104 lands second rebases. The specs use `showTab` or an explicit 390 px viewport, so they hold with and without SGS-104. Diagram: one state diagram of the run gate (prerender, loading, running, current, dropped b). The read/act/record save path is one sentence.

## Symbols

- `saved-build-loader.ts`: `loadSavedBuild(id, signal)` returns `{status:'ok', saved} | {status:'not-found'} | {status:'failed'}` and never rejects. `savedBuildOption(id, saved)`.
- `save-build-client.ts` (new, not in the design): `postSavedBuild`, `saveFailureMessage(status, retryAfter, body)`.
- `save-build.tsx`: `SaveBuild`.
- Page: `builds` becomes state. `savedLoadInFlight` is derived as `router.isReady && initialB !== undefined && !loadEnded`. The page owns every `router.replace`.
- `BuildInput` gets `busy`. `BuildTextEditor` and `StepTable` get `disabled`.
- Acceptance helper `openSavedBuild(page, id)`; spec `acceptance/aoe4-save-open.spec.ts`.
- Unit files: `saved-build-loader.test.ts`, `save-build-client.test.ts`, `save-build.test.ts`.

## `?b=` page behavior

- `hold` stays true from the first render where `isReady` and `b` are both present until the load ends. There is no default-build POST in between.
- `b` absent: the normal load.
- Malformed `b`: no fetch.
- Valid `b`: GET `/api/aoe4-build-order/builds/<id>`.
- On 200 the page adds the option `<name> (<id>)` at the front of the select, selects it, sets the text and the duration, and releases. The run is exactly one simulate POST.
- Select, duration, editor, step table and Save are `disabled` with `aria-busy="true"` during the load.
- On narrow screens the first run that ends `current` after a successful load selects Results. Any other run, a failed load and an invalid saved text leave Build selected.
- Only the first `b` is read, and a later `query.b` change loads nothing.
- Unmount aborts the GET.
- 404 or a malformed id: `That saved build was not found. Showing the default build.`
- Other failure or network error: `That saved build could not be loaded. Showing the default build.`
- Saved text that no longer converts: loaded as text, status `invalid`, no request.
- `b` is removed by a shallow replace on the first settled change of text, duration or selected. It is not removed by the load or its first run, or by a live edit inside the 500 ms pause. A save puts it back.

## Save wording (for an agent-facing smoke script)

- Button: `data-testid="save-build"`, text `Save build`, enabled only when `auto-run-status` `data-status` is `current`.
- Link: `saved-build-link` is a read-only input whose value is `origin + /apps/aoe4-build-order?b=<11-char id>`. It is focused with its text selected.
- Copy button: `copy-saved-link`, text `Copy link`, then `Copied`.
- Copy refused: `Could not copy. Select the link and copy it by hand.`
- Errors (`save-build-error`):
  - `Too many saves. Try again in <n> seconds.` (`1 second` for 1)
  - `Too many saves. Try again in <m> minutes.` (60 s or more, rounded up; `1 minute` for 60)
  - `Too many saves. Try again later.` (no usable `Retry-After`)
  - `The build could not be saved: <first issue message>` (400)
  - `The build is too large to save.` (413)
  - `Saving is unavailable right now. Try again later.` (503)
  - `The build could not be saved. Try again.` (anything else, or a network error)
- Open error (`saved-build-error`): the two texts above.
- Opened state for the smoke: select shows the `(<id>)` option, `auto-run-status` reaches `current`, `chart-units-produced` is visible.

## Open questions (all non-blocking; no owner questions)

1. `designer`, bundle. SGS-103 makes `saved-builds.ts` import `api-route.ts`, which exports `englishCatalog`, which imports `data.ts` and the 300 kB snapshot JSON. A page import of `isSavedBuildId` or `savedBuildSchema` could put the game data in the client bundle.
   - I ran `npm ci` and `npx next build` on main (1e6d6c2). `unit_workshop_ram_3_eng` from `english.json` is in `.next/server` and in no file under `.next/static`.
   - The ticket makes this a bundle criterion. SGS-103's note that "the page already loads the game data" is wrong. Next strips `getStaticProps`-only imports, so the client bundle has no data today.
   - Recommended fallback, used only if the check fails: move `englishCatalog` into `lib/aoe4-build-order/english-catalog.ts`. That changes where one C7 name lives, so the designer must confirm it.
2. `designer`, name drift. The design says Save posts `name: pinName(builds, settled.text, settled.selected)`, and an opened build is the option `<name> (<id>)`.
   - Saving an unchanged opened build posts `Fast Castle (<id>)`, which gets a new id.
   - Editing it gives `... (<id>) (edited)`.
   - A long loaded name can exceed `SAVED_NAME_MAX_CHARS`, which gives a 400.
   - The ticket follows the design as written. Decide whether Save should strip the ` (<id>)` suffix or keep the stored name for an unchanged build.
3. `designer`, names the design lacks: `postSavedBuild`, `saveFailureMessage` (file `save-build-client.ts`) and the `loadSavedBuild` result shape.

## Checks run

- Ran `git grep` for every wiring criterion on main. Each finds no match today, as expected, because the files do not exist yet. The `starts on Build` docs grep matches line 853 of `docs/aoe4-build-order.md` today and the end state keeps it with the `?b=` exception.
- Ran the bundle criterion's baseline as above. It passes on main and can fail once a client import pulls in the data.
- Did not run Playwright or Vitest. There are no mutation criteria on existing code.
- Checked `use-router.md` and the automatic-static-optimization docs under `node_modules/next/dist/docs`. `isReady` is only for `useEffect`, and shallow `replace` is supported. The ticket asks the implementer to verify that `{ query }` without a `pathname` keeps the current path, and to add `pathname: router.pathname` if it does not.
- The ticket's wording for load, save and copy messages is mine (the design leaves it to tickets). Hand it to a designer if the owner wants other text.
- The worktree is removed and nothing is left running.

## Overlap

- SGS-104: same page areas, as noted above. No dependency either way. The only helper clash is `openPage` and `showTab` in `acceptance/helpers.ts`, where this ticket only adds `openSavedBuild`.
- SGS-102: edits the same `BuildInput` props and the page hooks. This ticket applies on top of its end state.
- Outline H (smoke) will reuse the ids and `?b=` behavior above.
