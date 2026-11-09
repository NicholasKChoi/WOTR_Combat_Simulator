# SGS-106 ticket author, re-spec 3

File: `$PROJECT_DIR/tickets/SGS-106-smoke-preview-and-agent-howto.md` (aoe4-build-order, ~130 LOC, depends on SGS-103 and SGS-105, risk standard, unchanged).

Changes (tagged `(respec 2)`, change log "Re-spec 2026-11-09 (2)"):
- Closed file list replaced by the rule: nothing under `lib/`, `components/`, `pages/`, `data/`, not `docs/api/openapi.json`; besides script and spec only docs and `package.json`; package-lock clause kept.
- Bypass header: auth Scope now adds it only for requests to the deployment origin via `context.route('**/*', ...)`, never `extraHTTPHeaders`. New criterion with a second stub origin: the first stub sees the header on every request, the second sees none. The existing "secret set" criterion now says "deployment-origin stub".
- Step 2 compares the GET body's `buildOrder` (the zod-parsed stored value) to the sent build; local verification confirms `english-1tc.json` survives unchanged (new criterion). A differing field goes back to the manager instead of weakening the compare or importing `lib/`.
- Design check: M6.md C3 `SavedBuildWithId` (GET 200 closed, `SavedBuild & { id }`) and the Smoke table agree with the ticket's GET-body expectations.

Kept: On merge owner action, merge hold, "secret is never printed". Open questions: none. Diagram: unchanged (cross-component flowchart). No search/mutation commands were added.
