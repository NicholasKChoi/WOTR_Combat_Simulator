# SGS-074: Audit the M4 docs and OpenAPI against the code and add the M4 Playwright flow

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / M4.14
- **Priority**: medium
- **Risk**: standard
  <!-- Plan said standard. Audit edits can touch the public contract file docs/api/openapi.json, so not low. Test-only otherwise, no engine change. -->
- **Invariants**: none changed. Adjacent only in prose: A3 (the docs' determinism statement must stay true after the M4 rule changes).
- **LOC estimate**: 0 business logic. About 120 lines of test code (new `acceptance/aoe4-build-order-m4-flow.spec.ts`) plus whatever one-line doc or OpenAPI description fixes the audit finds.
- **Depends on**: SGS-056, SGS-057, SGS-058, SGS-059, SGS-060, SGS-061, SGS-062, SGS-063, SGS-064, SGS-065, SGS-066, SGS-067, SGS-068, SGS-069, SGS-070, SGS-071, SGS-072, SGS-073. (SGS-073 is the narrow-layout ticket, plan outline Q. The implementer re-reads it for the narrow-layout doc paragraph. SGS-073 owns every whole-page 390 px test; this ticket has none.)
- **On merge**: none. (`design/M2.md` lines 76, 210 and 222 were already edited on the state branch when this ticket was written; the manager commits them with the state files. The M4 design needs no CONTEXT.md line.)
- **Source**: `design/M4.md` "Docs and OpenAPI (M4.14)"; plan `plans/M4-20261102.md` outline R as amended by `reports/M4-designer-3.md` (R is an audit and Playwright gaps only; every other ticket updates its own docs, OpenAPI and contract spec).

## Context

Each M4 ticket edits the docs and OpenAPI for what it changes and tests its own UI. M4.14 asks for a last check that
`docs/aoe4-build-order.md` and `docs/api/openapi.json` describe the code after all of them, and for Playwright coverage of
the new layout, the inline error with a suggestion, the info list, and a pin that survives a reload (the 390 px width check belongs to SGS-073). This
ticket does that audit once and adds one cross-feature spec, as SGS-054 and SGS-055 did for M3. It carries no deferred doc
edits.

## Scope

All paths are repo-relative. Written against `origin/main` at `d5c2549` and the SGS-056 to SGS-072 Scope text; the
implementer re-reads the merged code first. Needs Node 24 for `npm run acceptance` (`source ~/.nvm/nvm.sh && nvm use 24`).

**1. Audit `docs/aoe4-build-order.md` against the code.** Fix every statement the code contradicts, in place, one
sentence at a time. Do not add sections the owning tickets did not need. Checks to run (the commands are the criteria
below):
- Stale phrases. On `origin/main` each of these has one hit in the doc: `survives later runs` (pin section, line 816),
  `pinned run draws none` (chart section), `keeps the lower tier` (unit tiers), `a build order textarea, a` (page
  section), `validateBuildOrder` (line 615, the Route diagram). The owning tickets (SGS-072, SGS-071, SGS-062,
  SGS-066, SGS-057) remove them. This ticket removes any that remain.
- Route section (lines 626 to 652 today): after SGS-061 it says the request is `{ buildOrder, inputs }`, that a body
  with a `text` key gets the removed-`text` 400, and that issues carry `step` and never `line`. Today it says `text`
  or `buildOrder`, 20,000 characters, and `line` on pasted steps. Fix what is left.
- Bounds table (line 55 today, `text / steps`): `text` still caps the paste in the browser (the 20,000-character
  length check in `textToBuildOrder`), not in the API. Make the row say so.
- Every backticked `*.ts`, `*.tsx`, `*.json` or `*.md` path in the doc resolves to a tracked file (0 missing on
  `origin/main` today; the M4 file moves and new files must keep it 0).
- Warning list and house sections (SGS-063, SGS-064): the five warning codes, their ranks and the lead-time rule match
  `simulate.ts`, `depletion.ts` and `houses.ts`.
- Page section (SGS-066 to SGS-073): tabs, run bar, text/table toggle, editor gutter, inline issues, info list, step
  table fields, timeline "Blocked by", compare, legends, pinned markers, pin persistence, label and stale notice, and the
  narrow layout each have one accurate description, with no sentence left that describes the old single-page layout.

**2. Audit `docs/api/openapi.json` against the code.** Run the contract spec and the checks below; fix descriptions,
examples or references that disagree with `lib/aoe4-build-order/api.ts`, `model.ts`, `schema.ts` and the route. Expected
end state (today in brackets): `info.version` `2.0.0` (`1.0.0`); `SimulateRequest.properties` has no `text` (has it);
`BuildOrderIssue.properties` has `suggestion` (absent); `SimWarning.oneOf` has 5 variants (3); the `UnitSeries` and
`unitsProduced` descriptions say counts are by current tier (SGS-062). No example sends `text`.

**3. Playwright flow (new `acceptance/aoe4-build-order-m4-flow.spec.ts`).** Use the design's test ids and the helpers in
`acceptance/helpers.ts` (`openPage`, `runSimulation`, `runRejected`, `AOE4_PAGE`); no CSS selectors. First, for each of
the four M4.14 areas it covers (tabs layout, inline error, info list, pin reload), run `git grep -ln "<test id>" -- acceptance` for the ids below. The spec asserts each area once
in the flow test below, even where another spec already covers it, because the point is the cross-feature journey.
Any area an earlier ticket does not cover at all is a hole; the spec closes it and the PR names it.
- **Flow test (desktop, default viewport).**
  1. On load `workbench-tabs` is visible, `tab-build` is selected, `panel-results` has the `hidden` attribute and
     `tab-results` is disabled (tabs layout).
  2. Choose `ENG Knight/Longbow (King's Palace)` in `build-order-select`, fill `duration-seconds` with `1800`, run with
     `runSimulation`, and read the response. `tab-results` is selected and `panel-results` is visible. `simulation-notes-list`
     has count 0 until `simulation-notes-toggle` is clicked; expanded, its `data-code="node-depleted"` items have the
     response's `gold` and `gold#2` run-out messages as their text, and `simulation-warnings` has none of them (info list).
  3. `tab-build`, fill `start -> sheep\nproduce knigt from stable`. Without a Run, `build-order-issues` is visible with one
     `build-order-issue` containing `knigt` whose `build-order-issue-suggestion` reads `did you mean knight?`, and
     `build-order-line-number` line 2 has `data-error="true"` (inline error with suggestion). `tab-results` still shows the
     charts (an edit does not clear the result).
  4. Fill the Knight/Longbow text back by choosing it in `build-order-select`, run at 1800 again, `pin-run`, then
     `page.reload()` with no Run. `tab-results` is enabled, `unpin-run` is enabled and `pinned-label` contains
     `ENG Knight/Longbow (King's Palace)` and `30:00` (pin survives reload). Then `unpin-run`, reload: `tab-results` is
     disabled.

**Out of scope:** a 390 px test (SGS-073 owns every whole-page 390 px `scrollWidth` test); any engine, page, CSS or data change (a failing check files a bug or a re-spec, it is not fixed here);
per-feature coverage the owning tickets already added; the `design/M4.md` text; the build READMEs (their owners edit them);
docs for the other apps.

## Diagrams

Single-component change outside the core control loop; no diagram required. (Test and prose only: the flow is run,
expand the info list, edit to an invalid paste, restore and pin, reload.)

## Acceptance criteria

- [ ] `git ls-files acceptance | grep -c m4-flow` prints 0 today and 1 after; `npm run acceptance` passes under Node 24 with it.
- [ ] Flow test, tabs: on load `tab-build` is selected, `panel-results` is `hidden` and `tab-results` is disabled; after a run `tab-results` is selected and `panel-results` is visible.
- [ ] Flow test, info list: the Knight/Longbow 1800 s run's collapsed `simulation-notes-list` is absent from the DOM, and once expanded its `node-depleted` items equal the response's gold run-out messages (read from the response, not hard-coded times); none sits in `simulation-warnings`.
- [ ] Flow test, inline error: typing `produce knigt from stable` after a Run shows one `build-order-issue` for `knigt` with suggestion text `did you mean knight?` and `data-error="true"` on gutter line 2, with the earlier charts still drawn, and no POST (the spec counts requests).
- [ ] Flow test, pin: after pinning and `page.reload()` with no Run, `tab-results` and `unpin-run` are enabled and `pinned-label` contains the build name and `30:00`; after `unpin-run` and a reload, `tab-results` is disabled.
- [ ] All new tests are deterministic (no `waitForTimeout`; waits are on responses and test-id assertions) and use the Playwright `webServer`, so no process is left running.
- [ ] Docs stale phrases: `git grep -nE "survives later runs|pinned run draws none|keeps the lower tier|a build order textarea, a$|validateBuildOrder" -- docs` prints nothing after the change (it finds 5 lines on `origin/main` today, one each, checked).
- [ ] Docs paths: every backticked `*.ts`, `*.tsx`, `*.json`, `*.md` path in `docs/aoe4-build-order.md` is a tracked file (0 missing on `origin/main` today; the implementer runs the check and lists any it fixes).
- [ ] Docs Route: `git grep -nE "exactly one of .text. \(paste format" -- docs` prints nothing (1 hit on `origin/main` today); the section says the request is `{ buildOrder, inputs }` and names the removed-`text` 400.
- [ ] OpenAPI end state: `jq -r '.info.version' docs/api/openapi.json` is `2.0.0`; `jq '.components.schemas.SimulateRequest.properties | has("text")'` is `false`; `jq '.components.schemas.BuildOrderIssue.properties | has("suggestion")'` is `true`; `jq '.components.schemas.SimWarning.oneOf | length'` is `5` (today: `1.0.0`, `true`, `false`, `3`, checked on `d5c2549`).
- [ ] The contract spec `acceptance/aoe4-simulate-api-contract.spec.ts` passes unedited, or edited only where it asserts a name this audit corrects (the PR lists each edit).
- [ ] Every doc or OpenAPI edit is listed in the PR with the code line that makes the old text untrue; an audit that finds nothing says so.
- [ ] Mutation, run in a throwaway worktree after the dependencies are merged (`git worktree add --detach "$FACTORY_DIR/worktrees/ticket-SGS-074"`): make the pin restore skip the stored value (so a reload shows no pin) and the pin-reload step fails; make `issue-list.tsx` omit the suggestion element and the `did you mean knight?` step fails (the narrow-layout mutation belongs to SGS-073). Confirm each before handing over and remove the worktree.
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-02

- Underspecified: the 390 px test duplicated SGS-073's (designer pass 4, Q10).
- Changed: dropped the 390 px test, its criterion, the min-width mutation and the open question; the flow test is now one desktop test.
- Stands: desktop flow, docs audit and OpenAPI audit unchanged.
