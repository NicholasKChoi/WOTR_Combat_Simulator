# SGS-041: Research multi-tier techs, name notes by id, add note severity

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.8 (note messages use ids; multi-tier tech), M3.12 (notes carry severity)
- **Priority**: medium
- **Risk**: high
  <!-- strongModelTriggers: adds a required field to the existing public response schema BuildOrderNote (SimulationResult.notes) that current callers validate against with additionalProperties: false; touches research.ts and effects.ts, which decide what a run computes. Plan said medium; raised under "when in doubt, pick the higher tier". Adjacent invariants: A1, A2, A3. -->
- **Invariants**: A1 (tier and costs still come only from the snapshot entry), A2 (research still pays only when affordable, through `payCost`/`canAfford`), A3 (`researchNotes` stays a pure function of `(order, data)`).
- **LOC estimate**: ~60 business logic (`research.ts` `researchEntry` ~15, handler and `resolveUnitEntry` rewrite ~25, `researchNotes` ~8; `effects.ts` ~6; `model.ts` ~4; `simulate.ts` `researchedIds` init ~2); tests, OpenAPI JSON and docs excluded.
- **Depends on**: SGS-037 (`Severity`; transitively SGS-035 for `payCost`, `canAfford`, `RESOURCE_TOLERANCE`, `test-helpers.ts`). Written against the post-SGS-035 tree: `research.ts` no longer has its own `RESOURCES` or tolerance, the handler pays through `payCost`, and the `currentUnitEntry` wrapper in `simulate.ts` is gone.
- **On merge**: none
- **Source**: design/M3.md "Behavior rules" rows `research | multi-tier tech` and `research | notes`, "Severity" table, "Modules" rows for `research.ts` and `effects.ts`; plans/M3-20261101.md outline G.

## Context

The engine picks a tech's entry with `byBaseId.get(step.tech)[0]` (the lowest age), so a tech with several age entries is always costed and applied at its first tier, and `resolveUnitEntry` infers a unit tier from every entry of a researched upgrade. Notes name the tech by display name (`entry.name`) and have no severity. The snapshot has one entry per tech today, so this changes no current result; tests use `editGameData` to build multi-entry techs.

## Scope

All names come from design/M3.md.

