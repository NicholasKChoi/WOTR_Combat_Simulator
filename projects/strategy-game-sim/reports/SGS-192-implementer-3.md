# SGS-192 implementer report 3

Ticket: SGS-192 (record what a waiting step waits for). This was a resume: a previous implementer left uncommitted work, which I kept, corrected and finished.
Branch: `sgs-192-wait-details`, one commit `7596bde9c63f55c8152eb46926c9a5d99c80d873` on top of `origin/main` 38320d8 (SGS-190 included).
Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-192-wait-details`.
The `checkout.sh task` call reused the checkout with the tip unchanged (38320d8, equal to origin/main). The branch has no `origin/<branch>`, so the own-commit check was skipped as allowed.

## What the previous pass left, and what I did with it
- Kept as found and checked against the ticket: `wait-detail.ts`, `wait-detail.test.ts`, the handler `detail` returns in `simulate.ts` and `research.ts`, `offerStep`, `accrueWait`/`accrueDetail`, `createEngine`, the `model.ts` types, and the fixture and shape edits to existing tests.
- Changed: `completeConstruction` now reads `state.constructing` with no cast. `ages` keeps its existing `state as Engine` destructure. The hand-built timing in `simulate.test.ts` needed a typed `waitDetails` to compile. I deleted the scratch file `zzq.test.ts`.
- Added: `simulate-wait-details.test.ts`; the OpenAPI schemas, the two new `StepTiming` fields and the 200 examples; the structure checks in the contract spec and the pinned names in the surface spec; the new fields on the `acceptance/helpers.ts` `Timing` type; the docs and README; 4 vowel rows in the `wait-detail.test.ts` article table (a mutation survived without them).

## Files touched
- `lib/aoe4-build-order/wait-detail.ts` (new): the builders, `waitReasonOf`, `waitTargetKey` and `waitDetailText`.
- `lib/aoe4-build-order/model.ts`: adds `BreakdownReason`, `StepWaitDetail` and `StepWaitEntry`, plus `StepTiming.waitingFor` and `StepTiming.waitDetails`.
- `lib/aoe4-build-order/simulate.ts`:
  - `constructing` moved onto `EngineState`.
  - `StepStart.detail` added.
  - `produce`'s combined first check split into unknown, age, then missing building; `produce`, `build` and `move` return details.
  - `offerStep` sets `waitingFor`; `createEngine` initializes the new fields; `accrueWait` calls `accrueDetail`.
- `lib/aoe4-build-order/research.ts`: details on every failed start, with `lowestResearchAge` for the age detail.
- `docs/api/openapi.json`: new `StepWaitDetail` and `StepWaitEntry` schemas; the 2 fields added to `StepTiming`; the 5 step objects in the 200 examples.
- `docs/aoe4-build-order-format.md`: the `steps` field list, the wait-reasons paragraph and table (new detail column and the no-handler clause), the check-order paragraph, and a new `### Wait details` section.
- `docs/aoe4-build-order.md`: the ordering paragraph now covers the check order, `waitingFor` and `waitDetails`.
- `lib/aoe4-build-order/README.md`: a `wait-detail.ts` module entry, and the new-step-action line.
- `acceptance/aoe4-simulate-api-contract.spec.ts`:
  - `StepWaitEntry` joins `RESPONSE_SCHEMAS`; `StepWaitDetail` joins `SHARED_SCHEMAS` and the description loop.
  - New test: every `StepWaitDetail` variant is closed, requires every property and is tagged by a `kind` const.
  - `Record<keyof ...>` literals for `StepTiming` (2 keys), `StepWaitEntry`, and each `StepWaitDetail` variant, with a variant-keys test.
- `acceptance/fight-api-spec-surface.spec.ts`: `AOE4_SCHEMA_NAMES` gains `StepWaitDetail` and `StepWaitEntry`.
- `acceptance/helpers.ts`: `Reason = BreakdownReason`; `Timing` gains `waitingFor` and `waitDetails`.
- `lib/aoe4-build-order/simulate-wait-details.test.ts` (new) and `lib/aoe4-build-order/wait-detail.test.ts` (new).
- The existing tests listed in the next section.

