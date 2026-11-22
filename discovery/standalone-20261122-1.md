# Discovery: standalone, 2026-11-22

Window: 5eac214..origin/main (7d74800). Items: none.

Checked:
- CI on main after ci watermark 43936803352: no newer runs (only the "AoE4 data freshness" run at the watermark, success).
- Issues: `discovery.sh uncovered $FACTORY_DIR 0` exited 0 and listed no issues.
- Dependencies: Dependabot alerts are disabled (HTTP 403), skipped. The outdated-package check was not run (no alerts source, no signal).
- New debt: no added TODO/FIXME/HACK/XXX lines in the window (non-markdown, non-lockfile diffs).
- Lint drift: `npx tsc --noEmit && npm run lint:dup` in scratch discovery-lint on origin/main passes; 0 clones. Scratch removed.

Watermarks: alerts=0, ci=43936803352, issue=0, sha=7d7480049b42888097d9344c92fb3a52e19a07f7
