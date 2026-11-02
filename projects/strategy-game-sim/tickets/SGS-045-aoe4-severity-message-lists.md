# SGS-045: Show result warnings and collapsible info messages on the AoE4 page

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.12 (warnings list, info collapsed behind a toggle), M3.2 (warning shown)
- **Priority**: medium
- **Risk**: standard
  <!-- One component, no API change, but it redefines the meaning of the M2 test id `simulation-notes` and sits near the ~100-line line. -->
- **Invariants**: none adjacent (A1-A3 cover engine numbers; this ticket adds no game number)
- **LOC estimate**: ~100 (`messages.ts` ~25, `messages.tsx` ~50, `results.tsx` and page wiring ~25; tests excluded)
- **Depends on**: SGS-041 (adds `BuildOrderNote.severity`; transitively SGS-037, which adds `Severity`, `SimWarning` and `SimulationResult.warnings`)
- **On merge**: none
- **Source**: design/M3.md "Page props and test ids", "Result messages (`messages.ts`)", Behavior rules rows `messages | page lists`, `messages | collapse`, `messages | Playwright`; plan M3-20261101 outline K

## Context

After SGS-037 and SGS-041 the result carries `warnings` (`SimWarning`, each with `severity`) and `notes` (each with
`severity`), but `components/apps/aoe4-build-order/results.tsx:8` still renders every note in one always-visible
`alert-info` box and ignores `warnings`. The page must show `warning` messages directly and keep `info` messages
collapsed until the user expands them. Request issues stay in `simulation-error`, unchanged.

## Scope

1. **`components/apps/aoe4-build-order/messages.ts`** (new, pure, no React): `ResultMessage = { severity: Severity; code: string; message: string }` and
   `resultMessages(result: SimulationResult): Record<'warning' | 'info', ResultMessage[]>`. Each list holds the `warnings`
   entries of that severity in result order, then the `notes` entries of that severity in result order. Imports
   types only from `lib/aoe4-build-order/model` (the bundle must not import `data.ts`).
2. **`components/apps/aoe4-build-order/messages.tsx`** (new):
   - `WarningMessages({ messages })`: renders nothing for an empty list; otherwise a container `data-testid="simulation-warnings"` with one
     `data-testid="simulation-message"` per message carrying `data-severity` and `data-code`.
   - `InfoMessages({ messages, expanded, onToggle })`: renders nothing for an empty list; otherwise a container
     `data-testid="simulation-notes"` holding a `<button data-testid="simulation-notes-toggle" aria-expanded>` with text
     `Show N info messages` (`Show 1 info message` for one) when collapsed and `Hide info messages` when expanded. Only while
     expanded it renders `data-testid="simulation-notes-list"` with one `simulation-message` per message (same attributes).
   - A message shows its `message` text only (messages already name ids), not the old `<code>{tech}</code>` prefix. Layout and
     styling beyond the fixed texts and ids are the implementer's (Bootstrap classes, `cn`).
3. **`components/apps/aoe4-build-order/results.tsx`**: replace the `result.notes.length > 0` alert (line 8) with `WarningMessages` and
   `InfoMessages` fed by `resultMessages(result)`. `Results` gains props `infoExpanded: boolean` and `onInfoToggle: () => void`.
4. **`pages/apps/aoe4-build-order.tsx`**: add `useState(false)` for the info-expanded flag and pass it with a toggle callback to `Results`.
   It starts collapsed on page load, the toggle flips it, and it persists across later runs (including a failed run and a later successful one)
   but is not saved across reloads. `simulation-error` is unchanged; when it shows, `result` is already `null`, so neither list shows.
5. **Tests**:
   - `components/apps/aoe4-build-order/messages.test.ts` (new, vitest; `include` already covers `components/**/*.test.ts`): `resultMessages` splits by severity, orders
     warnings before notes within a list and keeps result order within each source, returns empty lists for an empty result, and ignores
     nothing of `warning`/`info` severity.
   - `acceptance/aoe4-build-order.spec.ts`: the test "a research of a tech with ignored effects shows a note naming it" first expects
     `simulation-notes-list` to have count 0, then clicks `simulation-notes-toggle`, and only then expects `simulation-notes` to contain
     `fitted-leatherwork`. "a run with no notes shows no notes element" keeps `toHaveCount(0)` (RALLY_PASTE yields no `info`). New test: a
     real run through `page.route` + `route.fetch()` whose JSON body is patched to add one `warning` entry in `warnings`, one `info` entry in
     `warnings` and one `info` note, so the list rendering does not depend on the engine emitting warnings yet; it asserts
     `simulation-warnings` holds the warning with `data-severity="warning"` and `data-code`, the toggle reads `Show 2 info messages`, the
     list expands and collapses on click, and the expanded choice persists across a second run.
