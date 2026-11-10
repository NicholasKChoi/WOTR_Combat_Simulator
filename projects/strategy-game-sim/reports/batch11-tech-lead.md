# batch11 tech-lead (SGS-106)

Decision: PASS - draft PR opened. Merge HOLD: do not merge until the owner's smoke passes on the preview (owner Q15 A).

PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/115 (#115), base main, head sgs-106-smoke-preview at 0aee0751a40e8e7ac9159cb9bb682770f75412d4. Draft. Pushed (remote ref confirmed; local upstream config could not be written in the sandbox, harmless).

Merge risk: high (security-relevant code: the script handles the Vercel bypass secret and scopes it to the deployment origin; revert fully undoes it).

## Reviewed
- Range: origin/main 66354ac...0aee075 (2 commits, both authored choinickolas@gmail.com). Merge base equals origin/main tip, so no rebase needed; single task, no stack.
- Files: scripts/smoke-preview.mjs (+186), acceptance/smoke-preview.spec.ts (+297), docs/aoe4-build-order.md (+58), package.json (+1), ARCHITECTURE.md (+1). +543/-0 total, +246 reviewable excluding the spec.
- INVARIANTS.md (no app path touched; S3 boundedness holds: 15 s fetch timeouts, 30 s page budget, one save per run), CONTEXT.md open questions (none), ticket, review-2, implementer-2, simplify, suite-1.
- Docs duration bound "60 to 3600" matches docs/api/openapi.json.

## Blockers
None.

## Untested hotspots
None. Each Review focus entry is pinned by a spec row whose assertions fail on the break:
- routeBypassToOrigin (scripts/smoke-preview.mjs:86-92): "secret set is sent and never printed" asserts every deployment-stub request carries the sentinel and no asset-stub request does; afterEach asserts no stdout/stderr contains the sentinel.
- main/cleanUp (154-184): "read back differs" and "open fails" assert a DELETE was sent; "save fails" and the 401/403 rows assert no DELETE.
- deleteStep (137-144): "delete refused in production" asserts the exact 405 line; "delete leaves the build" asserts FAIL delete after a 200 re-read.

## PR body sections (verbatim)

## Merge risk
**high** - security-relevant code: the script carries the Vercel protection bypass secret and decides which requests receive it; a revert fully undoes the merge and no app code, route or contract changes.

## Review focus
- [`scripts/smoke-preview.mjs:86-92`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/115/files#diff-27605c12a0ab9b8ea663d0d05fbcbfc156ffe7a1a4ba39afa7ec93c0d55d66d0R86-R92) - if the origin check is wrong, the bypass secret goes to a third-party host the page loads (a CDN script or font) - check that the comparison is against the parsed deployment origin and that non-matching requests continue unmodified - pinned by [`acceptance/smoke-preview.spec.ts`: secret set is sent and never printed](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/115/files#diff-bea264330cee207f6455a5d333b6d9c7f6d8e13e6c07afba81d1879cf2b6f4eeR156-R165)
- [`scripts/smoke-preview.mjs:154-184`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/115/files#diff-27605c12a0ab9b8ea663d0d05fbcbfc156ffe7a1a4ba39afa7ec93c0d55d66d0R154-R184) - a failed read back or open leaves the smoke's build stored on the preview, or a delete is sent without a saved id - check that the cleanup runs only after a valid id and only when the delete step has not run - pinned by [`acceptance/smoke-preview.spec.ts`: read back differs](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/115/files#diff-bea264330cee207f6455a5d333b6d9c7f6d8e13e6c07afba81d1879cf2b6f4eeR195-R203) and [open fails](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/115/files#diff-bea264330cee207f6455a5d333b6d9c7f6d8e13e6c07afba81d1879cf2b6f4eeR204-R213)
- [`scripts/smoke-preview.mjs:137-144`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/115/files#diff-27605c12a0ab9b8ea663d0d05fbcbfc156ffe7a1a4ba39afa7ec93c0d55d66d0R137-R144) - a delete that answers 204 but leaves the build readable would report a clean preview while records pile up - check the 404 re-read and the exact 405 line - pinned by [`acceptance/smoke-preview.spec.ts`: delete refused in production, delete leaves the build](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/115/files#diff-bea264330cee207f6455a5d333b6d9c7f6d8e13e6c07afba81d1879cf2b6f4eeR214-R230)

## Non-blocking notes
- Redirects can carry the bypass header off-origin. Node fetch (undici) keeps custom headers on a cross-origin redirect (it strips only authorization/cookie), and Playwright applies `route.continue({ headers })` to redirects the routed request starts. If the deployment origin ever redirected an API call or the page navigation to another host, the secret would follow it. Not reachable today: with a valid bypass header Vercel does not redirect to SSO, and the app routes do not redirect cross-origin. Hardening for BACKLOG: `redirect: 'manual'` on fetch (treat 3xx as a step failure) and not following cross-origin redirects in the browser route.
- Playwright and fetch error messages are reduced to their first line or `message`; neither includes request headers, so the secret does not reach output by that path (the afterEach sentinel check covers the tested failure paths).
- Each run against a shared preview deletes any identical build saved by someone else; documented in the docs and the PR body.

## For the manager
- Do NOT auto-merge #115. Owner must run `npm run smoke:preview -- <preview url>` with VERCEL_AUTOMATION_BYPASS_SECRET exported and report four PASS lines, exit 0. The hold sentence is the first line of the PR body.
- Record: SGS-106 status pr-open (draft), branch sgs-106-smoke-preview, tip 0aee0751a40e8e7ac9159cb9bb682770f75412d4, PR #115.
