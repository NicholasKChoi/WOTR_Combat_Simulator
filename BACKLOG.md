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

- AoE4 acceptance coverage removed by SGS-098 (owner chose deletion over re-pin, Q14): pinned timelines and bank values (prebuilt English build, house lead time, spend/population, depletion-engine vs pre-depletion engine), veterancy-conversion counts, the contract 200-body example, edges result-shape, markers at a truncated horizon, triggers infinite-node timings, the house-warnings knight/longbow held warning, spear/longbow men-at-arms timing and 1200 s gold. Uncovered at acceptance level; unit pins are current. Source: reports/SGS-098-ticket-1.md.
- acceptance/aoe4-small-screen.spec.ts:42 "run bar at 360x760 ... scrolls the results heading into view" failed once in a full npm run acceptance (1/734), passed 5/5 alone and on a second full run; likely load flake. (SGS-095 implementer-2)
- design/M6.md:627 still says the smoke script sets the bypass header via browser extraHTTPHeaders; SGS-106 now requires context.route scoped to the deployment origin. Fix on the next M6 designer pass. (SGS-106 spec-gate 2)
- components/apps/aoe4-build-order/auto-run.ts:125: no test covers the update() check that skips onChange when nothing changed; deleting it leaves every test passing. Add a history-length assertion to the equal-input test (auto-run.test.ts:200-203). (SGS-100 review 1)
- SGS-102 (useAutoRun hook): when auto-run rule 2 fires, the in-flight request's shown.selected keeps the old value, so the pin name can lag briefly; per spec, but the hook should expect it. (SGS-100 review 1)
- lib/aoe4-build-order/saved-builds.ts:63-67 duplicates the issue-capping in pages/api/aoe4-build-order/simulate.ts:54-56; pull into one shared helper (SGS-103 rewrites simulate.ts and could do it). (SGS-099 review 1)
- `lib/aoe4-build-order/build-store.ts:24-27` and `blob-build-store.ts:53`: the counter step ("same window: count + 1, otherwise 1") is written twice. Export `nextCounter` from build-store.ts, import it in the Blob store, and amend the design C2 export list. (SGS-101 review 1)
- `lib/aoe4-build-order/build-store.test.ts:145`: the "never imports blob-build-store" assertion cannot fail on a static import (the mock factory runs at load; beforeEach resets the spy). Take `buildStoreFromEnv` from a fresh `import('./build-store')` after `vi.resetModules()`; also assert the message at :197 (`rejects.toThrow('blob import failed')`). (SGS-101 review 1)
- `lib/aoe4-build-order/blob-build-store.ts:18-19` and `ARCHITECTURE.md:24-25`: text fixes. The comment should say get returns null for a missing blob (BlobNotFoundError is also read as absent); ARCHITECTURE should say BUILDS_STORE_ID "is non-empty" / "is unset or empty". (SGS-101 review 1)
- `playwright.config.ts` webServer.env: if a developer's `.env.local` holds `BUILDS_STORE_ID`, acceptance runs would write to real Vercel Blob; set `BUILDS_STORE_ID: ''` and `VERCEL_ENV: ''` explicitly (the ticket says "omit", so this needs a spec change). (SGS-103 review 1)
- `lib/aoe4-build-order/api-route.ts` sendReply takes `body: unknown`, so the simulate handler's `NextApiResponse<...>` no longer type-checks response bodies. (SGS-103 review 1)
- SGS-103 tests: `recordingTarget` defined twice (api-route.test.ts, builds-routes.test.ts); GET 500 and getter-reject 503 tests do not assert `console.error`; the `JSON.stringify(error.mock.calls)` no-'client' check is weak (Errors stringify to `{}`); the live spec reads back with `toMatchObject` not `toEqual`. (SGS-103 review 1)
- `lib/aoe4-build-order/builds-routes.ts`: `savedBuildId` sits inside the try, so a crypto failure maps to 503 rather than 500. (SGS-103 review 1)
- `lib/aoe4-build-order/builds-routes.ts:51-54`: an unset `VERCEL_ENV` maps to development, so a production deploy missing it would allow unauthenticated DELETE and save under the `development/` prefix; consider failing closed when `VERCEL` is set but `VERCEL_ENV` is not. (SGS-103 tech-lead batch 8)
- `lib/aoe4-build-order/save-rate-limit.ts`: a refused save still writes the Blob counter, so a client over the limit keeps causing Blob operations; and Blob SDK retries (up to 10) multiply with the 3 compare-and-swap attempts during an outage. (SGS-101 tech-lead batch 8)
- `acceptance/aoe4-auto-run.spec.ts:203`: the invalid-duration case never asserts `duration-error` is visible; add `toBeVisible()` to catch a lost `is-invalid` class. (SGS-102 review 1)
- `use-auto-run.ts`: `firstPaintState` repeats the controller's request expression; export `settledFields` from the SGS-100 controller and reuse it. (SGS-102 review 1)
- `acceptance/aoe4-auto-run.spec.ts:309`: the open-rows test never asserts the two builds differ, so it could go vacuous. (SGS-102 review 1)
- `acceptance/aoe4-auto-run.spec.ts:189`: two chart ids listed by hand instead of `CHART_IDS`. (SGS-102 review 1)
- `docs/aoe4-build-order.md:878`: "until the next settled input" is loose; an edit that leaves the request unchanged keeps the 400 issues. Suggested text in reports/SGS-102-review-1.md. (SGS-102 review 1)
- Tooling: install a TypeScript LSP server for this repo (e.g. `typescript-language-server` via a Claude Code LSP plugin, using the repo's `tsconfig.json`) so agents get diagnostics, go-to-definition and find-references while working in task worktrees. (owner request, 2026-11-09)
- `pages/apps/aoe4-build-order.tsx:168`: `router.replace({pathname, query: {}})` drops every query key, not only `b`; keep other keys. (SGS-105 review 1)
- `pages/apps/aoe4-build-order.tsx:97`: `initialB.current` is written during render; move it to an initializer in the `isReady` effect. (SGS-105 review 1)
- `docs/aoe4-build-order.md:874`: say "choosing a build in the select settles the input at once". (SGS-105 review 1)
- `components/apps/aoe4-build-order/saved-build-loader` aborted-signal test is weak: its fetch stub rejects whether or not the signal is aborted. (SGS-105 review 1)
- `components/apps/aoe4-build-order/pin-name.ts:5/12` and `docs/aoe4-build-order.md:1018`: `Custom build` is documented for "no prebuilt builds", but the code checks page-state `builds`, which includes an opened `?b=` option; unreachable with today's data. (SGS-105 review 2)
- `docs/aoe4-build-order.md:862-863`: two "and"s in one list; suggested "a text/table toggle, the Save build button and the run status (`auto-run-status`)". (SGS-105 review 3)
- `components/apps/aoe4-build-order/workbench.module.css:42-44`: in the split layout the sideways scroll applies to the whole ~9100 px Build panel, so at 1280 the step table (693 px in a 534 px column) hides each row's right-hand controls and the horizontal scrollbar sits at the panel bottom; the same rule clips the textarea's right border and focus ring. Put the scroll on the step table's own wrapper, or narrow the table in split. (SGS-104 review 1)
- `acceptance/aoe4-auto-run.spec.ts:14`: `TABS_VIEWPORT` import sits between lower-case names, unlike the other edited specs. (SGS-104 review 1)
- `pages/apps/aoe4-build-order.tsx` (`?b=` load): `router.replace({ query: {} })` drops any other query params (none today), and the load effect lists only `[router.isReady]` as deps, which an exhaustive-deps lint would flag. No acceptance test pins the split-layout Tab order (select, duration, Text/Table, Save, link, Copy, Build, Results). Evidence: reports/batch10-tech-lead-1.md. From SGS-105.
- `design/M6.md` Smoke table "repeat" row says a second run gets 200; it gets 201 because the smoke deletes its build (200 only if still stored); also line 627 still names `extraHTTPHeaders` instead of `context.route`. Evidence: reports/SGS-106-review-1.md. From SGS-106.
- SGS-106 non-blocking review notes (reports/SGS-106-review-1.md): a cross-origin redirect would carry the bypass header (Node fetch and Playwright header override); the fallback `FAIL smoke:` line is untested and effectively unreachable; the spec helper reads a signal-killed run as exit 0; the "repeat run", "another directory" and usage spec rows inherit the shell's `VERCEL_AUTOMATION_BYPASS_SECRET`. From SGS-106.
- `lib/aoe4-build-order/simulate.ts:665` `houseGateOpen`: auto-houses stay off until the *last* explicit `build house` step starts (docs/aoe4-build-order.md "Houses and supply"), so a build that lists houses the way written guides do, with a late one behind a time trigger or a busy queue, sits at the supply limit and stops villager and army production for minutes; the only signal is the `auto-houses-held` warning. Evidence: aoeivbuilds.com build 259 (ENG 1TC Council Hall) with 4 explicit houses: "production was held at the supply limit for 12:24 from 1:00 while auto-houses waited for step 30 (build house) to start", 18 villagers and 8 longbows by 7:30; the same build with no house steps: 20 villagers, 10 longbows, no warnings. Options: let auto-houses build whenever supply blocks production (explicit steps then add houses on top), or gate on the next pending house step rather than the last, or make it a per-build setting. Owner request, 2026-11-09.
