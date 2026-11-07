# M6 designer pass 2 (design questions from plans/M6-20261105.md)

Verdict: done. design/M6.md answers Q1-Q12 and Q15 in place. Q13, Q14 and Q16 are dropped, and no design text depended on them. Two new owner decisions are pending: OD-7 and OD-8.

## Resolutions

| Q | resolution |
|---|------------|
| 1 | A new framework-free `createAutoRunController` (in `components/apps/aoe4-build-order/auto-run.ts`) owns the debounce, the settled input, the conversion, `durationError` and the request. `useAutoRun({text, duration, selected, catalog, hold})` wraps it and returns `AutoRunState` plus `flush(live?)` and `retry()`. Issues, the request and Save all read `settled`. |
| 2 | A new `components/apps/aoe4-build-order/simulate-client.ts` holds `postSimulation(order, duration, signal?)`, `readRejection(response)` and `simulationFailureMessage(status \| null)`. `errorMessages` is deleted. The pin restore imports `postSimulation`. A 400 with an unreadable body counts as `failed`. |
| 3 | The pure controller is tested in Vitest with fake timers and a stubbed `post`. Whether to also add jsdom and RTL is OD-7. |
| 4 | `retry()` is exactly rule 5 and is a no-op unless the status is `failed`. `hold = !router.isReady \|\| savedLoadInFlight`. `release()` fires at once with no debounce, the same for first load and `?b=`. |
| 5 | `tab-results` is enabled iff `result !== null \|\| pin !== null`. A status alone never enables it. A `?b=` load selects Results on its first 200 run. |
| 6 | `auto-run-status` renders once, in the run bar. `IssueList`, `simulation-error` and `simulation-retry` stay in the build panel. |
| 7 | `viewDisabled = !split && shownTab === 'results'`, plus the existing live-conversion rule. |
| 8 | The whole 1200 px CSS block (`.resultsSplit`, the sticky and capped `.timelineColumn`, `.chartsColumn`) moves to 1800 px. Below 1800 px the timeline is stacked with no cap. |
| 9 | C5 stays fixed (pending OD-8). Specs send a distinct `x-forwarded-for` each. One API spec makes 31 POSTs to cover 429. The page's 429 message is tested with `page.route`. |
| 10 | The route logic moves to Next-free `saveBuildReply` and `savedBuildReply` in a new `lib/aoe4-build-order/builds-routes.ts`. They take `store: () => Promise<BuildStore>`, and tests pass `createMemoryBuildStore`. A store getter that rejects maps to 503. The page files are thin. |
| 11 | A new `lib/aoe4-build-order/api-route.ts` exports `isPlainObject`, `methodNotAllowed`, `notAnObjectError`, `sendReply`, `RouteReply`, `ReplyTarget` and `englishCatalog`. `simulate.ts` adopts it with byte-identical responses. `fight.ts` is untouched. |
| 12 | The smoke stays `.mjs` with no tsx. It reads `data/aoe4-build-order/builds/english-1tc.json` via fs, resolved against `import.meta.url`. |
| 15 | The store composes the keys. Methods take a bare id or client key. C1 gains `rateCounterKey(env, clientKey)`. `createMemoryBuildStore` defaults env to `'development'`. `createBlobBuildStore(storeId, env)`. |
| 13, 14, 16 | Dropped. No design text referred to them. |

## New owner decisions

- **OD-7. How to unit-test auto-run.**
  - (a) Recommended. No new dependencies: Vitest tables test the controller, and acceptance covers the hook.
  - (b) Add jsdom and @testing-library/react and test the hook with `renderHook`.
- **OD-8. The rate limit under Playwright.**
  - (a) Recommended. The limit stays fixed and each spec sends its own `x-forwarded-for`.
  - (b) An env-tunable limit (`BUILDS_SAVE_LIMIT`) set in `webServer.env`.

## Changed contracts

