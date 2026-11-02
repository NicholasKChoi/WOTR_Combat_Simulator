# SGS-041 implementer report 1

- Ticket: SGS-041 (research multi-tier techs, notes by id, note severity)
- Branch: sgs-041-aoe4-research-multitier-note-severity
- Tip SHA: 0695d47 (one commit on origin/main 9137cf2), author choinickolas@gmail.com
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-041-aoe4-research-multitier-note-severity
- Status: needs_review

## Files touched

- lib/aoe4-build-order/research.ts: new `researchEntry(baseId, state: EffectState)`. The handler picks the entry through it on every attempt and returns `{ started: false }` (no reserve) when it returns undefined. Completion adds `entry.id` to `researchedIds`. `resolveUnitEntry` reads the tier from researched upgrade entries. Note messages use `baseId` and set `severity: 'info'`.
- lib/aoe4-build-order/effects.ts: `EffectState.researchedIds` (required). `activeEffects` reads technology effects from `researchedIds` through `byId`, and the `type === 'technology'` filter stays. `isGranted` still reads `researched`.
- lib/aoe4-build-order/model.ts: `BuildOrderNote.severity: Severity`.
- lib/aoe4-build-order/simulate.ts: `EngineState.researchedIds: Set<string>`, initialised empty beside `researched` (2 lines).
- lib/aoe4-build-order/test-helpers.ts: `effectStateOf` defaults `researchedIds` to empty. New `researchedOf(baseIds, data?)` returns `{ researched, researchedIds }` using each tech's lowest-age entry id. It is new; no equivalent existed.
- lib/aoe4-build-order/{gather,engine-common,modified-value}.test.ts, effects-gather.acceptance.test.ts, research.acceptance.test.ts: states that expect a tech's effects now use `researchedOf([...])`, so `researchedIds` holds the matching entry ids.
- lib/aoe4-build-order/{build-move.acceptance,simulate,simulate.acceptance,simulate-construction}.test.ts, houses.test.ts: empty `researchedIds` added to EffectState literals.
- lib/aoe4-build-order/research.test.ts: new `multi-tier research` describe block, note wording and severity tests, and `researchedOf` in the `resolveUnitEntry` and wheelbarrow state builders.
- acceptance/aoe4-simulate-api-contract.spec.ts: `severity: true` added to the `buildOrderNote` key literal (listed under "Tests that must change").
- docs/api/openapi.json: `BuildOrderNote.severity` (`$ref` Severity) added to `properties` and `required`; `additionalProperties: false` kept; `message` description now says it names the technology by id (baseId).
- docs/aoe4-build-order.md: the research queue paragraphs (highest entry at or below the age, picked per attempt, effects only from researched entries, waits while no entry is at or below the age), Tiers (age of the researched upgrade entry), the classifyTech note wording by `baseId` plus a sentence that notes classify by the lowest-age entry, and the `notes` output bullet (every note `info`, message starts with the baseId). The page notes paragraph ("technology id and message") is still accurate and was left as is.

## Tests

- `npm test`: 31 files, 742 passed, 0 failed (734 before; the new tests add 8).
- `npm run acceptance` (Playwright, full suite): 367 passed, 0 failed.
- New tests in research.test.ts. Each states the rule it pins.
  - `researchEntry picks the highest entry at or below the current age`: wheelbarrow at ages 1 and 3 gives -1 at ages 1 and 2 and -3 at ages 3 and 4. veteran-spearmen at ages 3 and 4 follows the same rule.
  - `finds nothing while every entry is above the age, for an unknown id, or for a non-tech`.
  - `waits with no reserve while every entry is above the age, then pays the entry of the age reached`: horticulture at ages 2 and 3, starting in age 1, with an abbey age-up. The handler's first outcome is `{ started: false }` and no outcome carries a reserve. The step starts at `ages[1].reachedAt` and pays the age-2 cost (50 wood, 100 gold), not the age-3 cost. Afterwards `researchedIds` is `['horticulture-2']` and `researched` is `['horticulture']`.
  - `picks the tier on each attempt...`: wheelbarrow at ages 1 and 2. Offered at 0 it pays tier 1 (50/150) and records `wheelbarrow-1`. Triggered at 150, after the age-up, it pays tier 2 (70/250) and records `wheelbarrow-2`.
  - `applies only the effects of the researched entry, not of its sibling`: `modifiedValue` carryCapacity is 15 for wheelbarrow-1, 30 for wheelbarrow-3 and 10 for none. Both cases share the same `researched` baseId set.
  - `resolves a unit to the age of the researched upgrade entry...`: with veteran-spearmen at ages 3 and 4, researching -3 gives spearman-3. The M2 rule gave spearman-4.
  - Notes: messages equal the exact `bloomery: ...` and `admiralty: ...` strings, severities are `['info','info']` and none is `error`, and researchNotes over every technology and upgrade in the data yields only `info` notes.
