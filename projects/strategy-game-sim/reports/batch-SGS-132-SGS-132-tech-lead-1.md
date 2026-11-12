# Tech-lead gate: batch SGS-132

## Decision
PASS. I opened a draft PR. There are no blockers and no untested hotspots.

## Opened PRs (bottom to top)
- SGS-132: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/141
  - Base: `main`
  - Head: `sgs-132-save-panel-live-status` at 5957beacaf8e450ab31c457fe509c56a10e779bf
  - The branch was not on origin before this gate. I pushed it here with no new commits.

### Merge risk
**low** - client-only component and CSS change; a revert fully undoes it, it touches no API, schema or engine symbol, and tests pin the status and Escape behavior.

### Review focus
No hotspots: the status text is a pure function of the saved, settled and saving state, pinned by a unit table and by browser tests covering success, failure, in-flight, lifetime and Escape. The rest is DOM regrouping and CSS checked by geometry specs at 1280px and 390px.

The PR also has two Preview checks, taken from the ticket's Unverified assumptions:
- A screen reader announces the status.
- The row wraps across the 1200px breakpoint as the CSS describes.

## What I reviewed
- **Commit range:** `origin/main` (5564bd0, which is also the merge base) to 5957bea, 5 commits.
- **Size:** 9 files, +455/-91 in total. The hand-written product code is +96/-58:
  - `save-build.tsx` +67/-54
  - `workbench.module.css` +29/-4
- **Rest of the diff:**
  - New `acceptance/aoe4-save-status.spec.ts` (273 lines).
  - A helper move from `aoe4-my-builds.spec.ts` to `helpers.ts`.
  - The two scroll-spec edits that re-spec 3 allows.
  - Unit table and static render tests.
  - Docs.

## Checks against the gate list
- **Invariants:** the paths fall under A1-A3, but the diff is UI only. It changes no game numbers, simulation logic or determinism. No S/W/H paths are touched.
- **criticalPaths:** none touched.
- **Irreversibility:**
  - No schema, migration or storage format change. The My builds entry shape is unchanged.
  - `SaveBuild`'s props are unchanged.
  - Every existing test id is kept.
- **Concurrency:** no new risk. In-flight handling still uses the existing `abort` ref and `send`. A failed save still clears `saved` through `showFailure`, so no stale `Saved` can remain.
- **Security:** nothing relevant.
- **Open questions:** PROJECT.md has none. The ticket's decisions (3A lifetime, no timer) are applied as specified.
- **Consumer contracts:** `build-input.tsx` is unchanged, and `auto-run-status` is still the run bar's last child.
- **Scroll-spec carve-outs:**
  - `aoe4-small-screen.spec.ts`: the sticky check has a tolerance below 1px and no other assertion changed.
  - `aoe4-split-scroll.spec.ts`: the test sets its scroll with `scrollInstantly(page, 0)` and asserts room to scroll before each wheel. The assertions after the wheel are unchanged.
  - `use-run-bar-height.ts` is unchanged.
- **Hotspot pinning:**
  - `saveStatusText` is pinned by the `it.each` table in `save-build.test.ts`. The table includes the saving rows and the changed-input rows.
  - Escape scope, failed-save clearing and the in-flight empty status are pinned by `aoe4-save-status.spec.ts`. That spec has the "Escape", "failed saves" and "keeps the link and empties the status while a second copy is in flight" tests.

## Non-blocking notes
- The copy hint now renders on `copy === 'failed' && linkVisible`, outside the old link wrapper. This is equivalent, because `linkVisible` implies `saved !== null`.
- `gh pr create` warned about uncommitted changes. That came from the state worktree's bookkeeping files, not from the PR branch.
