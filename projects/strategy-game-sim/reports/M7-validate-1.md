# M7 validation 1 — running app on origin/main b6a7338

Method: production build (`next build`, Next.js 16.4.3) from worktree `worktrees/validate-m7` at b6a7338, served with `next start`, driven with Playwright (Chromium) at viewport widths 1280 and 1800 (height 1000). Scripts lived in the session scratchpad, not the repo. Screenshots are in `reports/M7-validate-1/` (paths below are relative to that folder). Every finding held at both widths unless noted.

## Criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| M7.1 kind colour + started/finished times in step-table rows; never-reached and waiting steps marked | pass | All three bundled builds (ENG 1TC 42 rows, ENG Spear/Longbow into MAA/Crossbow 82 rows, ENG Knight/Longbow (King's Palace) 74 rows) show all 6 kinds with distinct left borders: villager rgb(25,135,84), building rgb(108,117,125), economy rgb(206,212,218), age-up rgb(13,110,253), research rgb(13,202,240), military rgb(220,53,69); legend matches. Every row has started/finished; in-progress rows show "ongoing". Test build `start 6 sheep -> sheep / produce villager… x1 / research bloomery / research admiralty` @600 s: waiting row shows "–" times, flagged, "prerequisite 10:00, still waiting on prerequisite"; following row "not reached (earlier-step)"; both warn background rgb(255,243,205). Shots: `w1280-build{0,1,2}-table.png`, `w1800-build{0,1,2}-table.png`, `w1280-step-table-crop.png`, `w1800-step-table-crop.png`, `w1280-waiting-notreached-table.png`, `w1800-waiting-notreached-table.png` |
| M7.2 waited, Blocked by, flagged and long-wait (>=60 s) highlights | pass | `build barracks with 9 from sheep`: API reports 65 s wait; row has data-long-wait=true, waited 1:05, Blocked by "villagers 1:05", warn background. Next row: no long-wait, waited 0:00, empty Blocked by. Flagged counts on bundled builds 1 / 2 / 4. Shots: `w1280-longwait-table.png`, `w1800-longwait-table.png` |
| M7.3 hover/focus a row shades that step's span on every chart | pass | No chart-step-band before hover. Hover row 1 (0:25–0:45) → band data-from=25 data-to=45 on all 4 charts (units produced, gather rates, gathered, floating); exactly one row data-active. Pointer off clears. Focus row 2's delete button → 45–70; Tab to next row → 60–60 (zero-length step); focus duration field → bands cleared. Shots: `w1280-row-hover-band.png`, `w1800-row-hover-band.png` |
| M7.4 stale results dim annotations with charts, never show another build's times; dim during debounce | pass | After a text edit, results-last-good opacity 0.5 while auto-run-status is still `current` (debounce), back to 1 after. With the simulate request held after deleting row 0: status `updating` ("Updating the results."), charts and all step-run cells at opacity 0.5; new row 0 shows old row 1's 0:25 (times stay aligned to their own step). Switching build while held: 0 of 82 rows show times, charts dimmed. On release opacity 1, 0 stale cells. Invalid edit ("produce knigt" on line 27): status `invalid`, only that step loses times (table row 25 / gutter line 27), others keep times dimmed to 0.5 with charts. Shots: `w1280-stale-held.png`, `w1800-stale-held.png`, `w1280-stale-switch-build.png`, `w1800-stale-switch-build.png`, `w1280-invalid-text.png`, `w1800-invalid-text.png`, `w1280-invalid-table.png`, `w1800-invalid-table.png` |
| M7.5 no step timeline in Results; charts full width | pass | 0 elements matching `step-timeline*`. Charts 534 px at 1280 and 624 px at 1800, equal to panel-results / results-last-good width. Shots: `w1280-row-hover-band.png`, `w1800-row-hover-band.png` |
| M7.6 Text-tab gutter: kind colour + times, waited/Blocked by on hover, dims when stale, line hover/caret shades charts | pass | 43 annotations for 43 lines, aligned with line numbers, kind borders match table. Title e.g. "Waited 0:05. Blocked by: villagers 0:05". Hover line 3 → bands 25–45 on all 4 charts, one data-gutter-active; caret on line 4 → 45–70; blur clears. Invalid text: gutter data-stale, opacity 0.5; bad line keeps kind, drops times. Kind legend above editor. Shots: `w1280-text-gutter.png`, `w1800-text-gutter.png`, `w1280-gutter-hover.png`, `w1800-gutter-hover.png`, `w1280-invalid-text.png` |
| M7.8 explicit `build house` does not freeze production; auto-houses still happen | pass | `start -> gold / produce villager from capital-town-center / @0:20 build house from gold then gold / @0:40 build mining-camp… / @1:00 rally capital-town-center -> sheep` @1200 s: house built 25–45 s; population 10→13→16→19→22→27→32→37→40 (t=60…750); villagers 6@120, 15@300, 30@600, 33@900; building spend steps at 25 (50), 45 (100), 240 (150), 440 (200) — auto-houses at 240 and 440. Same text without the house step gives an identical population curve. `build house with 1 from sheep` as the first step: pop 50 @900 s, villagers 43, auto-house spend at 240/440/640. Shot: `w1280-explicit-house.png` (1280 only; data from API responses) |

