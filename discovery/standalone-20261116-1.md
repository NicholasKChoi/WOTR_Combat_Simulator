# Discovery: standalone, 2026-11-16

Window: d4fd59a..87f0cd7 (origin/main). Prior marks: alerts=0 ci=43369981194 issue=0.

## Checked
- CI on main: 2 runs, both "AoE4 data freshness", both success (newest id 43936803352). Nothing failing.
- Issues: none open.
- Dependabot alerts: 403 (disabled for the repo), skipped. The `admin:repo_hook` hint was not followed.
- Outdated (`npm outdated`, scratch checkout at 87f0cd7): majors behind are @types/node 24.19.2 vs 26.6.6 (matches the Node 24 runtime, intentional) and jscpd 4.3.0 vs 5.4.3 (dev tool only). No item for either. Minor/patch behind: next 16.4.3 vs 16.4.6, @playwright/test, vitest, bootstrap.
- `npm audit --omit=dev`: one moderate advisory, GHSA-mfr8-8qww-v76h, next >=16.3.0 <=16.4.4, fix available. It concerns `use cache` called through `unstable_cache()`; grep of app/ and lib/ finds neither, so not exploitable here.
- New debt: no added TODO/FIXME/HACK/XXX lines since last SHA.
- Lint drift: `npx tsc --noEmit && npm run lint:dup` on origin/main exits 0, 0 clones. Scratch checkout removed.

## Items

1. Bump next 16.4.3 to 16.4.6 (clears a moderate advisory that does not apply to this code)
   - Pipeline: standalone chore, Priority low. Confidence: standard (judgment: advisory is not reachable, owner may prefer to batch the bump; AGENTS.md says to read the Next docs for breaking changes).
   - Evidence: `npm audit` output above; package.json next 16.4.3, latest 16.4.6.
   - Why: keeps the dependency audit clean.

## Watermarks
alerts=0 ci=43936803352 issue=0 sha=87f0cd7db397363420d50d6c7af663cac4c8e61f