## Pre-existing tests edited
All of these use the ticket's rule for fixture, shape and pinned-name-list edits. No timing, `waitSeconds`, `waitingOn` or `waitBreakdown` assertion changed.

- `simulate.test.ts` "completes a rally step the instant it arms" and "pauses at once, lets the paid villager spawn and pays no more": the whole-step `toEqual` gains `waitingFor: null, waitDetails: []`.
- `simulate.test.ts` "charges only the steps whose reason is a breakdown reason": the hand-built timings gain the two fields.
- `research.test.ts`: two `StepStart` `toEqual`s gain `detail`, with the values the engine returns.
  - "...reports resources..." (the outcome near line 415): `{ kind: 'resources', short: { gold: 1 } }`.
  - "waits with no reserve while every entry is above the age...": an age 2 detail naming the Abbey of Kings.
- `simulate-busy-buildings.test.ts` "a %s waits on prerequisite with nothing held or reserved": each row gains the expected `building` detail (barracks instance 3; blacksmith with instance null).
- `simulate-construction.test.ts` "ignore a waiting step reserve" and `simulate.acceptance.test.ts`'s 3 `withHandler` cases in "reserve returned by a registered handler": the stub outcome gains `detail: null`.
- `simulate-house-gate.test.ts` `digestTimeline`: it drops `waitingFor` and `waitDetails` from each step before hashing. The pinned digests stay byte-identical; I re-pinned nothing.
- `components/apps/aoe4-build-order/step-annotations.test.ts`: the `timing()` fixture typed as `StepTiming` gains the two fields, because `tsc` required them.
- `data.acceptance.test.ts` "model.ts exports exactly the documented types and the shared lists": the 3 new names are added and the count dropped from the title.
- `acceptance/fight-api-spec-surface.spec.ts` (`AOE4_SCHEMA_NAMES`) and `acceptance/aoe4-simulate-api-contract.spec.ts` (`stepTiming` literal): the pinned name lists from Scope.

## Tests
- `npm test`: 89 files passed, 1 skipped; 2798 tests passed, 15 skipped. Before my test additions it was 87 files and 2754 tests, all passing.
- `wait-detail.test.ts` (47 tests), all pure function calls:
  - the full `waitDetailText` table: article rule including `The ...` and each vowel, the 3 busy forms with the dropped `The `, 1 to 4 resources, 1 versus 2 villagers;
  - `waitReasonOf` and `waitTargetKey` for every kind, `busy:` versus `building:`;
  - name fallback, `resourceWait` rounding and tolerance;
  - `ageWait` choosing the landmark (earliest, tie by baseId, other age ignored, not the next age gives null), given an `EngineState`-typed value with `constructing` set;
  - an import-line check for browser safety.
- `simulate-wait-details.test.ts` (36 tests):
  - `produce` details: missing producer, unit above the age, missing instance, age reported before building, population `needed = targets x popcap`, the busy sample (respec 1 criterion), `every: true`, `instance: k`.
  - Resource details: the exact short kinds; short only through the auto-house hold, for `build`, `produce` and `research`.
  - `build` and `move` details.
  - `research` details: the lowest age (data edited to add an age-4 entry), `producedBy` order, `at`, the busy blacksmith, only the candidates that have an instance.
  - Landmark naming, and none when the wanted age is 2 above.
  - `waitingFor` lifecycle: the last offer of an instant wins; horizon states.
  - For every failed offer over the prebuilt builds at 1200 s plus the cases, `waitReasonOf(detail) === waitingOn`.
  - `accrueWait` keying table (B-W5 to B-W8, B-W11).
  - The B-W9 sum invariant and key uniqueness over every prebuilt build at 1200 s plus the cases, with a guard that some step has details.
  - A3: a repeat prebuilt run deep-equals, after asserting the run has resources, age and busy details.
  - `step-stuck` message and fields for resources, prerequisite and busy.

## Mutation checks
Each break was applied by a scratch script, the tests were run, and the file was restored (the script verified the restore every time). All breaks are undone; the scratch script was deleted.

