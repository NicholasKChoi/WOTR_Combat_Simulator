# SGS-041 review 1

- Branch: sgs-041-aoe4-research-multitier-note-severity, tip 0695d4742d1b6e225ca1b4f051a59c9b33af0cce (one commit on origin/main 9137cf2). The branch is local only; it is not on origin yet.
- Mode: full review, first pass.
- Verdict: **APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Commands run (Node 24, detached review worktree)

- `npm ci`: ok
- `npx tsc --noEmit`: exit 0, no output
- `npm run lint:dup`: exit 0, "Found 0 clones."
- `npm test`: 31 files, 742/742 passed
- `npx next build`: exit 0
- `npm run acceptance`: 367/367 passed
- `npm run dev` on port 3977: `/apps/aoe4-build-order` returned 200. `POST /api/aoe4-build-order/simulate` with `research admiralty` and `research bloomery` returned notes `admiralty: its effect is not simulated; ...` and `bloomery: its effect on meleeAttack is not simulated; ...`, both with `severity: 'info'`. The server was stopped afterwards.
- Greps: `git grep -n "entry.name" lib/aoe4-build-order/research.ts` finds nothing. `git grep -n "byBaseId.get(step.tech)\[0\]" lib/aoe4-build-order/research.ts` finds exactly one match, at research.ts:82 in `researchNotes`.

## Points the manager asked about

- **Handler picks the entry on each attempt; no payment or reserve while no entry is eligible.** research.ts:41-57: `researchEntry` is called on every handler call. `undefined` returns `{ started: false }` before the target lookup, with no `reserve`. A reserve is returned only on the existing `canAfford` failure, and payment goes only through `payCost(..., 'research')`. Cost, `producedBy` and the `PaidItem` entry, which sets the research time at simulate.ts:399, all come from the picked entry. Before this change, an entry above the age and a missing target both also gave `{ started: false }` with no reserve, so for single-tier techs the outcome is the same. A2 holds.
- **`researchEntry`.** research.ts:31-39: keeps only technology and upgrade entries with `age <= state.age` and picks the highest age. `byBaseId` is in ascending age order (docs, data.ts), so with strict `>` the first entry of an age wins. Unknown ids and non-tech ids return `undefined`. Its signature takes `EffectState`, as the design's Modules row requires.
- **`EffectState.researchedIds` is required; `activeEffects` uses `byId`.** effects.ts:86 and :107-110. tsc passes with `strict: false`, but every literal and cast was checked by grep. The literals in simulate.ts:577, test-helpers `effectStateOf`, houses.test cast, and the 9 test files all set `researchedIds`. Every test that expects a tech effect fills `researchedIds` with the matching entry ids through `researchedOf`. Effect order is unchanged for single-tier techs: both sets are filled in the same `complete()` call, so `researchedIds` insertion order matches the old `researched` iteration order. The `type === 'technology'` filter stays. `isGranted` still reads `researched` by `baseId`, as the design requires. No expectation in the shipped-snapshot tests changed.
- **`resolveUnitEntry`.** research.ts:65-73: reads the tier from each researched entry whose `baseId` is in `upgradeTargets` for the unit. Technology ids are skipped because `upgradeTargets` has no entry for them.
- **New `researchedOf` helper.** test-helpers.ts:91-97. It is used in 7 test files, so it is shared, not single-use. No existing helper builds both sets: `effectStateOf` only supplies defaults. It is not a copy of another module's helper; it uses the `byBaseId[0]` lowest-age lookup the design names. Its style (4-space indent, no semicolons) matches the file, as at test-helpers.ts:87.
- **Notes.** research.ts:90-100: both notes use `entry.baseId` and `severity: 'info'`. `researchNotes` still classifies `byBaseId.get(step.tech)[0]` and does not call `researchEntry`, so it stays a pure function of `(order, data)` (A3).
- **Edited pre-existing tests.** Every edit falls within the ticket's list:
  - `acceptance/aoe4-simulate-api-contract.spec.ts` gains `severity: true` (Tests that must change).
  - `research.test.ts` notes test: wording changed to `baseId` (scope 8, last bullet).
  - EffectState literals gain `researchedIds`, or `researchedOf` where an effect is expected (scope 5).
  - No assertion value changed. `modified-value.test.ts` purity gains one assertion that `researchedIds` is not mutated, which is additive.
