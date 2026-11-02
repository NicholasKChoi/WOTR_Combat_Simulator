# SGS-053 spec gate 2

Verdict: READY

Gap from gate 1 is closed. Scope item 7 now covers the ~220 start.rally statement, the ~221 walk-list bullet and the ~272 auto-house paragraph. The builder-walk criterion is widened to "every builder-walk statement" with a grep check. Verified against docs/aoe4-build-order.md on main (f078c11): lines 220, 221 and 272 lack the divisor today, and line 212 and 219 already have it. The other items are unchanged and still hold: shaft-mining at line 341 (1 hit), admiralty 0 hits, mermaid edge at 467 with no parse-to-error edge, "Any other failure" at 573-574. design/M2.md lines 31 (no EffectState), 140, 198 and 369 match the described edits. Risk low, no invariants adjacent, no open questions, and On merge covers the state-branch edits.

Notes (non-blocking)
- The "any other HTTP failure" criterion is a line-based grep, but the current sentence wraps ("Any" / "other failure"). Keep the phrase on one line when rewording, or the grep count will be 0.
- Only SGS-054 lists SGS-053 as a dependency, so the root-ordering claim is not enforced for other doc-editing tickets (conflict risk only).
- Optional: label the existing `parse --> validate` edge "ok" for symmetry.