6. **`docs/aoe4-build-order.md`** lines 570-571 ("When `notes` is non-empty, a notes list shows each note's technology id and message; with no notes there is no list") become untrue: describe the warnings list, the collapsed info list and its toggle text, and that a 400 shows only `simulation-error`. Grep `notes list` and `simulation-notes` in `docs/` to catch any other sentence. T audits the whole doc.

**Out of scope:** any engine or API change (`warnings` and `severity` are produced by SGS-037/038/041/042 and shown here as given); an `error`-severity list;
the per-step timeline, step table, pin and compare, chart markers; OpenAPI (no shape change); `design/M2.md` (history).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] `resultMessages` returns, per severity, the `warnings` entries then the `notes` entries, each in result order; a result with neither returns two empty lists (unit test).
- [x] With a result containing `warnings` of severity `warning`, `simulation-warnings` is visible and lists exactly those messages, each `simulation-message` with the right `data-severity` and `data-code`; with none, `simulation-warnings` has count 0 (Playwright, patched response).
- [x] With `info` messages (from `warnings` or `notes`), `simulation-notes` is visible, `simulation-notes-list` has count 0, and the toggle reads `Show N info messages` (`Show 1 info message` for one) with `aria-expanded="false"`.
- [x] Clicking `simulation-notes-toggle` renders `simulation-notes-list` with every info message, the toggle reads `Hide info messages` and `aria-expanded="true"`; clicking again removes the list.
- [x] The expanded choice persists after a second run, and a run with no `info` messages shows no `simulation-notes` element.
- [x] A 400 or failed run shows only `simulation-error`; neither `simulation-warnings` nor `simulation-notes` is present.
- [x] The existing notes test expands the toggle before asserting `fitted-leatherwork`, and "a run with no notes shows no notes element" still asserts `toHaveCount(0)`.
- [x] `git grep -n "result.notes" -- components pages` no longer matches `results.tsx` (today it matches line 8); `messages.ts` and `messages.tsx` import nothing from `lib/aoe4-build-order/data`.
- [x] `docs/aoe4-build-order.md` no longer says notes are always listed; it describes the warnings list and the collapsed info list.
- [x] No INVARIANTS.md regressions

## Open questions

- `designer`: `resultMessages` is typed to return only `warning` and `info` lists, and M3 emits no `error`-severity result item. The design does not say what it does with an `error` item if one ever appears (omit, or fold into `warning`). This ticket does not handle `error` and has no criterion depending on it; the answer matters only when an engine-level error message is added.

## Rework 1 - 2026-11-01 (review)

Bounced by review (report `reports/SGS-045-review-1.md`) at branch tip 5ecb2c81bc36b124f0c64f2ad75ecb27cfedd874. No earlier gate had passed it. Review confirmed the component file name `message-lists.tsx` (instead of `messages.tsx`, which cannot sit beside `messages.ts` as `./messages`) is sound, and that all other criteria pass.

### Findings
- `acceptance/aoe4-build-order.spec.ts:210-258` (test): acceptance criterion 2 (a run with no `warning`-severity messages shows `simulation-warnings` with count 0, via a patched response) has no test on a successful run. The only count-0 check is on a 400, where `Results` does not render. Deleting the empty-list guard in `WarningMessages` (`message-lists.tsx:16`) leaves all 17 tests in the page spec passing.

### Required fixes
- [x] (rework 1) Add a Playwright test in `acceptance/aoe4-build-order.spec.ts`: a successful run through `page.route` + `route.fetch()` whose patched body has no warning-severity entries (info entries or none) asserts `simulation-warnings` has count 0 while the results render. Do not use an unpatched RALLY_PASTE run (SGS-038 makes it emit a `node-depleted` warning). Mutation-check it: removing the empty-list guard in `WarningMessages` must fail it.
- [x] (rework 1, optional, same commit) Give `InfoMessages` a named `interface ...Props` like its siblings; make the persistence test's second patched response differ from the first so its final assertion cannot match the old page.
