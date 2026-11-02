# SGS-036 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-036-aoe4-request-hardening.md

Title: Harden the simulate request: issue cap, NBSP, pre-start lines, sparse steps. Component aoe4-build-order. About 45 business-logic lines. No dependencies. On merge: none (the outline names none).

Covers: `MAX_REPORTED_ISSUES = 100`, `SimulateError.omittedIssues` (route, api.ts, page line "N more issues not shown.", OpenAPI with `maxItems`, contract spec key map at acceptance/aoe4-simulate-api-contract.spec.ts:298), route narrowing on `ok`, NBSP/U+202F whitespace, `sawStep` only for parsed step lines, indexed loop in validate.ts:189, and the four doc spots in docs/aoe4-build-order.md. Criteria include 100/101 boundary, 120-issue mix (answer 7: cap after combining), ajv validity, page text, and two count greps (each 1 match on origin/main f078c11, run before handing back). No Mermaid diagram (single component, no control loop).

Risk: high, not the plan's low. lib/** is a REPO.md criticalPath and the diff adds the S3 cap plus a field to an existing response. Manager may override.

Open questions: none. Design questions 7 applied as owner-approved.
Overlap: parse-text.ts with F (rebase only; GATHER_NODE_ORDER left to F), validate.ts with D/E, api.ts with D (`nodeAmounts`), openapi.json with every shape ticket. The doc line numbers in Scope 8 are approximate.
Caught: the plan said `acceptance/aoe4-simulate-api-contract.spec.ts` needs the `omittedIssues` key in its `Record<keyof SimulateError, true>` map; this is in Scope 7.
