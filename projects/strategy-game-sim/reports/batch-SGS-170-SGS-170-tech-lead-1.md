# Tech-lead report: SGS-170

Decision: no blockers, no untested hotspots. Opened draft PR.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/185 , base main, new, head eb35dae9b7679a0447d100262ce3f52b279fdc6f

Merge risk: **low** - UI-only change to one text-editor gutter component; no public surface, schema or criticalPaths symbol touched, a revert undoes it, acceptance tests pin the behavior.

Review focus: No hotspots. Placement and last-event-wins logic are pinned by acceptance/aoe4-step-annotations.spec.ts (viewport/clipping at 360/768/1280 including last line; hover/caret last-wins; caret-only).

Reviewed: origin/main...eb35dae, 7 files, +264/-23 (about +82/-8 excluding tests). Invariants: none touched. No security, irreversibility, concurrency or contract concerns.

Non-blocking notes: popover repositions via setState on every captured scroll event while shown (cheap, only one popover at a time). Scratch checkout removed.
