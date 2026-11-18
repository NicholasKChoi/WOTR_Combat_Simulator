# SGS-207 spec gate (report 2)

**Verdict: READY**

Checked at origin/main:
- package.json pins `"next": "^16.4.3"`; the lock has `node_modules/next` and `@next/env` plus 8 `@next/swc-*` entries, all at 16.4.3. This matches Scope.
- No `use cache`, `unstable_cache`, `cacheComponents` or `cacheLife` appears outside the lockfile. The Context claim holds.
- `pages/` and `pages/api/` exist, so the pages-router and API-route pointer in Context is relevant. No `next.config` file exists.
- `next@16.4.6` is published, and its react and react-dom peers cover the repo's ^19.3.1.
- There is no `eslint-config-next` and no other `next` dependent in the lock, so no further `@next/*` entries need to move.
- Risk `low` is correct. No criticalPaths symbol is touched. The Invariants and On merge fields are fine, and no diagram trigger fires.

## Notes (non-blocking)
- Scope allows a test file change "if the new version forces one", but the criterion says "no test is edited". Reword the criterion to "no test is edited unless the upgrade forces it, and each such edit is named in the report".
- The `npm audit` criterion depends on advisory data at run time. It is fine as written because it names only the one GHSA.
- The Scope bound "so it cannot resolve below 16.4.6" is met by `^16.4.6`.
