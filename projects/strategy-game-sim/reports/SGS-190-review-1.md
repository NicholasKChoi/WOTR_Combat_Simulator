# SGS-190 review 1

- Branch `sgs-190-busy-building-wait`, tip `613c38d`, base `origin/main` 3bc29b2 (full diff, not delta mode).
- Scratch: `worktrees/review-sgs-190-busy-building-wait`.
- **Verdict: REQUEST CHANGES.** The engine change is correct against B-B1..B-B12 / C7c / C7d / C7e, and I found no correctness, invariant or lint defect. Three text-only fixes block approval: one doc sentence the code contradicts and two re-baselined test titles that claim checks their assertions no longer make.

## Blocking findings

1. `docs/aoe4-build-order.md:227` - contract (text) - The sentence "With a capital town center and two idle town centers, `research textiles` goes to the capital town center" makes the outcome depend only on the two town centers being idle. Under the new rule the capital must be free too. Probe on the branch: `noAutoVillagers(startingWith(2, ['capital-town-center','town-center','town-center', …]))`, `produce scout from capital-town-center x1`, then `research textiles` at 5 s takes `town-center` 1 at 5 s, not the capital. This sentence was edited in this diff ("idle" was added), and it now says more than the code does. Direction: replace the sentence and the one after it with:
   "With an idle capital town center and two idle town centers, `research textiles` goes to the capital town center and `research textiles at town-center` to town center 1; with town center 1 busy and town center 2 idle, `research textiles at town-center` goes to town center 2."
   Facts kept: textiles goes to the capital, `at town-center` goes to town center 1, and with town center 1 busy it goes to town center 2. Only the missing "idle" on the capital is added.

2. `lib/aoe4-build-order/simulate-construction.test.ts:235` - test (text) - The title "keeps paid items and offers next-age units at the age-up instant" no longer matches the re-baselined assertions. The spearman step now starts at 102.55 s, when the man-at-arms paid at 87.9 s spawns, not at the 100 s age-up. Both waits accrue to `prerequisite`, so no assertion can tell that the step was offered at 100. A regression that stopped offering steps at the age-up instant would still pass, because the 102.55 s completion event wakes the step anyway. Direction: retitle to
   `'keeps the unit paid before the age-up, then starts the next-age unit when that unit completes'`.
   Facts kept: paid items are kept (man-at-arms-1 at tier 1, 6 then 7), and the next-age unit is produced (spearman-2 at tier 2). Dropped: "at the age-up instant", which is the defect. Assertions stay unchanged.

3. `lib/aoe4-build-order/simulate.test.ts:420` - test (text) - The title "lets the villager in production finish and keeps the scout cost when switching" claims the scout cost is kept across a switch. The re-baselined assertions now show the opposite timing: nothing is charged at 10 s (`150 + 6 * r * 10`), and the step starts at 20 s on an idle town center, so no switch happens while anything is in production and no assertion checks a kept cost. Direction: retitle to
   `'waits for the villager in production, charges nothing before it starts, then trains the scout and resumes villagers at its spawn'`.
   Facts kept: the villager in production finishes (villager count at 20 s), the scout is trained (spawns between 40 and 45 s, completedAt 43), and villagers resume (4 at 120 s). Dropped: "keeps the scout cost when switching", which is the defect. Assertions stay unchanged.

All three are title or doc text only. No assertion or code changes.

## The two flagged deviations

