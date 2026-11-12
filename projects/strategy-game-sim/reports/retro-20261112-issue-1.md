Title: Ticket grep criteria must exclude tests and specs (reopen #10)

## Problem
#10 was closed as superseded by fcb83d1 with "reopen if grep-criteria bounces recur in a milestone
ticketed after that commit". They recurred: in project strategy-game-sim, three M9 tickets written
after fcb83d1 bounced at spec-gate for end-state greps that collide with tests:
- SGS-135 RS1: "no occurrence of <removed id>" while the ticket's own absence tests must name the id;
- SGS-138 RS2: a search criterion forbade the ids in tests;
- SGS-141 RS1: an end-state grep over the repo.
A test asserting X is absent must contain X, so such a grep cannot pass. Each bounce cost a re-spec
plus a gate (about $0.67).

## Suggested edit
agents/ticket.md, under "Check criteria you can run", add:

```diff
+- A grep or search criterion that asserts something is gone scopes its paths to source and
+  excludes test and acceptance dirs (for example `-- src/ ':!**/*.test.*' ':!acceptance/'`).
+  Tests that assert absence may name the removed id; never forbid it there.
```

And in agents/spec-gate.md, the matching check: "a repo-wide grep criterion that would match the
ticket's own tests is NEEDS_SPEC".
