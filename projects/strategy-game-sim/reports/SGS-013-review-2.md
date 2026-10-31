# SGS-013 review 2 (rework 1, full review)

- Branch `sgs-013-aoe4-design-doc`, tip 07ebae7. The branch is not on origin, so it was reviewed in a detached worktree at 07ebae7 (`worktrees/review-sgs-013-aoe4-design-doc`, removed afterwards). Merge base is 0b985f3. `origin/main` is 43a0331, and `git diff --stat origin/main...HEAD` shows only `docs/aoe4-build-order.md`.
- Diff: one new file, `docs/aoe4-build-order.md` (441 lines). The rework delta b9c9dc4..07ebae7 is +34/-17 in that file only.
- Verdict: **APPROVE**. No blocking findings. All 16 acceptance criteria are ticked in the ticket.

## Blocking findings

None.

## Rework 1 required fixes, checked

| fix | doc lines | result |
|---|---|---|
| Calibration sentence; "never a source" limited to raw gather rates | 96-99 | Done. Says trip walk and drop-off defaults are tuned toward the calculator's net rates, are labeled unverified, and that the calculator is "never a source of raw gather rates". Matches the CONTEXT "AoE4 gather rates" decision and SGS-014's trip-seed derivation (SGS-014 ticket l.83-85). |
| Name supply, starting state, overlay rows, trip walk/drop-off as unverified; carry capacities stay verified | 77-81 | Done. "Not every value is: the sheep, deer and boar carry capacities are observed in game". This matches SGS-014 l.56-57 and l.70-73 (`unverified: false` only for those three). It never says all hand values are unverified. |
| Issue-code table from design/M2.md | 311-327 | Done. Compared row by row with design/M2.md l.88-100: all seven codes present, same meanings, "complete and the same for JSON and paste", the rule of thumb, and villager `produce` without `rally` = `invalid` on that step/line. The `unsupported-tech`/`unknown-tech-effect` row says "rejected by `classifyTech`" where the design says "per `TechSupport`". These are equivalent. |
| Sampling rule | 364-367 | Done. Matches design l.102-105: `0, s, 2s, ...` up to and including `durationSeconds`, last sample `durationSeconds` when not a multiple, one value per sample, t=0 after zero-time steps start. The explicit `times.length` formula is omitted, but it follows from the rule. |
| `forestry-1` consistent; OverlayEffect rows not called `HandValue`; `capital-town-center` in examples | 216, 233; 77-78; 282, 290, 304 | Done. |
| Criterion 12 includes the two sentences | see criterion 12 | Done. |
| `none` trigger kind removed from issue row | 318 | Done. Matches design l.93 verbatim. Paste table l.276 now reads "(no prefix) / no condition" and no longer implies a `none` kind. |

## Spec gaps

None that block this ticket. One for the engine ticket or designer is under Out-of-scope findings.

## Acceptance criteria

1. Exists, 10 `##` headings in Scope order, 300-450 lines: PASS (441 lines, 10 headings).
2. Hygiene grep: PASS (no output, exit 1).
3. Mermaid >= 2: PASS (2).
4. Diagram labeled conceptual, mapping matches Scope, Outputs lists four statuses: PASS (384-403, 374).
5. Contract names match design exactly, no extra names: PASS. The rework adds no new contract names. `capital-town-center` is a snapshot baseId, not a contract name.
6. `startingState` fields, 7/10, never in `unitsProduced`, hook overrides the whole object, sheep are a node: PASS (116-122, 369-370).
7. Engine rules, `classifyTech` order, grammar table and details agree with the design line by line: PASS. I re-diffed against design l.107-145 and l.220-236. The paste table differs only in the "(no prefix) / no condition" row label, a deliberate rewording that avoids a `none` kind.
8. Paste examples parse and use English-snapshot ids: PASS. Checked against `data/aoe4-build-order/aoe4world/english.json` (aoe4world/data e89f01e, from the SGS-014 worktree):
   - `capital-town-center` exists and is in villager `producedBy`.
   - `wheelbarrow` has producedBy `mill`.
   - `council-hall` has class `age1_landmark2`.
   - `archery-range`, `longbowman`, `veteran-longbowmen` (upgrade, age 3), `house` and `mill` exist.
   - `forestry-1` has effect property `unknown`.
   - `shaft-mining`, `military-academy`, `lightweight-beams` and `kings-palace` (`age2_landmark1`) exist.
   - Every line follows the suffix order, `walk Ns` last, and the `#k`/`xN` spacing rules.
