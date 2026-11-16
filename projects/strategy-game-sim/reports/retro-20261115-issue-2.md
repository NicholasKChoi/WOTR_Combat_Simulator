Title: ticket-lint: flag `Invariants: none` when a Scope path matches an INVARIANTS.md Paths glob

## Problem

`agents/ticket.md` says INVARIANTS.md entries go in the ticket's `Invariants` field when "their `Paths:`
match the files it touches, or they guard behavior it changes". Writers read that as "entries the change
could break", so they write `none` for CSS-, test- or doc-only changes on matching paths. The spec-gate
applies the rule literally and returns NEEDS_SPEC, which costs a re-spec and a gate round each time.

## Evidence (WOTR_Combat_Simulator, strategy-game-sim, 2026-11-12..13)

- SGS-144 Re-spec 3: the only finding in that round. The ticket said "none (... no `Paths:` entry guards
  these rules)", but INVARIANTS.md has `Paths: ... components/apps/aoe4-build-order/**` and the ticket
  edits two CSS files there (spec-gate-2).
- SGS-151 Re-spec 1: spec-gate-1 gap 2, "Invariants field says `none`, but the ticket touches
  `lib/aoe4-build-order/**`, the Paths of A1-A3".
- SGS-157 Re-spec 1: spec-gate-1 gap 4, the same finding for `components/apps/aoe4-build-order/**`.

All three tickets were written after the 2026-11-12 ticket.md fixes.

## Suggested edit

`scripts/ticket-lint.py`: when the ticket's `Invariants` field is `none` (case-insensitive, any trailing
text), collect the backticked repo paths in Context and Scope. Load `$FACTORY_DIR/INVARIANTS.md` (the
lint already knows the ticket path; FACTORY_DIR is two levels up from `projects/<slug>/tickets`). Parse
each section's `Paths:` globs. Report
`Invariants is none but <path> matches the Paths of <section heading>; name the entry (it may say "paths
touched, not affected")` for every match. Use `fnmatch` with `**` support, as other Paths consumers do.

`agents/ticket.md`, Invariants line, to make the intent explicit:
```diff
-- Note which INVARIANTS.md entries the change is adjacent to (their `Paths:` match the files it
-  touches, or they guard behavior it changes); they go in the `Invariants` field.
+- Note which INVARIANTS.md entries the change is adjacent to (their `Paths:` match the files it
+  touches, or they guard behavior it changes); they go in the `Invariants` field, even when the change
+  cannot affect them ("A1-A3: paths touched, not affected"). `ticket-lint.py` checks the path match.
```

Source: retro 2026-11-15 (WOTR_Combat_Simulator, strategy-game-sim), pattern 2.