- **C1:** adds `rateCounterKey`. The keys rule now says only stores compose keys.
- **C2:**
  - Methods take a bare id or `clientKey`, and `bumpCounter(clientKey, windowStart)`.
  - The memory store's default env is `'development'`.
  - `createBlobBuildStore(storeId, env)`. The Blob adapter table adds a `deleteBuild` row.
  - A rejected `buildStoreFromEnv` result is not memoized.
  - Playwright sets the store directory through `webServer.env`.
- **C3:** the row order is made explicit, and a 503 row is added for a store getter that rejects.
- **C4:** reordered into evaluation order.
- **C5:** the `takeSaveSlot` parameter is renamed to `clientKey`, and a "Fixed numbers" note is added (pending OD-8).
- **C6:** rewritten as the `simulate-client.ts` contracts, the `auto-run.ts` controller contracts (`LiveInput`, `ShownInput`, `AutoRunState`, `AutoRunDeps`, `AutoRunController`, `createAutoRunController`, `durationError`, `requestKey`), and the new `useAutoRun` signature.
- **C7 (new):** the route seam (`api-route.ts`, `builds-routes.ts`).

## Changed behavior rules

- **Auto-run table.** It now belongs to the controller and has these rows:
  - create (held and not held)
  - input (held and not held)
  - flush (held and not held, with the explicit `live` passed on a select change)
  - release
  - rule 3 sets `shown`
  - an unreadable 400 becomes `failed`
  - retry is a no-op unless `failed`
  - dispose
  - no target (renders no `results-last-good`)
- **Page wiring.** A new table defines `hold`.
- **Status table.** `auto-run-status` is in the run bar. The build panel column was clarified.
- **"Tabs (narrow)".** Results is enabled iff a result or a pin exists. The `?b=` tab switch happens on the first 200 run.
- **Layout.** A new `viewDisabled` row. The 1800 px row now moves the whole CSS block.
- **`?b=`.**
  - A `savedLoadInFlight` and release rule.
  - A new unmount row.
  - "until the first settled change".
- **Save.** The click payload now uses `settled` and `conversion`.
- **Smoke.** Step 1 now uses the fixed JSON file.

## Starting state refresh (origin/main 1e6d6c2)

- **Commits since 9274372:** #104, 9328355, #106 and #107. None of them touch the M6 seams.
- **Run steps.** 15 specs, 78 lines, plus 4 lines in helpers.ts:
  - inline-issues 19, client-check 16
  - pin-compare 5, timeline-compare 5
  - m3-flow 4, m4-flow 4, step-band 4, step-table 4
  - gathered-resources 3, narrow-layout 3, results-split 3
  - knight-longbow-page 2, small-screen 2, chart-readability 2, gather-rates-per-villager 2
- **`results-stale` asserts:** 3 (m4-flow 1, pin-compare 2).
- **Tab steps at 1200 px or wider.** 12 specs, 60 lines. Each of these must use a narrow viewport or drop its tab step:
  - pin-compare 18, small-screen 11, m4-flow 9
  - inline-issues 4, step-table 4
  - results-split 3, step-band 3, gather-rates-per-villager 3
  - m3-flow 2
  - narrow-layout 1, gathered-resources 1, timeline-compare 1
- OpenAPI is still 2.3.0 and already documents the simulate 400 messages.

## Out of scope

- `pages/api/fight.ts` duplicates `isPlainObject`, but it is outside jscpd paths and outside M6. It is left unchanged.

## Manager actions

- Put OD-7 and OD-8 to the owner.
- Re-spec outlines B, C, D, E, F, G and H against the changed contracts above. C now also creates `api-route.ts` and `builds-routes.ts` and edits `simulate.ts`. D creates `auto-run.ts` and `simulate-client.ts`.
- Plan spec gap 3: the rewrite is 78 lines, not 74.
- The plan's environment-prerequisites row for jsdom applies only if OD-7 is (b).