M7.7 was not in the list of criteria to check on the running app.

## Defects

### D1 — Step kind badges break mid-word (the known "Econ / omy" break still occurs)

- Where: `[data-testid="step-kind-badge"]` inside `[data-testid="step-run"]`; styles in `components/apps/aoe4-build-order/step-annotation.module.css` (`.badge` and the run-cell column).
- Repro: open `/apps/aoe4-build-order` at 1280 or 1800 wide, switch to Table view, look at the left run cell of any row.
- Expected: badge text on one line ("Villager", "Building", "Economy").
- Actual: badges wrap to two lines inside words — measured "Villag/er", "Buildi/ng", "Econ/omy". Badges are 54–60 px wide and 41 px tall vs 20 px for one line. Computed style: `overflow-wrap: anywhere`, `white-space: normal`, `display: inline-block`. The run cell is only 74 px wide at 1280 and 80 px at 1800. At 1800 a few badges in build 1 fit on one line; most still break.
- Evidence: `w1280-step-table-crop.png`, `w1800-step-table-crop.png`, `w1280-row-hover-band.png`, `w1280-stale-held.png` ("Buildi / ng").

## Notes

- Bundled builds: all three loaded and simulated at both widths. No console errors and no page errors recorded at either width.
- Run-cell times are unlabelled: started / finished / waited / Blocked by are stacked ("0:25 / 0:45 / 0:05 / villagers / 0:05") with no headings; only the gutter title spells out "Waited … Blocked by …". Readability issue, not an M7 failure.
- Narrow selects in the table truncate values ("Capital Tow", "Lumber Can"); pre-existing, not M7.
- The step table is long (up to 82 rows with expanded rows), so the charts sit beside only the top rows unless scrolled; did not check whether the results panel is sticky. Hover-to-band still works, but the band is off-screen for lower rows.
- M7.8: the population plateau at 40 in the first house test is economy-bound (no wood gatherers), not a house freeze — the curve is identical with and without the explicit house step. An earlier probe with finite `produce villager x1` was not meaningful and is not used as evidence.
- Validation-harness quirk: a server started in one Bash command was not reachable from the next (per-command sandbox network isolation), so each Playwright run started its own `next start` on port 3918 in the same command.
- Teardown: see the summary returned to the manager (server stop and worktree removal results).
- Teardown done: background server (port 3917) stopped; no next-server processes remain; `git worktree remove --force worktrees/validate-m7` succeeded (rc=0). smoke-drop-delete-reread untouched.
