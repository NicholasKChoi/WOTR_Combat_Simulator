Comment on existing issue #41 (implementer and acceptance-test: mutation-check each table row, named
claim, and assertion). Not a new issue.

---

More evidence from WOTR_Combat_Simulator (project strategy-game-sim, 2026-11-12..15). Five review
reworks were for tests that could not fail:

- SGS-135 review-1: the acceptance test "ArrowUp on the first chart and ArrowDown on the last change
  nothing, keep focus and do not scroll" was mutation-checked once, on the status text (implementer-1).
  The "do not scroll" claim had no break that failed it, and it passed only because of a race. This is
  your per-claim case exactly.
- SGS-147 review-1: "another tab changing an unrelated key leaves My builds, and clearing storage there
  removes them". The implementer broke the listener, and the clear half failed. The unrelated-key half
  could not fail, because storage still held both builds. Per-claim again.
- SGS-139 review-1 and SGS-157 review-1: acceptance specs the implementer never ran. That is a separate
  rule conflict, filed as "Implementer runs and mutation-checks the acceptance specs a ticket makes it
  write".
- SGS-156 review-1, a shape the proposal does not name: "holds one house cost when several houses are
  due" asserted its "several are due" precondition on a different setup (`houseBuilders: 1`, 6 due)
  from the run it then asserted (4 builders, exactly 2 due). A tuning change could leave the test
  checking nothing.

Suggested addition alongside the #41 diff, in `references/common.md` Tests:
```diff
 A test whose meaning depends on the data (a deposit runs out by 3600 s, an entry exists, a list has
 more than one row) first asserts that condition, so a later data or tuning change fails it loudly
-instead of leaving it passing while it checks nothing.
+instead of leaving it passing while it checks nothing. Assert the condition on the same run, render,
+or fixture the test then checks, never on a separate setup.
```

Source: retro 2026-11-15, pattern 5 (`.claude/code-factory/projects/strategy-game-sim/reports/retro-20261115.md`).
