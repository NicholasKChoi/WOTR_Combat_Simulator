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

All paths are repo-relative. Written against `origin/main` at `e6cad35` (respec 3; the local `main` is stale, read code
there) and the SGS-056 to SGS-073 Scope text; the implementer re-reads the merged code first. Needs Node 24 for `npm run acceptance` (`source ~/.nvm/nvm.sh && nvm use 24`).

**Expect a mostly confirming audit.** On `e6cad35` the stale phrases are gone, the Route and Bounds sections are already
fixed, and OpenAPI is already at its end state. The greps and `jq` checks below are therefore regression criteria that
must print the end-state values, and "an audit that finds nothing says so" is the expected PR outcome for OpenAPI, Route
and Bounds. The one known doc fix is the More-control sentence (known fix below). Re-read the rest anyway.

**Each of the four areas is already covered by existing specs** (tabs on load: `aoe4-build-order.spec.ts`; inline error:
`aoe4-build-order-inline-issues.spec.ts`; info list: `inline-issues.spec.ts` and `knight-longbow-page.spec.ts`; pin
reload: `aoe4-build-order-pin-compare.spec.ts`). There is no hole. The new spec is the cross-feature journey only, with no
per-feature assertion depth, and the PR must say so.

**1. Audit `docs/aoe4-build-order.md` against the code.** Fix every statement the code contradicts, in place, one
sentence at a time. Do not add sections the owning tickets did not need. Checks to run (the commands are the criteria
below):
- Stale phrases: `survives later runs`, `pinned run draws none`, `keeps the lower tier`, `a build order textarea, a`,
  `validateBuildOrder`, and `exactly one of .text. (paste format`. None remains on `e6cad35` (the owning tickets
  SGS-072, SGS-071, SGS-062, SGS-066, SGS-057 removed them). Keep the grep as a regression check.
- Route section: already says the request is `{ buildOrder, inputs }`, names the removed-`text` 400 and says no route
  issue carries `line` on `e6cad35`. Confirm only.
- Bounds table: already reads "paste text (page-side conversion) / steps ... 20,000 chars / 200 steps" with prose saying
  the cap is not a route bound on `e6cad35`. Confirm only.
- Backticked paths: every backticked `*.ts`, `*.tsx`, `*.json` or `*.md` path in the doc matches a tracked file by full
  repo-relative path, or by basename/suffix when it has no directory part (it must match exactly one tracked file in
  that case, or be one of the seven short names). `<civ>` template paths (`aoe4world/<civ>.json`, `rules/<civ>.json`, the "Other civilizations" row ~line 972) are expected to match no tracked file literally and need no edit (they resolve with `english`). The doc uses seven short names on purpose and they need no edit:
  `effects.ts`, `depletion.ts`, `gather.ts`, `model.ts`, `simulate.ts` (all under `lib/aoe4-build-order/`) and
  `rules/base.json`, `rules/english.json` (under `data/aoe4-build-order/`). Do not expand them.
- Known fix (page section, the step table paragraph, `docs/aoe4-build-order.md` around line 845): "a per-row More
  control that starts open when the step sets one" is imprecise. In `components/apps/aoe4-build-order/step-table.tsx`
  (`StepTable`, around lines 292 to 308) the open state is kept per row index; it is recomputed from the rows
  (open where the step sets an optional field) when the row count changes, and a row's control closes when an edit
  changes that row's action. Rewrite the sentence to say exactly that, and add the mount rule (verified on `e6cad35`):
  `pages/apps/aoe4-build-order.tsx` imports `StepTable` (line ~17) and renders it (line ~238) only in Table view and
  only while the text parses (otherwise the `step-table-unavailable` notice shows). Toggling Text and Table remounts
  it, and so does the text going unparseable and back, after which rows with a set optional field open again.
  Switching the Build and Results tabs does not remount it (`workbench-tabs.tsx` uses `hidden`).
- Warning list and house sections (SGS-063, SGS-064): the five warning codes, their ranks and the lead-time rule match
  `simulate.ts`, `depletion.ts` and `houses.ts`.
- Page section (SGS-066 to SGS-073): tabs, run bar, text/table toggle, editor gutter, inline issues, info list, step
  table fields, timeline "Blocked by", compare, legends, pinned markers, pin persistence, label and stale notice, and the
  narrow layout each have one accurate description, with no sentence left that describes the old single-page layout.

