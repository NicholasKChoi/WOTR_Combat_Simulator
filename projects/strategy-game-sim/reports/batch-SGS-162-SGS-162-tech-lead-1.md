# Tech-lead report: batch SGS-162-SGS-162

Decision: opened draft PR, no blockers, no untested hotspots.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/174 (base main), new, head SHA 06eb4218d3bdb4280ac11075d3bee55161ccdee0, branch sgs-162-reread-availability-check.

## Merge risk
**low** - a revert fully undoes it, no public surface or `criticalPaths` symbol is touched, and acceptance tests pin both new branches.

## Review focus
No hotspots: a one-line guard in a client-side listener; the ordering (key filter before the probe) and the unavailable-storage branch are each pinned by a new acceptance test that fails if the order or the gate is removed.

## Reviewed
Commit 06eb421 on origin/main; files pages/apps/aoe4-build-order.tsx (+2/-1), acceptance/aoe4-my-builds.spec.ts (+49), docs/aoe4-build-order.md (+2/-2). Checked: the probe writes only its own PROBE_KEY (not the My builds key), and the key filter runs first, so no cross-tab probe loop. No invariant touched (aoe4 A1-A3 unaffected). No secrets, no schema change.

## Non-blocking notes
- `gh pr edit` fails on the classic-projects GraphQL deprecation; the body was set through `gh api PATCH` instead.
- The `toHaveCount(0)` in the unavailable-storage test could pass on first poll before render; mitigated by the preceding event poll.
- The stack marker `<!-- code-factory-stack -->` was copied from earlier PR bodies since REPO.md has no stackMarker field.
- Scratch checkout removed.