| # | Break | Failing test (assertion) |
|---|---|---|
| M1 | `simulate.ts` produce: building check moved before the age check | "a unit above the age names the age"; "reports the age before the missing producer" (`expected 'building' to be 'age'`) |
| M2 | `populationWait(state, entry.costs.popcap)` | population test (`needed: 1` vs 2) |
| M3 | `busyWait(..., false)` | "a busy wait names every target" |
| M4 | `build`: `resourceWait(state, cost)` | hold row for `build` (`short: {}`) |
| M9 | `produce`: `resourceWait(state, total)` | hold row for `produce` |
| M10 | `research`: `resourceWait(state, cost)` | hold row for `research` |
| M5 / M5b | `Math.ceil` changed to `round` / `floor` | "a fraction of a unit rounds up" and others |
| M6 | research `busyWait(candidates)` | "lists only the candidates that have an instance" |
| M7 | `Math.max` for the lowest age | "names the lowest age..." (`age: 4` vs 3) |
| M8 | `offerStep` drops `waitingFor = null` on start | busy sample (`expected ... to be null`) |
| M11 | `accrueDetail` merges by kind | "two buildings of one kind", "two ages" |
| M12 | landmark update even when null | "an age takes a later landmark and keeps it..." |
| M13 | no landmark update | same test |
| M14 | `ageWait` drops the same-age filter | "names no landmark of another age" and one more |
| M15 | busy key prefix `building:` | `waitTargetKey` rows, "missing then busy" |
| M16 | value import from `./simulate` in `wait-detail.ts` | import-line test |
| M17 | `offerStep` does not set `waitingFor` | 25 tests |
| M18 | `accrueDetail` not called | 25 tests, including the B-W9 guard |
| M19 | `move` `villagerWait` arguments swapped | "a move short of villagers" |
| M20 | landmark not limited to the next age | "not for an age two above the current one" and the `ageWait` null row |
| M21 | `build` `villagerWait(..., 1, ...)` | "a build short of villagers" |
| M22 | research ignores `at` | "a missing building names the at building" |
| M23 | `build` age detail null | "a build above the age", the per-offer reason test, the sum invariant |
| M24 | article vowels lose O | "a building starting with O" |
| M25 | busy keeps `The ` | "a free building named The ..." |
| M26 | villager plural always | "one more villager" |
| M27 | resource join uses ` and ` everywhere | three and four resources |
| M28 | `building-busy` maps to `resources` | `waitReasonOf` rows, per-offer test, sum invariant |
| M29 | name fallback is `''` | the name-fallback test |
| M30 | latest landmark picked instead of earliest | "completes first" |
| M31 | tie picks the higher baseId | "the lower baseId on a tie" |
| M34 | `waitingFor ??=` (keeps the first offer) | "keeps the last failed offer of an instant" (`available: 2`), sum invariant |
| M35 | `step-stuck` message changed | the 3 `step-stuck` rows |

Two weak tests were found and fixed:
- Before the vowel rows were added, M24 survived.
- M20 first survived because the "two above" test built an unbuildable landmark. It now builds the Dark Age Council Hall and asserts that step is `in-progress`.

## Codegen, build, lint
- codegen: none is set.
- `npx next build`: passed.
- `npx tsc --noEmit && npm run lint:dup`: passed; tsc clean, jscpd 0 clones in both configs.
- I did not run the Playwright acceptance specs; that belongs to the acceptance-test gate. Instead, in a scratch vitest (deleted) I called the simulate route handler on the OpenAPI request examples and checked them with ajv:
  - both 200 examples `toEqual` the live bodies;
  - the live bodies of every prebuilt build at 1200 s and 3 single-step cases validate against `SimulationResult`, between them covering all 6 detail kinds;
  - an empty `short` and an extra property are rejected.
- `git diff --stat` shows only the files above; no lockfile or `next-env.d.ts` drift.