**2. Audit `docs/api/openapi.json` against the code.** Run the contract spec and the checks below; fix descriptions,
examples or references that disagree with `lib/aoe4-build-order/api.ts`, `model.ts`, `schema.ts` and the route. Already at
its end state on `e6cad35`, so these are regression checks: `info.version` `2.0.0`; `SimulateRequest.properties` has no
`text`; `BuildOrderIssue.properties` has `suggestion`; `SimWarning.oneOf` has 5 variants (matching `model.ts`
`SimWarning`); the `UnitSeries` and `unitsProduced` descriptions say counts are by current tier (SGS-062). No example
sends `text`.

**3. Playwright flow (new `acceptance/aoe4-build-order-m4-flow.spec.ts`).** Use the design's test ids and the helpers in
`acceptance/helpers.ts` (`openPage`, `runSimulation`, `runRejected`, `AOE4_PAGE`); no CSS selectors. First, for each of
the four M4.14 areas it covers (tabs layout, inline error, info list, pin reload), run `git grep -ln "<test id>" -- acceptance` for the ids below. The spec asserts each area once
in the flow test below, even where another spec already covers it, because the point is the cross-feature journey.
Any area an earlier ticket does not cover at all is a hole; the spec closes it and the PR names it (none is, per above).
Add `test.describe.configure({ timeout: 90_000 })` at the top of the spec: the flow runs three simulations at 1800 s plus
a reload, and the config timeout is 60 s.
- **Flow test (desktop, default viewport).**
  1. On load `workbench-tabs` is visible, `tab-build` is selected, `panel-results` has the `hidden` attribute and
     `tab-results` is disabled (tabs layout).
  2. Choose `ENG Knight/Longbow (King's Palace)` in `build-order-select`, fill `duration-seconds` with `1800`, run with
     `runSimulation`, and read the response. `tab-results` is selected and `panel-results` is visible. `simulation-notes-list`
     has count 0 until `simulation-notes-toggle` is clicked; expanded, its `data-code="node-depleted"` items have the
     response's `gold` and `gold#2` run-out messages as their text, and `simulation-warnings` has none of them (info list).
  3. `tab-build`, then register `page.on('request', ...)` counting POSTs to `SIMULATE_PATH` (a request counter, since no
     Run is clicked and `runRejected` cannot be used), and fill `build-order-text` with `start -> sheep\nproduce knigt from stable`. Without a Run,
     `build-order-issues` is visible with one `build-order-issue` containing `knigt` whose
     `build-order-issue-suggestion` reads `did you mean knight?`, and `build-order-line-number` line 2 has
     `data-error="true"` (inline error with suggestion). The page fires its own pin-restore POST on the first reload, so keep that out of this request-counter window (register the counter after the reload has settled). The charts live in the hidden panel while Build is selected, so
     `showTab(page, 'results')`, assert a chart test id (for example `chart-units-produced`) and `results-stale` are
     visible (an edit does not clear the result), then `showTab(page, 'build')`. The POST count since the listener was
     registered is 0.
  4. Restore the prebuilt text: re-selecting the already-selected build may not fire a change, so `selectOption` another
     build first and then `ENG Knight/Longbow (King's Palace)` (or fill `build-order-text` with that build's text).
     Assert `build-order-text` equals the build's text before running. Run at 1800 again, `pin-run`, then `page.reload()`
     with no Run. `tab-results` is enabled, `unpin-run` is enabled and `pinned-label` has exact text
     `Pinned: ENG Knight/Longbow (King's Palace), 30:00` (the exact text fails on a `(edited)` label, which a `contains`
     check would not; format from `compare-panel.tsx`: `Pinned: {name}, {formatMinSec(duration)}`; the implementer
     confirms the name and `30:00` against the page and `pin-compare.spec.ts`). After the reload the Build tab is
     selected and `unpin-run` sits in the hidden Results panel, so `showTab(page, 'results')` first. Then `unpin-run`,
     reload: `tab-results` is disabled (pin survives reload).

**Out of scope:** a 390 px test (SGS-073 owns every whole-page 390 px `scrollWidth` test); any engine, page, CSS or data change (a failing check files a bug or a re-spec, it is not fixed here);
per-feature coverage the owning tickets already added; the `design/M4.md` text; the build READMEs (their owners edit them);
docs for the other apps.

## Diagrams

Single-component change outside the core control loop; no diagram required. (Test and prose only: the flow is run,
expand the info list, edit to an invalid paste, restore and pin, reload.)

## Acceptance criteria

- [x] `git ls-files acceptance | grep -c m4-flow` prints 0 today and 1 after; `npm run acceptance` passes under Node 24 with it.
- [x] Flow test, tabs: on load `tab-build` is selected, `panel-results` is `hidden` and `tab-results` is disabled; after a run `tab-results` is selected and `panel-results` is visible.
- [x] Flow test, info list: the Knight/Longbow 1800 s run's collapsed `simulation-notes-list` is absent from the DOM, and once expanded its `node-depleted` items equal the response's gold run-out messages (read from the response, not hard-coded times); none sits in `simulation-warnings`.
- [x] Flow test, inline error: typing `produce knigt from stable` after a Run shows one `build-order-issue` for `knigt` with suggestion text `did you mean knight?` and `data-error="true"` on gutter line 2, with the earlier charts still drawn (checked on the Results tab with `results-stale` visible, then back to Build), and no POST (a `page.on('request')` counter registered before the edit reads 0).
- [x] Flow test, pin: after pinning and `page.reload()` with no Run, `tab-results` and `unpin-run` are enabled and `pinned-label` has exact text `Pinned: ENG Knight/Longbow (King's Palace), 30:00` (after restoring and asserting the textarea matches the build); `unpin-run` is clicked after `showTab(page, 'results')`; after `unpin-run` and a reload, `tab-results` is disabled.
- [x] All new tests are deterministic (no `waitForTimeout`; waits are on responses and test-id assertions) and use the Playwright `webServer`, so no process is left running.
- [x] Docs stale phrases (regression): `git grep -nE "survives later runs|pinned run draws none|keeps the lower tier|a build order textarea, a$|validateBuildOrder" -- docs` prints nothing, before and after the change (checked on `e6cad35`).
- [x] Docs paths: every backticked `*.ts`, `*.tsx`, `*.json`, `*.md` path in `docs/aoe4-build-order.md` matches a tracked file by full path or by basename/suffix (the seven short names in Scope are expected and need no edit); the implementer runs the check and lists any it fixes.
- [x] Docs Route (regression): `git grep -nE "exactly one of .text. \(paste format" -- docs` prints nothing; the section says the request is `{ buildOrder, inputs }` and names the removed-`text` 400.
- [x] Docs More control: the step table paragraph no longer says the control "starts open when the step sets one" alone; it states the per-row-index open state, the reset on row-count change, the close on action change and the Text/Table and unparseable-text remounts.
- [x] OpenAPI end state: `jq -r '.info.version' docs/api/openapi.json` is `2.0.0`; `jq '.components.schemas.SimulateRequest.properties | has("text")'` is `false`; `jq '.components.schemas.BuildOrderIssue.properties | has("suggestion")'` is `true`; `jq '.components.schemas.SimWarning.oneOf | length'` is `5` (regression checks: these values already print on `e6cad35`).
- [x] The contract spec `acceptance/aoe4-simulate-api-contract.spec.ts` passes unedited, or edited only where it asserts a name this audit corrects (the PR lists each edit).
- [ ] Every doc or OpenAPI edit is listed in the PR with the code line that makes the old text untrue; an audit that finds nothing says so.
- [x] Mutation, run in a throwaway worktree after the dependencies are merged (`git worktree add --detach "$FACTORY_DIR/worktrees/ticket-SGS-074"`): make the pin restore skip the stored value (so a reload shows no pin) and the pin-reload step fails; make `issue-list.tsx` omit the suggestion element and the `did you mean knight?` step fails (the narrow-layout mutation belongs to SGS-073). Confirm each before handing over and remove the worktree.
- [x] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-02

- Underspecified: the 390 px test duplicated SGS-073's (designer pass 4, Q10).
- Changed: dropped the 390 px test, its criterion, the min-width mutation and the open question; the flow test is now one desktop test.
- Stands: desktop flow, docs audit and OpenAPI audit unchanged.

## Re-spec 2026-11-02 (3)

- Underspecified: counts and line numbers were from stale `d5c2549`; path check ignored short names; flow steps 3 and 4 lacked tab switches, exact label, restore method, request counter and timeout; the More-control doc fix was unlisted.
- Changed: rebased to `e6cad35` (greps and jq now regression checks, audit mostly confirms), added the eight fixes and the "existing specs already cover the areas" statement.
- Stands: desktop-only flow, no 390 px test, mutation criterion.

## Rework 1 - 2026-11-02 (review)

Gate that bounced: review (reports/SGS-074-review-1.md). Tip reviewed: 6465ca8e5984c1df1e220e1a6667e31e794da1d8 (one commit on origin/main e6cad35). Verified fine: the More-control sentence matches the code; the ticket greps and jq checks; the rest of the audit; full acceptance 690 passed; tsc, lint:dup, 1307 unit, build; five of six reviewer mutations fail the flow spec.

Findings:
- `acceptance/aoe4-build-order-m4-flow.spec.ts:73-75`: the final unpin step cannot fail. After unpin and reload, `expect(tab-results).toBeDisabled()` passes on its first check because `tab-results` is always disabled on first render (the pin is restored only after the restore POST answers); removing `clearStoredPin` from `unpin()` (page ~line 204) left the spec passing.
- `docs/aoe4-build-order.md:822`: "The view and the tab survive runs but not a reload." is wrong: the tab does not survive runs (`setTab('results')` on success ~page line 176; `setTab('build')` on a rejected or failed run ~lines 157, 166, 180). design/M4.md:480 says only the view survives runs and tab switches.
- Non-blocking: the spec's `page.on('request')` listener is never removed (runRejected in helpers.ts uses `page.off`); `docs/aoe4-build-order.md:932` is imprecise: with a pin, Results still shows the compare panel after a 400, and issue messages don't always name a line or step.

Required fixes:
- [x] (rework 1) Make the final unpin step able to fail: assert the localStorage key `aoe4-build-order.pinned-run` is null before the reload (as pin-compare.spec.ts:465 does), and/or count POSTs across the reload, wait for idle, assert 0, then check `tab-results` disabled. Mutation: remove `clearStoredPin` from `unpin()`: the spec must fail (report it).
- [x] (rework 1) Fix docs line ~822: the editor view survives runs and tab switches but not a reload; the selected tab follows each run (Results after a successful run, Build after a rejection or failure) and a reload starts on Build. Verify against pages/apps/aoe4-build-order.tsx and design/M4.md before writing.
- [x] (rework 1) Remove the `page.on('request')` listener when done (`page.off` in a finally).
- [x] (rework 1) Fix docs line ~932: after a 400 with a pin, Results still shows the compare panel; issue messages do not always name a line or step (state what is true after reading the code and the route's issue shapes).
- [x] Re-audit the other docs lines near these two for the same tab/view mix-up (grep the doc for "tab" and "view" statements about reload/run behavior) and fix any other wrong sentence; list them in the report.

## Rework 2 - 2026-11-02 (review)

Gate that bounced: review (reports/SGS-074-review-2.md). Tip reviewed: 103871ed84220bac1b47d5d237bc3cb45cc7aaec. Everything else passes (unpin step mutation-checked; doc line 822 matches the page and design; listener removed; flow + contract 660/660 under load).

Finding:
- `docs/aoe4-build-order.md:~930` (contract): the sentence added in rework 1 says each 400 issue message starts with "a line, a step, a field path such as `inputs.durationSeconds`, or `request body`". "A line" never happens on a 400: the route calls `checkBuildOrder` without `lines` (simulate.ts:26), so `located()` (schema.ts:550-551) never produces a `line N` label; this also contradicts the doc's own line ~589 "The route never sets `line`". The list also omits two real prefixes: `build order:` (schema.ts:582) and `request:` (simulate.ts:22,25). Confirmed on the live route: `{buildOrder:5}` -> "build order: must be an object"; `{text:"x"}` -> "request: text is no longer accepted...".

Required fixes:
- [x] (rework 2) Reword that sentence from the code: drop "a line", name the real prefixes, e.g. "each starts with the step or field it applies to, such as `steps[2]` or `inputs.durationSeconds`, or with `build order:` / `request:` for whole-body problems; the route never names a line". Keep the correct remainder (with a pin, Results stays enabled and shows the pin label and Unpin, no compare table).
- [x] (rework 2, optional) Rewrap line ~822 (about 170 characters) to the section's ~110 width without changing words.
- [x] No other change.
