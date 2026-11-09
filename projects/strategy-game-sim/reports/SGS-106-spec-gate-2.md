# SGS-106 spec gate 2

**Verdict: READY**

All three gaps and notes from gate 1 are closed, and I found no new blocking gap. Read against SGS-103's current ticket (GET 200 body `{ ...parsed, id }` / `SavedBuildWithId`, DELETE 204 or 405 in production, 201/200 `{ id, path }`) and SGS-105's current ticket (`?b=<id>`, option `<name> (<id>)`, `auto-run-status`).

## Gate 1 items, re-checked

1. Closed file list: replaced by a rule (no `lib/`, `components/`, `pages/`, `data/`, `docs/api/openapi.json`; only docs and `package.json` besides the script and spec; lockfile clause kept). Closed.
2. Bypass header scope: Scope item 1 "auth" adds the header in the browser only through `context.route('**/*', ...)` when the request origin equals the parsed deployment origin, and forbids context-wide `extraHTTPHeaders`. A new spec criterion ("secret set is sent only to the deployment origin") uses a second stub on another port that must record no header. Closed.
3. Step 2 compare: states the compared value (the GET body's `buildOrder`, the zod-parsed stored record, against the parsed file as sent), imports no schema, and the local run must show `read back` passing with `english-1tc.json`. If a field differs, the ticket goes back instead of weakening the compare. Closed. The schema keeps `name` and `source` (`schema.ts` ORDER_KEYS and `source: text().optional()`), so equality is plausible.

## Other checks

- Grounded: `data/aoe4-build-order/builds/english-1tc.json` exists on main; `scripts/` does not exist and is declared new; `acceptance`, `acceptance:setup` and `@playwright/test` are in `package.json`; `build-order-select` and `chart-units-produced` test ids exist on main; `auto-run-status` comes from the SGS-100/102/105 chain; "Where files go" exists in `ARCHITECTURE.md`.
- Contracts match design C3/C4 and SGS-103 (statuses, id pattern, 204 on an absent build, 405 in production). Smoke table steps, line formats and exit codes match the design.
- Criteria are observable; no stale counts or closed lists remain. The rule for existing tests does not apply (no default changes).
- Open questions: none; the owner smoke run is in `On merge` with the hold in Context. Invariants S3 and A3 exist and are consistent. Depends-on is stated; about 130 LOC; diagram present; Risk `standard` fits (no criticalPaths symbol, no strongModelTrigger). Docs and the ARCHITECTURE row are in Scope with a grep instruction. Input validation: one CLI argument and one env var, below the threshold. No LESSONS entry applies.

## Notes (non-blocking)

- `design/M6.md` line 627 (Smoke, auth row) still says "browser `extraHTTPHeaders`", while the ticket now forbids that and requires `context.route`. Scope says to read the design Smoke section first, so an implementer could see a conflict. The ticket is explicit and its rule wins, but the manager should update the design row to "browser requests to the deployment origin only (`context.route`)".
- "all steps pass" pins the stub request log as exactly five entries. Headless Chromium may also request `/favicon.ico` from the stub. Have the spec ignore favicon requests (or filter the log to the API paths plus the page path) so the order check does not flake.
- The usage and `set VERCEL_AUTOMATION_BYPASS_SECRET` messages do not say stdout or stderr. The 401/403 criterion accepts either; the usage criterion should say the spec checks stdout and stderr combined (or name the stream).
- "`package-lock.json` changes if and only if npm rewrites it" is not checkable. Prefer "`package-lock.json` is unchanged, since no dependency is added".
- The step 2 and 3 timeouts are bounded (15 s per fetch, 30 s for open); S3 holds.
