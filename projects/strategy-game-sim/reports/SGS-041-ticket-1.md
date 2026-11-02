# SGS-041 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-041-aoe4-research-multitier-note-severity.md

Summary: Task, component aoe4-build-order, ~60 business-logic lines, depends on SGS-037 (transitively SGS-035). Adds `researchEntry` (highest age <= state.age), `EffectState.researchedIds`, `activeEffects` reading entry ids, `resolveUnitEntry` reading the researched entry's age, notes named by `baseId` with `severity: 'info'`, `BuildOrderNote.severity` plus OpenAPI, and the doc sections for those. Nine criteria plus no-regression.

Risk: high (plan said medium). A required field added to the existing `BuildOrderNote` response schema (additionalProperties false) is a public-schema change; chosen under "when in doubt, higher".

Diagram: none (single component, not the core loop).

Command-style criteria checked against current code: `git grep "byBaseId.get(step.tech)\[0\]"` gives 2 matches today (handler, notes) and 1 after; `entry.name` in research.ts gives 2 today and 0 after. No mutation criteria.

Open questions (both `designer`):
1. Which entry `researchNotes` classifies for a multi-tier tech (pure function of order and data, must cover unreached steps). Ticket keeps `[0]`, same result for every current tech.
2. `researchEntry` state type: ticket uses `EffectState`; design leaves it unspecified.

Notes: the `prerequisite` waitingOn reason is SGS-042's; this ticket only keeps the step unstarted without reserve. 34 test sites need `researchedIds` added. Overlap: research.ts is shared with SGS-042 and SGS-044 (rebase only); docs sections limited to this ticket's behavior (decision 8). On merge: none.