1. `lib/aoe4-build-order/research.ts`
   - Add `export function researchEntry(baseId: string, state: EffectState): SnapshotEntry | undefined`: among `state.data.byBaseId.get(baseId)` entries of `type` technology or upgrade, the one with the highest `age <= state.age`; `undefined` when every entry is above `state.age`.
   - `researchHandler` (line 35 `byBaseId.get(step.tech)[0]`) uses `researchEntry(step.tech, state)`. `undefined` returns `{ started: false }` with no reserve (the step waits until the age is reached; the `prerequisite` reason value is SGS-042's, this ticket does not add the field). The pick is made on every attempt, so a step that waited for an age pays the higher tier it then reaches. The picked entry supplies `producedBy` (target), costs (through `canAfford` / `payCost` with category `research`), and the item pushed to the target's `paid`; the existing `entry.age > state.age` check is replaced by the `undefined` case.
   - `researchItem(...).complete` adds `entry.id` to `state.researchedIds` and `entry.baseId` to `state.researched`.
   - `resolveUnitEntry` reads the tier from the researched entries: for each id in `state.researchedIds` whose entry's `baseId` has `upgradeTargets.get(baseId)?.value === unit`, the tier is that entry's `age` (largest wins), instead of the largest age over all entries of the upgrade `baseId`.
   - `researchNotes` (line 78) messages name the tech by `baseId` instead of `entry.name`: `admiralty: its effect is not simulated; it still costs resources and queue time.` and `bloomery: its effect on meleeAttack is not simulated; it still costs resources and queue time.` Every note gets `severity: 'info'`.
2. `lib/aoe4-build-order/effects.ts`: `EffectState.researchedIds: ReadonlySet<string>` (required, beside `researched`). `activeEffects` collects effects only from entries whose `id` is in `researchedIds`, replacing the `researched` baseId flatMap. `isGranted` keeps reading `researched` by `baseId`.
3. `lib/aoe4-build-order/model.ts`: `BuildOrderNote.severity: Severity` (SGS-037's type).
4. `lib/aoe4-build-order/simulate.ts`: `EngineState.researchedIds: Set<string>`, initialised empty beside `researched` (line 613).
5. Every `EffectState` literal in tests gains `researchedIds` (34 `researched:` sites in `lib/aoe4-build-order/*.test.ts`, `houses.test.ts` casts). Use `test-helpers.ts` where SGS-035 provides an equivalent; do not add a new copy of a helper.
6. `docs/api/openapi.json`: `BuildOrderNote` gains `severity` (`$ref` `Severity`, added by SGS-037) in `properties` and `required`; `additionalProperties: false` stays. Update the description of `message` ("names the technology by id").
7. `docs/aoe4-build-order.md`, this ticket's sections only: Tiers (~line 184: tier read from the researched entry's age), the research queue paragraph (~178-182: waits while no entry is at or below the current age), the `classifyTech` note rules (~339-343: wording by `baseId`), the `notes` output bullet (~516: every note is `info`), and the page notes paragraph (~570 stays accurate; check). SGS-054 audits the whole.
8. Tests (Vitest, using `editGameData` to add a second tier entry to a technology and an upgrade):
   - `researchEntry` picks the highest entry at or below the age; `undefined` when all are above.
   - A multi-tier research step costs and applies the picked tier, and a step that waited for an age pays the higher tier it then reaches.
   - After research, `researchedIds` holds the entry `id` and `researched` its `baseId`; effects of the unresearched sibling entry do not apply (`modifiedValue`).
   - `resolveUnitEntry` follows the researched entry's age, not the largest age of the upgrade `baseId`.
   - Notes name `baseId` and have `severity: 'info'`; no note has `severity: 'error'`.

**Out of scope:** `waitingOn`/`step-stuck` (SGS-042); the page notes list and collapse (SGS-045); chart markers (SGS-044, which uses `researchEntry`); the validator's repeat-research rule (unchanged); parse-text and the paste grammar; which entry `researchNotes` classifies for a multi-tier tech (see Open questions: it keeps `byBaseId.get(step.tech)[0]`).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `researchEntry(baseId, state)` returns the highest-age entry with `age <= state.age` for a tech with entries at ages 1 and 3 (age 2 gives the age-1 entry, age 3 gives the age-3 entry) and `undefined` when every entry is above `state.age`.
- [ ] A research step of a multi-tier tech whose only entry is above the current age does not start, pays nothing and reserves nothing; after the age is reached the step starts and pays the costs of the higher-age entry.
- [ ] On completion `researchedIds` contains the picked entry's `id` and `researched` its `baseId`; `modifiedValue` applies the picked entry's effects and not those of a sibling entry of the same `baseId`.
- [ ] `resolveUnitEntry` returns the unit entry at the age of the researched upgrade entry; with two upgrade entries of one `baseId`, researching the lower-age one yields the lower tier (the M2 rule returned the higher one).
- [ ] With the shipped snapshot every existing simulation test and the ENG 1TC result are unchanged (`npm test` passes with no changed expectation other than note messages and `severity`).
- [ ] Every `BuildOrderNote` has `severity: 'info'`; a test fails if any note has `severity: 'error'`; messages start with the tech `baseId` (`admiralty: `), and `git grep -n "entry.name" lib/aoe4-build-order/research.ts` finds no match (2 today).
- [ ] `git grep -n "byBaseId.get(step.tech)\[0\]" lib/aoe4-build-order/research.ts` finds exactly one match, in `researchNotes` (2 today: handler and notes).
- [ ] `acceptance/aoe4-simulate-api-contract.spec.ts` (ajv against `docs/api/openapi.json`) passes with `severity` required on `BuildOrderNote`; `npx tsc --noEmit` passes.
- [ ] `docs/aoe4-build-order.md` no longer describes the lowest-age entry as the only research entry or names notes by display name, and states that notes are `info`.
- [ ] No INVARIANTS.md regressions

## Open questions

- `designer`: for a multi-tier tech, which entry does `researchNotes(order, data)` classify with `classifyTech`? It is a pure function of `(order, data)` (A3) and must also note unreached steps, so it cannot use the age at start. The design says only that notes name the `baseId`. This ticket keeps `byBaseId.get(step.tech)[0]` (the lowest-age entry), which is identical for every current tech; a different rule (for example one note per distinct classification across entries) needs a design decision before a multi-entry tech ships.
- `designer`: design/M3.md Modules gives `researchEntry(baseId, state)` without the `state` type. This ticket types it `EffectState` (as `resolveUnitEntry` is) so `markers.ts` and tests can call it without an engine. Confirm.