## Doc claims (each reread against the code)
- Format doc `steps`: "`waitingFor` is what the last failed check waits for ... set at each offer the step fails, `null` once the step starts, so at the horizon a `waiting` step has the detail of its last failed offer and every other step has `null`." Source: `simulate.ts:offerStep` sets `waitingFor = outcome.detail` or null. `createEngine` initializes null. Unarmed steps are never handed to a handler.
- Format doc table and order: "An action with no handler always reports it, with a `null` detail; every `BuildStep` action has a handler, so every second in `waitBreakdown` has a detail." Sources: `offerStep`'s fallback outcome and `stepHandlers` (all 6 actions). One more exception exists: unknown entries give a null detail, but these cannot pass the schema.
- "The order is an age, then a missing building (... a `produce` whose unit is above the age and whose producer is not built reports the age)...": `simulate.ts:produce` and `research.ts:researchHandler`.
- `### Wait details` table: each row against `wait-detail.ts` and the handler calls.
  - "`landmark` is set only when `age` is the next age...": `ageWait` and `nextLandmark`.
  - "`research` names the candidate buildings that have an instance, in candidate order": `researchHandler` `built`.
  - "rounded up; a covered resource is absent": `resourceWait`.
- Accrual paragraph: "Targets match by kind and, for `age`, the age; for `building` and `building-busy`, the buildings and instance ...", "An entry keeps the numbers of the interval that created it, except that an `age` entry takes the landmark a later interval names...", "A target never waited on for any time has no entry". Sources: `waitTargetKey`, `accrueDetail`, and `accrueWait`'s `seconds > 0` guard.
- Model doc: "Each offer runs the checks of the step's action in order (an age, then a missing building, then villagers or population, then resources, then a busy building) and reports the first that fails ... Recording them changes no timing." Sources: the handlers, and no existing timing test changed.
- README: "Browser-safe: its only value imports are `model.ts`, `engine-common.ts` and `landmarks.ts`." Source: the `wait-detail.ts` imports, enforced by the import-line test.
- README: "each of the handler's `started: false` returns names a `detail` built with the `wait-detail.ts` builders." Source: the `StepStart` type requires `detail`. Note the schema-impossible paths return `null`, not a builder result.
- OpenAPI descriptions: `waitingFor` ("...null once started, while not-reached, and for a check with no detail"), `waitDetails` ("...the seconds of the entries counting under it sum to that reason's seconds", B-W9, tested), and `StepWaitEntry.detail` ("the numbers of the first interval ...; an age entry takes a later landmark").
- Code comments: the `model.ts` field comments on `waitingFor` and `waitDetails`; `EngineState.constructing` "Buildings under construction, explicit or auto." (moved unchanged); `accrueDetail`'s comment (B-W6/B-W7); and `simulate-house-gate.test.ts` "The wait details are left out, so the pins stay a digest of the timings alone."

## Pinned outputs (values the engine returns)
- `research.test.ts` wheelbarrow outcome: `short: { gold: 1 }`.
- Abbey case: landmark `{ baseId: 'abbey-of-kings', name: 'Abbey of Kings' }`.
- OpenAPI `goldRunOut` 200 example, step 1: `waitDetails` `[{ building mill, instance null, seconds 25 }]`, taken from the live route.
- `simulate-wait-details.test.ts` "lists exactly the short kinds": `{ wood: 50 }` (barracks 150 wood, bank 100).
- Hold rows: `{ wood: 10 }` (bank = cost + house - 10).

## Invariant check
- A1: names come from `state.data.byBaseId`; no game number was added.
- A2: `resourceWait` only reads the bank; no check order or reserve changed. Every existing timing test passes unchanged.
- A3: no clock or randomness; entries keep first-accrued array order; the repeat run deep-equals.
- S1 to S3: not affected.

## Unverified assumptions added
None.

## Out-of-scope findings and notes for the manager
- The ticket's forms-table sample `50 gold and 20 wood` contradicts its own rule ("per short kind in `RESOURCE_KINDS` order", which is food, wood, gold, stone). The code follows the rule, and the test pins `20 wood and 50 gold`. The design table (M11.md C6) has the same sample. The UI ticket should not copy it.
- I did not add the `aoe4-simulate-api-waits.spec.ts` field checks named under Tests/Acceptance: the implementer brief gives acceptance-harness tests to the acceptance-test gate. The contract and surface spec edits I made are the existing-consumer edits Scope requires; I typechecked them but did not run them under Playwright.

## Status
`needs_review`
