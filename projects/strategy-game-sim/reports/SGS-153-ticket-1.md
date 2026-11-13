# SGS-153 ticket report 1

Ticket: projects/strategy-game-sim/tickets/SGS-153-smoke-script-hardening.md
Title: SGS-153: Harden the preview smoke script and its spec
Type Chore, Priority medium, Milestone none, Risk low, Component aoe4-build-order, Depends on none, On merge none. LOC about 40.

Summary: Covers SGS-106 review notes 1, 2, 4 and 5. Script: a 3xx fails its step (no redirect following), the browser route never forwards the bypass header to another origin (including redirect targets), and the unreachable `FAIL smoke:` fallback is removed. Spec: signal-killed child is not exit 0, `run` defaults to the sentinel secret so no row inherits the shell's, and redirect rows are added. Docs: the smoke subsection of docs/aoe4-build-order.md gets a redirect statement. Lint passed. Read at origin/main; no search found a `FAIL smoke` mention in the doc.

Diagrams: none (single component).

Open questions: none. Unverified assumption listed: how the installed Playwright applies a `route.continue` header override to redirects (the ticket makes the implementer establish it, with a fallback of failing the open step on a cross-origin redirect).

Overlap: none with open tickets checked. Notes 3 and 6 and the design/M6.md repeat-row fix are out of scope.
