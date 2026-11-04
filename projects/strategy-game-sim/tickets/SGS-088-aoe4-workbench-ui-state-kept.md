# SGS-088: Keep step-table row state through moves and view switches, and let a failing stored pin be dropped

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog triage 2026-11-03, post-M4 UX fixes)
- **Priority**: medium
- **Risk**: standard
  <!-- Not low: the pin restore rule in the effect on `pages/apps/aoe4-build-order.tsx` changes (a documented design row), and the ticket crosses the page and two components. No criticalPaths symbol, no API/schema change. -->
- **Invariants**: none adjacent (A1-A3 are not touched; no engine, data, or route code). S1 holds: only imports from `components/apps/aoe4-build-order/` and `lib/aoe4-build-order/`.
- **LOC estimate**: about 70 (`pages/apps/aoe4-build-order.tsx` about 30: row-open state, external-edit hook, view-toggle handler, restore failure; `components/apps/aoe4-build-order/step-table.tsx` about 20: controlled open flags; `step-table-model.ts` about 20: pure helpers). Business logic only.
- **Depends on**: none
- **On merge**: none (manager follow-up: delete BACKLOG.md bullets 51, 52 and 55, and edit the M4 design row "pin restore | on load" to match Scope 3)
- **Source**: `BACKLOG.md` bullets "step-table.tsx (~292-298) ... tracked by row index" (SGS-068 tech-lead), "Workbench (SGS-066) ... toggling Text/Table remounts ... the Text/Table toggle does nothing visible while on the Results tab" (SGS-066 tech-lead), "pages/apps/aoe4-build-order.tsx (~110-133, pin restore) ... cannot be removed with Unpin" (SGS-072 tech-lead). All three verified against main at `cc9bb04`.

## Context

Three bits of workbench UI state get lost or stick. Which step rows show their optional fields ("More options") is a
row-index array inside `StepTable` that is reset when the row count changes, so moving a row leaves the flag on the old
position and a text edit that sets `rally`/`count` can leave that value hidden; the same array is thrown away whenever the
Text/Table toggle unmounts the table; and the toggle itself does nothing visible while the Results tab is shown. Separately, a
stored pin whose restore always answers 5xx stays in `localStorage` and is re-POSTed on every load with no pin shown, so
Unpin cannot remove it.

## Scope

Verified on main at `cc9bb04`; all three backlog items still hold. Not covered, left in the backlog: the part of the
SGS-066 bullet about "an unsaved invalid entry in a required number field" (that is `NumberControl`'s local `draft` in
`step-table.tsx`, lost on remount, a separate fix) and the recharts resize-while-hidden spec gap; the dev Strict Mode
double restore POST in the SGS-072 bullet.

