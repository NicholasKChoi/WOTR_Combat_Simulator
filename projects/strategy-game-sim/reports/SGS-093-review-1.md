# SGS-093 review 1

Branch sgs-093-aoe4-docs-prebuilt-cleanups, tip 6e7ebd3c0a2dde637e1834191ad57f14b5bcb3f2, base origin/main b9481e3
(the merge base is the same commit). Reviewed in a detached worktree at the tip SHA. The branch is not on
origin yet (`origin/sgs-093-...` does not exist), so the worktree was made from the SHA.

**Verdict: APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

1. Intro "idle time" removed: PASS. `docs/aoe4-build-order.md:35` now reads "walk time, drop-off time, distance to
   each resource". `dropOffSeconds` is a real input (`lib/aoe4-build-order/schema.ts:47`, `TRIP_FIELDS` :62).
   I read every line `git grep -n -i idle` returns (286, 294, 315-318, 340-342, 369, 399-418, 421, 431-433, 730,
   762-778, 812, 820, 968, 1010, 1015). Each one means a villager standing at a node or farm with nothing to gather,
   the `farm-idle` or `idle-arrival` code, or one of the "gathering or idle" / "walking or idle" pairs. None means
   transit. 1010 ("holding villagers idle", a future step kind) also means standing still, not walking.
2. Per-key merge sentence and "Ordering and triggers": PASS, and neither needed an edit. Lines 73-75 name `trips`
   (merged per node, then per field), `influenceCoverage` and `nodeAmounts` (merged per key). That covers every
   record field of `SimInputOverrides` (`lib/aoe4-build-order/api.ts:6-9`). Line 157 points at "the wait reasons
   table (Outputs)" with no partial list, and the table exists under Outputs.
3. OpenAPI examples: PASS. The 200 response now has `examples` {buildOrder, goldRunOut}, and the request examples
   use the same keys. `goldRunOut` contains:
   - warnings: `node-depleted` (gold), `idle-arrival` (gold) and `node-depleted` (gold#2);
   - markers: one economy marker, `survival-techniques`;
   - depletions: `gold#2` with depletedAt 74.85.

   I compared the old and new files as JSON. The old 200 `example` equals the new `examples.buildOrder.value`
   exactly. Apart from that conversion and the new `goldRunOut` request example, the spec is identical, so the
   1658-line diff is only the re-nesting. `acceptance/aoe4-simulate-api-contract.spec.ts` passed (as part of the
   174-test run below).
4. Mutations on the contract spec: PASS, based on the implementer's runs, which I did not repeat:
   - changing the marker `at` 50 to 51 fails `goldRunOut ... returns the documented 200 body`;
   - deleting the request key fails the new key-equality test.

   The code backs this up. The per-name test compares the live response to `okExamples[name].value` with
   `toEqual`, and the key test compares `keys(requestExamples)` to `keys(okExamples)` using the existing `keys`
   helper (spec:56).
5. Redundant rally removed: PASS, and I verified it independently with a scratch vitest (deleted afterwards):
   - **Removed rally.** Old build (main) against new build: the result minus `steps` is identical at 1200 s and at
     3600 s. The steps are also identical once old index 31 (380 s TC rally to wood) is dropped and `step` numbers
     are ignored.
   - **Remaining rallies.** I removed each remaining TC or King's Palace rally in turn (new indices 2, 9, 10, 14, 32
     KP, 33, 36). Every removal changes the result at both horizons, even after ignoring step-number and message
     shifts in warnings, so every remaining rally is load-bearing.
   - **Paste round-trip and build-quality cases.** These pass in `npm test` (1351 passed).
   - **README rally prose.** It still holds: sheep until 20 s, gold 130-200 s and 560-700 s, wood otherwise.
6. No stale spear step index: PASS. `MAN_AT_ARMS_STEP` is now 34 (`acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts:8`),
   and the spear digest in `simulate-house-warnings.test.ts:164` is re-pinned. A grep of `acceptance/` and the
   `lib/aoe4-build-order/` tests found no other pinned step index for the spear build. `prebuilt-plans` locates the
   step by unit. I ran the acceptance specs that read the spear build and all pass (list under Coverage).
7. Gold pin: PASS. The new test at `lib/aoe4-build-order/builds.test.ts:191-198` asserts gold `depletedAt`
   `toBe(1200.64894561628)` and gold#2 `toBeNull()`. I reproduced the value at 1800 s. No doc states it. On the
   130 s rally mutation, see note 1.
8. Line length: PASS. Running `awk 'length>110'` prints nothing in README lines 34-127 (Prebuilt builds) or in the
   doc paragraph at 963-972. `ENG 1TC` is no longer alone on a line. Long lines elsewhere in both files were there
   before this diff and are outside its scope.
9. Knight entry: PASS. The README no longer says "step 2x" or "three", and it states the last-`build house` rule.
   In `english-knight-longbow.json` the `build house` steps are 1, 7 and 21-23, and `build kings-palace` is 27, so
   the last house precedes the palace. The wording matches the doc's Houses and supply section (lines 323-329).
