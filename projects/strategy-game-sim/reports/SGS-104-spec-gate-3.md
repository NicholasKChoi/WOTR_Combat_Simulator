# SGS-104 spec gate 3

**Verdict: READY**

Scope: the two notes folded after gate 2, and the changed text only. Unchanged sections were not re-audited.

## Folded notes

1. Existing specs rule 4 now covers a box inside either column.
   - It names the results column (compare table in `aoe4-narrow-layout.spec.ts`) and the Build column (editor, issues and step-table assertions in the inline-issues, step-table, step-band and chart-readability specs).
   - The remedy is the same as before: move to the 1800 px `WIDE` viewport with the expected value unchanged, and list the move as a finding.
   - The end state is testable and matches the "no spec left failing or loosened" requirement.
2. The "resize keeps focus and state" criterion now runs as two round trips.
   - (a) Text view: the textarea keeps focus and its value.
   - (b) Table view: the draft cell keeps its value.
   - Pin state is unchanged in both. This matches the fact that only one editor view is mounted at a time.
   - Each case states the break it catches.

## Contradiction check

- No new contradiction with Scope, the invariants (S1, A3), or design M6 C6.
- The Docs section and Open questions (none) are unchanged and still agree.
- The re-spec section has a "(3)" entry and no stray open questions.

## Notes (non-blocking)

- Rule 4 cites "respec 4" inline, while the re-spec headings are numbered 2 and (3). This is a cosmetic label mismatch and does not affect implementation.
