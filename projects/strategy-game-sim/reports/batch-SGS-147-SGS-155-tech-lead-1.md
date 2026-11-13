# Tech-lead gate: SGS-147, 149, 150, 155

Decision: no blockers, no untested hotspots. Four independent draft PRs opened against main (483dde4). Each branch was rebased onto origin/main (clean, no conflicts) and pushed; the tips below are the rebased ones.

| Task | PR | Pushed tip | Merge risk |
|------|----|-----------|-----------|
| SGS-147 sgs-147-browser-storage-edge-cases | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/158 | b60e61f | low |
| SGS-149 sgs-149-test-hardening-masked-assertions | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/159 | c490d42 | low |
| SGS-150 sgs-150-deflake-small-screen-step-band | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/160 | b7e92a6 | low |
| SGS-155 sgs-155-aoe4-data-freshness-workflow | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/161 | e398003 | medium |

Original tips (pre-rebase): 6bb1297, 76390a0, 9450b34, bf73e7f. Merge base was 41b3ed3; the rebase picked up only main's docs-only change. The suite ran on f55e0aa and was not rerun after the rebase.

## Review focus (verbatim intent)
- PR 158: build-library.ts:83-97 (withCreatedEntry trim keeps selected build; pinned by build-library.test.ts withCreatedEntry cap cases) and aoe4-build-order.tsx:221 (storage event key null reread; pinned by aoe4-my-builds.spec.ts "another tab changing an unrelated key...").
- PR 159: No hotspots (optional param defaulting to old behavior; pinned by "memory build store backing" test).
- PR 160: No hotspots (test-only).
- PR 161: workflow permissions and token scope (pinned by check-freshness.test.ts getJson token test); check-freshness.mjs exit-code split (pinned by checkFreshness tests). Preview check: run the workflow via workflow_dispatch after merge.

## Reviewed
Combined diffs vs origin/main for all four: production code read in full (build-library.ts, pin-storage.ts, aoe4-build-order.tsx hunks, build-store.ts, check-freshness.mjs, snapshot-source.mjs, refresh-snapshot.mjs, workflow). Total about 140+59+31+315 lines changed across the four. Invariants A1-A3 untouched; PROJECT.md Open questions is None; no schema, migration or deletion.

## Non-blocking notes
- 147 leaves an unreadable stored pin in localStorage permanently until the next Pin (documented in docs/aoe4-build-order.md).
- 155: the workflow fails red weekly while the snapshot is stale (intended); the refresh-snapshot User-Agent changed from refresh-snapshot to aoe4-snapshot.
- `gh pr edit` fails in this repo (Projects classic deprecation GraphQL error); bodies were set via `gh api -X PATCH`. The stack marker used is `<!-- cf-stack -->`, copied from PR 157. Each PR is its own one-item stack.
