# SGS-051 tech-lead 1

Decision: NO BLOCKERS - draft PR opened.

PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/60 (draft, base `main`, head `sgs-051-aoe4-build-knight-longbow` at 74afb68, pushed; no new commits). Body set via `gh api -X PATCH`. Single PR, footer stacking, so no stack footer.

## Merge risk
**low** - data-only addition to the prebuilt list: a revert removes it, no API, schema or `criticalPaths` symbol changes, and the shared prebuilt-build tests pin its behavior at 1200 s and 3600 s.

## Review focus
No hotspots: the change adds a JSON build and one list entry. Engine code is untouched, the shared suite validates, round-trips and runs the full prebuilt check on the build at both horizons, and ENG 1TC stays first, so the page's default is unchanged.

## Reviewed
- Range origin/main (441dd1b)...74afb68, 5 commits, authored choinickolas@gmail.com.
- Files: english-knight-longbow.json (+439), data README (+19), builds.ts (+6/-1), builds.test.ts (+17), acceptance specs (+71). Reviewable +464/-1 excluding tests.
- Invariants A1-A3: no amount key, no restated numbers; no step waiting at either horizon; data only. S1-S3 not touched. No criticalPaths symbol touched. No open question answered (CONTEXT has none). Only consumer of listBuilds is pages/apps/aoe4-build-order.tsx; builds[0] unchanged.
- Own probe (temporary vitest file, removed, tree clean): Castle 777.81 s; 1200 s knights 31, longbowmen 54 (13+41 across tiers); gold run-outs 931.85, 1477.30, 2022.74, 2568.19, 3113.63 s; only warning-severity item is sheep node-depleted at 16:38 (4 idle).
- Suite report: tsc, lint:dup, npm test 1076 passed/8 skipped, acceptance 546 passed, next build OK.

## Non-blocking notes
- Sheep runs out at 16:38 leaving 4 villagers idle (warning severity, allowed by the bar since it is not a gold ref). A small build-quality wart a later tune could fix.
- Knights go from 31 at 1200 s to 39 at 3600 s; late-game production is not part of the bar.
- Engine gaps (auto-houses counting under-construction supply; late explicit house gating auto-houses) are already in BACKLOG.md.
