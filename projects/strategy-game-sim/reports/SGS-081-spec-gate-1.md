# SGS-081 spec gate 1

Verdict: NEEDS_SPEC

## Gaps

1. Scope 3 and the diff-stat criterion - the pin list is incomplete, and the criterion forbids the fix.
   - Several other tests run the shipped builds and pin their output or step indexes, and Scope 3 does not name them.
   - Example: `acceptance/aoe4-simulate-api-timelines.spec.ts` runs `english1tc` and pins step timings.
     - It pins `steps[4]` startedAt 143.56..., the Feudal `reachedAt` 262.56..., the final counts [57, 51, 50], and `steps[14]` and `steps[22]` timings.
     - `steps[14]` and `steps[22]` shift if a farm step is inserted into 1TC before them.
   - Other files that import or load a shipped build:
     - `aoe4-simulate-api-spend-population.spec.ts` (english1tc)
     - `aoe4-simulate-api-markers.spec.ts` (english1tc)
     - `aoe4-simulate-api-waits.spec.ts` (english1tc)
     - `aoe4-simulate-api-triggers.spec.ts` (english1tc)
     - `aoe4-simulate-api-research.spec.ts` (english1tc)
     - `aoe4-simulate-api-depletion-engine.spec.ts` (english1tc)
     - `aoe4-simulate-api-house-warnings.spec.ts` (knightLongbow)
     - `aoe4-build-order-knight-longbow-page.spec.ts` (knightLongbow)
     - `aoe4-simulate-api-veterancy-conversion.spec.ts` (knightLongbow)
     - `lib/aoe4-build-order/simulate-triggers.test.ts` (1TC, line 252)
     - `lib/aoe4-build-order/simulate.test.ts` (`listBuilds()[0]`, line 715)
     - `lib/aoe4-build-order/text-to-build.test.ts` and `schema.test.ts` (not checked for pins)
   - Why an implementer would guess: the criterion says `git diff --stat` touches only the listed test files, and `npm run acceptance` only has to pass "for the AoE4 specs named in Scope 3". A pin that moves in an unlisted file has no instruction.
   - Proposed fix:
     - Replace the closed list with a rule: any test whose pin on a shipped build's output or step index fails after the re-tune is re-derived (or its index updated), never loosened. List them in the report.
     - Widen the diff-stat allow-list to "test files that pin a shipped build".
     - Require the full `npm run acceptance` AoE4 set, not only the specs in Scope 3.
     - Grep seed: `grep -lE "english-(1tc|knight|spear)|listBuilds"`.

2. Scope 1 - the step indexing base is not stated.
   - The ticket says "steps 9 to 11", "5 to 7", "45 to 56" for the files.
   - These match 0-based indexes: 1TC farm steps are at indexes 9-11, 16-17 and 21.
   - Scope 3 also uses 0-based `i < 21`.
   - Why an implementer would guess: the README and the page show steps 1-based.
   - Proposed fix: add "indexes are 0-based, as in `steps[]`".

## Notes (non-blocking)

- The Depends-on line omits SGS-079, but Scope 4 depends on whether it has merged.
  - The two-branch instruction is workable.
  - Prefer naming SGS-079 as a soft dependency, or merging it first.
- Scope 3 relies on SGS-080's "implementation report lists failing tests", which does not exist yet. The fallback (`needs_spec`) is stated, so this is acceptable.
- Checked and fine:
  - All named files exist: the three builds, `builds.test.ts` with its `describe.each` and `simulateTo`, and `docs/aoe4-build-order.md` line 936 (the "Prebuilt builds live in" paragraph).
  - The 681 s trigger is at spear step 23.
  - The README currently has 6 matches of `[0-9]+\.[0-9]+ s` in the Prebuilt-builds section. The "0 on the SGS-079 branch" claim was not verified.
  - Open questions are none, and CONTEXT.md Decisions is empty, so there is no conflict.
  - No LESSONS.md entry applies.
  - Risk `standard` is reasonable for data-only edits: no engine or criticalPaths symbol changes.
  - No diagram is needed.
  - Input validation does not apply.
  - On merge: none is correct.
- Criterion 1's "catches" check (re-time the first farm 60 s later) holds in the end state.
