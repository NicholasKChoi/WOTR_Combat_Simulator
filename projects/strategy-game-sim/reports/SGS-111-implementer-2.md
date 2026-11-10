# SGS-111 implementer pass 2 (Rework 1)

- Ticket: tickets/SGS-111-drop-house-gate.md, Rework 1 (review, text)
- Branch: sgs-111-drop-house-gate, tip ce302bb (previous 3844378), base origin/main
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-111-drop-house-gate

## Files touched
- docs/aoe4-build-order.md: replaced the headroom sentence (lines 332-334) verbatim with the review's text, rewrapped.

## Required fixes
- [x] Sentence replaced verbatim: "Whichever kind it is, a house under construction that finishes within the lead counts toward the planner's headroom, so an explicit step that starts after auto-houses already cover the demand adds a surplus house."

## Doc claims
- The sentence above: `lib/aoe4-build-order/houses.ts:planAutoHouse` filters `demand.pending` to `completesAt <= state.time + lead` (`arriving`) and adds only those to `headroom`; `pending` covers every building under construction (HouseDemand comment), with no distinction between auto and explicit houses.

## Tests / mutation checks
- None written or edited; doc-only change. No pre-existing tests edited.

## Codegen, build, lint
- Not rerun: the diff touches only a Markdown file, which neither `tsc`, `lint:dup` (TS sources), the build, nor the unit suite read. The pass-1 results at 3844378 still apply to all code.

## Invariant check
- No code changed; invariants as in pass 1.

## Out-of-scope findings
- None.

## Status
needs_review
