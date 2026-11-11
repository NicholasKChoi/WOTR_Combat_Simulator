# SGS-123: Add the my-builds storage, build library, build query and discard guard modules

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M8 / M8.1 (client), M8.6 (`?b=` keeps other keys: `nextBuildQuery`)
- **Priority**: medium
- **Risk**: standard
  <!-- Not low: it adds the contracts the page and Save panel build on and handles edit secrets in
       localStorage. Not high: the design gives every name and rule, so no strongModelTriggers item
       applies, and no criticalPaths symbol changes. -->
- **Invariants**: none adjacent (A1 to A3 cover the engine and data; these are pure client modules and one effect hook)
- **LOC estimate**: 240 (`my-builds-storage.ts` about 90, `build-library.ts` about 90, `build-query.ts` about 30, `use-discard-guard.ts` about 30; tests excluded)
- **Depends on**: SGS-119
- **On merge**: none
- **Source**: `design/M8.md` C5, C6, C7, `useDiscardGuard` (module table), "Library, select and edits" rules; `plans/M8-20261110.md` outline L

## Context

The page's select becomes a library of templates, opened links and "my builds", with an edited marker, a
discard confirmation and `?n=` / `?b=` links that keep other query keys. The page and Save panel tickets
need the pure logic first. This ticket writes four modules and wires none of them into the page.

## Scope

All paths are under `components/apps/aoe4-build-order/`. New files only, each modelled on the nearest sibling
(`pin-storage.ts` and `pin-storage.test.ts` for storage and the fake `Storage`). Read at `origin/main`;
`NAMED_BUILD_ID_PATTERN` and `EDIT_SECRET_PATTERN` come from `lib/aoe4-build-order/named-builds.ts`, described
here as the end state of SGS-119 (that ticket is not integrated; read its branch tip). `SAVED_NAME_MAX_CHARS`
(100) is in `lib/aoe4-build-order/saved-builds.ts`.

- **`my-builds-storage.ts`, the C5 contract exactly.** `MY_BUILDS_STORAGE_KEY` (`'aoe4-build-order.my-builds'`),
  `MY_BUILDS_MAX` (`50`), `storedMyBuildsSchema` (zod, `REPO.md` `schemaLibrary`; the stored value crosses a
  trust boundary), `type MyBuildEntry` (the element type of `builds`: `id` matching `NAMED_BUILD_ID_PATTERN`,
  `name` 1 to 100 chars, `editSecret` matching `EDIT_SECRET_PATTERN`, `revision` an integer of at least 1,
  `updatedAt` is `z.string().datetime()` with no options), `readMyBuilds(storage)`, `upsertMyBuild(storage, entry)`
  and `myBuildsAvailable(storage)`. (respec 1) Because `datetime()` has no options, only the `Z` form is valid
  (`2026-11-10T18:00:00Z`, `2026-11-10T18:00:00.000Z`); zod 4 rejects an offset such as `+00:00`, so an element with
  one is invalid and is dropped. The server writes only `toISOString()`, which always ends in `Z`.
  - `readMyBuilds` never throws. A value that is not JSON, or is not `{ version: 1, builds: [...] }`, removes the
    key and returns `[]`. Otherwise it validates each element on its own: an invalid element is dropped, the rest
    stay (so the schema for one element is a separate constant that `storedMyBuildsSchema` uses). Duplicate ids keep
    the entry with the later `updatedAt` (equal timestamps keep the one earlier in the stored array). The result is
    sorted newest `updatedAt` first by the parsed instant (`Date.parse`), not by string compare, stable for equal
    instants (equal instants keep their stored order).
  - `upsertMyBuild` reads the list, replaces the entry with the same id or inserts the new one, sorts as above,
    keeps the first `MY_BUILDS_MAX`, and writes the whole `{ version: 1, builds }`. It returns the kept list and
    `persisted`: `false` when `setItem` throws (the returned list is still the new one), else `true`. It never throws.
  - `myBuildsAvailable` is `false` for `null`, and `false` when a probe `setItem` or `removeItem` throws. The probe
    uses its own key, never `MY_BUILDS_STORAGE_KEY`, and leaves no key behind.
