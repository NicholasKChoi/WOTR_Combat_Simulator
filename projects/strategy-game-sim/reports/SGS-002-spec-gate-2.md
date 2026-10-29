# SGS-002 spec-readiness gate, pass 2

Base: origin/main d54af2e (confirmed). Ticket: tickets/SGS-002-playwright-acceptance-harness.md (respec 1).

## Verdict: READY

All three prior gaps and the four prior notes are closed. No new blocking gaps.

## Prior gaps

1. Landing spec / old AC 6 - CLOSED. Scope 4 now asserts `href` equals the route, `request.get(href)` is 200,
   then click, URL, and exact `<h1>`. AC 7 allows loading the StarCraft page via the link and reading its h1 and
   forbids interacting with its controls. Verified: Layout renders a single h1 on non-home pages (header uses an
   h2), so the h1 locator is unambiguous; each link name is unique on `/`.
2. API body values - CLOSED. Default armies are fixed (3 regs, 1 elite, 1 leader per side), strings, passed as a
   `data:` object. `parseInt` accepts them; values sit inside the form options (regs/elts <= 9, leaders <= 5) and
   the project caps. Both sides are non-zero, so `rounds` is a number > 0.
3. Hydration race and heading match - CLOSED. `networkidle` after goto (with a no-sleep fallback named in the PR),
   `waitForResponse` before the click with a 200 assertion, `exact: true` headings ("Army Results", "Fighting
   Stats"). The `<h2>Results</h2>` collision is addressed.

Prior notes: port pinned to 3100 and `reuseExistingServer: false` (AC 1, AC 2); lockfileVersion 2 kept; helper
module now mandatory (AC 8); directory open question removed (ARCHITECTURE.md lines 31 and 48 name `acceptance/`).

## Checks

1. Grounded scope: pass. Re-read pages/index.js, combat-simulator.js, army.js (selects by `name`, no ids, 0-9 and
   0-5), results.js (two h4s), fight.ts (`parseInt` of six keys, 200 on success), package.json (only `dev`),
   tsconfig (`**/*.ts` included), .gitignore, lockfile v2. New files are declared new. As a feasibility check I
   ran `next dev -p 3199` (Node v22.17, Next 12.1.6) from a scratch export of origin/main: `/` and
   `/apps/combat-simulator` returned 200. No ERR_OSSL issue.
2. Testable criteria: pass. Every AC names an observable outcome. AC 2 is observable (Playwright errors when the
   port is already in use with `reuseExistingServer: false`).
3. Open questions: none; CONTEXT.md open questions concern AoE4 only.
4. Invariants: S2 named in scope; S1, S3, W*, H* untouched (no production change). AC 13 says no regressions.
   No contradiction.
5. Contracts: field names and the `survivor`/`rounds` subset match CONTEXT.md Key surfaces. npm script names are
   not a CONTEXT surface.
6. Dependencies and size: none; ~140 lines, no business logic.
7. Diagrams: present, edges match the scope.
8. Lessons: repo and project LESSONS.md are empty.
9. Risk: `standard` is correct. No strongModelTriggers hit, `criticalPaths` is empty.

## Notes (non-blocking)

- `networkidle` may never settle under `next dev`, because the HMR connection stays open. The ticket allows a
  fallback signal and requires naming it in the PR, which is enough. A deterministic option is to wait for the
  page's Next hydration marker (for example `window.next` being defined) or to poll a React-attached handler.
- Playwright's default per-test timeout is 30 s. The first request to each route compiles it under `next dev`,
  so the landing spec's `request.get(href)` could hit it on a cold cache. Consider setting `timeout` in the
  config alongside `webServer.timeout`.
- Pin or caret a `@playwright/test` version in package.json and let the lockfile record it. No version is stated.
- Running `npm run dev` and the harness at the same time shares `.next`. Port 3100 avoids the port clash but not
  the cache clash. Mention in the config comment only if it bites.
- Landing step 3 ("go back to `/` if needed") is vague but harmless; a fresh `goto('/')` per link is simplest.
