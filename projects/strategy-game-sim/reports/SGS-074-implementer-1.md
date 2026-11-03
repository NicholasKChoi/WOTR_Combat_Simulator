# SGS-074 implementer 1

Branch sgs-074-aoe4-m4-docs-audit-playwright, tip 6465ca8e5984c1df1e220e1a6667e31e794da1d8 (one commit on origin/main e6cad35), worktree $FACTORY_DIR/worktrees/sgs-074-aoe4-m4-docs-audit-playwright. Status: needs_review.

## Files
- docs/aoe4-build-order.md: More-control sentence rewritten (page facts verified in code first).
- acceptance/aoe4-build-order-m4-flow.spec.ts: new cross-feature flow spec.

## Doc edit
Old: "sits behind a per-row More control that starts open when the step sets one". New text: open state kept per row index; starts open where the step sets an optional field; recomputed the same way when the row count changes; closes when an edit changes the row's action; table mounted only in Table view and only while the text parses, so Text/Table toggle and unparseable-then-parseable text remount it and set-field rows open again; Build/Results tab switches do not.
Verified: step-table.tsx 292-298 (expansion {rows, open}, recompute on steps.length change) and edit() closing on action change (~line 318); pages/apps/aoe4-build-order.tsx line 17 import, line 233-238 (`view === 'text'` else StepTable), line 240 unavailable notice; workbench-tabs.tsx lines 44 and 52 use `hidden`.

## Audit results
- Stale phrase and "exactly one of .text. (paste format" greps: print nothing.
- Route and Bounds sections: confirmed, no edit.
- Warning codes: model.ts SimWarning has 5 variants, matches OpenAPI oneOf (5). Nothing stale found in the warning/house/page sections that I re-read for contradictions; no other doc edit.
- Backticked paths: all match exactly one tracked file, except the expected: `aoe4world/<civ>.json`, `rules/<civ>.json` (templates, 0 matches) and `simulate.ts` (3 matches, one of the seven short names). No fixes.
- OpenAPI: version 2.0.0; SimulateRequest has no `text` property (false; `not.required text` present as intended); BuildOrderIssue has `suggestion` (true); SimWarning.oneOf length 5; UnitSeries/unitsProduced descriptions describe per-tier series. No edit; the audit found nothing in OpenAPI.
- Contract spec acceptance/aoe4-simulate-api-contract.spec.ts passes unedited (66 passed with the flow spec).

## Flow spec
Cross-feature journey only; the four areas (tabs, inline error, info list, pin reload) are each covered in depth by existing specs (aoe4-build-order, inline-issues, knight-longbow-page, pin-compare), so there is no hole and the spec adds no per-feature depth. One desktop test, `test.describe.configure({ timeout: 90_000 })`, uses showTab helper, response-based waits, no sleeps. The POST counter is registered after the first run, before the edit, and never spans the reload. The info-list expectations are read from the response. Pin label exact text `Pinned: ENG Knight/Longbow (King's Palace), 30:00`.

## Mutations (each failed, then reverted with git checkout)
- pages/apps/aoe4-build-order.tsx: pin restore reads `const stored = null` -> tab-results toBeEnabled failed after reload.
- issue-list.tsx: suggestion condition false -> build-order-issue-suggestion not found.
- message-lists.tsx: notes list always rendered -> `simulation-notes-list` toHaveCount(0) failed.
- workbench-tabs.tsx: tab-results never disabled -> toBeDisabled failed.
- results.tsx: stale banner suppressed -> results-stale not visible.

## Stability
--repeat-each=5 (5 workers) against one shared server (throwaway config with reuseExistingServer true, deleted) while pin-compare spec (2 workers, 32 passed) ran in parallel: 5 passed; repeated a second time while the inline-issues spec ran: 5 passed (that other spec's result was cut off when I stopped the server, not counted).

## Gates
- tsc --noEmit: clean. lint:dup: 0 clones. npm test: 1307 passed, 10 skipped. next build: ok. Full `npm run acceptance` not run in full; flow + contract specs run (66 passed). codegen: none configured.
- Port 4191: nothing listening (checked ss).

## Out-of-scope findings
None.
