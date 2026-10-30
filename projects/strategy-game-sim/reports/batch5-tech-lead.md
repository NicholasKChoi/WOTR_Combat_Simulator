# Batch 5 tech-lead gate: SGS-011

**Decision: no blockers. Draft PR opened.**

- PR #23: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/23, base `main`, head `sgs-011-api-models-army-resolver-error` at 9336369 (pushed, draft). The task is a single PR, so there was nothing to stack and `gh stack link` was not run.

## Merge risk (copied from the PR body)
**medium** - removes a served route under `pages/api/` (public surface); backward-compatible in practice since the route only ever returned 500 and was documented as not part of the API, and a revert restores it.

## Review focus (copied from the PR body)
No hotspots: a two-line re-export file is deleted with no importers (`git grep` finds none), the only behavior change is 500 to 404 on a path that never worked, and the acceptance test pins the 404.

## What I reviewed
- Range: merge-base 96d2602..9336369 (one commit, "Stop serving /api/models/army", authored by choinickolas@gmail.com). `git merge-tree` against origin/main 2eb3eb3 is clean.
- Files: pages/api/models/army.ts (deleted), docs/api/openapi.json, ARCHITECTURE.md, acceptance/fight-api-caps.spec.ts, acceptance/fight-api-spec-surface.spec.ts. Total +5/-10; reviewable +1/-3.
- Checks: no importer of `pages/api/models` on origin/main (only docs and tests mention the path). No change under lib/combat-simulator/ or pages/api/fight.ts, so W1, W2, and S3 hold. The route removal was confirmed by the owner (CONTEXT.md Decisions, 2026-10-29), so no open question was answered unilaterally. Irreversibility: none, because a revert restores the file. No security, concurrency, or secrets surface.

## Non-blocking notes
- On merge, the manager must apply the factory-file edits the ticket lists: remove `pages/api/models/army.ts` from CONTEXT.md line 22 and from the line 34 sentence, from the INVARIANTS.md WOTR Paths, and from the REPO.md Combat simulator Paths.
