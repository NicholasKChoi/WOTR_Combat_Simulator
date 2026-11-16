# Build order simulator internals

A map of the code in this directory: which module does what, how a build order flows from pasted text to a
result, and how the event loop advances. It states no rules. The design docs are the only authority on
behavior; each section below links to the one that holds its rules.

- [Model doc](../../docs/aoe4-build-order.md): the model, data sources, depletion, technologies, CivRules
  seams and extension points.
- [Format doc](../../docs/aoe4-build-order-format.md): the build order input, the routes and the outputs.

The HTTP handlers are the files under `pages/api/aoe4-build-order/`: `simulate.ts`, `builds/` and
`named-builds/`. They are thin; the logic they call lives here. The game data files are under
`data/aoe4-build-order/` and are described in that directory's own `README.md`.

## Module map

Test files (`*.test.ts`, `*.acceptance.test.ts`) sit beside the module they cover and are not listed.

### Text and checking

Rules: [Build order input](../../docs/aoe4-build-order-format.md#build-order-input).

- `parse-text.ts`: the paste grammar, text to `BuildOrder` and back (`parseBuildOrderText`,
  `formatBuildOrderText`). It checks grammar only; ids, bounds and cross-field rules are left to `schema.ts`.
- `text-to-build.ts`: `textToBuildOrder`, the paste-to-build conversion. It parses with `parse-text.ts`, then
  checks the result with `checkBuildOrder`, and returns the order with its line map or the issues sorted by line.
- `schema.ts`: the zod checks. `checkBuildOrder` and `checkSimInputs` validate a build order and the
  simulation inputs against a catalog; `buildOrderCatalog` derives that catalog from the game data. It also
  owns `SIM_INPUT_BOUNDS`, `INPUT_DEFAULTS` and the `BuildOrder`, `BuildStep`, `BuildStart` and `Trigger` types.
- `english-catalog.ts`: `englishCatalog`, the English catalog built once and reused by the route handlers.
- `step-options.ts`: `stepOptions`, the lists of actions, ids and triggers a step may use, which `schema.ts`
  builds its catalog on.

### Types and data

Rules: [Data sources](../../docs/aoe4-build-order.md#data-sources).

- `model.ts`: the shared types and constants: node and resource ids, `SimInputs`, `SimulationResult` and the
  series, step timing, warning, issue and marker types.
- `api.ts`: the request and response types of the simulate route and the saved-builds routes. The OpenAPI
  document is the contract; this file mirrors it.
- `data.ts`: the `GameData`, snapshot and rules types, `buildGameData`, and `loadGameData`, which reads the
  data files and caches the result.
- `data-schema.ts`: zod schemas for the three data file shapes (snapshot, base rules, civ rules).

### The engine

Rules: [Model rules](../../docs/aoe4-build-order.md#model-rules).

- `simulate.ts`: `simulateBuildOrder`, the event loop, the engine state, the step handlers for `produce`,
  `pause`, `rally`, `build` and `move`, production queues and result assembly. See [The event loop](#the-event-loop).
- `engine-common.ts`: cost and payment helpers (`costOf`, `canAfford`, `canAffordHeld`, `payCost`), the
  resource tolerance and small bookkeeping shared by handlers.
- `gather.ts`: `effectiveGatherRate`, the per-villager rate for a node.
- `construction.ts`: `constructionSeconds`, build time for a number of builders.
- `houses.ts`: `planAutoHouse`, the automatic house planning.
- `depletion.ts`: the finite node stock, draw-down, run-out times, idle arrivals and the depletion results and
  warnings. Rules: [Depletion](../../docs/aoe4-build-order.md#depletion).
- `effects.ts`: the overlay effect interpreter (`modifiedValue`) and `classifyTech`, which sorts a technology
  into supported and ignored effects. Rules: [Technologies](../../docs/aoe4-build-order.md#technologies).
- `research.ts`: the `research` step handler, unit upgrade conversion and the research notes.
- `civ-rules.ts`: the `CivRules` hook interface and `civRules`, the per-civilization lookup. Rules:
  [CivRules seams](../../docs/aoe4-build-order.md#civrules-seams).
- `landmarks.ts`: the class-name rule that identifies a landmark.
- `markers.ts`: chart marker kinds and ordering for age-ups and research.
- `production-buildings.ts`: which buildings produce units, and their per-sample count series.
- `format-time.ts`: `formatMinSec`, the time text used in messages and the text format.

### Saved builds and routes

Rules: [Route](../../docs/aoe4-build-order-format.md#route), with
[Builds routes](../../docs/aoe4-build-order-format.md#builds-routes) and
[Named builds routes](../../docs/aoe4-build-order-format.md#named-builds-routes).

- `api-route.ts`: what every route shares: the reply shape, `sendReply`, the method-not-allowed and issue
  errors. Browser-safe.
- `builds-routes.ts`: the save and read replies for saved builds, plus the error helpers the named-builds
  replies reuse.
- `named-builds-routes.ts`: the create, read, update and delete replies for named builds.
- `saved-builds.ts`: the saved-build record, its content-addressed id, storage keys and the checks a save
  request must pass.
- `named-builds.ts`: named-build ids, edit secrets, stored and public shapes, storage keys and header parsers.
- `build-store.ts`: the `BuildStore` interface, the memory and file stores and `buildStoreFromEnv`, which picks
  the store for the environment.
- `blob-build-store.ts`: the Vercel Blob `BuildStore`.
- `save-rate-limit.ts`: the per-client save limit, kept in the `BuildStore` as serverless instances share no
  memory.
- `builds.ts`: `listBuilds`, the prebuilt build orders from `data/aoe4-build-order/builds/`.

### Test support

`test-helpers.ts`, `route-test-support.ts`, `blob-fake-test-helpers.ts` and `production-floors.ts` are used only
by tests and acceptance specs: engine run helpers, route reply fakes, the in-memory Blob fake, and the
production floor checks for the prebuilt orders.

## Data flow

Rules: [Build order input](../../docs/aoe4-build-order-format.md#build-order-input) and
[Outputs](../../docs/aoe4-build-order-format.md#outputs).

- Parse: pasted text goes through `parseBuildOrderText` in `parse-text.ts`, which checks grammar only and yields a
   `BuildOrder` (with a line map).
- Check: `checkBuildOrder` in `schema.ts` checks the `BuildOrder` against the catalog from `buildOrderCatalog`.
   `checkSimInputs` does the same for the simulation inputs.
- Simulate: `simulateBuildOrder` runs the checked order over the game data and inputs.
- Result: a `SimulationResult`: the series sampled over time, the step timings, depletions, warnings and
   markers.

Call sites:

- `textToBuildOrder` runs the parse and check stages for a paste. The page and its auto-run call it in the browser;
  `saved-builds.ts` calls it to confirm a saved build reopens.
- The simulate handler in `pages/api/aoe4-build-order/simulate.ts` takes an already parsed `buildOrder` in the
  request body and never parses text; a body with a `text` field is rejected. It runs the check stage
  (`checkBuildOrder` on the body's `buildOrder`, `checkSimInputs` on its `inputs`) against `englishCatalog`,
  then the simulate stage, and replies with the result, or with the issues from either check.

## The event loop

`simulateBuildOrder` builds the engine, then repeats until the last sample time is reached.

- `runInstant` settles everything that happens at the current time, in this order: collect run-outs, a house
   pass, `offerSteps`, `applyDueEvents`, a second house pass, a second `offerSteps` (events change population,
   supply and builders, so a step refused before them is offered again), `startProduction`, and a final
   house pass.
- The series are sampled for every sample time up to the current time (`sampleTimes` lays them out).
- `nextWake` picks the next time anything can change: the next sample, the next run-out, the next scheduled
   event, the wake time of the armed step's trigger, and the time each waiting need becomes affordable.
- Income is credited up to that time, wait time is accrued to the steps still waiting, and the clock moves.

Where the pieces plug in:

- `offerSteps` offers reaction steps, then the step at the cursor. Each step goes to its handler in
  `stepHandlers` (`produce`, `pause`, `rally`, `research`, `build`, `move`); `research` is
  `researchHandler` from `research.ts`.
- Payment checks come from `engine-common.ts` (`canAfford`, `canAffordHeld`, `payCost`) and are used by the
  handlers and by production. A need that cannot be met feeds `nextWake`, so the wait is reported rather than
  the spend happening early.
- Depletion: `collectRunOuts` and `recordRunOuts` in the loop use `depletion.ts`, and `nextWake` asks it for
  the next run-out.
- Effects and rates: `gather.ts` and the production time calculation read `modifiedValue` from `effects.ts`;
  `civ-rules.ts` hooks are called through the engine's rules.
- Houses: `runHousePass` calls `planAutoHouse` in `houses.ts`.
- Result assembly, after the loop ends: each step gets its final status, then the depletion results, the
  step-stuck warnings and the farm idle warnings are sorted into `warnings`, and the series, markers, notes and
  step timings are returned as the `SimulationResult`.

## Where to change what

The model doc's [Extension points](../../docs/aoe4-build-order.md#extension-points) table names the seam for
each kind of addition, and [CivRules seams](../../docs/aoe4-build-order.md#civrules-seams) covers the hooks.
In terms of files:

- A new step action: its type in `schema.ts` and an entry in `stepHandlers` in `simulate.ts`.
- A new civilization rule: a hook in `civ-rules.ts`, called from the engine.
- A new data field: its type in `data.ts` and schema in `data-schema.ts`, then the data file under
  `data/aoe4-build-order/`.
- A new result series: the type in `model.ts`, then `simulateBuildOrder`; a route change also updates
  `docs/api/openapi.json` and `api.ts`.
