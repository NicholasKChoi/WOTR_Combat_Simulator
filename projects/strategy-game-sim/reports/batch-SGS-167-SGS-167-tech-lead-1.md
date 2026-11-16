# Tech-lead report: batch SGS-167

Decision: no blockers, no untested hotspots. Draft PR opened.

- PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/176, base main, new, head 8b017ef6a485ffdff5f3c379939ca168ab4e804c

## Merge risk
**low** - acceptance test code only, no public surface or critical path touched, and a revert fully undoes it.

## Review focus
No hotspots: test-only refactor of how layout values are read; the converted specs themselves exercise each changed site.

## Reviewed
Combined diff origin/main...8b017ef: 5 files under acceptance/, +67/-37. Invariants: none apply (no lib/components/pages paths). No schema, security, concurrency or contract change.

## Non-blocking notes
- The 1200 s versus 300 s width assertion in the pin-compare spec is now inside expect.poll (it was a one-shot assertion); this is a retry, not a weaker relation.
- lineEndYs with duplicate keys works (same result per key).
