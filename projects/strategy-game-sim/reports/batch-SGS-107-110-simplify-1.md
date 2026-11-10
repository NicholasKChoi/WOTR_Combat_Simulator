# Batch SGS-107..110 simplify pass 1

Simplify was run inline per branch (no sub-agents). No push, no PRs.

| Branch | Trimmed | New tip |
|---|---|---|
| sgs-107-step-annotation-model | step-timeline.tsx now imports the shared `finishedText` instead of a local duplicate | a5d180e |
| sgs-108-step-run-cell | Nothing. Rebased onto 107 (one trivial conflict in step-timeline.tsx, took 108's side). A redundant-looking status check in `annotationToneClass` is pinned by its tests with inconsistent runs, so it was kept. | 740a094 |
| sgs-109-row-hover-drop-timeline | Nothing. Rebased onto 108 cleanly. A dead-CSS trim in results.module.css was reverted: `scrollBox` and `scrolledTable` are used by compare-panel, and removing them broke the narrow-layout spec. | 96b926a |
| sgs-110-text-gutter-annotations | Caret line uses `lineCount`. The gutter reuses `kindBorder` from step-annotation.module.css, and the duplicate `.annotations li.annotation` rule is deleted. Unused `DURATION` and `LINE_OF.comment` removed from the compact-view spec. | (see below) |

## Tests
- 107: tsc clean, npm test 1910 pass, playwright step-band + timeline-compare 14 pass.
- 108 (after rebase, no trim): tsc clean, npm test 1970 pass, playwright step-annotations + pin-compare 48 pass.
- 109 (no trim): tsc clean, npm test 1963 pass, playwright step-band, results-split, narrow-layout, m3-flow, knight-longbow 28 pass plus narrow-layout rerun green at baseline.
- 110: tsc clean, npm test 1968 pass, playwright compact-view + step-annotations + step-band 35 pass.
- The 108 change to scripts/smoke-preview.mjs and acceptance/smoke-preview.spec.ts was not exercised (needs a deployment).
110 tip: 44e23e8
