# SGS-011 spec gate 3

Verdict: READY

Gate 2 gap (AC1 grep count) is closed. The re-spec 2 change introduced no new contradiction.

Check: at 96d2602, `git grep "models/army"` hits 4 lines: ARCHITECTURE.md:55-56, caps spec:132, spec-surface spec:26, openapi.json:6. After the Scope edits, ARCHITECTURE.md and openapi.json lose theirs. The retitled caps test no longer has the path in its title. The caps request URL (line 132) and the spec-surface not-contain assertion are the only two remaining. AC1's "exactly two" matches Scope and the searched-directory list.

Other ACs, Risk (high), On merge, invariants (W1, W2, S3) and Open questions (none) were not touched by re-spec 2 and still agree.

Notes (non-blocking): the implementer should keep each of the two remaining matches on a single line, because `git grep` counts lines.
