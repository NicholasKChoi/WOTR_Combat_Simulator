# SGS-141: Add the split-layout Tab-order spec and close the M9 docs gaps

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.9
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (a Playwright spec and docs; no engine, data or simulation path is touched)
- **Unverified assumptions**: none (the spec runs in real Chromium, which decides Tab traversal; nothing is faked)
- **LOC estimate**: 0 business logic (one acceptance spec of about 100 lines, a possible helper move into `acceptance/helpers.ts`, and doc edits)
- **Depends on**: SGS-130, SGS-131, SGS-132, SGS-133, SGS-137, SGS-138, SGS-139, SGS-140
- **On merge**: none
- **Source**: `design/M9.md` criteria map row M9.9, "Tab order (M9.9)" behavior rule, C13 (acceptance path); criterion M9.9; `plans/M9-20261111.md` outline N

## Context

M9.9 asks that the design doc and `ARCHITECTURE.md` describe every M9 change, that Playwright cover the new behavior, and that the split layout's Tab order is pinned. Each feature ticket already owns its own doc edits and its own spec; this ticket adds the one spec nobody owns (Tab order across the run bar, the Build column and the Results column), and then sweeps the two docs and the code comments at the seams for statements the milestone left untrue or never added. It lands last so it audits the integrated result.

## Scope

