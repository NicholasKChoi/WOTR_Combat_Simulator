# SGS-174: Add an AoE4 simulator internals overview

- **Type**: Docs
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: medium
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 0 (docs only; one new markdown file of roughly 120-200 lines)
- **Depends on**: SGS-171
- **On merge**: none
- **Source**: BACKLOG.md "Add an AoE4 simulator internals overview" (owner docs review, 2026-11-15)

## Context

Nothing describes the AoE4 code path end to end: `docs/aoe4-build-order.md` holds the rules, and a reader
has to find the module that implements each one. An overview of the modules and the data flow, linking
into the design doc, lets a reader (and a reviewer) go from a rule to its code.

The backlog item allows a README or an Internals section in the design doc. This ticket uses
`lib/aoe4-build-order/README.md`: `data/aoe4-build-order/README.md` is precedent for a README beside the
code. The design docs stay the only authority on rules; the README describes structure and links to rules,
and restates none.

SGS-171 splits `docs/aoe4-build-order.md` into three docs, so this ticket depends on it and reads the docs
at the SGS-171 branch tip (`git -C "$FACTORY_DIR/<worktreeRoot>/<branch>" show <branch>:<path>`, or
`origin/main` once SGS-171 is integrated), not at the old `origin/main`. After the split:
`docs/aoe4-build-order.md` (model doc) holds Purpose and model, Determinism bounds and resources, Data
sources, Model rules, Depletion, Severity, Technologies, CivRules seams and Extension points;
`docs/aoe4-build-order-format.md` (format doc) holds Build order input, Route (with Builds routes and Named
builds routes) and Outputs; `docs/aoe4-build-order-ui.md` holds the Page behavior.

## Scope

Add `lib/aoe4-build-order/README.md`. Describe only what is in the code at `origin/main`; read each module
before writing its line. It contains:

- **Module map.** Every `.ts` file in `lib/aoe4-build-order/` that is not `*.test.ts` or
  `*.acceptance.test.ts` gets one line naming its job, grouped by role, not listed alphabetically. The
  test-support files (`test-helpers.ts`, `route-test-support.ts`, `blob-fake-test-helpers.ts`, and any other
  test-only support file present) are named under one "test support" line, so the README accounts for every
  such file. Groups to cover (examples of the files the exploration found;
  the README covers every file present when it is written): text and checking (`parse-text.ts`,
  `text-to-build.ts`, `schema.ts`, `english-catalog.ts`, `step-options.ts`); types and data (`model.ts`,
  `api.ts`, `data.ts`, `data-schema.ts`); the engine (`simulate.ts`, `engine-common.ts`, `gather.ts`,
  `construction.ts`, `houses.ts`, `depletion.ts`, `effects.ts`, `research.ts`, `civ-rules.ts`,
  `landmarks.ts`, `markers.ts`, `production-buildings.ts`, `production-floors.ts`); saved builds and
  routes (`build-store.ts`, `blob-build-store.ts`, `saved-builds.ts`, `save-rate-limit.ts`,
  `named-builds.ts`, `builds.ts`, `api-route.ts`, `builds-routes.ts`, `named-builds-routes.ts`); small
  helpers (`format-time.ts`). Also say where the HTTP handlers live (`pages/api/aoe4-build-order/`) and
  where the data files live (`data/aoe4-build-order/`).
- **Data flow.** Pasted text -> `parse-text.ts` (grammar only) -> `BuildOrder` -> check (`checkBuildOrder`,
  `checkSimInputs` in `schema.ts`, against the catalog from `buildOrderCatalog`) -> `simulateBuildOrder` ->
  `SimulationResult` series. Say which call site runs each stage (the simulate handler in
  `pages/api/aoe4-build-order/simulate.ts` takes an already parsed `buildOrder`; `textToBuildOrder` is the
  paste-to-build conversion), as read from the code.
- **The event loop.** In `simulateBuildOrder`: per instant `runInstant` (house pass, `offerSteps`,
  `applyDueEvents`, production start); sampling the series at `sampleTimes`; `nextWake` choosing the next
  time anything can change (next sample, run-out, due event, trigger wake, affordability time); crediting
  income and accruing wait time up to it. Say where step handlers (`stepHandlers`), payment checks
  (`engine-common.ts`), depletion, effects and research plug in, and where the result is assembled at the
  end (final step status, warnings, series).
- **Links into the design docs.** Each module group and each loop stage links to the section that holds
  its rules, by heading anchor, never by line number, into whichever doc holds that section at the SGS-171
  tip: the model doc for Model rules, Depletion, Technologies, CivRules seams and Extension points; the
  format doc for Build order input, Route and Outputs.
- **Where to change what.** A short pointer for the common edits (a new step action, a new civ rule, a
  new data field), pointing at the model doc's Extension points and CivRules seams sections rather than
  restating them.

Docs the change touches: the model doc `docs/aoe4-build-order.md` gets one line saying the code overview lives in
`lib/aoe4-build-order/README.md`, placed in its intro beside the links to the format and UI docs that
SGS-171 adds. No code changes. `ARCHITECTURE.md` is not edited here: the README sits beside
the code like `data/aoe4-build-order/README.md`, and another backlog item owns ARCHITECTURE.md edits.

**Out of scope:** changing any code or comment; rewriting or splitting the design doc; ARCHITECTURE.md
and CONTEXT.md edits; restating game rules or numbers in the README; per-function documentation of
`simulate.ts` helpers; the UI components under `components/apps/aoe4-build-order/`.

## Diagrams

Docs-only change; no code control loop or state machine changes. The README itself may include a Mermaid
flowchart of the data flow if it helps, but this ticket requires none.

## Acceptance criteria

- [ ] `lib/aoe4-build-order/README.md` exists and every `.ts` file in `lib/aoe4-build-order/` other than
  `*.test.ts` and `*.acceptance.test.ts` is named in it (test-support files under the one test-support
  line), so a reviewer can diff `git ls-files lib/aoe4-build-order` against the README. (respec 1)
- [ ] Every file, function and type the README names exists at the commit the PR is based on, and its
  one-line description matches what that code does (a reviewer checks each against the source).
- [ ] The data-flow section lists the stages in the order the code runs them and names which of them the
  simulate endpoint runs and which only the paste conversion runs.
- [ ] The event-loop section names `runInstant`, `offerSteps`, `applyDueEvents`, `nextWake` and the order
  `runInstant` calls them in, matching `simulate.ts`.
- [ ] Every relative link in the README (to files and to design-doc headings) resolves to an existing file
  and an existing heading in the doc that holds the section after SGS-171; no link uses a line number. The
  implementer runs a link check in its checkout and records the result in the report. (respec 1)
- [ ] The README contains no digits other than in file names, heading anchors and link targets; rules are
  linked, not copied. (respec 1)
- [ ] `docs/aoe4-build-order.md` links to the README, and the only change to that doc is the added pointer
  line(s): `git diff` on that file shows only added lines. (respec 1)
- [ ] No code file changes in the diff (`git diff --name-only` lists only markdown files).
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-15

- Underspecified: the dependency on SGS-171 (which moves Build order input, Route and Outputs into the format doc), which doc holds each link target, whether test-support files belong in the module map, and two unobservable criteria.
- Changed: `Depends on: SGS-171`; links and the pointer line target the docs as they read at the SGS-171 tip; test-support files get one line; the number and doc-diff criteria are now mechanical; the link check is recorded.
- Stands: nothing on a branch yet; the module and data-flow scope is unchanged.
