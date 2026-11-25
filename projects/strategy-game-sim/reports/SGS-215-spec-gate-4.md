# SGS-215 spec gate 4

Base origin/main 7d74800 (fetched). ticket-lint.py with --spec: exit 0, no errors, no warnings.

## Verdict: NEEDS_SPEC (two mechanical gaps)

All three gaps from gate 2 are closed. The ticket now has the named pre-cap digest test, the rule on `waitBreakdown.population`, and the S3 bounded worst-case test. The only gaps left are wording and one list of consumers.

## Gaps

1. **Acceptance criteria, retuned Spear/Longbow criterion - the list of tests that must keep passing omits other consumers of the build (item 2, item 13).** *mechanical (adding sites to a list)*
   - The criterion names `builds.test.ts`, `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts` and `acceptance/aoe4-simulate-api-prebuilt-plans.spec.ts`. The retune changes this file's result, and other tests load it. A retune that satisfies the three named files can still break one of these:
     - `acceptance/aoe4-simulate-api-house-rule.spec.ts` (1800 s: no non-remaining warning codes and no waiting step)
     - `acceptance/aoe4-simulate-api-deer-pack.spec.ts`
     - `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts`
     - `acceptance/aoe4-simulate-api-unit-lines.spec.ts`
     - `acceptance/aoe4-units-chart-upgrade-dots.spec.ts` (its comment says the build researches no man-at-arms upgrade)
     - `lib/aoe4-build-order/simulate-house-gate.test.ts` (the Spear/Longbow 1800 s digest, which Scope re-pins)
     - the `PRODUCTION_FLOORS` entry for this build in `lib/aoe4-build-order/production-floors.ts`, a 1200 s floor of 61 villagers and 8/8/21/13 military units. It is checked where `builds.test.ts` uses it, so confirm the named test run covers it.
   - Fix: change the criterion to "every unit test and acceptance spec that loads this build file passes with its assertions as written". Name the files above as examples. Say the digest re-pin in `simulate-house-gate.test.ts` is taken from the retuned file with the engine change. The implementer runs each of those specs alone, as Scope already says for at-risk specs.

2. **Acceptance criteria, pre-cap prebuilt criterion - "a `durationSeconds` at or before that instant" contradicts "assert `populationCapReachedAt` is `null`" (item 2).** *mechanical (criterion wording)*
   - A run whose horizon equals the cap instant includes the spawn that sets it, so the field is not `null`. The cap instants are fractional (ENG 1TC 1094.94, Knight/Longbow 1247.01, Council Hall 1158.20), so an integer duration is strictly before them.
   - Fix: say "strictly before that instant" (for example the last whole second below it).

## Verification done

- **Gate code and docs.** Both gates match the ticket's description at the base: the `produce` handler check before `canAffordHeld`, and `payOrder`'s early-return condition. So do `noteCapReached(engine: Engine)`, the `state as Engine` cast in `spawnUnit`, and `createEngine` calling `noteCapReached` before the start buildings add supply. The Scope doc quotes were also matched against the base in gate 2.
- **Design match.** C1, C5 and the Behavior rules of `design/M13.md` match the ticket's names and rules. Open questions: none. `page-help.tsx` exists, as the ticket says.
- **Same-instant criterion holds.** `runInstant` runs `applyDueEvents`, then a second `offerSteps` and `startProduction`, so a spawn that sets the field is seen in the same instant.
- **Population-wait criterion holds.** Before the lift, spawned population is at most population, which is at most supply, which is at most the cap. When `spawnedPopulation` first reaches the cap, supply is therefore already at the cap, except for the start-already-at-cap case. That case is the criterion about supply below the cap, which keeps the old rule.
- **Cap instants.** In a scratch checkout of the base I ran the four prebuilt builds at 1800 s and 3600 s (a throwaway test, now removed with the scratch). Every build reaches the cap by 1800 s with the same instant at 3600 s, and every run ends at 200:

  | Build | `populationCapReachedAt` |
  |-------|--------------------------|
  | ENG 1TC | 1094.94 |
  | Spear/Longbow | 1149.07 |
  | Knight/Longbow | 1247.01 |
  | Council Hall | 1158.20 |

  The pre-cap criterion's precondition holds for the three untouched builds.
- **Existing tests.** Gate 2 ran the unit suite with the engine change and found exactly the nine failures Scope lists. This run searched again for tests that read `spawnedPopulation`, `populationCapReachedAt` or `maxPopCap`, and for the `'population'` wait. The other users read pre-cap data or `maxPopCap` values with no run past 200: the `simulate.test.ts` wait tests, the `villagerTarget` tests (`supplyProvider` 200, before the cap), the performance test (180 villagers), `simulate-farms.test.ts`, `research.test.ts`, `compare.test.ts` and `houses.test.ts`. None depends on the change beyond what Scope names.
- **Builds-bar assertions kept as written.** `builds.test.ts` asserts `gold#2` and `gold#3` `depletedAt` are `null` at 1800 s. The ticket re-pins only the first gold run-out, so the retune must keep `gold#2` stocked past 1800 s. Gate 2's probe had `gold#2` out at 1799.4 s. The ticket already points the implementer at this.
- **Docs.** Searched `docs/`, READMEs, `ARCHITECTURE.md`, `page-help.tsx` and `openapi.json` for supply and population-cap statements. Everything stale is in Scope. `docs/aoe4-build-order-ui.md:251` (the `pop-cap` compare row) and format doc `:473` are SGS-216's. `openapi.json:5048` ("paid and supply allowed") and `model.ts:214` stay true.
- **Other items.**
  - Risk `high` is right: it changes a bound on S3 and a `criticalPaths` decision.
  - Hotspots: the lift condition, the same-instant order and the S3 bound each have a test criterion that fails when the logic breaks. The retune is data checked by `builds.test.ts`.
  - Contracts match the design. Size is small. There are no exception clauses against a rule stated elsewhere, no input-validation change, and `On merge: none` is correct. Unverified assumptions: none is right, since the change is internal code.

## Notes (non-blocking)

- The S3 criterion is a wall-clock bound, like the existing "performance" test. Setting it with headroom from the measured run, as the ticket says, is enough.
- Only the Spear/Longbow gold depletion pin is a `toBe`. The `toBeCloseTo(3305.17, 2)` pin in `aoe4-simulate-api-triggers.spec.ts` still holds under the engine change (gate 2).