9. Bounds table row for row, `out-of-range` for JSON and paste alike: PASS (41-56 against design l.206-218).
10. Numbers match the sources; labels: PASS. All listed numbers trace to CONTEXT or design. Unverified labels cover gather rates, builder scaling, farm bonus and the 5 s walk, plus the new sentence. Carry capacities are never called unverified.
11. No unsourced hand values: PASS. The rework adds no values.
12. Decisions coverage line by line: PASS. The three lines that failed in review 1 are now covered:
    - "AoE4 gather rates": tuning rule at 96-99.
    - "AoE4 auto-houses": supply unverified at 78.
    - "AoE4 v1 coverage and structure": starting state, supply, overlay (landmark and farm) rows, and walk/drop-off defaults unverified at 78-79.

    The other seven lines are unchanged from review 1 and still covered. All ten lines that On merge deletes can be deleted. Keeping "AoE4 interface" is correct.
13. A1, A2, A3, S3 one sentence each with an observable consequence: PASS (32-39).
14. v1 coverage and out list match CONTEXT item for item: PASS (202-222).
15. Only `docs/aoe4-build-order.md` changes: PASS (against both 0b985f3 and origin/main).
16. No INVARIANTS regressions: PASS.

## Invariants touched

- A1, A2, A3, S3: restated in the doc, not changed. All hold. S1/S2, W1/W2, H1-H3: no paths touched.

## spec-checklist.md

- Contracts: the route is not yet in CONTEXT Key surfaces, which is expected; the ticket's On merge defers Key surfaces to the route and page tickets. No conflicting name.
- Scope: English only, no `golang/`, no open question answered with a constant.
- Naming and S1-S3/A1-A3 code items: not applicable to a doc-only diff, beyond the restatements checked above.

## Lint and build

- `npx tsc --noEmit` at 07ebae7 after `npm ci`: exit 0. The repo has no ESLint config, and the diff is Markdown only.
- `npx next build` at 07ebae7: exit 0.
- `git status` was clean afterwards. `npm ci` did not touch the lockfile.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty in REPO.md, so no bot was run and there are no bot findings to reconcile.

## Conventions

The doc still follows `docs/combat-simulator.md:1-17`: title, a one-paragraph lead that says "Reviews judge ... against this doc", one `##` per topic, and rules stated flatly. The new issue table uses the same `| a | b |` layout as the doc's other tables. It is placed at `docs/<app>.md`, per ARCHITECTURE.md "Where files go". Commits are authored as choinickolas@gmail.com, with no ticket ids or PR numbers in the messages.

## Non-blocking notes

- `docs/aoe4-build-order.md:78`: "Supply ... labeled unverified" does not plainly cover `maxPopCap` (200), which l.176-177 places in `rules/base.json`, apart from `supply`. CONTEXT "AoE4 auto-houses" lists "max 200" among the unverified supply values. "Supply (including the 200 cap)" would be exact. SGS-014 labels it unverified anyway.
- `docs/aoe4-build-order.md:311-312`: "A paste error carries the 1-based `line`; a step error carries `step`." design/M2.md never says lines are 1-based. That is the universal convention, but strictly it is an unstated choice. The sentence can also be read as saying paste validation errors carry `step`, while l.325-326 and the design say `line` for paste. Suggestion: "Every issue from paste input carries its `line`; from JSON, its `step`." Ask the designer to confirm 1-based, or drop the word.
- `docs/aoe4-build-order.md:368-369`: "`tier`, the entry's age" can still read as two fields (carried over from review 1). "`tier` (the entry's age)" would be clearer.

## Out-of-scope findings

- Spec gap in design/M2.md, for the engine or validate ticket: the design gives no rally target for the default continuous villager production ("optimal villagers" with no `produce` step, doc l.19-20 and CONTEXT "AoE4 model scope"). A villager `produce` step without `rally` is `invalid` (design l.97, l.100), but nothing says where villagers from the default order go, or whether the rally walk applies to them. The doc correctly does not invent an answer. The designer should decide before the engine ticket.

## Coverage

- Reviewed: all 441 lines of `docs/aoe4-build-order.md` and the rework delta b9c9dc4..07ebae7. Compared against design/M2.md (all lines, including the new Issue codes table and Sampling paragraph), CONTEXT.md Decisions, INVARIANTS.md, spec-checklist.md, ARCHITECTURE.md, `docs/combat-simulator.md`, the SGS-013 ticket (including Rework 1), review 1, and SGS-014's labeling and trip-seed scope.
- Snapshot ids were verified against the SGS-014 worktree's `english.json` (source commit e89f01e, patch 17.0.12182).
- REPO.md "Every diff": `next build` passes. No page or code changed, so no `npm run dev` page load was needed. No path-scoped checklist section covers `docs/`.
- No REVIEW.md at the repo root. Project LESSONS.md is empty. The repo LESSONS lockfile rule holds (`npm ci` only, lockfile unchanged).
- Not done: Mermaid rendering was not checked with a renderer, only by reading the syntax (`A --> B & C` and forward node references are valid).
