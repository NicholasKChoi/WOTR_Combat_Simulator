# SGS-002 re-spec report

Ticket: tickets/SGS-002-playwright-acceptance-harness.md (status needs_spec -> ready for spec gate).
Base: origin/main d54af2e. Findings: reports/SGS-002-spec-gate.md. Branch: none yet.

## Summary

Title: Add a Playwright acceptance harness runnable by one npm script. Component: site. Risk: standard
(no production code, no invariant touched, no contract change). Size ~140 lines (config, three specs,
`acceptance/helpers.ts`, package.json, .gitignore). Depends on: none. Downstream: SGS-003, SGS-005, SGS-006
add specs to this harness.

## Gaps folded in

1. Landing spec (gap 1): per link, assert `href` equals the route, `request.get(href)` is 200, then click and
   assert URL and exact `<h1>` ("Combat Simulator" / "Starcraft Helper"). AC 6 reworded: no interaction with
   controls on /apps/starcraft-helper; loading it via the link and reading its h1 is allowed.
2. API body (gap 2): default armies 3 regs / 1 elite / 1 leader per side, values as strings (what the form
   posts; SGS-003 accepts digit strings), sent as Playwright `data:` object so JSON Content-Type is set.
   Values sit inside form options and project caps, so SGS-003/004 keep them valid.
3. Simulator flakiness (gap 3): `waitForLoadState('networkidle')` after goto before filling (fallback: another
   hydration signal, no fixed sleeps, named in the PR); `waitForResponse` for POST /api/fight started before
   the Fight! click with a 200 assertion; headings matched with `exact: true`.
4. Notes: port pinned to 3100 (`next dev -p 3100`, baseURL to match), `reuseExistingServer: false` with an AC
   for the occupied-port case; lockfileVersion 2 kept; helper module made mandatory with a shared default
   armies constant.
5. Environment: browsers absent on host. Scope item 6: implementer runs npm ci, acceptance:setup, acceptance;
   tries `npx playwright install-deps chromium` on library failures; reports a blocker with error output if it
   cannot launch Chromium. AC 3 states this.
6. Directory open question deleted: ARCHITECTURE.md on main lists `acceptance/` (Acceptance tests row and
   "Add acceptance tests under acceptance/").

## Changed criteria (tagged respec 1)

AC 1 (port 3100, own server), new AC 2 (occupied port fails), AC 3 (setup + blocker), AC 4 (landing),
AC 5 (API body), AC 6 (simulator waits and exact headings), AC 7 (StarCraft wording), new AC 8 (helpers).

## Diagrams

Cross-component flowchart kept, edges updated (port, href GETs, JSON object body). No control loop or state
machine change.

## Open questions

None remaining.

## Overlap

SGS-006 adds `acceptance/fight-api-contract.spec.ts` to this harness; SGS-003 and SGS-005 add boundary and
frequency cases. Out of scope here and listed as such. No duplicate work.

## Existing branch work

None; branch not created.
