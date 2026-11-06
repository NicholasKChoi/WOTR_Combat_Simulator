# Batch SGS-098, SGS-095 tech-lead 1 (written by manager from the agent's returned text)

No blockers. Opened stacked draft PRs (stacking: footer):
1. #106 SGS-098, base main. Merge risk: low - test-only deletions; revert restores them. No hotspots: tsc catches any dangling reference to the removed finalCount helper.
2. #107 SGS-095, base sgs-098-delete-failing-aoe4-acceptance. Merge risk: low - test-only. No hotspots: hydration wait only affects acceptance timing; schema test is a refactor of the same cases.
Tests not run by tech-lead; relied on suite PASS on a857539. Bodies set via gh api PATCH (gh pr edit fails in this repo). Stack marker chosen: <!-- code-factory-stack --> (stackMarker not defined anywhere).
