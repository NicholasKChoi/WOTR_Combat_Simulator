# SGS-013 implementer report

- Ticket: SGS-013 (write `docs/aoe4-build-order.md`)
- Branch: `sgs-013-aoe4-design-doc`, base origin/main 0b985f3
- Tip SHA: b9c9dc428ee794b6b6ea0a0b63874330758cd242 (author choinickolas@gmail.com)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-013-aoe4-design-doc
- Not pushed; no PR.

## Files touched
- `docs/aoe4-build-order.md` (new, 424 lines): the AoE4 design doc. No other file changes (`git diff --stat origin/main` shows only it).

## Structure (`##` headings, Scope 1-10)
Purpose and model; Determinism, bounds and resources; Data sources; Model rules; Technologies; Build order input;
Route; Outputs; CivRules seams; Extension points. Two Mermaid diagrams: data-flow flowchart (Build order input) and a
step-lifecycle `stateDiagram-v2` labeled conceptual with a state -> `StepTiming.status` table (Outputs).

## Checks run
- Hygiene grep from the acceptance criteria: prints nothing (exit 1).
- `git grep -c '^```mermaid'`: 2.
- Line count: 424 (target 300-450).
- Paste examples verified against the aoe4world data at commit e89f01e (fetched to scratchpad): `villager`, `town-center`,
  `house`, `mill`, `wheelbarrow` (producedBy `mill`, so `research wheelbarrow at mill` is valid), `council-hall`
  (class `age1_landmark2`), `archery-range`, `longbowman`, `veteran-longbowmen`, `scout`, `kings-palace` all exist as English
  baseIds. Every example line parses under the doc's own grammar (suffix order, `walk Ns` last, `#k`, `xN`, kebab-case).
- `npm ci && npx next build`: pass. `npx tsc --noEmit`: pass. `npm test`: 4 files, 57 tests passed. Codegen: not set.
  Local Node 22 (EBADENGINE warning only).
- No unit tests written: doc-only ticket, no logic.

## Notes for the reviewer
- Bounds table copied row for row from design/M2.md; the two parenthetical rationales ("= max durationSeconds",
  "= maxPopCap") reworded to "the largest `durationSeconds`" / "the population cap".
- Hand values: the doc says each carries its own `source` and `unverified` label; labels the wiki gather rates, builder
  scaling formula, farm bonus and 5 s walk unverified; says some carry capacities are observed in game and not labeled
  unverified. No deer/boar rates, trip seconds, supply values, starting resources or villager placement are stated; it
  points to `rules/base.json` / `rules/english.json`.
- Statements I inferred where the design is terse (check these): a trigger-less step arms as soon as earlier steps
  have started; `times` samples every `sampleSeconds` up to the horizon; "any issue stops the request; nothing is simulated"
  (from the 400 contract); issue code glosses (`syntax` = grammar mismatch, `unknown-id` = id or node not in data,
  `invalid` = well-formed step that breaks a rule); "refreshing the snapshot replaces it and records the new commit and patch".
  The doc does not assign an issue code to a villager `produce` without `rally` (design says rally is required but names no code).
- The `research` example without `at` and the `at <building>` example both appear; the example block is marked "each line
  stands alone" since it is not a runnable build order (e.g. no archery range is built before `produce longbowman`).

## Invariant check
- A1, A2, A3, S3: each stated in its own sentence with its observable consequence (Determinism section). No code changed,
  so no invariant can regress. S1/S2 untouched.

## Out-of-scope findings
- design/M2.md Summary still describes Recharts 2.15.4 type-checking under TS 4.7.4 and `@types/react` 18; main is now on
  React 19 / TS 7 after the dependency upgrade, so that rationale (and possibly the 2.15.4 vs 3.x choice) is stale for
  the chart ticket.
- CONTEXT.md On merge edits (Design docs row, deleting the AoE4 Decisions lines) are for the manager after review.

## Status
needs_review
