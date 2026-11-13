# Discovery: standalone, run 2 (owner-requested rerun)

Window: e50e0749ac1b59657daf9d5283a5e67935d90e25..origin/main. origin/main is still e50e074 (`git ls-remote origin main` confirms; local `git fetch` failed on a gc/reflog error in the sandbox, so the remote head was checked with ls-remote).

## Checked

- BACKLOG.md, TASK-GRAPH.md, QUESTIONS.md read first.
- CI on main: `gh run list -b main --limit 30` returns one run, "AoE4 data freshness" 43369981194, success. Same as run 1; nothing new.
- Issues: `gh issue list --state open` returns none.
- Dependabot alerts: HTTP 403 (disabled for the repo); skipped.
- Outdated dependencies: not rerun; no commits since run 1 and run 1 found nothing worth filing.
- New debt: no commits in the window, so no added TODO/FIXME/HACK/XXX lines.
- Lint drift: not run; no new commits.

## Items

None.

Standing note (already in BACKLOG.md, no ticket in the graph): `acceptance/aoe4-results-split.spec.ts:41` is red on main per the SGS-154 implementer. It is the strongest existing candidate for a `standalone bug` or `debug`.

## Watermarks

ci=43369981194
issue=0
alerts=0
sha=e50e0749ac1b59657daf9d5283a5e67935d90e25
