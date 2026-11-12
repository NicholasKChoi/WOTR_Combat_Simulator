Title: Ticket writer: apply the can-it-fail check to every test criterion

## Problem
ticket.md asks "would this fail if the code were wrong" only of mutation criteria. Ordinary test
criteria are not put through it, and the spec-gate pays a round for each. Evidence (project
strategy-game-sim): SGS-128 RS1 (probe could not fail), SGS-135 RS1 (ArrowUp focus check: focus was
already there), SGS-139 RS2 (collapse case could not fail), SGS-133 RS2 (stopping rule passes
vacuously), and SGS-132 Rework 1 where review (#14 rule) blocked a test that could not fail. The
review side works; the ticket side does not.

## Suggested edit
agents/ticket.md, under "Check criteria you can run":

```diff
-- A mutation criterion names the change that must make the test fail.
+- Every test criterion, not only mutation criteria, names its starting state and the wrong
+  implementation it rejects. If the asserted state already holds before the action (focus already
+  there, list already empty, rule satisfied by zero items), change the setup so it does not.
```
