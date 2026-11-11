# SGS-141: Add the split-layout Tab-order spec and close the M9 docs gaps

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.9
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (a Playwright spec and docs; no engine, data or simulation path is touched)
- **Unverified assumptions**: none (the spec runs in real Chromium, which decides Tab traversal; nothing is faked)
- **LOC estimate**: 0 business logic (one acceptance spec of about 60 lines and doc edits)
- **Depends on**: SGS-130, SGS-131, SGS-132, SGS-133, SGS-137, SGS-138, SGS-139, SGS-140
- **On merge**: none
- **Source**: `design/M9.md` criteria map row M9.9, "Tab order (M9.9)" behavior rule, C13 (acceptance path); criterion M9.9; `plans/M9-20261111.md` outline N

## Context

M9.9 asks that the design doc and `ARCHITECTURE.md` describe every M9 change, that Playwright cover the new behavior, and that the split layout's Tab order is pinned. Each feature ticket already owns its own doc edits and its own spec; this ticket adds the one spec nobody owns (Tab order across the run bar, the Build column and the Results column), and then sweeps the two docs and the code comments at the seams for statements the milestone left untrue or never added. It lands last so it audits the integrated result.

## Scope

State read at `origin/main` plus the end states of every Depends-on ticket (and, through SGS-137 and SGS-138, SGS-134 to SGS-136, plus SGS-128 and SGS-129). For SGS-139 (marker legend buttons that label a kind's markers on hover or focus, new `acceptance/aoe4-marker-labels.spec.ts`) use the design's C8 and outline L until its ticket file is integrated.

### 1. Tab-order spec

- New `acceptance/aoe4-split-tab-order.spec.ts` at the `SPLIT_VIEWPORT` of `acceptance/helpers.ts`. It reaches the state "link shown after Save as copy" through the real save flow with the helpers SGS-132 left in `acceptance/helpers.ts` (or the ones it moved there from `acceptance/aoe4-my-builds.spec.ts`); reuse them, do not copy, because the acceptance jscpd gate (`.jscpd.json` now scans `acceptance/`, SGS-128) fails on a clone.
- From the focused `build-order-select`, press Tab and record the focused element each time, until focus has reached the Results column. The recorded stops must contain, in this order and strictly increasing in document order: `duration-seconds`, `editor-view-text`, `save-build`, `save-build-copy`, `saved-build-link`, `copy-saved-link`, then an element inside `build-column`, then an element inside `results-column` (design M9.9 row). Other stops may sit between them; the rule is order, not an exact list. `save-build` is present only for a build that has an edit secret, so the spec either starts from a state that shows it or asserts the order without it and says which in a comment.
- Within the Results column, the key-results caret comes before every chart's drag handle, and in a chart the handle comes before that chart's caret (design "Tab order" rule). Assert this on the stops the walk already records; do not extend the walk through the legends.
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
- Add the Tab-order rule to the "Page" section of `docs/aoe4-build-order.md`: in the side-by-side layout the Tab order follows the DOM order (run bar controls, then the Build column, then the Results column, with no positive `tabindex`), and the save row's controls come in the order buttons, status, link, Copy link. Scope names the statement; the implementer writes it against the code. No measured values.
- `ARCHITECTURE.md`: any statement about where AoE4 UI, test-helper or acceptance files live that the new files make incomplete (for example a list of component test helpers or acceptance helpers). Check with a grep for the helper file names; do not add a row for every new component file, since the table lists kinds of files, not files.
- M9.9 coverage check, no new spec unless one is missing: confirm the M9 Playwright specs the feature tickets own exist and assert their M9.9 topics (saved status, drag and caret controls with persistence across reload, pinned tooltip and legend, the two chart views, marker-label hover and focus, and this ticket's Tab order). When a named topic has no assertion in any spec, add the missing case to the spec that owns it and say so in the report. Report anything that cannot be covered as a finding rather than a ticket-sized change.

**Out of scope:** any product code or CSS change; rewriting doc text the table assigns to a feature ticket when it is correct; `design/M8.md` and `design/M9.md` (factory files); a DOM test environment; extending the Tab walk through the legends, drag or the table view; measured results in docs.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] At 1280x800 after Save as copy (link shown), Tab from `build-order-select` visits `duration-seconds`, `editor-view-text`, `save-build-copy`, `saved-build-link` and `copy-saved-link` in that order (and `save-build` between `editor-view-text` and `save-build-copy` when it is shown), then a control inside `build-column`, then a control inside `results-column`, each strictly later in document order than the one before. A test fails if the save row's DOM order, or the run bar, Build column and Results column order, is changed (a probe that swaps two of them makes the spec fail).
- [ ] Within the Results column, the key-results caret is reached before every chart's drag handle, and in each chart the handle is reached before that chart's caret.
- [ ] No element on the page has a `tabindex` greater than 0.
- [ ] The spec reads all focus and position data per step in one `page.evaluate` (or inside `expect.poll`), and reuses the save-flow helpers from `acceptance/helpers.ts` instead of copying them.
- [ ] `docs/aoe4-build-order.md` states the split-layout Tab order rule, and every M9 behavior in the milestone criteria M9.3 to M9.8 and M9.10 to M9.13 that changes what a user or API client sees has a sentence in it or in `ARCHITECTURE.md`; the report lists each criterion with the doc location that covers it.
- [ ] End state of the search `git grep -n -E "chart-move-up|chart-move-down|chart-pinned-key|pinned-age-up|Age-up \(pinned\)|gather-rates-per-villager|perVillagerSeries|PinnedLineKey|Per villager|strictNullChecks" -- docs ARCHITECTURE.md`: no match. Today it finds the stale statements in `docs/aoe4-build-order.md` and `ARCHITECTURE.md` that the feature tickets remove; this ticket confirms none remain.
- [ ] `ARCHITECTURE.md` describes the integrated AoE4 state: both `lint:dup` configs with `acceptance/` scanned, `strict` TypeScript, the component test helpers listed beside `lib/aoe4-build-order/test-helpers.ts` and `acceptance/helpers.ts`, and the Blob storage behavior; a statement a feature ticket left untrue is fixed here.
- [ ] No comment in `components/apps/aoe4-build-order/` or `lib/aoe4-build-order/` still describes behavior an M9 ticket removed (found with the removed-name grep in Scope).
- [ ] Every M9.9 topic in Scope's coverage check is asserted by a Playwright spec; the report names the spec file for each, and any case added here is listed.
- [ ] `npm run lint:dup` (both configs, `acceptance/` scanned), `npx tsc --noEmit`, `npm test` and the new spec under `npm run acceptance` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none
