# Backlog

Follow-ups noticed during work that are not yet tickets. `/code-factory:new-project` and milestone planning
pull from here; triage moves an item into a milestone or deletes it.

- **AoE4 data freshness check (CI).** Add a scheduled CI job that compares the pinned aoe4world snapshot
  under `data/aoe4-build-order/` (its recorded aoe4world/data commit) with the latest upstream and fails or
  opens an issue when it is out of date. Note: the repo has no GitHub Actions yet (REPO.md CI behavior), so
  this would be the first workflow. Depends on M2's data snapshot existing. (owner, 2026-10-29)
- **AoE4 base gather rates are provisional.** Replace the unverified values copied from
  SichYuriy/aoe4-production-calculator with measured or citable ones, labeled with a patch. (owner, 2026-10-29)
- **AoE4 English economy and Blacksmith tech gaps (owner review of rules/english.json, 2026-10-31).** Owner flagged
  wood and food gather upgrades, Wheelbarrow and the basic Blacksmith upgrades
  (https://ageofempires.fandom.com/wiki/Blacksmith_(Age_of_Empires_IV)) as missing; owner accepts them as follow-ups.
  Checked against `data/aoe4-build-order/aoe4world/english.json` on main 68e004a: wheelbarrow, crosscut-saw,
  lumber-preservation, horticulture, fertilization, survival-techniques, professional-scouts and all twelve Blacksmith
  techs plus siege-works are in the snapshot; `rules/english.json` holds only the hand-entered overlay. Real gaps:
  `double-broadax-2` is in the snapshot too (age 2, 50 food 100 gold, 45 s, wood gather x1.15; matches the owner's cost). (2) `forestry` effect is `unknown`, so
  the engine rejects it; (3) crosscut-saw's +5 wood carry is not modeled (SGS-014 known data gap); (4) Blacksmith
  techs are combat-only, so by the v1 coverage decision they cost resources and queue time but their effects are
  ignored. Decide whether a follow-up adds overlay rows for (2)-(3).
- **AoE4 workbench: auto-simulate on edit, results beside the editor (owner, 2026-11-05).** Replace the Run button flow in
  `pages/apps/aoe4-build-order.tsx` with an auto-run: each edit to the text (or the step table, or the duration) restarts
  a debounce timer (start near 500 ms), and when it fires the page POSTs to `/api/aoe4-build-order/simulate`. Frontend
  validation gates the POST: only send when `textToBuildOrder(text, catalog)` is ok and the duration is valid
  (the page already computes `converted` client-side); an invalid build shows its client issues inline and sends nothing.
  Also skip the POST when the text and duration equal the last run, cancel the in-flight request (AbortController) when a
  newer one starts, and ignore an older response that lands after a newer one. Layout: the Build/Results tabs become a
  side-by-side split (editor left, charts right) at desktop widths; under a breakpoint keep the stacked/tabbed layout so the
  page still fits 390 px (#81). Revisit what auto-run makes obsolete or annoying: the `stale` indicator, the
  `resultsShownCount` scroll-into-view and the `rejection` scroll (both would jump the page while typing), the run bar,
  and whether the last good chart stays visible (dimmed) while the current text is invalid. Measured cost on main ee7ecb9
  (local, node): client validation about 1 ms, server simulate 10-18 ms for the three shipped builds, response 39-49 KB;
  a round trip is network-bound, so the debounce, not the server, sets the felt latency. Acceptance specs that click Run
  need rewriting.
- **AoE4 workbench: save a build on the server and open it by link (owner, 2026-11-05).** Goal: an agent (or a
  person) saves a build and hands over a link, so the owner sees the charts in the browser instead of screenshots or
  a file on disk. Saved builds are immutable: `POST /api/aoe4-build-order/builds` validates with the shared zod build
  schema, stores it under a short id and returns the id; `GET .../builds/<id>` returns it; the page loads
  `/apps/aoe4-build-order?b=<id>`. No accounts. Needs a size cap, basic rate limiting, OpenAPI entries.
  Storage: Vercel Blob store `aoe4-simulator-builds` (private, iad1), already created and connected to Production and
  Preview only (not Development) with env prefix `BUILDS_`, so the id is `BUILDS_STORE_ID` (the code passes it, not the
  SDK default `BLOB_STORE_ID`); `BUILDS_WEBHOOK_PUBLIC_KEY` is unused. Behind a two-method storage interface: a local
  stand-in (memory or a gitignored dir) is the default for `next dev`, unit and Playwright; the Blob adapter is used
  only when `BUILDS_STORE_ID` is set. Keys are prefixed by `VERCEL_ENV` (preview/ vs production/) since both share the
  store. Validation of the real store is on the PR's preview deploy, not locally: `npm run smoke:preview -- <url>`
  saves, reads back, opens `?b=<id>`, deletes (through `vercel curl` or a protection-bypass token). Dependency:
  `@vercel/blob` ^2.8.2 pulls `@vercel/oidc` -> `@vercel/cli-config` -> zod 4.1.11 (npm audit: 4 high, one zod
  memory advisory <4.6.6); add a package.json `overrides` pinning that zod to ^4.6.6, never `npm audit fix --force`
  (downgrades blob to 2.4.0). Supersedes a "build link in the URL" and a dev-only "live scratch file" idea.

- `acceptance/aoe4-simulate-api-contract.spec.ts:284` ("the buildOrder request example returns the documented 200 body") fails on origin/main 9274372: engine output differs from the documented example at later `food` samples (~index 47). Reported by the SGS-097 implementer; the reviewer or suite should confirm. Source: SGS-097.

- **M6 follow-up (deferred from SGS-096, owner Q13 A, 2026-11-06):** add a Playwright spec that resizes the window while the Results tab is hidden (charts may render at width 0), run at the narrow widths where the stacked tabs remain (M6.2). Source: SGS-096.

- The documented 200 `buildOrder` example in `docs/api/openapi.json` no longer matches the real response since the villager-target change (villager producers keep making villagers until 100 exist): `aoe4-simulate-api-contract.spec.ts:284` fails on origin/main. Regenerate the example. Confirmed by the SGS-097 reviewer. Source: SGS-097.