- **`build-library.ts`, the C6 contract exactly.** `LibraryEntryKind`, `LoadedVersion`, `LibraryEntry`,
  `LIBRARY_GROUPS` (`My builds` for `mine`; `Opened links` for `shared` and `link`; `Templates` for `template`, in
  that order), `entryKey` (`template(name)` gives `template:<name>`, `named(id)` gives `named:<id>`, `link(id)` gives
  `link:<id>`), `templateEntries`, `mineEntries`, `entryLabel`, `isEdited`, `copyName` and `runName`, with the rules
  of C6:
  - (respec 1) Each builder fills every `LibraryEntry` field. `templateEntries(builds)` gives, per build,
    `key: entryKey.template(build.name)`, `kind: 'template'`, `name: build.name`, `id: null` and
    `loaded: { text: build.text, duration: null, revision: null }`. `mineEntries(stored)` gives, per element,
    `key: entryKey.named(entry.id)`, `kind: 'mine'`, `name: entry.name`, `id: entry.id` and `loaded: null`, in the
    input order.
  - These two are the only C6 builders this ticket adds; `linkEntry` and `namedEntry` belong to the page ticket
    and `savedMineEntry` to the Save panel ticket.
  - `entryLabel`: `template` and `mine` show `name`; `shared` shows `` `${name} (shared)` ``; `link` shows
    `` `${name} (${id})` ``; ` (edited)` is appended when `edited`.
  - `isEdited(entry: LibraryEntry | undefined, live: { text: string; duration: string }): boolean` is `false` for
    an undefined entry or a `loaded` of `null`; otherwise
    `live.text !== loaded.text || (loaded.duration !== null && live.duration !== loaded.duration)`.
  - `copyName` strips one trailing ` (edited)`, then returns the first 93 chars plus ` (copy)`.
  - `runName(entries, text, selectedKey)` returns the `name` of the entry whose `loaded.text` equals `text`,
    the selected entry when it matches and otherwise the first entry that does (entries with `loaded: null` never
    match). With no match it returns the selected entry's `name` plus ` (edited)`, or `Custom build` when
    `selectedKey` is not among the entries. It does not strip an existing ` (edited)` and does not cut the name.
  - The new file does not import `PrebuiltBuild` from `build-input.tsx`. Existing `pin-name.ts`
    (`pinName`, `savedBuildName`) and its test stay unchanged here: the page ticket deletes `pinName`, retypes
    `savedBuildName` to `LibraryEntry` and leaves `pin-name.ts` for the Save panel ticket to delete.
- **`build-query.ts`, the C7 contract exactly.** `NAMED_BUILD_QUERY_KEY` (`'n'`), `SAVED_BUILD_QUERY_KEY` (`'b'`),
  `InitialBuildQuery`, `initialBuildQuery(query)` and `nextBuildQuery(query, entry)`. `initialBuildQuery` takes the
  first value when a key is an array, treats an empty string as absent, prefers `n` over `b`, and runs no id pattern
  check (the server 404s). `nextBuildQuery` copies every key except `n` and `b` with its value unchanged, then
  sets `n` for a `mine` or `shared` entry, `b` for a `link` entry, and neither for a `template`; it never writes a
  key whose value would be `undefined`, so an entry whose `id` is `null` adds no key. It returns a new object and
  does not mutate its argument. `ParsedUrlQuery` is a type-only import from `querystring`.
- **`use-discard-guard.ts`.** `useDiscardGuard(edited: boolean)` adds a `beforeunload` listener on `window` while
  `edited` is `true` and removes it when `edited` turns `false` or the component unmounts. The listener calls
  `event.preventDefault()` and sets `event.returnValue = ''`. That handler is an exported function
  (`blockUnload(event: BeforeUnloadEvent)`) so it can be unit tested without a DOM; the hook adds it and removes
  the same reference.

