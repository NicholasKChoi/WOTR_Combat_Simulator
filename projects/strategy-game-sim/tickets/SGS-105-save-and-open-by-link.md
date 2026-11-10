# SGS-105: Add the Save button, the copyable link and the `?b=<id>` load to the AoE4 page

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M6 / M6.5 (Save button, copyable link, `?b=` load, unknown-id error), M6.9 (save-then-open spec, docs for save and open)
- **Priority**: medium
- **Risk**: standard
- **Invariants**: S1 (imports stay inside `components/apps/aoe4-build-order/`, `lib/aoe4-build-order/` and `pages/apps/aoe4-build-order.tsx`), S3 (the page posts to the save route only for a settled, valid, `current` input and never sends an unvalidated body; the opened record is re-checked by `checkBuildOrder` through the controller before any simulate request), A3 (a `?b=` load and a manual edit of the same content show the same result: the page adds no timing-dependent state). Not adjacent to A1 or A2.
- **LOC estimate**: ~205 (`save-build.tsx` ~90, `saved-build-loader.ts` ~35, `save-build-client.ts` ~40, `savedBuildName` in `pin-name.ts` ~15, page ~70 net, `build-input.tsx` ~15, `disabled` on `build-text-editor.tsx` and `step-table.tsx` ~10; UI markup and CSS, tests, docs and specs excluded where they carry no branch)
- **Depends on**: SGS-103, SGS-102
- **On merge**: none
- **Source**: `design/M6.md` C6 (save part: `SaveBuild`, `loadSavedBuild`, `savedBuildOption`, the test ids), "Save and link", "`?b=<id>` load", "Page wiring", the "tabs (narrow)" row, OD-5 (a), OD-6 (a), OD-8 (a); `design/M6.md` C6 "saved name" (`savedBuildName`, `PrebuiltBuild.buildName`) and C7 (`english-catalog.ts`); `reports/M6-designer-2.md` Q4, Q5, Q9; `reports/M6-designer-3.md` Q8, Q9, Q10; `plans/M6-20261105.md` outline G; M6.5, M6.9

## Context

SGS-103 adds the builds routes (`POST` saves a validated `{ buildOrder, durationSeconds }` and returns
`{ id, path }`; `GET` reads it back). SGS-102 makes the page re-run on edit through `useAutoRun`. This ticket is
the page side of M6.5: a Save button that is enabled only while the shown result matches the settled input, a
read-only link with a Copy button, and opening `/apps/aoe4-build-order?b=<id>` to load that build into the
editor and run it. The address bar never claims a link for content it no longer shows (OD-5 (a)).

## Scope

