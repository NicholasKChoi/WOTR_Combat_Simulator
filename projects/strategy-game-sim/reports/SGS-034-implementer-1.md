# SGS-034 implementer report (pass 1)

- Ticket: SGS-034-aoe4-build-order-page
- Branch: sgs-034-aoe4-build-order-page (base origin/main 25a4e18)
- Tip SHA: 1bfff2a1e1b5a5beb6f88cb24551b304f7f9901f (one commit, author choinickolas@gmail.com)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-034-aoe4-build-order-page
- Status: **needs_review**

## Files touched

- `pages/apps/aoe4-build-order.tsx` (new): page; Layout + Head + h1 "AoE4 Build Order Simulator"; `getStaticProps` turns `listBuilds()` into `{name, text: formatBuildOrderText(build)}`; default duration 1200; POSTs a typed `SimulateRequest` with `Number(duration)`; 400 with issues lists every message in `simulation-error`; other non-OK shows "The simulation could not be run (HTTP <status>)."; network failure shows a retry message; any failure clears the previous result.
- `components/apps/aoe4-build-order/build-input.tsx` (new): form (`noValidate`), `build-order-select`, `duration-seconds` (raw string, step 1, no min/max), `build-order-text`, `run-simulation` (disabled while running).
- `components/apps/aoe4-build-order/results.tsx` (new): three `SeriesChart`s (`chart-units-produced`, `chart-gather-rates`, `chart-floating-resources`) and `simulation-notes` only when notes exist.
- `components/apps/aoe4-build-order/result-series.ts` (new): `unitSeries` (key unitId, name "<name> (tier N)", values counts) and `resourceSeries` (fixed order food, wood, gold, stone; capitalized names).
- `lib/aoe4-build-order/builds.ts` (new): `listBuilds()` returns a fresh array of the static-imported prebuilt builds.
- `data/aoe4-build-order/builds/english-1tc.json` (new): English 1TC build transcribed from https://aoe4guides.com/builds/reinDv5vkVX6KUny571E (25 steps).
- `data/aoe4-build-order/README.md`: `builds/` row (user-authored, not game data, not patch-labeled) and a "Prebuilt builds" section with the omission and transcription choices.
- `docs/aoe4-build-order.md`: "### Page" subsection (route, controls, select behavior, unchecked duration, chart table and series keys, legend toggle, notes, errors, where prebuilt builds live).
- `pages/index.js`: landing link to `/apps/aoe4-build-order`.
- `lib/aoe4-build-order/builds.test.ts` (new, 7 tests).
- `components/apps/aoe4-build-order/result-series.test.ts` (new, 7 tests).
- `acceptance/aoe4-build-order.spec.ts` (new, 12 Playwright tests the ticket names).
- `acceptance/landing.spec.ts`: adds the new landing link to the table.

## Tests

- `npm test`: 27 files, 695/695 pass.
- `npm run acceptance`: 340/340 pass (includes the 12 new page specs and 2 new landing specs).
- Invariants encoded by unit tests:
  - builds.test.ts: every JSON file under `data/aoe4-build-order/builds/` is listed (count match); the owner's source build is present; `listBuilds` returns a fresh array; each build is English, has a source and a `start.rally`; each round-trips through `formatBuildOrderText`/`parseBuildOrderText` (start + steps); each validates with zero issues; each simulates 3600 s with no step left waiting/not-reached and one step status per step.
  - result-series.test.ts: unit series key/tier name/order; values aligned with times through `toChartRows`; empty input; no mutation of the result; resource order fixed regardless of input key order; resource values passed through; inputs not mutated.

## Mutation checks (each failed, then restored with `git checkout -- .`, confirmed clean)

builds.test.ts:
- `walkSeconds` 4.5 in the build: round-trip test failed.
- unit `nonexistent-unit`: validate and simulate tests failed.
- appended a never-satisfiable `move 150 wood -> gold` step: simulate test failed. (An earlier attempt with an extra research step survived because it completes; replaced with this one.)
- removed `start.rally`: 4 tests failed.
- civ `french`: 3 tests failed.
- extra unlisted JSON file in `builds/`: count test failed.
- `return BUILDS` without copy: fresh-array test failed.
- source URL changed: owner-build test failed.

result-series.test.ts:
- key `baseId` instead of `unitId`: 2 failed.
- dropped "(tier N)" from name: 1 failed.
- resource order food, gold, wood, stone: 2 failed.
- unit values shifted `[0, ...counts]`: 1 failed.
- resource values `.slice(1)`: 1 failed.
- `unitsProduced.reverse()` in place: 2 failed.
- resource arrays `.reverse()` in place: 2 failed.
- lowercase resource names: 1 failed.

## Stages

- codegen: none configured.
- build `npm ci && npx next build`: succeeds; `/apps/aoe4-build-order` is SSG. `.next/static` contains no snapshot strings (patchSource, walkSecondsCamp, formatBuildOrderText, the source URL): the snapshot stays server-side.
- lint `npx tsc --noEmit`: clean.
- `git diff --stat origin/main`: only the 13 files above; no lockfile, formatting or cache noise. No processes left running (Playwright's webServer exited; no listeners on :3000).
- Runtime: Node v24.22.2 matches engines 24.x.

## Deviations and decisions to review

1. Notes render `<code>{tech}</code>: {message}`. The engine's note messages use display names ("Fitted Leatherwork: ..."), but the ticket's Playwright case expects the id `fitted-leatherwork` in the notes element, so the tech id is shown too.
2. The form uses `noValidate` so the browser's number-input validation does not block submitting 59 or an empty field; the route's 400 is the only duration check (empty sends 0).
3. `<Layout home={false}>`: needed for `tsc` because `layout.js` destructures `home`.
4. Build transcription: the guide's 0:40 "termina house" (a second villager helping finish the house) is omitted; no action adds a builder to an in-progress building. Its "después a mining camp gold" is kept as `build mining-camp from gold then gold`. Military production steps are continuous `produce` steps, so they show as in progress at 3600 s; everything else completes. Feudal is reached at about 262.6 s. Notes are emitted for steeled-arrow and iron-undermesh (ignored effects). No step was removed for failing to complete. The aoe4world id is `double-broadax`.
5. I wrote the Playwright specs the ticket names (following SGS-033's precedent). If the acceptance gate owns them, they can be replaced.

## Invariant check

- No cross-app imports: the page imports only `lib/aoe4-build-order`, its own components, and shared `components/layout`. Upheld.
- New app is linked from the landing page and uses the shared Layout. Upheld.
- Only `durationSeconds` (plus the text) reaches the route, and bounds are enforced server-side; the client sends it unchecked. Upheld.
- Simulation determinism (no randomness or clock): page adds none; the build test simulates deterministically. Upheld.
- Snapshot stays server-side: verified by grepping the static bundle. Upheld.

## On merge (manager)

- CONTEXT Routes: add `/apps/aoe4-build-order`.
- CONTEXT component model: point at the real paths above.
- INVARIANTS: drop "(proposed)" from the page-related invariant if this lands it.
- PR description: include the transcription omission list (item 4) and the mutation record above.

## Out-of-scope findings

- `lib/aoe4-build-order/research.ts` (around lines 86 and 94) builds note messages from display names rather than ids. The page works around this by showing the id; a consistent choice in the engine would let the UI drop it.
- No build step was found that the engine cannot complete.