10. No measured value added: PASS. The only numbers added are build-file times already in the README, and the pin
    lives only in the test.
11. Invariants: PASS (see below).

## Invariants touched

- A3 (determinism): holds. Only data, docs and tests change. Removing the rally leaves results identical at
  1200 s and 3600 s (verified above).
- A1 and A2: not touched. There is no engine change.
- S3: not touched. There is no route or input change.

## spec-checklist

- **Contracts:** no Key-surface name changed. `operationId` and paths are unchanged.
- **Scope:** nothing in `golang/`, no engine, schema or route change, and `design/M4.md` is untouched.
- **Open-question constants, Naming:** no open question was answered with an invented constant. Names are
  `goldRunOut` and `okExamples`.
- **S1, S2, W1, W2, H1-H3:** not applicable.
- **A1-A3:** as above.

## Linter

`npx tsc --noEmit` is clean. `npm run lint:dup` found 0 clones.

## Review bot

`reviewBot.cli` and `rulesFile` are empty in REPO.md, so there was nothing to run or reconcile.

## Conventions

- **New gold-pin test.** It uses the same `if (build === undefined) throw` guard and `inputsFor(data, {
  durationSeconds })` call as its siblings (`builds.test.ts:150-153`, 183-189).
- **Contract spec.** The new key-equality test mirrors the 400 one (`every 400 example has a request that
  reproduces it`, spec:290-291). The 200 loop has the same shape as the request and 400 loops (spec:258-266).
- **OpenAPI.** The `goldRunOut` 200 `summary` follows the existing "the result of the X request" form.
- **Commit message.** Author email is correct, and it has no ticket ids or factory pointers.

## Correctness

None found. This is a data, docs and test diff.

## REPO.md review checklist

- **Every diff:**
  - `npx next build` succeeded.
  - No page or component changed, so I did not do a page walkthrough beyond the Playwright page spec
    (`aoe4-build-order.spec.ts`, which passed).
- **AoE4 build order:**
  - No helper or constant is copied.
  - The doc sentences changed by the diff hold against the code (see criteria 1 and 9).
  - No UI or layout change, so there were no screenshots to take.
- **Other sections:** not touched.

## Doc claims checked

- **Doc line 35, "drop-off time" is a named input:** true (`dropOffSeconds`).
- **README, spear Town Center rally schedule:** still true after the removal.
- **README, knight entry ("Explicit `build house` steps come early and in a block just before the King's Palace.
  Auto-houses stay off until the last `build house` step has started, so the run can carry an
  `auto-houses-held` warning while production waits at the supply limit before that step starts."):** true
  against the build file and the doc. "Just before" is loose: steps 24-26 (produce longbowman, build stable, KP
  rally) sit between the house block and the palace. The ticket suggested this wording, so it is not a finding.
- **Reflowed doc paragraph (963-972):** the wording is unchanged. Only the line breaks moved.

## Non-blocking notes

1. **The 130 s rally mutation does not fail for every new time.** I moved the rally to each time below and
   re-ran the gold pin:

   | 130 s rally moved to | Gold pin |
   |---|---|
   | 100 s, 120 s, 145 s, 150 s, 170 s | fails |
   | 125 s, 129 s, 131 s, 135 s, 140 s | passes |

   Inside the 125-140 s window the engine gives the identical gold run-out. Villager spawns are discrete, so a
   rally moved between two spawns sends the same villagers. This is an equivalent mutant, not a test defect. The
   implementer's 150 s mutation is a real failing case.
2. **`MAN_AT_ARMS_STEP` is still an index.** The ticket preferred locating the step by action and id over a new
   index. The implementer kept the constant and changed it 35 -> 34. It is correct today, but the next edit to the
   spear build can make it stale again. A follow-up could use `build.steps.findIndex(s => s.action === 'produce'
   && s.unit === 'man-at-arms')`, as `prebuilt-plans` and `builds.test.ts:154` already do.
3. **Missing blank line.** `builds.test.ts:191` has no blank line before the new `it(`, while the other `it` blocks
   in that describe are separated by one.

## Coverage

**Files reviewed** (the full diff):
- `acceptance/aoe4-simulate-api-contract.spec.ts`
- `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts`
- `data/aoe4-build-order/README.md`
- `data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json`
- `docs/aoe4-build-order.md`
- `docs/api/openapi.json` (compared as JSON)
- `lib/aoe4-build-order/builds.test.ts`
- `lib/aoe4-build-order/simulate-house-warnings.test.ts`

**Commands run** (from `npm ci`):
- tsc and lint:dup: clean.
- `npm test`: 45 files, 1351 passed.
- `npx next build`: OK.
- Playwright: 174 passed across contract, spear-longbow-build, prebuilt-farms, prebuilt-plans, timelines,
  spend-population, house-warnings, knight-longbow-build and aoe4-build-order.
- Scratch probes for the rally removal and the 130 s mutation, deleted afterwards. Build file restored, and the
  tree was clean before removal.

**Not reviewed:** I did not re-run the implementer's contract-spec mutations myself. They are covered by reading
the code (criterion 4).

**Processes:** no processes left running.
