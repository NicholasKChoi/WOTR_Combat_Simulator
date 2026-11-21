# Standalone discovery, 2026-11-21

Scanner: standalone. Window: 5eac214..origin/main. origin/main is still 5eac214, so the base has not moved.

Checked:
- CI on main: the only workflow is `AoE4 data freshness`. Its two runs are both success, and none is newer than the watermark 43936803352.
- Issues: `discovery.sh uncovered . 0` exited 0 and printed nothing. `gh issue list` shows no open issues.
- Dependencies: the Dependabot alerts API returned 403 (alerts disabled for the repo), so the check was skipped. The outdated-package check was not run.
- New debt: no TODO, FIXME, HACK or XXX lines added in the window (it is empty).
- Lint drift: skipped. Warnings count only if new since the last SHA, and the base has not moved.

Items: none.

Watermarks: alerts=0, ci=43936803352, issue=0, sha=5eac2142954b5a42351f433956297e4b921f77bc
