# batch5 simplify: SGS-011

Branch sgs-011-api-models-army-resolver-error, tip 9336369, diff vs 96d2602 (5 files, +5/-10).

Result: no change. Diff is already minimal: route file deleted, stale doc prose and OpenAPI description removed, two acceptance tests updated (500 -> 404, description no longer mentions the route). No new comments, helpers, or duplication to trim. Comment bar met.

`git grep models/army` still finds exactly two single-line matches (acceptance/fight-api-caps.spec.ts:132, acceptance/fight-api-spec-surface.spec.ts:26).

Checks: not run (no edits made). No processes started. No commit.