Read first: `design/M6.md` C6, "Save and link", "`?b=<id>` load", "Page wiring" (authoritative for rules). Read in
`node_modules/next/dist/docs/02-pages/04-api-reference/03-functions/use-router.md` (`isReady`, "should only be used inside
`useEffect`", shallow `replace`) and
`02-pages/03-building-your-application/02-rendering/04-automatic-static-optimization.md` (`query` is empty during
prerender) before editing the page; this Next is 16 and has breaking changes (AGENTS.md). Checked while writing:
`router.isReady` is false on the prerender and the first client render of a statically optimized page, and
`router.replace(url, as, { shallow: true })` updates the URL without rerunning `getStaticProps`.

**Parallel work.** SGS-104 (split layout) edits the same page areas (`WorkbenchTabs` props, `viewDisabled`, tab
state, the hooks block, `showTab` and `openPage` in `acceptance/helpers.ts`, the layout sentences in
`docs/aoe4-build-order.md`). This ticket does not depend on it and is written against `main` plus SGS-102 and
SGS-103; whichever of the two lands second rebases. Nothing here reads a split flag: setting `tab` after a `?b=`
load is harmless when SGS-104 renders no tablist, and the specs below use `showTab` or an explicit 390 px viewport,
so they hold with and without SGS-104.

Names from the dependencies are described as their tickets end, not as `main` reads today:

- SGS-099 `saved-builds.ts`: `savedBuildSchema`, `SavedBuild`, `SaveBuildRequest`, `SaveBuildResponse { id; path }`,
  `isSavedBuildId`, `SAVED_BUILD_ID_PATTERN`, `savedBuildPath`; `api.ts`: `BuildsError { error }`, `SimulateError`.
- SGS-103: `englishCatalog` lives in the server-only `lib/aoe4-build-order/english-catalog.ts`, so `api-route.ts`
  (six names, no data import) and `saved-builds.ts` import no game data and are browser-safe. `POST /api/aoe4-build-order/builds` answers 201 and 200 `{ id, path }`, 400 `SimulateError`, 413
  `BuildsError`, 429 `BuildsError` with `Retry-After`, 503 `BuildsError`, 405. `GET /api/aoe4-build-order/builds/{id}`
  answers 200 `SavedBuild & { id }`, 404, 500, 503. Acceptance helpers `BUILDS_PATH`, `buildPath(id)`,
  `postBuild(request, body, client)`, `uniqueClient(spec)`.
- SGS-100 and SGS-102 (`auto-run.ts`, `use-auto-run.ts`): `useAutoRun({ text, duration, selected, catalog, hold })`
  returns `AutoRunState & { flush; retry }` with `status` (`AutoRunStatus`), `settled: LiveInput`, `conversion`,
  `result`, `shown`; `hold` true gives status `loading`, no timer and no POST, and `release()` (run by the hook when
  `hold` turns false, after `input` with the same render's values) settles the last live input and fires at once.
  `auto-run-status` has `data-status`; helpers `waitForRun(page, action?)`, `expectNoRun(page, action?)`,
  `openPage(page)` (waits for status `current`), `AUTO_RUN_DEBOUNCE_MS`; `BuildInput` takes `status`, `hasResult`,
  `durationError`, `onSubmit`; `autoRunStatusMessage`.

### Modules (new files in `components/apps/aoe4-build-order/`, none imports `next`, and only `save-build.tsx` imports React)

1. **`saved-build-loader.ts`** (no React): `loadSavedBuild(id: string, signal: AbortSignal)` returns
   `Promise<{ status: 'ok'; saved: SavedBuild } | { status: 'not-found' } | { status: 'failed' }>` and never rejects.
   - `!isSavedBuildId(id)`: `not-found`, and `fetch` is not called.
   - Otherwise `fetch('/api/aoe4-build-order/builds/' + id, { signal })`, header `Accept: application/json`.
     200 whose JSON passes `savedBuildSchema.safeParse`: `ok` with the parsed record (the extra `id` key is
     dropped by the schema). 404: `not-found`. Any other status, a 200 body that fails the schema or is not
     JSON, a network error and an aborted signal: `failed`.
   - `savedBuildOption(id: string, saved: SavedBuild): PrebuiltBuild` returns `{ name: `${saved.buildOrder.name}
     (${id})`, text: formatBuildOrderText(saved.buildOrder), buildName: saved.buildOrder.name }`.
     `PrebuiltBuild` (in `build-input.tsx`) gains `buildName?: string`, the `buildOrder.name` a save posts for that
     option; it is absent for the prebuilt builds. The ` (<id>)` suffix is a select label only and is never saved.
2. **`save-build-client.ts`** (no React; names confirmed by the design, C6):
   - `postSavedBuild(request: SaveBuildRequest, signal?: AbortSignal): Promise<{ ok: true; response: SaveBuildResponse } | { ok: false; message: string }>`
     posts JSON to `/api/aoe4-build-order/builds` (201 and 200 are success; a body that is not a
     `SaveBuildResponse` is a failure). Every failure is mapped by `saveFailureMessage` and the function never
     rejects.
   - `saveFailureMessage(status: number | null, retryAfter: string | null, body: unknown): string` with exactly:

     | case | text |
     |------|------|
     | 400 with a non-empty `issues` array in `body` | `The build could not be saved: <first issue's message>` |
     | 413 | `The build is too large to save.` |
     | 429, `retryAfter` a whole number of seconds below 60 | `Too many saves. Try again in <n> seconds.` (`Try again in 1 second.` for 1) |
     | 429, `retryAfter` 60 or more | `Too many saves. Try again in <m> minutes.` with `m = ceil(seconds / 60)` (`1 minute` for 60) |
     | 429, `retryAfter` missing, not a whole number, or below 1 | `Too many saves. Try again later.` |
     | 503 | `Saving is unavailable right now. Try again later.` |
     | any other status, a 400 with no readable issue, or `null` (network error) | `The build could not be saved. Try again.` |
3. **`pin-name.ts`** gains `savedBuildName(builds: readonly PrebuiltBuild[], text: string, selected: string): string`
   (rules and samples are `design/M6.md` C6 "saved name", first match wins):
   1. `builds` empty: `'Custom build'` (as `pinName`).
   2. Some build's `text` equals `text` (the first in `builds` order): its `buildName ?? name`. So an unchanged
      loaded build keeps its stored name and a save returns the same id.
   3. Otherwise `base = builds.find(b => b.name === selected)?.buildName ?? selected`, with one trailing
      ` (edited)` removed, and the result is `${base.slice(0, SAVED_NAME_MAX_CHARS - 9)} (edited)` (9 is the length
      of ` (edited)`, `SAVED_NAME_MAX_CHARS` is 100), so it never exceeds 100 characters and never stacks a second
      ` (edited)`.
   `pinName` and the pin label are unchanged (a loaded build's pin label still shows ` (<id>)`).
4. **`save-build.tsx`** exports `SaveBuild`. Props (the names are the implementer's; the data is): `status:
   AutoRunStatus`, `settled: LiveInput`, `conversion` (the settled conversion), `builds: PrebuiltBuild[]`, `busy:
   boolean` (a `?b=` load is in flight) and `onSaved(response: SaveBuildResponse, input: LiveInput): void`. Rules:
   - **Enabled** only when `status === 'current'`, `busy` is false and no save is in flight. `conversion.order` is
     read only inside the `status === 'current'` branch (type narrowing, no cast). Otherwise it is
     `disabled` (the attribute) and visibly dimmed. `data-testid="save-build"`, visible text `Save build`.
   - **Click** posts, through `postSavedBuild`, `{ buildOrder: { ...conversion.order, name: savedBuildName(builds,
     settled.text, settled.selected) }, durationSeconds: Number(settled.duration) }`. The body is built from the
     settled input and never from the live text.
   - **201 or 200:** shows `saved-build-link` (a read-only `<input>`, `aria-label="Link to this saved build"`,
     value `window.location.origin + response.path`) and `copy-saved-link` (text `Copy link`) in the run bar,
     moves focus to the input and selects all its text, clears any `save-build-error`, and calls `onSaved`. A repeat
     click on the same settled input shows the same link.
   - **Failure:** shows `save-build-error` (`role="alert"`) with the `postSavedBuild` message, hides the link
     panel, and leaves Save enabled.
   - **Hiding:** when the settled input's `text`, `duration` or `selected` differs from the input saved, the link
     panel and `save-build-error` are hidden. Escape inside the panel hides it and returns focus to Save. The
     panel is the only place that renders a saved link; nothing else on the page does.
   - **Copy:** `navigator.clipboard.writeText(link)` (the only clipboard call under `components` and `pages`); on
     success the button reads `Copied` until the link panel hides or the settled input changes; if the call
     rejects or `navigator.clipboard` is missing, the input text is selected and the hint `Could not copy. Select
     the link and copy it by hand.` shows next to it.
   - The link input and the run bar must not widen the page: with the panel shown nothing scrolls sideways at 390
     px, and the sticky run bar (768 px and wider) stays within 40% of the viewport height.

### Page (`pages/apps/aoe4-build-order.tsx`) and `BuildInput`

5. `builds` becomes page state (`useState(props.builds)`), so a loaded option can be put at the front. `pinName`,
   the select and `useAutoRun`'s `selected` all read the state.
6. **The `?b=` read.** `useRouter` from `next/router`. A `useEffect` keyed on `router.isReady` (never read during
   render for anything but `hold`) reads `router.query.b` once: an array gives its first value, and an absent or
   empty value is the normal first load. Only the initial `b` is read: a later change of `query.b` (back or forward
   after a save) loads nothing.
   - `hold = !router.isReady || savedLoadInFlight` as SGS-102 passes it, with `savedLoadInFlight` true for every
     render in which `router.isReady` is true, `b` is present and the load has not ended. No render may have
     `isReady` true, `b` present, and `hold` false before the load ends; otherwise the controller fires the default
     build and a second request follows. A derivation such as `router.isReady && initialB !== undefined &&
     !loadEnded` (a `loadEnded` state set by the effect) satisfies it, a flag set inside the effect does not.
   - Present `b` fails `isSavedBuildId`, or `loadSavedBuild` returns `not-found` or `failed`: `saved-build-error`
     (`role="alert"`) shows `That saved build was not found. Showing the default build.` (`not-found`) or `That saved
     build could not be loaded. Showing the default build.` (`failed`), the load ends, and the default build runs.
   - `ok`: in one state update, `builds` gets `savedBuildOption(id, saved)` at its front, `selected` is its name,
     the text is its text (through the page's `editText`, so open step rows stay consistent), `duration` is
     `String(saved.durationSeconds)`, and the load ends, so the hook's `input` and `release` run with that
     input. A saved record whose text no longer converts is loaded as text and the status is `invalid`, with no
     request (the controller's rule).
   - While the load runs: the select, the duration input, the text editor, the step table and Save are `disabled`
     with `aria-busy="true"`; the attribute is absent afterwards. `BuildInput` gets a `busy` prop,
     `BuildTextEditor` and `StepTable` a `disabled` prop (a `<fieldset disabled>` wrapper is enough for the table).
     The Text/Table toggle is unchanged.
   - The effect's `AbortController` aborts on cleanup, and no state changes after unmount or after an aborted
     load.
7. **Tab after a load (OD-6 (a)).** Nothing sets `tab` except a successful `?b=` load: the first run that follows
   it and ends `current` sets `tab` to `results`. If that run ends `invalid`, `rejected` or `failed`, `tab` stays
   `build`. No other run changes the tab.
8. **The URL (OD-5 (a)).** The page owns every `router.replace`. After a save (`onSaved`) it calls
   `router.replace({ query: { b: response.id } }, undefined, { shallow: true })`. The baseline for the URL is the
   input the `b` belongs to: the saved input after a save, the loaded input after a `?b=` load, and the default
   build's input after a failed load. When the settled input's `text`, `duration` or `selected` first differs
   from that baseline, the page calls `router.replace` with the `b` removed, shallow, once, and the link panel hides
   (item 4). The settled input is what counts, never the live text, so `b` stays through the 500 ms pause.
   **Rule for the interim render (respec 1):** the comparison runs only while `status !== 'loading'`. The hook's
   `loading` status is the held state (`design/M6.md` C6 and designer pass 4: before the mount effect, and while
   `hold` is true, the hook returns `loading` with `settled` equal to the args at that time). The render in which
   the `?b=` load has ended but the hook has not yet released still reports `loading` with the default input as
   `settled`, so it is skipped, and the next non-`loading` status already carries the loaded input as `settled`
   and equals the baseline. A failed load needs no wait: the baseline is the default input, equal to `settled`.
   `b` therefore stays through the load and its first run. **Late save response (respec 1):** a save response is
   acted on only if the input it was posted for equals the current settled `text`, `duration` and `selected`; if
   it differs (the settled input changed while the save was in flight) no link panel shows, `onSaved` does not
   call `router.replace`, and the baseline does not move. A selection that changes the
   settled input counts. The final URL after removal is `/apps/aoe4-build-order` with no `?`; verify
   that `{ query: {...} }` without a `pathname` keeps the current path under Next 16 and add `pathname:
   router.pathname` if it does not.
9. `BuildInput` hosts `SaveBuild` after the view toggle and before nothing else, inside the run bar form; Save is
   `type="button"` so Enter in the duration field still means `flush()` and never saves. The link panel follows the
   Save button in tab order, then Copy.
10. Imports from `lib/aoe4-build-order/` into `components` and `pages/apps` are limited to `saved-builds.ts`
   (values and types) and `api.ts` (types), plus what the page already imports. Neither `api-route.ts`,
   `builds-routes.ts`, `build-store.ts`, `blob-build-store.ts` nor `save-rate-limit.ts` is imported client-side.
   **Bundle check:** `saved-builds.ts` imports `api-route.ts`, which holds no data import because `englishCatalog`
   lives in the server-only `english-catalog.ts` (SGS-103). The page's client bundle must have no game data
   (`data.ts` imports the 300 kB snapshot JSON); verified on `main` (`npx next build` at 1e6d6c2: the string
   `unit_workshop_ram_3_eng` from `english.json` is in `.next/server` and in no file under `.next/static`). The
   implementer runs the check after the build and records the result.

**Existing tests (respec 1).** The Save button and link panel change the run bar. A test of the changed behavior gets
the new expected value; any other test keeps its expected value and adapts only its setup. Every unit or acceptance
test that fails only because `builds` is page state, `BuildInput` gained props or the run bar holds a new control
is fixed to the same expectation. The likeliest to change are the narrow-layout spec
(`acceptance/aoe4-narrow-layout.spec.ts`) and the run-bar height specs; the implementer lists every test it edits in
the report.

### Out of scope

The controller, `useAutoRun` and the status texts (SGS-100, SGS-102); split layout (SGS-104); the routes, stores and
rate limit (SGS-101, SGS-103) beyond calling them; the smoke script and the agent how-to (outline H); saving
comments, blank lines or the raw text (OD-1 (a): the parsed order only); a DELETE or listing UI; the
`docs/api/openapi.json` (no route changes); the Strict Mode double
effect (Strict Mode is off).

### Tests

11. **Vitest** (no DOM, no new dependency; table style of `simulate-client.test.ts` from SGS-100):
    - `pin-name.test.ts`: `savedBuildName` for every sample row of `design/M6.md` C6 "saved name" (prebuilt unchanged
      and edited; loaded option `L` unchanged and edited; a `buildName` already ending ` (edited)` edited again; a
      100-character `buildName` edited giving its first 91 characters + ` (edited)`), plus `builds` empty giving
      `Custom build`, and a name never longer than 100 characters. Breaks caught: the ` (<id>)` label saved as the
      name, a stacked ` (edited) (edited)`, a name over the cap, an unchanged loaded build renamed.
    - `saved-build-loader.test.ts`: `savedBuildOption` for a record named `Fast Castle` and id `Zx3_k9-QaB0` gives
      name `Fast Castle (Zx3_k9-QaB0)`, `buildName` `Fast Castle` and the text equal to `formatBuildOrderText` of the order (and the text
      re-converts with `textToBuildOrder`). `loadSavedBuild` with `vi.stubGlobal('fetch', ...)`, one row each:
      `abc` and a 12-character id give `not-found` and `fetch` is not called; a valid id requests
      `/api/aoe4-build-order/builds/<id>` with the given `signal`; 200 with a valid record (extra `id` key) gives
      `ok` and `saved` without `id`; 200 with `{ version: 2 }` and 200 with a non-JSON body give `failed`; 404
      gives `not-found`; 500 and 503 give `failed`; a rejecting `fetch` gives `failed`; an already-aborted signal
      gives `failed`. Breaks caught: a 404 mapped to `failed`, a 500 mapped to `not-found`, a fetch for a malformed
      id, a body that skips the schema.
    - `save-build-client.test.ts`: the `saveFailureMessage` table above, including `retryAfter` `'1'`, `'59'`,
      `'60'`, `'61'`, `'3600'`, `null`, `'abc'`, `'0'`, and a 400 with `issues: []`. `postSavedBuild` with a
      stubbed `fetch`: 201 and 200 give `ok` with the response body; 429 with header `Retry-After: 90` gives
      `Too many saves. Try again in 2 minutes.`; a rejecting `fetch` gives the network text; a 201 whose body is
      `{}` is a failure. Break caught: `Retry-After` ignored, 60 shown as seconds, minutes rounded down.
    - `save-build.test.ts` (`renderToStaticMarkup`, table style of the nearest component test): `SaveBuild` renders
      `save-build` with the `disabled` attribute for each of `loading`, `running`, `updating`, `invalid`,
      `rejected`, `failed`, and without it for `current`; with `busy` true it is disabled even for `current`; no
      `saved-build-link` is rendered on first render. Break caught: Save enabled while a run is pending.

12. **Acceptance** (Playwright). Helpers added to `acceptance/helpers.ts`: `openSavedBuild(page, id)` (goes to
    `${AOE4_PAGE}?b=${id}` and waits for `auto-run-status` `data-status` `current`). Saved builds that a test only
    opens are created with `postBuild(request, body, uniqueClient('aoe4-save-open'))` from SGS-103 so the UI save is
    not the setup. New `acceptance/aoe4-save-open.spec.ts`. Every test that saves, through the UI or the API, uses
    its own `uniqueClient`, set on its context (`browser.newContext({ extraHTTPHeaders: { 'x-forwarded-for': ... } })`),
    so no test shares the 30-save budget (OD-8 (a)). Failure responses of the builds route are made with
    `page.route`. Tests whose point is the 500 ms pause use Playwright's paused clock. No test clicks `tab-*` at the
    default viewport.

**Docs.** In `docs/aoe4-build-order.md` add a subsection "Saving a build and opening it by link" after the "Page"
text. It states, as rules and with no measured result or copied rate-limit number: Save is enabled only while the
shown result matches the settled input; a save stores the parsed build order with the name of the build whose text
it equals, or else the selected build's name followed by ` (edited)`, an opened build being named by its stored name
without the ` (<id>)` of its select label (rework 1), and the duration, so comments and blank lines are not kept and the text reopens in canonical form; the same content
gives the same link, and saving again returns it; the link is the page's origin plus `?b=<id>` and is shown
read-only with a Copy button, which falls back to a selected link and a hint; the link and the `b` in the address
bar go away on the first settled change and a save puts `b` back; opening `?b=<id>` loads the build into the editor
and runs it, adds an option `<name> (<id>)` to the select, disables the editor while it loads, and, when the page shows the
Build and Results tabs, selects Results after the first successful run (rework 1); an unknown or malformed id, or a failed load, shows the
message and runs the default build; a saved build whose text no longer converts opens as text with the issues; the
save error texts and the 429 wording follow `saveFailureMessage`. Fix every statement this makes untrue: grep
`docs/aoe4-build-order.md` for `starts on Build` and for the sentence that the select holds the prebuilt builds
only, and make each state the `?b=` exception. `ARCHITECTURE.md` is not changed (it does not list the files of
`components/apps/aoe4-build-order/`; grep first). The agent how-to is outline H's.

## Diagrams

The change adds a source of `hold` to the page's run gate (the `?b=` load), so the state machine of the gate:

```mermaid
stateDiagram-v2
  [*] --> prerender
  prerender --> ready_no_b: isReady, b absent
  prerender --> loading: isReady, b present (same render: hold stays true)
  ready_no_b --> running: release, default build
  loading --> running: load ok, input and release with the saved build
  loading --> running: load not-found or failed, release with the default build
  running --> current: 200
  running --> invalid: saved text no longer converts, no request
  current --> current: save, URL gets b
  current --> dropped_b: first settled change, URL loses b
```

Read, act, record for a save: the page reads the settled input and status, `SaveBuild` posts the settled build to
the builds route, and the page records the link, the shallow `replace` and the baseline input.

## Acceptance criteria

Specs are Playwright in `acceptance/aoe4-save-open.spec.ts` unless a case names another file. Each states the
break it catches. A "saved build" below is created through the API unless the case saves through the UI.

- [ ] Wiring holds in the end state: `git grep -nE "router\.(replace|push)" -- components pages` finds every match in
      `pages/apps/aoe4-build-order.tsx`; `git grep -n "navigator.clipboard" -- components pages ':!*.test.ts'` finds every match in
      `save-build.tsx`; `git grep -n "/api/aoe4-build-order/builds" -- components pages/apps ':!*.test.ts'` finds every match in
      `saved-build-loader.ts` and `save-build-client.ts` (test files are excluded: the loader and client tests assert the URL); `git grep -nE "api-route|english-catalog|builds-routes|build-store|blob-build-store|save-rate-limit" -- components pages/apps`
      finds no match; `git grep -nE "from 'next|from 'react" -- components/apps/aoe4-build-order/saved-build-loader.ts components/apps/aoe4-build-order/save-build-client.ts`
      finds no match.
- [ ] Bundle: after `npx next build`, `grep -rlF "unit_workshop_ram_3_eng" .next/static` (a string that appears only in
      `data/aoe4-build-order/aoe4world/english.json`; if a snapshot refresh removes it, use another snapshot-only
      string) lists no file, and the same string is still found under `.next/server`. The report records both
      results. Break caught: a client import that pulls the game data into the page.
- [ ] "an unchanged opened build re-saves to the same id": open `?b=<id>` of a build saved through the API at 1200 s
      (the record's name is not a prebuilt name), wait for `current`, click Save without an edit: the builds POST body's
      `buildOrder.name` equals the stored name (no ` (<id>)`), the response is 200, and `saved-build-link` ends with
      `?b=<id>`. After an edit and a save, the saved name is `<stored name> (edited)`. Break caught: the select label
      saved as the name, so every re-save gets a new id.
- [ ] Unit tests in Scope item 11 pass and each table has the rows listed there.
- [ ] "save, copy, open in a fresh context": on the default build, `save-build` is enabled once status is `current`.
      Clicking it posts one body whose `buildOrder.name` is the default build's name, whose `durationSeconds` is
      1200, and which `postBuild`'s schema accepts (201). `saved-build-link` is visible with value matching
      `^<page origin>/apps/aoe4-build-order\?b=[A-Za-z0-9_-]{11}$`, is the focused element, and has its whole text
      selected (`selectionStart` 0, `selectionEnd` the value length). `page.url()` ends with `?b=<that id>`. A new
      context (its own `x-forwarded-for`) that goes to the link shows `build-order-select` with the selected option
      label `<default name> (<id>)`, reaches status `current` with exactly one simulate POST whose `buildOrder.steps`
      equal the saved ones, `duration-seconds` 1200, `page.url()` still ending `?b=<id>`, and the editor text equal
      to the saved order's `formatBuildOrderText`. Breaks caught: a link built from the live text, a missing focus move,
      a second default-build POST before the load (hold released early), `b` dropped by the load itself.
- [ ] "an edited build round trips": after `fill`ing the text with an edit and `duration-seconds` with 900, waiting
      for the run, saving and opening the link in a fresh context: the duration input reads 900, the POST's
      `buildOrder` equals the saved one, and the select's selected label matches `^.+ \(edited\) \([A-Za-z0-9_-]{11}\)$`.
      Break caught: the request or the duration taken from the live state or from the default.
- [ ] "the same content gives the same link": two clicks on Save with no edit give two builds POSTs (201, then 200)
      and the same link value. Break caught: a link that changes per click.
- [ ] "Save is enabled only when the shown result is current" (a table over states, each asserting the `disabled`
      attribute and a computed `opacity` below 1 when disabled, 1 when enabled): `current` enabled; text with an
      unknown unit id (`invalid`) disabled; duration `59` (`invalid`) disabled; the simulate response held by
      `page.route` (`running`) disabled with no builds POST made by a click; a route-fulfilled 500 (`failed`) disabled;
      a route-fulfilled 400 (`rejected`) disabled; after restoring a valid input and `waitForRun`, enabled. Break
      caught: Save posting a build the charts do not show.
- [ ] (respec 1) "the load does not drop `b`" and "a late save response": after a `?b=` load and its first run `page.url()`
      still ends `?b=<id>` with no `router.replace` call that removes it (spy on `history.replaceState` through
      `addInitScript`); with the builds POST held by `page.route`, an edit that settles before the response is
      released leaves no `saved-build-link` and `page.url()` without `b`, and the released response adds no `b`. Break
      caught: the interim `loading` render counted as a change; a stale save putting `b` back for content no longer shown.
- [ ] "an edit after a save hides the link and drops `b`": after a UI save, with the clock paused, `fill`ing the text
      leaves `saved-build-link` visible and `?b=` in `page.url()` until `AUTO_RUN_DEBOUNCE_MS` elapses; after it, the
      link and `save-build-error` are gone and `page.url()` has no `b` and no `?` (checked under `expect.poll`). A
      duration edit and a build-select change behave the same. Saving again shows a link with `b` back in the URL.
      Break caught: `b` removed on the live edit instead of the settled one, or never removed, or the link left
      visible for changed content.
- [ ] "an edit and an undo inside the pause keeps the link": with the clock paused, an edit then restoring the saved
      text before `AUTO_RUN_DEBOUNCE_MS` elapses leaves the link visible and `b` in the URL after the pause (the
      settled input never changed). Break caught: dropping on the live change.
- [ ] "Copy": with clipboard permissions granted, clicking `copy-saved-link` leaves `navigator.clipboard.readText()`
      equal to the link and the button reading `Copied`. With `navigator.clipboard.writeText` replaced by a
      rejecting stub (`addInitScript`), clicking Copy shows `Could not copy. Select the link and copy it by hand.`,
      and the input's text is selected. Break caught: a Copy that claims success when refused.
- [ ] "Escape closes the panel": Escape with focus in the link input hides `saved-build-link` and
      `copy-saved-link` and `save-build` is the focused element. Break caught: a trapped focus.
- [ ] "Save keeps the Enter rule": Enter in `duration-seconds` runs the build at once (a simulate POST) and sends no
      builds POST; Enter or Space on a focused `save-build` saves. Break caught: Save as a submit button.
- [ ] "save errors" (a table over route-fulfilled responses, each asserting the exact `save-build-error` text, the link
      panel hidden and `save-build` enabled): 429 with `Retry-After: 5` gives `Too many saves. Try again in 5 seconds.`;
      `Retry-After: 90` gives `Too many saves. Try again in 2 minutes.`; 429 with no header gives `Too many saves. Try
      again later.`; 400 with `{ error, issues: [{ code: 'out-of-range', message: 'name: 117 characters, more than
      100' }] }` gives `The build could not be saved: name: 117 characters, more than 100`; 413 gives `The build is
      too large to save.`; 503 gives `Saving is unavailable right now. Try again later.`; an aborted request gives
      `The build could not be saved. Try again.`. A later successful save clears the error. Break caught: a missing
      branch, rounded-down minutes, a hidden error.
- [ ] "opening a missing or malformed id" (a table): `?b=abc` (malformed) shows `saved-build-error` with `That saved
      build was not found. Showing the default build.`, makes no request to `/api/aoe4-build-order/builds/`, selects
      the default build and reaches `current` with one simulate POST; `?b=AAAAAAAAAAA` (valid shape, absent) gives the
      same text after one GET that answered 404; a route-fulfilled 500 and an aborted GET give `That saved build could
      not be loaded. Showing the default build.`. In every row `b` stays in the URL until the first settled edit, then
      is removed. Break caught: a fetch for a malformed id, a missing default run, `b` removed at once.
- [ ] "the first `b` wins": `?b=<saved id>&b=AAAAAAAAAAA` loads the saved build with no `saved-build-error`. A back
      navigation after a save (the shallow `replace` entry) loads nothing new: the GET count stays at the initial
      one. Break caught: reading the last value, a reload on `query.b` change.
- [ ] "the load holds the first run and disables editing": with the GET held by `page.route`, `auto-run-status` has
      `data-status` `loading`, no simulate POST was sent, and the select, `duration-seconds`, `build-order-text` and
      `save-build` are `disabled` with `aria-busy="true"` (the table view's controls are disabled too after
      `showView(page, 'table')`); after releasing the GET, exactly one simulate POST is sent, its `buildOrder` equals the
      saved build's, the controls are enabled and `aria-busy` is gone. Break caught: the default build posted while the
      load runs, an edit racing the load.
- [ ] "a saved build that no longer converts": a route-fulfilled GET 200 with a record whose order names the unit id
      `knigt` loads its text into the editor, shows the issues in `build-order-issues`, ends with `auto-run-status`
      `data-status` `invalid`, sends no simulate POST (`expectNoRun`) and leaves `tab-build` selected at 390 px.
      Break caught: a run for text the catalog rejects, Results selected for an invalid load.
- [ ] "the tab after a load" at an explicit 390 px wide viewport: a successful `?b=` load ends with `tab-results`
      selected (`aria-selected="true"`) and `panel-results` visible; a load with no `b` ends with `tab-build` selected;
      a `?b=` that falls back to the default build (404) ends with `tab-build` selected. Break caught: a tab switch
      on every run or on a failed load.
- [ ] "leaving during a load aborts it": with the GET held, navigating away (`page.goto('/')`) makes the GET request
      end as aborted (`requestfailed`), and no console error is logged. Break caught: a missing abort on unmount.
- [ ] "layout with the link shown": after a save, with the link panel visible, `document.documentElement.scrollWidth`
      is at most 390 at a 390 px wide viewport, and at 768x1024 and 1280x720 the `run-bar` height is at most 40% of the
      viewport height (all rects read in one `page.evaluate`). Break caught: a long link widening the page or a run
      bar that covers the editor.
- [ ] Test hygiene: no test shares a `uniqueClient` with another (each test creates its context with its own header);
      `git grep -n "request.post\|page.request.post" -- acceptance/aoe4-save-open.spec.ts` finds no match (posts go
      through `postBuild`).
- [ ] Docs: `docs/aoe4-build-order.md` carries every statement listed under Scope "Docs", quotes the Save, Copy,
      `Copied`, load and 429 texts exactly as in Scope, and contains no measured timing and no rate-limit number;
      every match of `git grep -n "starts on Build" -- docs/aoe4-build-order.md` also states the `?b=` exception.
- [ ] `npx tsc --noEmit`, `npm run lint:dup`, `npm test`, `npm run acceptance` and `npx next build` pass (the page
      prerenders with `hold` true and no `?b=` read, and sends no request). Every existing test that failed because
      `builds` is page state or `BuildInput` gained props keeps its expected value; the report lists each test edited
      (see Scope "Existing tests").
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-09

- Underspecified: the bundle fallback, the loaded-build name drift and the unconfirmed module names were open questions.
- Changed: `englishCatalog` is in server-only `english-catalog.ts` (bundle criterion has no fallback); `PrebuiltBuild.buildName`,
  `savedBuildName` in `pin-name.ts` and Save posting it (new item 3, `pin-name.test.ts`, unchanged re-save criterion);
  names `postSavedBuild`, `saveFailureMessage`, `loadSavedBuild` results confirmed; open questions deleted.
- Stands: no branch work existed. Scope items after 2 are renumbered by one.

## Re-spec 2026-11-09 (spec gate 1)

- Underspecified: how the interim render after a `?b=` load avoids counting as a URL change; a save response that
  arrives after the settled input moved; the `conversion` narrowing; the existing-tests rule lived only in criteria.
- Changed: Scope item 8 compares only while `status !== 'loading'` (agrees with designer pass 4: `loading` with `settled`
  equal to the args before the mount effect and while held) and ignores a save response whose input differs from the
  settled one; item 4 reads `conversion.order` only when `current`; the `navigator.clipboard` and builds-URL greps
  exclude `*.test.ts`; "Existing tests" paragraph and a new criterion added.
- Stands: no branch work existed; module, test and doc scope unchanged.

## Rework 1 - 2026-11-09 (review)

Bounced by review 1 at tip 66a9a18671fa567e0cf4b8fa1a976d1b4591692b (report `reports/SGS-105-review-1.md`). No
earlier gate passed a tip. Review runs again in full after this rework.

### Findings

1. `docs/aoe4-build-order.md:869` and `:920-921` (text): the docs say Results opens after a `?b=` load "on a narrow
   screen"; without SGS-104 the tabs show at every width and the code selects Results at any width.
2. `docs/aoe4-build-order.md:905-907` (text): "the name the pin would use" is false for an opened build; the pin uses
   `<name> (<id>)`, the save stores `<name>`.
3. `docs/aoe4-build-order.md:875` (text): "On load the default build settles and runs once." is false with `?b=`.
4. `docs/aoe4-build-order.md:1020-1021` (text): the pin label searches the select options, which include the opened
   build's `<name> (<id>)` option, not only the prebuilt builds.
5. `pages/apps/aoe4-build-order.tsx:63` and `components/apps/aoe4-build-order/save-build.tsx:23` (code): each copies
   the private `sameInput` of `components/apps/aoe4-build-order/auto-run.ts:80`.

### Required fixes

- [ ] At `docs/aoe4-build-order.md:869`, replace "(except that opening a `?b=` link selects Results on a narrow screen after its first successful run)" with "(except that after opening a `?b=` link, Results is selected after its first successful run when the page shows the Build and Results tabs)".
- [ ] At `docs/aoe4-build-order.md:920-921`, replace "On a narrow screen Results opens after the first successful run." with "When the page shows the Build and Results tabs, Results is selected after the first successful run."
- [ ] At `docs/aoe4-build-order.md:905-907`, replace "with the name the pin would use (an unchanged opened build keeps its stored name, an edited one gets ` (edited)` once, and the name is cut to fit the name cap)" with "with the name of the build whose text it equals, or else the selected build's name followed by ` (edited)` (added once, and cut to fit the name cap); an opened build is named by its stored name, without the ` (<id>)` of its select label".
- [ ] At `docs/aoe4-build-order.md:875`, replace "On load the default build settles and runs once." with "On load the default build settles and runs once; with a `?b=` link the opened build runs instead, once its load ends (the default build runs if the load fails)."
- [ ] At `docs/aoe4-build-order.md:1020-1021`, replace "the prebuilt build's name when its text equals one exactly" with "the name of the select option whose text it equals exactly (for an opened build, `<name> (<id>)`)".
- [ ] Export `sameInput` from `components/apps/aoe4-build-order/auto-run.ts`, import it in `pages/apps/aoe4-build-order.tsx` and `components/apps/aoe4-build-order/save-build.tsx`, and delete both local copies. Unit tests, tsc, lint and `lint:dup` stay clean.

## Rework 2 - 2026-11-09 (review)

Bounced by review 2 at tip 60d2161310061081dedec168cd67dc8511d8c46f (report `reports/SGS-105-review-2.md`); review 1
bounced 66a9a18. No other gate has passed a tip. Review runs again in full after this rework. Finding 1 comes from
review 1's own replacement text, not from the implementer or the spec.

### Findings

1. `docs/aoe4-build-order.md:905-906` (text): the rework 1 clause split "A save stores ... with the name ... and the
   duration", so the doc now says an opened build's name leaves out "the duration" and no longer says a save stores
   the duration (save-build.tsx:65 posts `durationSeconds`).
2. `components/apps/aoe4-build-order/save-build-client.test.ts:61-76` (convention): four `postSavedBuild` blocks
   repeat the stub-then-`toStrictEqual` shape instead of one table.

### Required fixes

- [ ] In `docs/aoe4-build-order.md` (905-906; the sentence spans the line break after "the text"), replace "A save stores the parsed build order, not the raw text, with the name of the build whose text it equals, or else the selected build's name followed by ` (edited)` (added once, and cut to fit the name cap); an opened build is named by its stored name, without the ` (<id>)` of its select label and the duration, so comments and blank lines are not kept and the text reopens in canonical form." with "A save stores the parsed build order, not the raw text, and the duration, so comments and blank lines are not kept and the text reopens in canonical form. The saved name is that of the build whose text it equals, or else the selected build's name followed by ` (edited)` (added once, and cut to fit the name cap); an opened build is named by its stored name, without the ` (<id>)` of its select label."
- [ ] In `components/apps/aoe4-build-order/save-build-client.test.ts`, fold the four `postSavedBuild` result blocks (the `it.each([201, 200])` success, `maps 429 with Retry-After to minutes`, `maps a rejecting fetch to the network message`, and the `it.each([201, 200])` non-save body) into one `it.each<[string, () => Promise<Response>, Awaited<ReturnType<typeof postSavedBuild>>]>` table of `[label, respond, expected]` rows, as `saved-build-loader.test.ts:65-76` does. Keep `posts the request as JSON` separate. Every case stays covered.

## Rework 3 - 2026-11-09 (review, text)

Bounced by review 3 at tip e2bc300c2259f2a679ced7ee620ec9dca39132e3 (report `reports/SGS-105-review-3.md`). Text-only:
`reworkCount` stays 2, and review runs in delta mode from e2bc300.

### Findings

1. `docs/aoe4-build-order.md:901-928` (text): the "#### Saving a build and opening it by link" section sits inside
   the "Narrow layout" paragraph, so "At 1200 px and wider ..." trails the 429 paragraph and the rest of the Page
   section (step table, pin, error texts, prebuilt builds) falls under the Save heading.

### Required fixes

- [ ] In `docs/aoe4-build-order.md`, move with no wording change: cut the blank line at :901 and the block from the "#### Saving a build and opening it by link" heading through "...when the wait is unknown." (end of :927); paste it after the line ending "MAA/Crossbow`.", just before `## CivRules seams`, with one blank line on each side. "At 1200 px and wider ..." then rejoins the Narrow layout paragraph.

## Rework 4 - 2026-11-09 (suite)

Bounced by batch 10 suite 1 at tip c016f92e3089747e8e1f1d6edbfcb350f2229278 (report `reports/batch10-suite-1.md`),
the first run after rebasing onto SGS-104's split layout (`sgs-104-split-layout` at 32d9d29). Earlier passes:
review 4 APPROVE and acceptance-test 1 PASS at 7835b9b (pre-rebase); simplify at c016f92. Classified stale-test.

### Findings

1. `acceptance/aoe4-save-open.spec.ts:704` ("a saved build whose text no longer converts opens as text with the
   issues and no run"): it runs at the default desktop viewport, where the split layout renders no tabs, so
   `getByTestId('tab-build')` does not exist. The criterion "a saved build that no longer converts" requires
   `tab-build` selected at 390 px; the test never sets that viewport.

### Required fixes

- [x] Make that test run at the `PHONE` viewport (390x844), e.g. `await page.setViewportSize(PHONE)` before
      `page.goto`, keeping every existing assertion. Test-only; no production change.
- [x] Run `acceptance/aoe4-save-open.spec.ts` and `acceptance/aoe4-split-layout.spec.ts` on the result; both pass.