1. **Open flags carried with the row (bullet 51).** Row-open state moves out of `StepTable`'s `expansion` state in
   `components/apps/aoe4-build-order/step-table.tsx` into `AoE4BuildOrder` in `pages/apps/aoe4-build-order.tsx` (it must
   outlive the table), passed to `StepTable` as props (controlled: the flags and a change callback). A flag with no entry
   (index at or beyond the array) reads as `hasOptionalField(step)`, the rule the table uses today for a row's first
   appearance. Pure helpers for the array edits go in `components/apps/aoe4-build-order/step-table-model.ts` beside
   `moveStep`, `hasOptionalField` (names are the implementer's). Rules:
   - Move up/down (`moveStep` call in `StepTable`) swaps the two rows' flags.
   - Delete (`deleteStep`) removes that row's flag; later rows keep theirs.
   - Add step (`insertStep` at the end) leaves the new row closed unless its default step sets an optional field.
   - An action change on a row closes it (existing behavior, `edit` in `StepTable`).
   - A table edit that keeps the row (a field or trigger edit) never changes any flag. A row the user opened stays open
     while its value is cleared (existing behavior: clearing `count` leaves the `count` field in place).
   - A text edit made outside the table (typing in `BuildTextEditor`, picking a prebuilt build in `BuildInput`) keeps every
     open flag and additionally opens each row whose step now sets an optional field (`flag = flag || hasOptionalField(step)`).
     This replaces "recomputed when the number of rows changes". The text the table itself writes through
     `formatBuildOrderText` is not an external edit.
2. **Table state survives Text/Table and Results (bullet 52).** Because the flags live in the page, toggling Text/Table
   or the text going unparseable and back no longer loses them; `StepTable` still mounts only in Table view while
   the text parses (no change to what is in the DOM). Clicking `editor-view-text` or `editor-view-table` while the
   Results tab is shown also selects the Build tab (`setTab('build')` from the `onViewChange` handler passed to `BuildInput`
   in `pages/apps/aoe4-build-order.tsx`), so the toggle always shows its effect; clicking the already-active view while on
   Results also goes to Build. On the Build tab behavior is unchanged.
3. **Failed restore drops the stored pin (bullet 55).** In the restore effect in `pages/apps/aoe4-build-order.tsx`, after
   the existing `cancelled || pinTouched.current` guard, any HTTP response that is not ok (400 or 5xx) calls `clearStoredPin`
   (today only 400 does). A network failure (the `fetch` rejects) still keeps the key, since the next load can succeed.
   Rationale: the engine is deterministic for the same inputs, so a repeating 5xx would otherwise be POSTed on every load
   and could never be removed. This changes the M4 design row "pin restore | on load" ("On a network or 5xx failure, keep
   the key"); the manager updates that row.
4. **Docs made untrue, fixed here.** In `docs/aoe4-build-order.md`: the paragraph that says whether a row's control is open
   "is kept per row index ... recomputed the same way when the number of rows changes" and that the table "is mounted only
   in Table view ... mounts it afresh and rows that set one of those fields open again" (rewrite to the Scope 1 rules and
   the lifted state); the sentence "Switching tabs changes nothing else" next to the text/table toggle description (add that
   choosing a Text/Table view while on Results shows the Build tab); the pin paragraph that says a "network or server
   failure keeps it" (a response that is not ok removes it; only a failed request keeps it). Grep the doc, `README.md` and
   `ARCHITECTURE.md` for `per row index`, `mounts it afresh`, `network or server failure` and the toggle text to catch
   other statements.
5. **Existing tests.** A test of changed behavior gets the new expected value: the pin-compare row that expects a
   restore answered with 500 to keep the stored pin (`aoe4-build-order-pin-compare.spec.ts`, the `[400, false], [500, true]`
   table) expects it dropped; the step-table spec cases that assert flags reset when the row count changes, if any, are
   updated to the Scope 1 rules. Any other test keeps its expectation. The implementer lists every test edited. Do not
   add or edit tests in `acceptance/aoe4-build-order.spec.ts` (being deleted).

**Out of scope:** the number-field draft state, chart resize coverage, the Strict Mode double POST, persisting the view or
tab, retrying or "N failures" counting, any change to `pin-storage.ts` or to the stored shape, engine/route/data files.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Unit tests in `components/apps/aoe4-build-order/step-table-model.test.ts` for the pure helpers: (a) moving row 0 down with flags `[true, false, false]` gives `[false, true, false]` (a helper that leaves flags in place must fail); (b) deleting row 1 from `[true, false, true]` gives `[true, true]` (a helper that clears all flags on a count change must fail); (c) an external edit merge with flags `[false, true]` and steps whose row 0 sets `count` and row 1 sets none gives `[true, true]` (dropping the OR with the old flag, or ignoring content, must fail).
- [ ] In `acceptance/aoe4-step-table.spec.ts`: with a build of three rows where only row 0 has a set optional field (open) and the user opens row 2 by hand, moving row 0 down leaves the open state with the same step (the step that set the field is still open at its new position and the row now at index 0 is closed); deleting the first row leaves the hand-opened step open. (Fails on main, where moving leaves the flag at the old index.)
- [ ] In the same spec: typing in the textarea (row count unchanged) so a closed row now sets `rally` or `count`, then switching to Table, shows that row open with its value visible.
- [ ] In the same spec: open `step-more` on a row that sets no optional field, switch to Text and back to Table (`showView` from `acceptance/helpers.ts`), and that row is still open; also after a Run that selects Results, clicking `editor-view-text` and then `editor-view-table` keeps it open.
- [ ] With the Results tab shown, clicking `editor-view-table` makes `panel-build` visible, `tab-build` selected, and the step table visible; the same for `editor-view-text` and the text editor (asserts what is visible, not only `aria-selected`).
- [ ] In `acceptance/aoe4-build-order-pin-compare.spec.ts`: a stored valid pin whose restore POST is answered 500 (via `page.route`) shows no pin and the stored key is removed after the response; a second reload makes no restore POST (the track of POSTs is empty). A restore whose request aborts (`route.abort()`) shows no pin and keeps the key. The 400 case still drops the key. A user Pin made while the restore is delayed and then answered 500 keeps the user's stored pin (the failure branch sits behind the `pinTouched` guard; removing the guard must fail this case).
- [ ] No test is added to or changed in `acceptance/aoe4-build-order.spec.ts`; `git grep -n "per row index\|mounts it afresh\|network or server failure" -- docs README.md ARCHITECTURE.md` finds nothing after the change.
- [ ] `npx tsc --noEmit`, `npm test`, `npm run lint:dup` and `npm run acceptance` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

- `owner`: Scope 3 reverses the M4 design choice to keep a stored pin on a 5xx; confirm dropping on any non-ok HTTP response (and keeping only on a network failure) is wanted, rather than a notice with a "discard" control.
- `owner`: Scope 2 picks "selecting a Text/Table view while on Results switches to the Build tab" over disabling the toggle on Results.
