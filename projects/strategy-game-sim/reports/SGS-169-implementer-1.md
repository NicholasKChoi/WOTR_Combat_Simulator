# SGS-169 implementer report 1

Ticket SGS-169, branch sgs-169-effect-not-simulated-debug-severity, tip ec70f1d84d1aecabd6222555047892888585bb34.
Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-169-effect-not-simulated-debug-severity

## Files
- lib/aoe4-build-order/model.ts: `Severity` and `SEVERITIES` gain `debug` after `info`. SimWarning still uses the full `Severity` (not narrowed).
- lib/aoe4-build-order/research.ts: both research notes emit `debug`.
- components/apps/aoe4-build-order/messages.ts: unchanged. It already renders only `warning` and `info`, so `debug` never reaches the lists.
- docs/api/openapi.json, docs/aoe4-build-order.md, docs/aoe4-build-order-format.md, docs/aoe4-build-order-ui.md: severity wording updated.
- Tests: research.test.ts, model.test.ts, messages.test.ts (3 new), acceptance/aoe4-simulate-api-research.spec.ts (expected severity).

## Tests
`npm test`: 2612 passed, 15 skipped (all 84 files pass). `tsc --noEmit` plus `lint:dup`: clean. `next build`: succeeded. Acceptance not run (not authored here).
Invariants encoded: every note over every tech in the data is `debug`; `resultMessages` drops `debug`; a debug-only result renders no warnings list, no toggle and no control (`<div></div>`); the toggle count excludes debug beside info.

## Pre-existing tests edited
- research.test.ts "marks every note info..." and "marks info the note of every tech": expected `info` became `debug` (ticket Scope names them).
- model.test.ts SEVERITIES: expected list gains `debug`.
- acceptance/aoe4-simulate-api-research.spec.ts: note severity `info` became `debug` (ticket names it; not run here).
- acceptance/aoe4-build-order-inline-issues.spec.ts and the m3/m4/knight-longbow specs were checked and left unchanged. They filter on `info` or `node-depleted`, so debug notes are already excluded.

## Doc claims
- openapi.json Severity: "debug items are for API clients only; the page does not show them." (`messages.ts` resultMessages).
- openapi.json BuildOrderNote.severity: "every note is debug." (`research.ts` researchNotes).
- aoe4-build-order.md: severity list gains `debug`; the table row reads `debug`; "hides `debug` messages, which appear only in the API response".
- aoe4-build-order-format.md: "Every note has `severity: 'debug'`"; the warnings severity list gains `debug`.
- aoe4-build-order-ui.md: "Messages of severity `debug` are not shown, and the page has no control to show them." The sentence near the top about gold run-outs and info notes in the collapsed info list stays true and is unchanged.

## Mutation checks
- messages.ts (map debug to the info list and loosen the filter): the 3 new messages tests failed on their assertions. Undone with `git checkout`.
- research.ts (`debug` back to `info`): both research.test.ts tests failed (`['info','info']` vs `['debug','debug']`). Undone.

## Invariants
A3: notes are still a pure function of order and data (existing purity test passes). Cost and queue-time tests are unchanged and pass.

## Unverified assumptions added
None.

## Out-of-scope findings
None.

Status: needs_review
