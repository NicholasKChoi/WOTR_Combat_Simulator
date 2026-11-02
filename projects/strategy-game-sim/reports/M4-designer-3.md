# M4 designer report 3 (2026-11-02)

Design: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/design/M4.md (updated in place, not committed).
Owner decisions Q1=A, Q2=C, Q3=A are unchanged. No new owner decisions: every question below was a design call.

## Answers to the planner's design questions

| # | answer | design section |
|---|--------|----------------|
| DQ1 | B (schema ticket) adds `suggestion` to the OpenAPI `BuildOrderIssue` schema in the same diff. The contract spec forces it. | C3 (last paragraph); Docs and OpenAPI table; M4.1 ticket order row 2 |
| DQ2 | Yes. Every ticket updates docs, OpenAPI and the contract spec for what it changes, in the same diff. G adds both `SimWarning` variants and the `simWarningVariants` tuple entries. F updates the `UnitSeries`/`unitsProduced` descriptions. R audits and fills Playwright gaps only. | Behavior rules, Docs and OpenAPI (new); C4 last bullet |
| DQ3 | D shows client rejections in `build-order-issues` through a new `IssueList` in `components/apps/aoe4-build-order/issue-list.tsx`, rendered directly under the textarea. The list is not live and has no suggestion or highlight. `simulation-error` keeps every server 400, network failure and HTTP failure and never shows a browser issue. A client rejection clears the shown result, keeps the pin and sends no POST. K makes the list live and adds the gutter highlight, suggestions and scroll-to-line. The 6 specs (`aoe4-build-order.spec.ts` 107-131 (two tests), 304-307, 320-327, 574-576; `pin-compare.spec.ts` 173-178) call a new `runRejected(page)`. They assert one `build-order-issue` with `data-line="2"` and `data-code="syntax"` whose text contains `fly`, `simulation-error` count 0, and the same removed/kept elements as today. The duration and mocked 400/500 specs keep `simulation-error`. | C8 (test-id rows, `runRejected`, `IssueList`); Behavior rules, Page run: Run ordering, failure leaves, inline issues (ticket 3), page specs rows |
| DQ4 | P lifts the select into page state (`BuildInput` props `selected`, `onSelectedChange`). The name is fixed at Run and stored in the run snapshot. Label: the first prebuilt whose text equals the run text exactly, else `<selected> (edited)` (this includes a fully pasted build), else `Custom build` when `builds` is empty. Example: `Pinned: ENG 1TC (edited), 20:00`. A restored pin shows the stored name. | C8 code block; Compare and pin: pin name source, label, restore |
| DQ5 | Yes. It is one ticket, component aoe4-build-order, including the 4 `lib/combat-simulator/simulate.ts` errors. Fixes only narrow types (assertion, guard, corrected type, or throw on an impossible state). They never add a fallback or change a branch. The `validate.ts` fixes may be minimal assertions. | C1 (new bullet) |
| DQ6 | D renames it (`StepTable` prop `catalog: BuildOrderCatalog`). L then needs no page edit. | C8 paragraph under the code block; Left to tickets serialization (`step-table.tsx`) |
| DQ7 | Accepted, as M4.1 ticket 2b (after 2, which owns the `package.json` edit). | M4.1 ticket order |
| DQ8 | The list stays in the results panel, inside `Results` where it is today. Only `build-order-issues` goes under the editor. Main already keeps every info entry, so K adds Playwright coverage of a knight + longbow gold run-out in the list and changes no code unless that coverage finds a gap. | Page run: info list place (new row) |

## Spec gaps

1. Confirmed. Every `text` request body in `acceptance/` is rewritten: about 75 across 11 specs, using the list the ticket greps itself. The helper is a contract: `acceptance/helpers.ts` `export function buildOrderFrom(text: string): BuildOrder`. It calls `textToBuildOrder` with a lazily built English catalog and throws, joining the issue messages, when the text does not convert. B adds it. Spec-local text helpers such as the waits spec's `simulate(request, text, inputs)` keep their signature and convert inside. Specs never call `textToBuildOrder` directly. (C4a; Validation: API test rewrite which/how/when; Starting state)
2. Same as DQ3.

