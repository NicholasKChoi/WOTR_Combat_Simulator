# SGS-124 review 1

Branch `sgs-124-page-library` at 36cab45c98c4db386dd6a574dc51f0b7506ae3fb, diff against a440406 (main has moved since; it was not considered).

**Verdict: REQUEST CHANGES**

## Blocking findings

1. `acceptance/aoe4-step-annotations.spec.ts:178-180` - test - "choosing another build in the select scrolls the text back to the left" now fails. `scrolledLongText` fills a long line, so the page is edited. The `selectOption` raises the new discard `confirm`, Playwright auto-dismisses it, the switch is cancelled, and `toHaveValue(formatBuildOrderText(listBuilds()[1]))` fails. The ticket's existing-tests rule covers every test: "a build selected after an edit with no dialog handler gets a dialog handler". This spec is not on the implementer's list, and it was missed. Direction: add `page.once('dialog', (dialog) => dialog.accept())` right before the `selectOption` at line 178.

2. `acceptance/aoe4-build-order-m4-flow.spec.ts:76-78` - test - this has the same cause. Earlier in the test the text is filled with an invalid build (`start -> sheep\nproduce knigt from stable`), so both `selectOption` calls (OTHER_BUILD, then KNIGHT_LONGBOW) raise a confirm that is dismissed, and `toHaveValue(textOf(KNIGHT_LONGBOW))` at line 78 fails. Direction: add `page.once('dialog', (dialog) => dialog.accept())` before line 76. The second select then starts from an unedited template and needs no handler.

   I checked every other `selectOption`, `reload` and `goto` in the specs this diff does not touch. At those points the page is either unedited or has only a template duration change that leaves the text equal to the template (still `edited`, but each of those is followed by an assertion that holds). No further sites were found.

