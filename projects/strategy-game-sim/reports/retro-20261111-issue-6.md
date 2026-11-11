review.md: a test that cannot fail is never a note; dictated preconditions must leave room to move

## Problem

#4 told review never to downgrade a test that cannot fail. Review now blocks some, but still files others as
non-blocking notes with softer words ("rarely fails first"). And when review dictates a replacement test, it
can dictate a precondition under which the action still cannot change the asserted value, so the rework
repeats.

## Evidence (after #4 landed)

- Two reviews filed a test that cannot fail (a memory-store test; a test that "rarely fails first") as note 1, not a blocking finding.
- One review dictated a scroll test whose precondition left the element already at max scroll. The reworked
  test still could not fail, the same criterion came back in rework 2, and the ticket went to re-spec.

## Suggested edit

`agents/review.md`, test-strength section:

```diff
 A test that cannot fail is REQUEST CHANGES, never a note.
+This includes tests that "rarely" or "may not" fail first: if reverting the change under test leaves the
+test passing in any normal run, it is blocking.
+When you dictate a test, state its precondition so the action under test can move the asserted value
+(for example: not already at max scroll, not already the default, list not already empty), and say what
+the value is before and after.
```
