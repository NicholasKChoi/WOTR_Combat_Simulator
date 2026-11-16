Title: ticket.md: search criteria are only for doc wording, for every kind of claim (follow-up to #18)

Confidence: low. Two occurrences, but each round had other gaps, so this alone would not have saved a
spec-gate round. File it only if the owner wants fewer findings per round.

## Problem

db5a2d0 (#18) added "A search criterion is only for doc and comment wording" inside the bullet that
begins "Code the change removes is proven gone by a test or the typecheck, never a search". Writers
apply it to removals only. Claims that something is unique ("exactly one implementation exists") or
unreachable are still written as searches over code, and the spec-gate bounces them.

## Evidence (WOTR_Combat_Simulator, strategy-game-sim, both tickets written after db5a2d0)

- SGS-151 Re-spec 1 (spec-gate-1 gap 1): "Exactly one implementation ... exists in test code; none of
  the three test files re-implements them - a search/reading criterion over code with no test or
  typecheck behind it."
- SGS-153 Re-spec 1: "`FAIL smoke:` 'unreachable' was wrong (`browser.close()` can reject) and was
  checked by a search."

## Suggested edit

`agents/ticket.md`, Write, as its own bullet ahead of "Code the change removes ...":
```diff
+  - A criterion about code (a name is absent, unique, unreachable, or appears once) is proven by a
+    test, the typecheck, or a lint rule (for duplication, the repo's duplicate checker), never by a
+    search. Search criteria are only for doc and comment wording: scoped to the doc paths, stating the
+    end state, with no match count.
   - Code the change removes is proven gone by a test or the typecheck, never a search: a test
     asserts the removed behavior is absent, or deleting the export makes a leftover reference a type
-    error. A test that asserts absence names what is gone, so a search over code collides with it.
-    A search criterion is only for doc and comment wording: scoped to the doc paths, stating the
-    end state ("no README section names the `text` field"), with no match count.
+    error. A test that asserts absence names what is gone, so a search over code collides with it.
```

Source: retro 2026-11-15 (WOTR_Combat_Simulator, strategy-game-sim), pattern 9.
