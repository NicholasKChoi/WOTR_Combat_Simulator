Title: Ticket writer must grep existing tests for what Scope changes and name each in Scope

## Problem
The rule "Scope states a rule for existing tests" exists in manage.md and ticket.md, but it does not
fire: nothing makes the writer find which tests depend on what Scope changes, so tickets claim
"existing tests keep their assertions" without looking. Evidence (project strategy-game-sim):
- SGS-131 RS1: "existing tests keep assertions" contradicted the removal test (spec-gate);
- SGS-134 RS1: a new write effect fires on load and breaks an existing spec (spec-gate);
- SGS-132 RS3: the implementer bounced needs_spec after a full implementation because two existing
  acceptance specs depended on the run-bar height; the bounce cost an opus re-spec, gate,
  re-implementation and a separate batch gate (about $5);
- previous window, SGS-124: the same shape.
The spec-gate sees only the ticket text, so it catches contradictions inside the ticket but not a
dependency the ticket never names (132).

## Suggested edit
agents/ticket.md, under "Check criteria you can run":

```diff
+- Before writing Scope's rule for existing tests, grep the unit and acceptance test dirs for every
+  testid, storage key, exported function, route and layout or size property (height, width, order)
+  that Scope changes. Name each matching test file in Scope with what happens to it (unchanged,
+  updated: how, removed). "Existing tests keep their assertions" is allowed only when the grep found
+  none or each hit is named as unchanged.
```

agents/spec-gate.md: "Scope changes a testid, key, function or layout property and names no existing
test for it: run the grep; any hit not named is NEEDS_SPEC."
