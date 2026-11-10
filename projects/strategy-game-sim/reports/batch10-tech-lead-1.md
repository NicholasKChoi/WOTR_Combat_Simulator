# Batch 10 tech-lead review

## Decision
No blockers, no untested hotspots. Opened two stacked draft PRs.

## PRs (bottom to top)
1. SGS-104 - https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/113 - base `main` - branch sgs-104-split-layout @ 32d9d29 - draft
2. SGS-105 - https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/114 - base `sgs-104-split-layout` - branch sgs-105-save-and-open-by-link @ f55754c - draft

Stacking: footer (`<!-- cf-stack -->`). Bodies set via `gh api -X PATCH`.

### #113 Merge risk
**low** - a revert fully undoes it, it touches no public surface or critical-path symbol, and acceptance specs pin the layout at each width.

### #113 Review focus
No hotspots: a client-only layout switch that reads no result path. The breakpoint, the live switch without a re-run or remount, the hydration-safe first paint and the toggle rule each have an acceptance test in `acceptance/aoe4-split-layout.spec.ts`.

### #114 Merge risk
**medium** - adds a public URL surface (`?b=<id>` links users share); it is backward-compatible and a revert undoes the code. Saved records outlive a revert, but the existing route can already write them.

### #114 Review focus
- `components/apps/aoe4-build-order/save-build.tsx:59-82` - an edit while a save is in flight, if the guard at line 71 is lost, gives a link and `?b=` for a build other than the one on screen - pinned by `acceptance/aoe4-save-open.spec.ts` "a save response that lands after the settled input changed..." and "a late save for a changed build selection..." (lines 404-442).
- `pages/apps/aoe4-build-order.tsx:92-157` - hold released before the load ends runs the default build and lets the loaded build overwrite an edit - pinned by "the load holds the first run, disables editing, then runs the saved build once" (581-615).
- `pages/apps/aoe4-build-order.tsx:165-169` - `b` removal timing (strip a shared link on open, or leave a stale one after an edit) - pinned by "the load does not drop b" (537-555) and the "after a save" edit table (348-391).

## What I reviewed
- Range origin/main (5b29e9e)..f55754c, 10 commits, linear: sgs-104 is an ancestor of sgs-105, origin/main an ancestor of sgs-104. Each branch diff against its base contains only its own task.
- SGS-104: use-split-layout.ts, workbench-tabs.tsx, workbench.module.css, page, docs; +89/-46 reviewable LoC (acceptance and docs excluded).
- SGS-105: save-build.tsx, save-build-client.ts, saved-build-loader.ts, pin-name.ts, build-input.tsx, build-text-editor.tsx, step-table.tsx, auto-run.ts (export only), page, CSS, docs; +377/-11 reviewable LoC (unit tests, acceptance and docs excluded).
- Invariants: S1 holds (imports stay inside the AoE4 app; client imports only `saved-builds.ts` from lib). A3 holds (layout and save state feed no result path). No criticalPaths symbol touched. No secrets, no new routes, no API or schema change (save and load routes were already on main). CONTEXT open questions: none.
- All commits authored as choinickolas@gmail.com.

## Tab order check (split layout)
Confirmed from the stacked DOM: `SaveBuild` (Save, then link input, then Copy) is rendered inside the run bar `<form>` after the view toggle and before the status line, and the form precedes `WorkbenchTabs`. The split layout is a plain two-column grid with no CSS `order`, reversed flex or `tabIndex` on these controls, so the tab order is select, duration, Text/Table, Save, link, Copy, then the Build panel, then Results, matching design M6 Layout "keyboard, split". No acceptance test pins the Tab sequence in the split layout explicitly; it follows from DOM order.

## Non-blocking notes
- `router.replace({ query: {} })` on edit drops any other query parameters on the page; none exist today.
- The `?b=` load effect depends only on `router.isReady` (uses `editText` and `prebuilt` from the closure); correct because it runs once, but an exhaustive-deps lint would flag it.
- A 200 response from the save route (same content saved before) is treated as success like 201, as intended.
