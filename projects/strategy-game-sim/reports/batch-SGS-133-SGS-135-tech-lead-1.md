# Tech-lead gate: batch SGS-133, SGS-135

## Decision

PASS. No blockers and no untested hotspots. Opened two stacked draft PRs.

## Opened PRs (bottom to top)

1. SGS-133: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/147, base `main`, head `sgs-133-split-scroll-anchoring-run-bar-cap` @ 2f504bc

   ## Merge risk
   **low** - CSS and one class on the page section; no public surface or critical path, a revert fully undoes it, and the acceptance spec pins the anchoring, the cap, and reachability.

   ## Review focus
   No hotspots: the change is three CSS rules and one class name; each behavior (anchoring off, the 40dvh cap, scroll and focus reachability inside the capped bar, no horizontal overflow, static below 768px) has an acceptance case in `acceptance/aoe4-split-scroll.spec.ts` that fails when its rule is removed.

2. SGS-135: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/148, base `sgs-133-split-scroll-anchoring-run-bar-cap`, head `sgs-135-chart-header-drag-handle-and-caret` @ a597f1d

   ## Merge risk
   **low** - client-only UI controls; no public surface, stored format or critical path changes, a revert fully undoes it, and acceptance and unit tests pin the drag, keyboard and caret behavior.

   ## Review focus
   - [`components/apps/aoe4-build-order/use-chart-drag.ts:36-56`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/148/files#diff-8d151c6625dfae1bd230a55f9fe5f29ae74a54145c38ffe423ee5f56a85972e9R36-R56) - a drag that is cancelled (Escape, lost capture) but leaves a listener attached would reorder charts on the next release, or keep the section dimmed - check that `finish` removes every listener before `onUp` calls `onDrop`, and that a cancelled session cannot drop - pinned by [`acceptance/aoe4-chart-layout.spec.ts`: Escape during a drag cancels it and the release afterwards changes nothing](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/148/files#diff-c96481d83a1a29b026f5b17e13955617f2921ec9d039aa12a70cadcd1c9b4d0aR308-R318)

Both PRs carry Preview checks for every ticket `Unverified assumptions` entry (4 on #147, 3 on #148) and the `<!-- cf-stack -->` footer.

## What I reviewed

- Combined range `e15a982..a597f1d` (origin/main to SGS-135 tip), 6 commits, linear stack verified: SGS-133 = 6cd40b8, 464ea8f, 2f504bc on main; SGS-135 = d664ec0, 821e81e, a597f1d on 2f504bc. Each branch's diff against its base holds only its own task.
- SGS-133: `workbench.module.css` (+13), `pages/apps/aoe4-build-order.tsx` (+2/-1), `docs/aoe4-build-order.md` (+2/-2), acceptance `aoe4-split-scroll.spec.ts` (+169/-2), `aoe4-my-builds.spec.ts` (+9/-42), `helpers.ts` (+44). Reviewable +15/-1.
- SGS-135: `use-chart-drag.ts` (+75), `chart-header.tsx` (+55), `chart-header.module.css` (+16), `chart-drag.ts` (+3), `results.tsx` (+33/-17), `line-chart.tsx` (+12/-55), `results.module.css` (+2/-10), docs (+13/-5), unit tests and `aoe4-chart-layout.spec.ts` (+211/-36). Reviewable +196/-82.
- Checked against INVARIANTS.md (A1-A3 paths touched only in components/docs; no engine, data or simulation change; S1-S3 not affected), PROJECT.md Open questions (none), M9 C3 contract and the Run bar / Chart drag behavior rules, criticalPaths (none touched), stored layout key and format (unchanged). Run bar has no absolutely positioned popups the new `overflow-y: auto` could clip.
- Hotspot pinning: drag cancel/drop path pinned by Escape, under-4px, drop-at-start and drag-reorder Playwright cases (assertions on order, storage and status); keyboard no-op guard pinned by the "ArrowUp on the first chart leaves the announcement ... unchanged" case.

## Process notes

- `git push` of the SGS-133 ref returned GitHub "Internal Server Error" three times; pushing the SGS-135 branch first (which carries the SGS-133 commits) succeeded, then the SGS-133 ref push succeeded. No new commits; tips verified on origin (2f504bc, a597f1d). PRs were still created bottom-up.
- PR bodies set with `gh api -X PATCH` (gh pr edit is broken here).

## Non-blocking notes

- `use-chart-drag.ts`: `pointercancel` and `lostpointercapture` share `finish` with the Escape path, so the cleanup is pinned, but no test fires those two events directly; a touch/system cancel is covered only by the Preview check.
- `use-chart-drag.ts:14`: the unmount cleanup calls `finish`, which calls `setDragging(null)` on an unmounting component; harmless in React 18.
- `workbench.module.css`: the new `padding-inline`/`margin-inline` sit on the same element as Bootstrap `py-2 mb-3`; they set different sides, so no `!important` conflict today, but it is the mix the repo checklist warns about.