- With the shipped snapshot no existing expectation changed except the research.test.ts note-wording test (display names `Bloomery`/`Admiralty` changed to the full baseId messages), as the ticket requires.

## Pre-existing tests edited

- acceptance/aoe4-simulate-api-contract.spec.ts:`buildOrderNote` key literal gained `severity: true`, as the "Tests that must change" list requires.
- lib/aoe4-build-order/research.test.ts:`notes > names the tech, and for ignored effects the properties` became `names the tech by id, ...` and asserts the exact baseId messages (scope 8, last bullet).
- EffectState literals in the lib/aoe4-build-order/*.test.ts files above gained `researchedIds`. Where a test expects an effect, the matching entry ids are supplied (scope 5). No assertion values changed. modified-value.test.ts purity test also checks that `researchedIds` is left unchanged (`['wheelbarrow-1','shaft-mining-3']`).

## Mutation checks

Each mutation was applied in turn and research.test.ts run, then the file was restored. The scratch script was /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/mut.py. All 9 failed as expected and were undone; the final tree has none.

1. researchEntry picks the lowest entry (`>` to `<`): failed the pick test and the per-attempt tier test.
2. Type filter dropped from researchEntry: failed the non-tech test (`spearman`).
3. Handler goes back to `byBaseId.get(step.tech)[0]` plus the age check: failed the per-attempt tier test.
4. Undefined branch returns a reserve: failed the no-reserve test.
5. `researchedIds.add` dropped: failed the multi-tier wait test and 5 existing tier and effect tests.
6. resolveUnitEntry goes back to the max age over all entries of the upgrade baseId: failed the researched-upgrade-entry test.
7. Note severity set to `error`: failed the info test.
8. `entry.name` in the unmodeled message: failed the by-id wording test.
9. activeEffects reads `researched` by baseId again: failed the sibling-effects test.

## Clean stages

- codegen: not set in REPO.md.
- build: `npx next build` passed (npm ci run first).
- lint: `npx tsc --noEmit` clean; `npm run lint:dup` found 0 clones.
- unit: 742/742. acceptance: 367/367.
- `git diff --stat origin/main`: 19 files, +241/-64. Every file is named by the ticket or is a test-literal site under scope item 5. No lockfile, formatting or AGENTS.md drift; the tree was clean after the commit.
- Runtime: Node 24 (nvm use 24) matches the repo.

## Invariants

- A1: tier, costs, producers and effects come only from the snapshot entry `researchEntry` returns. research.ts still has no numeric literal other than 0 and 1 (source-shape test).
- A2: unchanged. Research still pays only through `canAfford`/`payCost` with category `research`. The new wait (no entry at the age) pays and reserves nothing.
- A3: `researchNotes` is still a pure function of (order, data). It classifies `byBaseId.get(step.tech)[0]`, the only match the acceptance grep finds, and does not call `researchEntry`. The engine pick depends only on state.age.

## Acceptance greps

- `git grep -n "entry.name" lib/aoe4-build-order/research.ts`: no match.
- `git grep -n "byBaseId.get(step.tech)\[0\]" lib/aoe4-build-order/research.ts`: one match (line 82, researchNotes).

## Merge note

simulate.ts changes are two lines (the `EngineState.researchedIds` field and its initialiser), to keep the merge with SGS-038 and SGS-043 simple.

## Out-of-scope findings

- lib/aoe4-build-order/modified-value.test.ts has its own `stateOf`, a copy of `test-helpers.ts` `effectStateOf`. It predates this ticket and was left in place; it could be replaced by the shared helper.