- **Design sample (7), "armed at 0 it takes the archery range": not a defect, and not NEEDS_SPEC.** The rules settle the case: B-B4 (the `produce` handler pays its first unit inside the handler when it starts) plus B-B9 / runInstant order (steps in list order, before `startProduction`). So with `produce longbowman` listed before `research veteran-longbowmen`, both at 0 s, the range already has a paid longbowman when the research is offered, and B-B7 sends the research to the idle council hall. The design's parenthetical is true only when the research is listed first. The ticket criterion reads "armed at 0 it takes the archery range, whose first longbowman is not yet paid at the first offer". That precondition holds only with research-first, and the candidate table pins that case (row 2: range at 0) as well as the produce-first case (row 3: council hall at 0). Criterion passes. Action for the manager or designer: correct the parenthetical in `design/M11.md` (M11.5a sample 7) to "listed before the produce, it takes the archery range at 0; listed after it, the council hall". Factory-internal text only, no owner decision.
- **Rename `researchTarget` to `candidateInstances`: accepted, not a defect.** It is module-private, with no export, no caller outside `research.ts`, and no named contract: C-rows name only `researchHandler`, whose signature is unchanged. The design (line 448) leaves the internals to the implementer as long as both handlers call `instanceFree`, and `researchHandler` does (`research.ts:52`). The function now returns every candidate instance so the handler can tell check 2 (no instance) from check 4 (none free), with resources checked between them. Keeping the name `researchTarget` would misname it. Follow-up for the manager: `tickets/SGS-192-record-what-a-waiting-step-waits-for.md:21` says "`researchTarget`'s busy check (check 4)". The check now lives in `researchHandler` (`research.ts:52-55`), so change that wording before SGS-192 runs. The design rows (`design/M11.md` lines 55, 146, 351, 448) use the old name too and are factory-internal.

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `instanceFree` is the only free test; unit test fails if either half dropped | pass | `engine-common.ts:73-75`; only callers `simulate.ts:409`, `research.ts:52`; `held` read only there and `startProduction` (`simulate.ts:642`). Table `simulate-busy-buildings.test.ts:53-63` rows 1, 3, 4 cover each half |
| 2 | Single busy target, sample 20/43/10, food not charged at 10 | pass | test :66-79; `spent.military` 65 at 20 |
| 3 | Several targets a<b, hold, hold released | pass | :81-106 asserts a=10<b=30 first (:86-90); held barracks pays no spearman (count 1); release (3 at 60, 5 at 90) |
| 4 | `instance: k` waits only for k | pass | :108-121 |
| 5 | Check order resources then busy; busy wait reserves | pass | :123-144; keys `['resources','prerequisite']` with `resources > 0` precondition; reserve case holds gold at 20 and starts at 40 |
| 6 | Reactions treat held as busy, never hold, reserve nothing | pass | :146-164 (armedAt between 10 and 30 asserted); `offerReactions` (`simulate.ts:554-565`) reads no `hold` and only feeds `reactionNeeds` |
| 7 | Research waits behind unit (15/75/10), behind research (0/60, 60/120/60), two blacksmiths both 0 | pass | :166-195 |
| 8 | Candidate choice (council hall 5/65; range when armed at 0; first-free; tie by instance; `at`) | pass | :197-215, six rows; see Deviations for the design sample |
| 9 | Running research pauses the order; waiting step wins the tie; back-to-back chain | pass | :217-234, blacksmith row :186 |
| 10 | Missing target unchanged; never free leaves step waiting, step-stuck, not-reached; pause/rally/build/move never wait | pass | :236-281; exact `{ started: false, waitingOn: 'prerequisite' }` |
| 11 | A2 and A3 on several-target and research-at-busy cases | pass | :102-105, :172-173 |
| 12 | Seam-names test unchanged; only listed tests re-baselined; changed assertions fail at base | pass | no new `simulate.ts` export; every edited test is in the Scope list (implementer table); fail-at-base record per row. Idle-building and `noAutoVillagers` variants used as the ticket allows. Titles: see findings 2 and 3 |
| 13 | (respec 1) Knight/Longbow tier test by rule, derived samples | pass | `research.acceptance.test.ts:152-166` unchanged from SGS-189; derived from `completedAt`; no (840, 845] window. Implementer records 838.02 s, 20 at 835 and 840, final 71 |
| 14 | Spear/Longbow = base minus exactly four steps, no trigger changed | pass | diff of the JSON removes only those four objects |
| 15 | builds.test.ts bars pass, floors/cap unchanged, gold pin re-pinned | pass | I ran `vitest lib/aoe4-build-order`: 51 files pass. `production-floors.ts` untouched; pin retitled and re-pinned (gold#2 now stocked) |
| 16 | Acceptance run for the named specs passes | unverified | acceptance-test gate's run; review runs no acceptance specs |
| 17 | Model doc states the busy rules; searches find nothing; README omissions | pass, except finding 1 | searches return nothing (verified); README names the four techs as omitted, with no "Nothing is omitted" and no Castle upgrades. Model doc capital example contradicted (finding 1) |
| 18 | (respec 2) Format doc wait-reasons section | pass | `prerequisite` row names "not free" for both; "only reason that reserves" gone; order sentence puts busy after resources (`docs/aoe4-build-order-format.md:479-481`) |
| 19 | No INVARIANTS.md regressions | pass | below |

## Invariants touched

- **A1** holds. No literal in the engine diff; test times are edited through `editGameData`.
- **A2** holds. A busy `produce` returns `reserve: total` (`simulate.ts:411`) and a busy research returns `reserve: cost` (`research.ts:54`). `payOrder` respects `engine.reserve` for non-villager units, and payment still goes through `canAffordHeld`/`payCost` only after the affordability check. `noneNegative` passes on the several-target, research-at-busy and both reserve cases.
- **A3** holds. The `held` Set is used for membership only. Candidate order is `producedBy`, then instance creation order (`flatMap`). Deep-equal reruns pass. No Date or random.
- **S1, S3**: not affected (no new input, no cross-app import).

## Bot reconciliation

No `reviewBot.cli` and no `rulesFile` in REPO.md, so this section was skipped.

## Lint and build

- `npx tsc --noEmit` passes, and `npm run lint:dup` finds 0 clones.
- `npx vitest run lib/aoe4-build-order`: 51 files passed, 1 skipped; 1792 tests passed, 15 skipped.
- `npx next build` passes, and the tree was clean afterwards.

## Non-blocking notes

- `lib/aoe4-build-order/research.acceptance.test.ts:229` builds the idle game with an inline `(parts) => void (parts.base.villagerTarget.value = 0)`. `noAutoVillagers(game)` from `test-helpers.ts` (already imported in that file for other helpers) does the same thing. Tolerable, because the file builds its games through its own `gameWith`.
- `simulate-construction.test.ts:241-243` pins `102.55000000000001` with `toBe`/`toEqual`. It is deterministic, but `toBeCloseTo(102.55, 9)` would read better (the sibling test at :216 uses `toBeCloseTo`).
- Pre-existing (SGS-189, not in this diff): `research.acceptance.test.ts:154` `expect(completedAt).toBeDefined()` passes on `null`. The following `toBeGreaterThan(0)` on the index still fails in that case, so the test can fail, but `not.toBeNull()` plus a value check would state the intent.
- `houseDemand` still counts an order on a held instance in `populationPerSecond`, so the auto-house planner may build slightly early while a hold lasts. This is out of this ticket's scope and was not measured.
- Design-doc corrections listed under the deviations: `design/M11.md` sample 7 and the `researchTarget` mentions, and the SGS-192 ticket wording.

## Coverage

- Reviewed in full: `engine-common.ts`, `simulate.ts` (the `produce`, `offerReactions`, `offerSteps`, `payOrder`, `startProduction`, `runInstant` and `nextWake` paths), `research.ts`, `test-helpers.ts`, the new `simulate-busy-buildings.test.ts`, every re-baselined test hunk, the build JSON, README, `docs/aoe4-build-order.md` and `docs/aoe4-build-order-format.md` hunks, and `docs/api/openapi.json` (no stale queue or reserve text found).
- Checked against `design/M11.md` B-B1..B-B13, C7, C7c, C7d and C7e, plus the ticket and both respecs.
- Two probe runs (a temporary test file, deleted afterwards) confirmed finding 1 and the research target with all town centers training villagers (capital at 40 s on the candidate-order tie).
- UI inspection did not run: the diff changes no component, page or style. No page was loaded for the same reason; I ran the build.
- LSP was not available; I found callers with grep (`instanceFree`, `held`, `paid.length`, `researchTarget`).
- REPO.md review checklist: Every diff (build run; the AoE4 page flow is not affected because no UI changed) and AoE4 build order (no copied helper or tolerance; every engine rule change checked against the docs). Every section whose paths the diff touches was applied.
