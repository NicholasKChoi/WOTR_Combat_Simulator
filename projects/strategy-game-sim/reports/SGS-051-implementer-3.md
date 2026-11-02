# SGS-051 implementer 3 (rework 2)

Branch sgs-051-aoe4-build-knight-longbow, worktree .claude/code-factory/worktrees/sgs-051-aoe4-build-knight-longbow, rebased onto origin/main 0f290d8.

- Rebase: builds.ts conflicted twice (one per commit); resolved to [english1tc, englishSpearLongbowMaaCrossbow, englishKnightLongbow], one entry per line.
- README: spear entry first, knight entry after it, blank-line separated. Reworded rather than moved the rally: gold rally fires at 5:47 (waits behind the 5:15 farms); 14:00/16:00/18:00 farm blocks start at their times, the 10:00 block at 10:01. Run-outs now stated as the page rounds them: 15:32, 24:37, 33:43, 42:48, 51:54 (previously truncated 15:31/33:42/51:53). The build JSON is unchanged, so every other measured number stands. The "since 5:30" Castle cause in implementer 2 / PR body text should read "since 5:47".
- Checks after the rebase: tsc clean; lint:dup 0 clones; npm test 38 files, 1012 passed, 8 skipped; npm run acceptance 531 passed; next build OK.
- No new tests (docs and merge only); no mutation checks needed.
- Out-of-scope findings: none. No processes left running.
