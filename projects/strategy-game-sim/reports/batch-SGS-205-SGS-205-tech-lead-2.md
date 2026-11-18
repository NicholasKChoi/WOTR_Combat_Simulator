# Tech-lead: batch SGS-205-SGS-205

Decision: no blockers, no untested hotspots. Draft PR opened.

- PR #212 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/212, base main, new, head d5c37714fd36e0b5cd7d1f059fa666c4fcd00a7d.

## Merge risk
**low** - one CSS class change on a heading, no public surface or critical path touched; a revert fully undoes it and a Chromium spec pins the computed sizes.

## Review focus
No hotspots: a single class swap from `h6` to `h5`; the new acceptance test measures computed font sizes against the body text, dialog title and a chart title.

## Reviewed
origin/main...d5c3771, 2 files, +31/-1 (page-help.tsx +1/-1, acceptance/aoe4-help-modal.spec.ts +30). Invariants A1-A3 do not apply.

Non-blocking notes: none.