**Out of scope:** page wiring and the library select; the `linkEntry`, `namedEntry` and `savedMineEntry` builders
(the page ticket adds the first two and replaces `savedBuildOption`; the Save panel ticket adds the third); `named-build-client.ts`; the Save panel; `pin-name.ts` and
`PrebuiltBuild`; the `storage` event handling for other tabs; `browserStorage()` (created by SGS-114; callers
pass its result to these functions, none of the four modules reads `window.localStorage`); docs (the page and Save
panel tickets document the select, edits and my builds).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 1) `my-builds-storage.test.ts` (new; fake `Storage` and a throwing `Storage` as in `pin-storage.test.ts`) `readMyBuilds` table: a valid value reads back with the stored fields; unsorted input comes out newest `updatedAt` first (the input order is not already sorted, and it holds an entry at `2026-11-10T18:00:00Z` stored before one at `2026-11-10T18:00:00.500Z`; the `.500Z` entry comes first, which fails a plain string compare, since `Z` sorts after `.`); a duplicate id keeps the later `updatedAt`; a duplicate id with equal `updatedAt` keeps the element earlier in the stored array (fails if the last one wins); two distinct ids with equal `updatedAt` keep their stored order (fails on an unstable or reversed sort); a mixed list drops only the elements with a 42-char `editSecret`, a 21-char `id`, an empty `name`, a 101-char `name`, `revision: 0`, a non-ISO `updatedAt` and an offset `updatedAt` such as `2026-11-10T18:00:00+00:00`, and keeps the valid ones; each of non-JSON text, `{"version":2,"builds":[]}`, `{"version":1}` and `null` returns `[]` and removes `MY_BUILDS_STORAGE_KEY`; an absent key returns `[]` and a `getItem` that throws returns `[]`, both without throwing.
- [ ] `upsertMyBuild` tests: a new id is inserted and written; an existing id is replaced (one entry for the id, with the new `revision` and `updatedAt`); with `MY_BUILDS_MAX` stored entries, one more with the newest `updatedAt` leaves `MY_BUILDS_MAX` entries, includes the new one and drops the one with the oldest `updatedAt` (breaks: no cap, evicting the newest); a `setItem` that throws returns `persisted: false` with the list that includes the entry and does not throw; the stored JSON has exactly the keys `version` and `builds`.
- [ ] `myBuildsAvailable` tests: `null` gives `false`; a working fake gives `true`, leaves a previously stored list unchanged and leaves no extra key; a `setItem` that throws gives `false`; a `removeItem` that throws gives `false`.
- [ ] (respec 1) `build-library.test.ts` (new, table style): `entryKey` samples (`template:ENG 1TC`, `named:<id>`, `link:<id>`); `LIBRARY_GROUPS` order and labels; `templateEntries` and `mineEntries` results asserted as whole `LibraryEntry` objects with `toEqual` (including `key`: `template:<name>` and `named:<id>`), so a missing or wrong `key`, `id` or `loaded` fails; `entryLabel` for each of the four kinds with `edited` false and true (`link` reads `Name (<id>)`, `shared` reads `Name (shared)`); `isEdited` rows: undefined entry `false`, `loaded: null` `false`, same text `false`, changed text `true`, a template with a changed duration `false` (its `loaded.duration` is `null`), a link entry with a changed duration and the same text `true`, a link entry with the same duration `false`. It fails if the template duration counts as an edit or a changed duration on a `loaded.duration` entry is ignored.
- [ ] `copyName` rows: `ENG 1TC` gives `ENG 1TC (copy)`; `ENG 1TC (edited)` gives `ENG 1TC (copy)`; a 100-char name gives the first 93 chars plus ` (copy)`, which is 100 chars; a name already ending ` (copy)` gains another ` (copy)` (no dedupe). The 100-char row fails if the slice is 100 or if the suffix is dropped.
- [ ] `runName` rows: the selected entry's text matches and another earlier entry has the same text, giving the selected entry's name (this is a change from `pinName`, which returned the first; it fails if the first match wins); the text matches only a non-selected entry, giving that entry's name; no match with a selected entry, giving `<name> (edited)`; no match with a `selectedKey` not among the entries, giving `Custom build`; an entry with `loaded: null` is never matched by the empty text; empty `entries` gives `Custom build`; a selected name already ending ` (edited)` with edited text gains a second ` (edited)` (the rule has no strip).
- [ ] `build-query.test.ts` (new): `initialBuildQuery` rows: `{ n: 'x' }` gives `named x`; `{ b: 'y' }` gives `link y`; both gives `named x` (`n` wins); `{ n: '', b: 'y' }` gives `link y`; `{ n: ['p', 'q'] }` gives `named p`; `{}` and `{ n: '', b: '' }` give `none`; an invalid id such as `'!'` is returned as is. `nextBuildQuery` rows: `{ x: '1', b: 'abc' }` with a `mine` entry `Q1` gives exactly `{ x: '1', n: 'Q1' }`; `{ n: 'old', b: 'old2', utm: 'a' }` with a `link` entry `z` gives exactly `{ utm: 'a', b: 'z' }`; a `template` entry gives the query with `n` and `b` removed and other keys kept; a `shared` entry sets `n`; an array value on another key is kept unchanged; an entry with `id: null` writes no key; the input object is not mutated. It fails if other keys are dropped (the M8.6 defect) or `b` stays beside `n`.
- [ ] (respec 1) `use-discard-guard.test.ts` (new, node environment): `blockUnload` called with a stub event calls `preventDefault` once and leaves `returnValue` equal to `''` (the stub starts with a different `returnValue`, so a handler that does nothing fails). The hook itself has no unit test here (Vitest runs `.ts` tests without a DOM); every match of `git grep -n beforeunload -- components` outside test files is in `use-discard-guard.ts`, and that file removes the listener it added in the effect cleanup (reviewed; acceptance coverage comes with the page ticket's reload spec).
- [ ] No new module imports `window`, `localStorage` or `document` at module scope (a grep of the three new `.ts` files other than `use-discard-guard.ts` finds none), the new modules import nothing from `build-input.tsx`, and `use-discard-guard.ts` reads `window` only inside the effect.
- [ ] `npx tsc --noEmit` and `npm run lint:dup` pass, and `npm test` passes with every existing test unedited (`pin-name.test.ts` still passes). The report records that no existing test was edited.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-10

- Underspecified: the `readMyBuilds` ordering row used a `+00:00` offset that `z.string().datetime()` rejects, and the builders' `key` field was not stated.
- Changed: Scope pins the Z-only datetime (offset elements dropped), the builder `key` values, the `isEdited` signature and the builders left to later tickets; criteria use `.500Z` against `Z` for instant order, add equal-`updatedAt` duplicate and stable-sort rows, assert builder results with `toEqual`, and grep `beforeunload` without quote style.
- No branch work exists yet; nothing to keep or discard.