3. `docs/aoe4-build-order.md:848` - contract (text) - "No run selects a tab (one exception: opening a `?b=` link, see below)". `?n=` loads now call `setAwaitingLoadTab(true)` too (`pages/apps/aoe4-build-order.tsx`, the initial-load effect's ok branch). The ticket requires fixing every sentence the change makes untrue. Replace with: "No run selects a tab (one exception: opening a `?n=` or `?b=` link, see below)".

4. `docs/aoe4-build-order.md:852` - contract (text) - "(except that after opening a `?b=` link, Results is selected after its first successful run when the page shows the Build and Results tabs)". This is the same cause as finding 3. Replace with: "(except that after opening a `?n=` or `?b=` link, Results is selected after its first successful run when the page shows the Build and Results tabs)".

5. `docs/aoe4-build-order.md:869` - contract (text) - "with a `?b=` link the opened build runs instead, once its load ends (the default build runs if the load fails)". The initial-load effect also runs the `?n=` build, and holds the default run until that load ends. Replace with: "with a `?n=` or `?b=` link the opened build runs instead, once its load ends (the default build runs if the load fails)".

6. `docs/aoe4-build-order.md:1031` - contract (text) - "while no save and no `?b=` load is in flight". `busy` is now `initialLoadInFlight || choosing`, so Save is also disabled during a `?n=` load and while a chosen My builds or shared entry loads. Replace with: "while no save and no build load is in flight".

## Spec gaps

None.

## Decisions requested by the manager

**`savedBuildName` prefers the selected entry before the first text match: correct reading, no NEEDS_SPEC.** The ticket rewrites the helper "Rule as today", says "its behavior is otherwise unchanged", and keeps every other test's expected values. Respec 3 changed Opened links to append rather than prepend. Under that order, a literal first-match rule changes the existing save-open re-save outcome: a template with the same text now wins over the opened link the user is on. Main passed that test because the link sat first. Selected-first gives main's result for that case. It is the same rule the ticket gives `runName` (design C6: "the selected one's name wins"). The doc sentence describes it accurately, and the `pin-name.test.ts` row "selected link wins over an earlier entry with the same text" pins it. Breaking the selected-first branch fails that row. I accept the deviation. SGS-125 deletes this file in any case.

**No unit test catches an empty selected key from `save-build.tsx`: non-blocking.** `save-build.test.ts` asserts no names, and the ticket keeps its expectations unchanged. The rule itself is covered by the `pin-name` rows. The wiring is covered by the save-open acceptance tests. With `''` passed, the re-save test would save the template name and the "edited saves as edited" test would save `Custom build`, so both would fail. Note for the acceptance-test gate: keep the saved-name assertions in those save tests.

## Acceptance criteria

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| New spec: select structure (label Build, optgroups My builds / Opened links / Templates, empty groups skipped) | unverified | Left to the acceptance gate. Inspection: label "Build", groups `My builds`, `Opened links`, `Templates`, and no empty group at any width |
| New spec: edited marker (` (edited)`, `data-edited`) | unverified | Left to the acceptance gate. Inspection: `ENG 1TC (edited)` and `data-edited="true"` after an edit; a duration-only edit on a link also marks it |
| New spec: discard confirm (exact message, cancel keeps text/duration/select, focus on select, no POST) | unverified | Left to the acceptance gate. Inspection: message `Discard your edits to "<label>"?`; after dismissing, the value is kept, `activeElement` is `build-order-select`, and the URL is unchanged |
| New spec: unload guard | unverified | Left to the acceptance gate. Inspection: a `beforeunload` dialog fired on navigation while edited, and dismissing it aborted the navigation |
| New spec: `?n=` loading, choose-mine, not-busy, merge, unmount, `?b=`-pinned label, three new save-open cases | unverified | Left to the acceptance gate by the manager's instruction |
| Merge-order unit tests (`withMyBuilds`, `withLoadedEntry`) | pass | `build-library.test.ts` merge rows |
| Builder unit tests (`linkEntry`, `namedEntry`) | pass | `build-library.test.ts` builder rows |
| `pin-name` rewrite over entries | pass | 10-row table in `pin-name.test.ts`; deviation accepted above |
| `runName` Custom build rows | pass | Pre-existing rows, unchanged |
| Grep end state (`PrebuiltBuild`, `pinName`, `buildName`, `urlBaseline`, `-w initialB`, `savedBuildOption` gone) | pass | Grep of the tip |
| No ref written during render | pass | `chooseAbort` is written in the handler and its callback; `pinTouched` in handlers; cleanup in effects |
| Docs updated, and no sentence made untrue | fail | Findings 3-6 |
| Existing tests keep passing with dialog handlers added where a select follows an edit | fail | Findings 1-2 |
| `tsc --noEmit`, `lint:dup`, `npm test` | pass | tsc clean; jscpd 0 clones; vitest 26 files and 688 tests pass |
| Listed acceptance specs pass | unverified | Implementer reports a pass; review runs no acceptance tests |

## Invariants

- A1, A2: not touched.
- A3 (the saved payload carries only the build order and duration): holds. `selected` and the entry key are never posted.
- S1, S2, S3: unaffected. The save path and the stored My builds format are unchanged apart from the name rule.

## Bot reconciliation

`reviewBot.cli` is empty and not required, so no bot ran. No `rulesFile` is configured.

## Lint

- `tsc --noEmit`: clean.
- `lint:dup` (jscpd): 0 clones.

## UI inspection

The task worktree was served on port 3471 with `npx next dev`, and the server was stopped afterwards. The script was `inspect.cjs` in the reviewer scratch dir. It loaded `/apps/aoe4-build-order` at 360x760, 768 and 1280 with a seeded My builds entry and a stubbed `?b=` load named with an 80-character name. It showed four states: default, text edited, link loaded (`?b=...&utm=1`), and link with the duration edited. It then chose a template and dismissed the confirm.

- Overflow under hidden or clipped overflow: only `#__next-route-announcer__`, which is Next's visually hidden announcer and is dismissed. The document does not scroll horizontally at any width.
- Overlap among run-bar children: none.
- Mid-word wraps in labels or status: none.
- Edited and unedited states differ: the option text gains ` (edited)` and `data-edited` flips from `false` to `true`. A native select has no other style, which matches the ticket.
- Screenshots read: default-768, edited-1280, link-edited-360, link-edited-1280. At 360 the native select truncates the long label with its own clipping, and the arrow stays visible. At 1280 the long link label widens the select to its content and pushes Duration onto the next row. Main already sized the select to its label, so this is not new.
- The URL keeps `utm=1` alongside `b`, no page errors occurred, and the beforeunload guard fired on navigation while edited.

## Non-blocking notes

- `pages/apps/aoe4-build-order.tsx:237`: the page focuses the select with `document.getElementById('build-order-select')?.focus()`. Siblings focus through refs (`components/apps/aoe4-build-order/save-build.tsx:55`, `workbench-tabs.tsx:45`, `results.tsx:37-40`). A ref forwarded from `BuildInput` would match them.
- The dialog handlers added to the pin-compare spec accept any dialog type. Checking `dialog.type() === 'confirm'` the way `acceptBeforeUnload` checks its type would catch a stray beforeunload.
- `build-library.test.ts`: `linkEntry(LINK_ID, {version: 1, buildOrder: firstOrder, durationSeconds: 600})` is built twice in the merge rows. A shared constant would remove the repeat.
- `build-library.test.ts`: the new `stored()` helper sits beside an inline mineEntries fixture that could use it.
- Docs, Page section: "choosing a build in the select settles at once" is approximate for My builds and shared entries, which settle after their load.
- Docs line 907 still says "prebuilt build". It is harmless.
- The confirm label for links includes the id (`"<name> (<id>)"`). The ticket body specifies `entryLabel(selectedEntry, false)`, so this is per spec. The acceptance criterion's "<name>" wording only matches for templates; the acceptance gate should test with a template or expect the label.

## Coverage

- Reviewed the full diff a440406...36cab45:
  - `pages/apps/aoe4-build-order.tsx`
  - `components/apps/aoe4-build-order/` (`build-input.tsx`, `build-library.ts`, `pin-name.ts`, `save-build.tsx`, `saved-build-loader.ts`, `use-discard-guard`, and their tests)
  - `acceptance/helpers.ts` and the pin-compare and save-open specs
  - `docs/aoe4-build-order.md`
- Also read all specs outside the diff for select, reload and goto sites after edits.
- REPO.md review checklist:
  - The "Every diff" steps were followed.
  - For the AoE4 section, the page was loaded at 360x760, 768 and 1280 through the inspection.
  - `next build` was not run by review; the implementer reports a pass.
  - No copied helper was found.
- Not run, by gate rules: acceptance, browser and e2e tests.
