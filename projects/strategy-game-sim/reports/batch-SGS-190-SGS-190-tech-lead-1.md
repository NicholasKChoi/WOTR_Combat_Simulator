# Tech-lead gate: batch SGS-190-SGS-190 (tech-lead-1)

## Decision: OPENED (no blockers, no untested hotspots)

| Task | PR | Base | Kind | Head pushed |
|------|----|------|------|-------------|
| SGS-190 `sgs-190-busy-building-wait` | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/202 (draft) | main | new | d550fdce30471655ab9b7886d05d5e6f6a3e1ef1 |

The body was set with `gh api` PATCH, and the response confirmed head d550fdc, base main, draft true. The body source file is `$PROJECT_DIR/reports/pr-202-body-draft.md`. It was input to the PATCH and is not a stale body.

### Merge risk (verbatim)
**high** - changes what the simulate API computes for existing saved and prebuilt builds (start times, the meaning of `waitingOn: 'prerequisite'`, and when a waiting step reserves its cost), and changes the critical-path event loop `offerSteps`.

### Review focus (verbatim)
- [`lib/aoe4-build-order/simulate.ts:567-586`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/202/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R567-R586) and [`:642`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/202/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R642-R642) - if the hold is not cleared at each offer, or lasts past the step's start, a held barracks or town center silently pays nothing for the rest of the run, which cuts production and villager counts in every result - check that `held` is reset before the cursor loop and set only from the blocking step's outcome - pinned by [`simulate-busy-buildings.test.ts`: a produce on several instances starts when every target is free](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/202/files#diff-3775a8548527c21c3cb554b5a1a324856ced009509c8748657d028cbddce3d7eR81-R106)
- [`lib/aoe4-build-order/research.ts:39-59`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/202/files#diff-6dea0adf30bf11d9accf8e7e324e7d858172051b5845ec1a4cbae0e47c1be4d4R39-R59) - a wrong candidate order or a missed free check sends a research to a busy building, which delays or reorders every later step and shifts upgrade times - check candidate order (`at`, then `producedBy`, then instance number) and that the cost is reserved before the busy check - pinned by [`simulate-busy-buildings.test.ts`: a research takes the first free candidate instance](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/202/files#diff-3775a8548527c21c3cb554b5a1a324856ced009509c8748657d028cbddce3d7eR197-R215)
- [`lib/aoe4-build-order/engine-common.ts:72-75`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/202/files#diff-35b3ec4fb3937c43fadaab0ea6b0a6bc00e22339001ac5e39657bb13873f4c61R72-R75) - if a reaction can take an instance held for the blocking step, that step waits again for the reaction's unit and its start time drifts - check that a hold for a different step makes the instance busy - pinned by [`simulate-busy-buildings.test.ts`: a reaction treats instances held for the cursor step as busy](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/202/files#diff-3775a8548527c21c3cb554b5a1a324856ced009509c8748657d028cbddce3d7eR146-R164)

Hotspot pinning, checked by reading the assertions:
- If the `engine.held = null` reset were dropped, or a hold outlived the step's start, barracks 1 would stop paying man-at-arms after the step starts. "releases the hold when the step starts" asserts 3 man-at-arms at 60 s and 5 at 90 s, so it would fail.
- If the `startProduction` skip were dropped, barracks 1's continuous spearman order would pay more spearmen. The test asserts exactly 1 spearman at 120 s.
- Research candidate choice is pinned by a 6-row table covering the expected building and instance plus `startedAt`.
- The reaction hold is pinned by both the produce and research reaction rows, and `instanceFree` by its own 6-row table.

## What I reviewed
- Range: `3bc29b2..d550fdc` (merge-base = origin/main head 3bc29b2, which includes #201). Commits are 613c38d, a39e091 and d550fdc, all authored as choinickolas@gmail.com.
- Files: 16 changed, +480/-122. Reviewable logic is +30/-34: `simulate.ts` +13/-4, `research.ts` +11/-13 and `engine-common.ts` +6/-1, plus the -16 data lines of the Spear/Longbow build.
- Also read: the docs, the README, the re-pinned tests, the new unit test file and the new acceptance spec.
- Invariants checked:
  - A1: no game number is added.
  - A2: a busy wait reserves its cost, `payOrder` respects `engine.reserve`, and `noneNegative` is asserted.
  - A3: `held` is only queried with `has`, and a deep-equal re-run is asserted.
  - S3: unaffected. A never-free target is bounded by the horizon and gives `step-stuck`.
- No irreversibility, security, concurrency, open-question or API-shape issue. The response schema and OpenAPI are unchanged. The timing change is the owner-decided OD3 rule, documented in both docs.
- Stack check: a single member on main. Its diff contains only its own task. SGS-189 is integrated (PR 198). No open PR is stacked above it: SGS-192 and SGS-200 have no PR.
- Acceptance ran at a39e091, which already contains 3bc29b2, so the new `aoe4-simulate-api-unit-lines` spec was in its glob. The suite passed 2715 tests at d550fdc.

## Non-blocking notes
- Commit a39e091's message, "Fix the SGS-190 rework text findings: capital idle example and two test titles", carries a ticket id and process history. If the squash merge keeps the commit list in its body, that text reaches main. Use the PR title as the squash message, or trim the body at merge.
- Saved user builds that relied on the old switch (a `produce` on a busy town center) will now start up to one unit-time later. This is the intended rule, not a defect, and is noted in the PR Summary.

## Cleanup
Scratch `tech-lead-SGS-190-SGS-190` removed after this report (see handback for result).