State read at `origin/main` plus the end states of every Depends-on ticket (and, through SGS-137 and SGS-138, SGS-134 to SGS-136, plus SGS-128 and SGS-129). For SGS-139 (marker legend buttons that label a kind's markers on hover or focus, new `acceptance/aoe4-marker-labels.spec.ts`) use the design's C8 and outline L until its ticket file is integrated.

### 1. Tab-order spec

- New `acceptance/aoe4-split-tab-order.spec.ts` at the `SPLIT_VIEWPORT` of `acceptance/helpers.ts`. It reaches its two states (below) through the real save flow against the real named-builds routes, using the Save as copy helpers that live as local functions in `acceptance/aoe4-my-builds.spec.ts` at the base (`saveCopy`, and `editedCopy` for the edited state; these are examples, with whatever local helpers they call). Helper rule: if the Depends-on tips already export a Save as copy helper from `acceptance/helpers.ts` (SGS-132 moves one there only when its own spec needs it), import that one. Otherwise move `saveCopy` (and `editedCopy` and the locals they need) from `acceptance/aoe4-my-builds.spec.ts` to `acceptance/helpers.ts` and import them from both specs. Never copy them: the acceptance jscpd gate (`.jscpd.json` scans `acceptance/` after SGS-128) fails on a clone. (respec 1)
- Why two states: `save-build` (Save a new version) is enabled only while the loaded saved build is edited, and the saved link is shown only while the settled input equals the saved input (`SaveBuild` in `components/apps/aoe4-build-order/save-build.tsx`: `canSaveVersion` needs `edited`; `linkVisible` needs `sameInput(saved.input, settled)`). Right after any save the build is unedited, so while the link is shown `save-build` is present but disabled, and a disabled button is not a Tab stop. The design M9.9 row lists `save-build` and the link controls in one walk, which no page state allows; the spec checks `save-build` explicitly in the edited state and the link controls in the link state. (respec 1)
- **Walk.** From the focused `build-order-select`, press Tab and record the focused element each time (its test id, the nearest ancestor test ids of `build-column`, `results-column` and the chart section, and its document position, read in one `page.evaluate` per step). The walk stops when focus reaches the `chart-collapse` caret inside the section of the last chart in the rendered order (the chart sections carry the `RESULT_CHART_IDS` test ids, `CHART_IDS` in `acceptance/helpers.ts`), and fails if it has not reached it within a fixed cap of presses the implementer sets. The walk passes through earlier charts' view toggles and legend items on the way; it asserts nothing about them and does not go past the last chart's caret. Other stops may sit between the named ones; the rule is order, not an exact list. (respec 1)
- **Edited state** (Save as copy, then edit the text so the run settles and `save-build` is enabled, the link hidden): the spec first asserts `save-build` is visible and enabled, then walks. The stops contain, in this order and strictly increasing in document order, `duration-seconds`, `editor-view-text`, `save-build`, `save-build-copy`, then an element inside `build-column`, then an element inside `results-column`. (respec 1)
- **Link state** (Save as copy, link shown): the spec first asserts `saved-build-link` is visible and `save-build` is present and disabled, then walks. The stops contain, in order and strictly increasing in document order, `duration-seconds`, `editor-view-text`, `save-build-copy`, `saved-build-link`, `copy-saved-link`, then an element inside `build-column`, then an element inside `results-column`; `save-build` precedes `save-build-copy` in document order and is not a stop. (respec 1)
- **Results column**, asserted on the stops of the link-state walk: the key-results caret (`compare-collapse`, SGS-134) is reached before every chart's drag handle (`chart-drag-handle`, SGS-135); for every chart section, the `chart-drag-handle` inside that section is reached before the `chart-collapse` inside the same section (design "Tab order" rule). Each chart's handle and caret are identified by the chart section that contains them, never by index across the page. (respec 1)
- No element on the page has a positive `tabindex`.
- Read focus and rect or document-position data in one `page.evaluate` per step, or through `expect.poll` (house lesson); never compare two sequential `boundingBox()` calls.

### 2. Final docs pass

Audit `docs/aoe4-build-order.md`, `ARCHITECTURE.md`, `docs/api/openapi.json` `info`, and code comments at the changed seams against the integrated code. Edit only what is untrue or missing; do not rewrite text a feature ticket already got right, and do not re-own a statement a Depends-on ticket names below (a fix to the same statement is allowed when the integrated code shows that ticket's text is wrong). What each ticket already owns, so this ticket adds nothing in these places:

| ticket | owns in the docs |
|--------|------------------|
| SGS-128 | `ARCHITECTURE.md` `lint:dup` rule (two configs, `acceptance/` scanned) and the shared test-helper list |
| SGS-129 | `ARCHITECTURE.md` Stack line on `strict` |
| SGS-130 | `ARCHITECTURE.md` saved-build storage row (landed-write check, retry cap, `conflict` rules) and the `replaceNamed` seam comments |
| SGS-131 | `docs/aoe4-build-order.md` My builds paragraph (unreadable list kept and backed up) |
| SGS-132 | `docs/aoe4-build-order.md` run-bar contents, "Saving a build and opening it by link" (status, one-row layout, Escape scope) |
| SGS-133 | `docs/aoe4-build-order.md` run bar "stays at the top" and the narrow-layout run-bar sentence (cap, scrolling inside the bar) |
| SGS-134 | key-results panel collapse and its persistence; `collapsed` holds the panel id |
| SGS-135 | "Chart controls" paragraph: handle, drag, keyboard reorder, announcement, caret, header controls while collapsed |
| SGS-136 | `SimulationResult` field list gains `productionBuildings` and its rules; OpenAPI 2.6.0 |
| SGS-137 | removal of the Per villager checkbox; the two view toggles, defaults, no persistence, pinned lines follow the view |
| SGS-138 | pinned lines and markers out of the tooltip; one "dashed = pinned build" entry; `chart-pinned-key` and `Age-up (pinned)` statements |
| SGS-139 | marker legend items as buttons; hover or focus labels that kind's markers; the age-up-only labelling statement |
| SGS-140 | text editor's second gutter and font statements below 48rem |

The gaps this ticket closes:

- Statements a feature ticket missed or two tickets left in conflict. Method: for each M9 behavior in the milestone's M9.3 to M9.8 and M9.10 to M9.13 criteria, find the doc sentence that describes it; a behavior with no sentence is added, and a sentence the integrated code contradicts is fixed. Run the grep in the criteria below, plus a grep for the removed or renamed names in `design/M9.md` C1 to C14 (for example `PinnedLineKey`, `chart-move-`, `pendingFocus`, `headerControls` slots described as living in the chart body) over the docs and over comments in `components/apps/aoe4-build-order/` and `lib/aoe4-build-order/`.
- Names that may stay in accurate text: `Per villager` (SGS-137's Gather rates toggle may name a villager view, and a doc may say the toggle replaced the former checkbox) and `strictNullChecks` (a doc may say `strict` replaced it). Grep the docs for both as part of the audit; each match must describe the integrated state (a removed control or setting may be named only in a sentence that says it was removed or replaced). They are not in the end-state grep criterion. (respec 1)
- Add the Tab-order rule to the "Page" section of `docs/aoe4-build-order.md`: in the side-by-side layout the Tab order follows the DOM order (run bar controls, then the Build column, then the Results column, with no positive `tabindex`), and the save row's controls come in the order buttons, status, link, Copy link. Scope names the statement; the implementer writes it against the code. No measured values.
- `ARCHITECTURE.md`: any statement about where AoE4 UI, test-helper or acceptance files live that the new files make incomplete (for example a list of component test helpers or acceptance helpers). Check with a grep for the helper file names; do not add a row for every new component file, since the table lists kinds of files, not files.
- M9.9 coverage check, no new spec unless one is missing: confirm the M9 Playwright specs the feature tickets own exist and assert their M9.9 topics (saved status, drag and caret controls with persistence across reload, pinned tooltip and legend, the two chart views, marker-label hover and focus, and this ticket's Tab order). When a named topic has no assertion in any spec, add the missing case to the spec that owns it and say so in the report. Report anything that cannot be covered as a finding rather than a ticket-sized change.

**Out of scope:** any product code or CSS change; rewriting doc text the table assigns to a feature ticket when it is correct; `design/M8.md` and `design/M9.md` (factory files); a DOM test environment; walking past the last chart's caret, asserting on legend, view-toggle or table-view stops, and drag; measured results in docs.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 1) Edited state at 1280x800 (Save as copy, then an edit that settles): the spec asserts `save-build` is visible and enabled before walking, and Tab from `build-order-select` visits `duration-seconds`, `editor-view-text`, `save-build`, `save-build-copy`, then a control inside `build-column`, then a control inside `results-column`, each strictly later in document order than the one before. The `save-build` stop is asserted unconditionally; the spec fails if `save-build` is missing, disabled or out of order.
- [ ] (respec 1) Link state at 1280x800 (Save as copy, link shown): the spec asserts `saved-build-link` is visible and `save-build` is present and disabled before walking, and Tab from `build-order-select` visits `duration-seconds`, `editor-view-text`, `save-build-copy`, `saved-build-link`, `copy-saved-link`, then a control inside `build-column`, then a control inside `results-column`, each strictly later in document order than the one before; `save-build` precedes `save-build-copy` in document order. A test fails if the save row's DOM order, or the run bar, Build column and Results column order, is changed (a probe that swaps two of them makes the spec fail).
- [ ] (respec 1) The walk continues until focus is on the `chart-collapse` inside the last chart section in rendered order, and fails if that caret is not reached within the spec's press cap. On those stops, `compare-collapse` is reached before every `chart-drag-handle`, and in every chart section the section's `chart-drag-handle` is reached before the section's `chart-collapse`; each pair is matched by its containing chart section. A test fails if the walk ends before the chart headers, or if a chart's handle and caret are matched across sections.
- [ ] No element on the page has a `tabindex` greater than 0.
- [ ] (respec 1) The spec reads all focus and position data per step in one `page.evaluate` (or inside `expect.poll`). The Save as copy and edited-copy flows come from `acceptance/helpers.ts` and are imported by both this spec and `acceptance/aoe4-my-builds.spec.ts`; neither spec defines its own copy of them, and `npm run lint:dup` reports no clone under `acceptance/`.
- [ ] `docs/aoe4-build-order.md` states the split-layout Tab order rule, and every M9 behavior in the milestone criteria M9.3 to M9.8 and M9.10 to M9.13 that changes what a user or API client sees has a sentence in it or in `ARCHITECTURE.md`; the report lists each criterion with the doc location that covers it.
- [ ] (respec 1) End state of the search `git grep -n -E "chart-move-up|chart-move-down|chart-pinned-key|pinned-age-up|Age-up \(pinned\)|gather-rates-per-villager|perVillagerSeries|PinnedLineKey" -- docs ARCHITECTURE.md`: no match. Today it finds the stale statements in `docs/aoe4-build-order.md` that the feature tickets remove; this ticket confirms none remain.
- [ ] (respec 1) Every match of `git grep -n -E "Per villager|strictNullChecks" -- docs ARCHITECTURE.md` describes the integrated state: it names a current control or setting, or says the old one was removed or replaced; the report lists each match it kept.
- [ ] `ARCHITECTURE.md` describes the integrated AoE4 state: both `lint:dup` configs with `acceptance/` scanned, `strict` TypeScript, the component test helpers listed beside `lib/aoe4-build-order/test-helpers.ts` and `acceptance/helpers.ts`, and the Blob storage behavior; a statement a feature ticket left untrue is fixed here.
- [ ] No comment in `components/apps/aoe4-build-order/` or `lib/aoe4-build-order/` still describes behavior an M9 ticket removed (found with the removed-name grep in Scope).
- [ ] Every M9.9 topic in Scope's coverage check is asserted by a Playwright spec; the report names the spec file for each, and any case added here is listed.
- [ ] `npm run lint:dup` (both configs, `acceptance/` scanned), `npx tsc --noEmit`, `npm test` and the new spec under `npm run acceptance` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-11

- Underspecified: the walk ended at the first Results stop, so the chart handle and caret order could not be asserted; Results selectors were unnamed; the helper source was conditional on SGS-132; `save-build` was optional; the end-state grep could forbid accurate `Per villager` and `strictNullChecks` text.
- Changed: two states (edited, where `save-build` is an asserted enabled stop, and link shown, where it is asserted present and disabled), because `save-build` is disabled whenever the link is shown; the walk runs to the last chart's `chart-collapse`; `compare-collapse`, `chart-drag-handle`, `chart-collapse` matched per chart section; a move-to-`helpers.ts` rule for `saveCopy`/`editedCopy`; those two names moved from the end-state grep to an audit criterion.
- No branch work exists yet; the docs pass section and ownership table stand unchanged.
