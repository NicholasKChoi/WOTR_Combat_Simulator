# SGS-174 docs report 1

- Ticket: SGS-174. Branch: `sgs-174-aoe4-internals-overview`. Tip: `13fde21c5e8afeb19f9ca7398adac71022566d35` (one commit on origin/main `c6109a4`).
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-174-aoe4-internals-overview`

## Docs touched

- `lib/aoe4-build-order/README.md` (new, 159 lines): module map by role, data flow, event loop, where to change what.
- `docs/aoe4-build-order.md`: two added lines in the intro pointing at the README (`git diff --numstat`: 2 added, 0 removed).

## Doc claims (sentence -> source)

- parse-text: "the paste grammar, text to BuildOrder and back ... checks grammar only" -> `parse-text.ts` header comment, exports `parseBuildOrderText`, `formatBuildOrderText`.
- text-to-build: parses, then `checkBuildOrder`, returns order with line map or issues sorted by line -> `text-to-build.ts:textToBuildOrder`, `byLine`.
- schema: `checkBuildOrder`, `checkSimInputs`, `buildOrderCatalog`, `SIM_INPUT_BOUNDS`, `INPUT_DEFAULTS`, types `BuildOrder`/`BuildStep`/`BuildStart`/`Trigger` -> `schema.ts` exports.
- english-catalog: built once and reused -> `english-catalog.ts:englishCatalog` (`??=`).
- step-options: lists of actions, ids, triggers; schema builds its catalog on it -> `step-options.ts:StepOptions`, `schema.ts` `BuildOrderCatalog extends StepOptions`, `stepOptions(data)` at schema.ts:195.
- model/api/data/data-schema lines -> their exports (`api.ts` header says openapi.json is the contract; `data.ts:buildGameData`, `loadGameData` with cache; `data-schema.ts` three schemas).
- engine: `simulate.ts` handlers for produce, pause, rally, build, move -> `stepHandlers` (simulate.ts:513, with `research: researchHandler`).
- engine-common: `costOf`, `canAfford`, `canAffordHeld`, `payCost`, tolerance -> `engine-common.ts`.
- gather, construction, houses (`planAutoHouse`), depletion, effects (`modifiedValue`, `classifyTech`), research, civ-rules, landmarks, markers, production-buildings, format-time (`formatMinSec`) -> each file's exports and header.
- Routes group: `api-route.ts` (header "What every route shares", browser-safe), `builds-routes.ts` (`saveBuildReply`, `savedBuildReply`, helpers reused by `named-builds-routes.ts` imports), `named-builds-routes.ts` (`createNamedBuildReply`, `namedBuildReply`), `saved-builds.ts`, `named-builds.ts`, `build-store.ts` (`buildStoreFromEnv`, memory and file stores), `blob-build-store.ts`, `save-rate-limit.ts` (header: counter in the BuildStore), `builds.ts:listBuilds`.
- Test support: `test-helpers.ts`, `route-test-support.ts`, `blob-fake-test-helpers.ts`, and `production-floors.ts` (only importers are `*.test.ts` and `acceptance/*.spec.ts`, by grep).
- Data flow call sites: "page and its auto-run call `textToBuildOrder`" -> `pages/apps/aoe4-build-order.tsx:183`, `components/apps/aoe4-build-order/auto-run.ts:81`; "`saved-builds.ts` calls it to confirm a saved build reopens" -> `saved-builds.ts:roundTripIssues`; simulate handler takes `buildOrder`, rejects `text`, runs `checkBuildOrder`, `checkSimInputs`, then `simulateBuildOrder`, or replies with issues -> `pages/api/aoe4-build-order/simulate.ts`.
- Event loop order: collect run-outs, house pass, `offerSteps`, `applyDueEvents`, house pass, `offerSteps`, `startProduction`, house pass -> `simulate.ts:runInstant` (706-717). `nextWake` candidates (next sample, run-out, next event, armed step trigger wake, affordability) -> `simulate.ts:nextWake`. Income credit, `accrueWait`, clock move -> `simulateBuildOrder` loop. `offerSteps` offers reactions then the cursor step -> `offerSteps`/`offerReactions`. Result assembly -> end of `simulateBuildOrder`.
- Where to change what: step action -> `stepUnion` in schema.ts and `stepHandlers`; civ rule -> `CivRules` in civ-rules.ts; route change updates `docs/api/openapi.json` (REPO.md convention).

## Removed claims

None.

## CONTEXT.md Design docs rows

None to change (README is not a design doc; code overview is described as pointer only).

## Checks

- Lint: `commands.lint` (tsc, jscpd) not run; no code or TS file changed (`git diff --name-only`: the two markdown files). Codegen: none configured.
- Link check (ad hoc script, run in the checkout, 20 relative links in README and the model doc, anchors derived from headings): all resolve, bad 0. No link uses a line number. All backticked `.ts`/`.md` names in the README exist.
- File coverage: every non-test `.ts` in `git ls-files lib/aoe4-build-order` is named in the README (loop printed no "unlisted").
- Digits: README has digits only in file names, paths and link targets (grep checked); lists are bullets, not numbered; prose says "build order simulator", not "AoE4".

## Out-of-scope findings

- `docs/aoe4-build-order.md` anchors `#model-rules` etc. work, but the doc has only `##` headings (rules are bold run-in heads), so the README cannot link to subsections such as Ages and landmarks.

## Status

needs_review