- **Docs and OpenAPI.** I checked every sentence the diff adds or edits against the code, and none is contradicted:
  - docs/aoe4-build-order.md:181-185: per-attempt pick; producers, cost, time and effects come from the picked entry; the entry `id` is recorded. Matches research.ts and effects.ts.
  - :188-189: waits while no entry is at or below the age; reserves only when short of resources. Matches.
  - :192-195: tier from the researched upgrade entry's age. Matches.
  - :348-357: notes worded by `baseId`, classified by the lowest-age entry. Matches.
  - :541-542: every note is `info` and starts with `baseId`. Matches.
  - Untouched sentences I re-read: :116-117 ("resolves a baseId to the entry for the current age or tier") and :604 (the page shows the technology id and message) are still accurate.
  - openapi.json `BuildOrderNote` has `severity` (`$ref` Severity) in `properties` and `required`, and `additionalProperties: false` stays. The ajv contract spec passes, and no example object carries a note.

## Acceptance criteria

All 10 are ticked in the ticket.

1. `researchEntry` at ages 1/3 returns the right entry at ages 2 and 3, and `undefined` when all entries are above the age: pass. research.test.ts `multi-tier research > researchEntry` covers wheelbarrow at 1/3 and veteran-spearmen at 3/4.
2. A step waits without paying or reserving, then pays the higher entry once the age is reached: pass. The "waits with no reserve" test checks:
   - the first outcome is exactly `{ started: false }` and no reserve appears;
   - `startedAt === ages[1].reachedAt`;
   - it pays the age-2 cost.

   The "picks the tier on each attempt" test checks that the tier-2 cost is paid after the age-up.
3. `researchedIds` holds the id and `researched` the baseId; sibling effects are not applied: pass. The wait test checks the state; the `modifiedValue` sibling test returns 15, 30 and 10.
4. `resolveUnitEntry` follows the researched entry and gives the lower tier for the lower entry: pass (`spearman-3` for `veteran-spearmen-3`).
5. Shipped-snapshot tests are unchanged: pass. I reviewed the diff: only `researchedIds` plumbing changed, plus the notes wording test. 742/742 pass.
6. Notes are `info`, a test pins "no `error`", messages start with `baseId`, and the `entry.name` grep finds 0: pass.
7. The `[0]` grep finds exactly one match, in `researchNotes`: pass.
8. The contract spec passes with `severity` required, and tsc passes: pass.
9. The doc no longer describes a single lowest-age research entry or display-name notes, and it states that notes are `info`: pass.
10. No invariant regressions: pass (see below).

## Invariants touched

- A1 holds: tier, costs, producers and effects come only from snapshot entries. research.ts adds no numeric literal.
- A2 holds: the new wait path neither pays nor reserves, and every spend still goes through `canAfford` then `payCost`. The wait shows up in `startedAt`/`waitSeconds` through the existing engine.
- A3 holds: the pick depends only on `state.age` and the data, and `researchNotes` is pure.
- S1 holds: no cross-app import. S3 is not affected.

## spec-checklist

- Contracts: `BuildOrderNote.severity` uses design names exactly.
- Scope: nothing from Out of scope is implemented, and `golang/` is untouched.
- Open questions: none were answered with an invented constant.
- Naming: `researchEntry`, `researchedIds` and `researchedOf` state intent.
- A1-A3: as above.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are not set, so no bot ran.

## Non-blocking notes

1. lib/aoe4-build-order/validate.ts:311 accepts `research X at B` if *any* entry of X lists B in `producedBy`. Meanwhile, `researchTarget` uses `[step.at]` without checking it against the picked entry. For a multi-tier tech whose tiers have different producers, a step could research a tier at a building that tier does not list. This is out of scope: the ticket keeps the validator unchanged, and the snapshot has one entry per tech. Consider it for a follow-up if multi-tier data lands.
2. docs/aoe4-build-order.md:195 is one over-long line (about 160 chars) where the edit was not reflowed. This is cosmetic.
3. The research.ts:30 comment does not mention that unknown or non-tech ids also return `undefined`. This is minor and the code is clear.
4. lib/aoe4-build-order/modified-value.test.ts:10 keeps its own `stateOf`, which duplicates `effectStateOf`. This predates the diff; the implementer already flagged it as out of scope.

## Coverage

- Reviewed the full diff of 19 files:
  - research.ts, effects.ts, model.ts, simulate.ts and test-helpers.ts;
  - all 11 test files;
  - the acceptance contract spec, openapi.json and docs/aoe4-build-order.md.
- Compared against: validate.ts checkResearch; the simulate.ts consumers of `entry` (handler, PaidItem duration); design/M3.md rows 614-615, Modules rows 79/81, and the Severity section.
- REPO.md Review checklist:
  - "Every diff": next build run, page loaded and API exercised on dev.
  - "AoE4 build order": no copied helper or tolerance; doc sentences checked; no chart change.
  - Other sections do not apply.
- Could not review: nothing.
