# SGS-082: Delete the AoE4 build order page acceptance spec

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner request 2026-11-03)
- **Priority**: medium
- **Risk**: low
  <!-- Test-only deletion: no product code, API, schema, config or invariant touched. -->
- **Invariants**: none
- **LOC estimate**: 0 business-logic lines (deletes `acceptance/aoe4-build-order.spec.ts`, 925 lines, 46 tests)
- **Depends on**: SGS-081 (it edits this file; start from main after SGS-081 merges, so the deletion does not conflict)
- **On merge**: none
- **Source**: owner request 2026-11-03: "we should remove the acceptance tests for the build order acceptance/aoe4-build-order.spec.ts -- let's let humans judge them"

## Context

`acceptance/aoe4-build-order.spec.ts` drives the AoE4 build order page in Chromium (title and build select, run and
error display, warnings and notes, chart legend, marker labels and overlap, step timeline, workbench tabs and editor).
The owner wants humans to judge that UI, so the spec goes. Its tests are not moved elsewhere.

## Scope

Paths are relative to the repo root.

1. Delete `acceptance/aoe4-build-order.spec.ts`. Do not recreate any of its tests in another file.
2. Helpers: explored on main at `cc9bb04`. Every export of `acceptance/helpers.ts` that the spec imports (`SIMULATE_PATH`,
   `buildOrderFrom`, `openPage`, `showTab`, `showView`, `runSimulation`, `runRejected`, `INVALID_PASTE`,
   `expectFlySyntaxIssue`, `hexToRgb`) is also imported by at least one other spec (for example `hexToRgb` by
   `aoe4-build-order-pin-compare.spec.ts`), so none becomes dead. Re-check after SGS-081 merges; remove from
   `helpers.ts` any export that no other file and no remaining code in `helpers.ts` uses (`AOE4_PAGE` is used only
   inside `helpers.ts` and stays).
3. Production exports the spec imported (`MARKER_COLORS`, `MARKER_KIND_LABELS`, `CHART_MARKER_KINDS`, `listBuilds`,
   `formatMinSec`, `formatBuildOrderText`) are all used by app code or unit tests; leave them. Test ids that only this
   spec queried (`chart-marker-legend-item`, `chart-pinned-marker`, `editor-view-text`, `panel-build`) are component
   markup; leave them.
4. Docs: no README, `docs/aoe4-build-order.md`, `ARCHITECTURE.md`, `REPO.md` (`acceptanceHarness` names the folder and
   `helpers.ts`, not this file) or factory `LESSONS.md` mentions the file, so no repo doc changes. No other spec
   imports it.
5. Manager follow-up (state files, not this ticket's diff): delete these `BACKLOG.md` bullets once the ticket merges,
   because the file they cite is gone:
   - the bullet beginning "`acceptance/aoe4-build-order.spec.ts` ~396/429 ("marker labels stay apart and inside the plot at 768 px")" (Reported by SGS-067 review);
   - the bullet beginning "acceptance/aoe4-build-order.spec.ts:493 compares two separate `boundingBox()` reads" (SGS-081 review 5).

**Out of scope:** (respec 1) every other AoE4 acceptance spec stays, including the UI-only ones
(`aoe4-build-order-pin-compare`, `aoe4-step-table`, `aoe4-build-order-inline-issues`,
`aoe4-build-order-client-check`, `aoe4-results-split`, `aoe4-narrow-layout`, `aoe4-build-order-m3-flow`,
`aoe4-build-order-timeline-compare`, `aoe4-build-order-m4-flow`, `aoe4-build-order-knight-longbow-page`,
`aoe4-gathered-resources`) and the `aoe4-simulate-api-*` and `aoe4-build-order-from` specs; moving or rewriting any
deleted test; renaming test ids; changing `playwright.config.ts`.

**Accepted coverage loss (owner, 2026-11-03):** (respec 1) behavior tested only by the deleted spec is dropped and not
moved to API or unit tests: unknown-id and 20000-character paste issues, the non-JSON failure message, warnings and
notes toggling, marker label overlap, workbench tab and editor switching.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `acceptance/aoe4-build-order.spec.ts` does not exist.
- [ ] `git grep -n "aoe4-build-order.spec"` finds no match outside `.claude/` state files.
- [ ] `npx tsc --noEmit` and `npm run lint:dup` pass (no dangling import; no helper left with zero users).
- [ ] No export of `acceptance/helpers.ts` is unused by every other file and by `helpers.ts` itself.
- [ ] `npm test` passes unchanged.
- [ ] `npm run acceptance` passes, and its test count is the pre-change count minus the deleted file's tests; no
      other spec is edited except to remove a now-dead helper import.
- [ ] (respec 1) No other file under `acceptance/` is deleted or renamed; the diff deletes only
      `acceptance/aoe4-build-order.spec.ts` (plus any dead helper export removed from `helpers.ts`).
- [ ] No INVARIANTS.md regressions

## Re-spec 2026-11-03

- Underspecified: the owner had not said whether other UI-only AoE4 specs go or whether lost coverage must be kept.
- Changed: Out of scope now names the other specs explicitly as staying; coverage loss recorded as accepted; added a criterion that only this spec is deleted; Open questions removed.
- Branch work: none yet; nothing to carry over.
