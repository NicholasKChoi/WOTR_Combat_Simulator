# BATCH-028-029 tech-lead 1

## Decision: NO BLOCKERS. Two stacked draft PRs opened and linked as gh-stack native stack #36.

Bottom to top:
1. SGS-028: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/34, head sgs-028-aoe4-parse-build-order-text @ 442832e, base main. Merge risk: low.
2. SGS-029: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/35, head sgs-029-aoe4-validate-build-order @ d8bce08, base sgs-028-aoe4-parse-build-order-text. Merge risk: low.

Stack: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/stack/36. `gh stack link 34 35` succeeded. It rejects `--repo`, so it was run from the checkout. No footer was written.
PR bodies were set with `gh api -X PATCH ... -F body=@file`. Both PRs are draft.

### PR 34: Merge risk
**low** - a new module with no consumer yet: a revert fully undoes it, it touches no API, schema, CLI or config, and unit and acceptance tests pin the grammar and the line map.

### PR 34: Review focus
No hotspots: this is a pure, self-contained parser that nothing imports yet. The tests pin the grammar, the line numbers and the format round trip, and a parsing defect cannot reach production until a route uses it.

### PR 35: Merge risk
**low** - a new module with no consumer yet, plus a doc addition: a revert fully undoes it, no route, schema or config changes, and unit and acceptance tests pin every bound at min, max and just outside, plus each `invalid` rule.

### PR 35: Review focus
No hotspots: nothing imports these functions yet, so a defect cannot reach production in this PR. The bounds and rules that will matter once the route uses them are each pinned by a failing case and a passing neighbor.

## Why low, when the tickets are high
The tickets are high-risk tier because of the contract they define. The merge-risk rating comes from the diff. Neither module has an importer on main or in the stack: the route arrives in SGS-033. Each PR is pure library code plus tests, and SGS-029 also adds a doc paragraph. A revert fully undoes either one. criticalPaths is empty. When the route ticket wires these functions into `POST /api/aoe4-build-order/simulate`, that PR takes on the public-surface and S3 factors.

## Reviewed
- Combined range 72d74a0..d8bce08 (merge-base with origin/main = 72d74a0), 6 commits, all authored by choinickolas@gmail.com.
- SGS-028 (72d74a0..442832e): lib/aoe4-build-order/parse-text.ts +356, parse-text.test.ts +453, parse-text.acceptance.test.ts +203.
- SGS-029 (442832e..d8bce08): lib/aoe4-build-order/validate.ts +422, validate.test.ts +512, validate.acceptance.test.ts +298, docs/aoe4-build-order.md +20/-1.
- Stack check: each branch's diff against its base contains only its own task's files. The stack is linear.
- Checked against INVARIANTS.md (S1, S3, A1, A2, A3), the CONTEXT.md open questions (none) and the M2 Contracts sections for Line map, Issue codes, Rally and start, Producer capability, Repeat research, Route and Paste format.
  - S1: the modules import only `./model`, `./data` and `./effects`.
  - S3: the 200-step cap and the per-field bounds are fixed in code and match the design table. Over 200 steps gives one issue and per-step checks are skipped. The 20,000-character cap is defined, and the route enforces it, per the ticket.
  - A1: the trip defaults, `walkSeconds` and the starting villager count are read from data. The remaining defaults are input defaults the design specifies, not game numbers.
  - A3: both modules are pure and deterministic.
  - "Extra properties ignored" is specified in SGS-029 ticket check 1, not decided unilaterally.
- Prototype-key safety: node lookups use `Object.hasOwn`, and id lookups use a Map. `constructor` and `__proto__` as node keys give `unknown-id`.

## Non-blocking notes
1. parse-text.ts:262-263: `sawStep` is set for a step line even when that line had a syntax error. A later `start` line then gets a second issue, "'start' must come before every step". The cause is the same as the step-order rule, and the order is rejected either way.
2. validate.ts:325: on success the result returns the caller's `input` object itself, with any extra properties. This is fine while the engine treats the order as read-only. A future engine that mutates the order would mutate the request body.
3. validate.ts:294 and :297 record a rally source before the producer is confirmed valid. This is harmless: an invalid producer already rejects the order.

## Out-of-scope findings
None.