## Contracts changed in this pass

- C3: with `lines`, step issues carry `lines.steps[step]` and start issues carry `lines.start`, matching validate.ts. Order-level issues carry no line. The OpenAPI `suggestion` lands in the schema ticket.
- C4a: new `buildOrderFrom` in `acceptance/helpers.ts`.
- C8: `IssueList` moves to the new `issue-list.tsx` and its props become `{ issues }` (no `lines`). `issueLines(issues)` drops its `lines` argument and reads each issue's `line`. New `runRejected(page)` in `acceptance/helpers.ts`. `BuildInput` gains `selected`, `onSelectedChange` (M4.12). The `StepTable` prop rename is assigned to ticket 3. The `build-order-issues` placement is fixed. `simulation-error` now holds every server 400 issue.
- C1: precursor scope and fix rule.
- Modules table: rows for `issue-list.tsx` and `acceptance/helpers.ts`; `build-text-editor.tsx` exports only `BuildTextEditor`.

## Behavior rules added or changed

- Run ordering is rewritten as steps 1 to 7. Server 400 issues are no longer mapped to editor lines; all go to `simulation-error`. The browser checks with the same schema and catalog, so a server order issue means a deploy skew. This removes the pass-2 step-5 mapping and simplifies K.
- New rows: Run tabs (from M4.7), first issue scroll (from M4.8), inline issues in ticket 3, page specs for client rejections, page specs for the request body.
- Run failure: a client rejection clears the shown result like a 400. Run repeat: a rejection leaves Run enabled. Inline issues: an edit never clears the shown result.
- Info list place (new).
- Pin name source, label and restore (expanded).
- API test rewrite split into which, how and when (two steps).
- New Docs and OpenAPI section (per-ticket doc ownership).
- M4.1 ticket order now has 6 rows (1, 2, 2b, 3, 4, 5) with `after` columns. Left to tickets serialization adds `build-input.tsx`, `openapi.json`/contract spec, and `step-table.tsx`.

## Outline changes the plan needs

1. Split E into E1 "API specs send `buildOrder`" (dependsOn B, parallel with D, wave 3) and E2 "API rejects `text`, OpenAPI 2.0.0" (dependsOn D, E1, wave 4). E1 is the mechanical rewrite with the route unchanged. E2 is a small breaking diff: route, `api.ts`, the old `text`-rule specs replaced by the C4 rows, OpenAPI and docs. E1 does not edit `helpers.ts`.
2. B also adds `buildOrderFrom` to `acceptance/helpers.ts` and OpenAPI `BuildOrderIssue.suggestion`.
3. D also adds `issue-list.tsx` `IssueList`, `runRejected` in `helpers.ts`, the `StepTable` prop rename, and the rewrites of the 6 page specs plus `aoe4-step-table.spec.ts:203`.
4. K: `IssueList` is already present (from D). K makes the list live, adds suggestion rendering, gutter `data-error` via `issueLines`, scroll-to-first-issue, and info-list Playwright coverage. Its server 400 mapping is dropped.
5. P also lifts `selected` out of `BuildInput`.
6. R is audit plus Playwright gaps only. The doc edits move into B, E2, F, G, H, I and J to Q.
7. Path corrections in the plan: components live in `components/apps/aoe4-build-order/`, not `components/aoe4-build-order/`. `compare.ts` and `step-timeline-rows.ts` are in `components/apps/aoe4-build-order/` (outline M says `lib/`). `text-lines.ts` is `components/apps/aoe4-build-order/text-lines.ts` (outline J says `lib/`).

## Owner decisions

None new. Questions that could be read as product choices are design rules already approved in pass 2 or plain wording, so this pass decided them:
- the pin label for an edited or pasted build (kept the approved `(edited)` form);
- whether a client rejection clears results (kept today's failed-run behavior).
