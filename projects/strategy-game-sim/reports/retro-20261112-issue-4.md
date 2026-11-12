Title: Planner outlines name the owner of each shared test, spec and helper

## Problem
Tickets written in parallel waves see only their own outline, so two writers change or claim the same
spec or helper. Evidence (project strategy-game-sim, M9): SGS-137 RS1 conflicted with sibling SGS-138;
SGS-133 and SGS-132 both changed the run-bar spec; SGS-141 RS1 left a helper's source conditional on
SGS-132. Each was a re-spec plus gate.

## Suggested edit
agents/planner.md, outline format: add `Shared:` listing each test file, acceptance spec and helper
that more than one outline touches, with the one outline that owns it; the others depend on it.
agents/ticket.md: "When your outline lists a Shared item you do not own, depend on its owner and do not
change it in Scope."

Confidence low: changes planner output; side effects on ordering not measured.
