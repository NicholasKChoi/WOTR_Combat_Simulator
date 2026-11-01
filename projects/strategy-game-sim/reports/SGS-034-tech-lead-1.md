# SGS-034 tech-lead report (1)

## Decision: no blockers. Draft PR opened.

- PR #41 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/41, branch sgs-034-aoe4-build-order-page (tip 725e1ca), base main (25a4e18), draft.
- Stack check: single task. The branch diff against main holds only this task (2 commits). gh-stack linking was skipped because a stack of one PR has nothing to link.
- Body set with `gh api -X PATCH` (REPO.md: `gh pr edit` fails here).

## Merge risk
**medium** - adds a new public page route and edits the shared landing page; purely additive, no existing contract changes, and a revert fully undoes it.

## Review focus
No hotspots: the change is additive. The page's error, notes, duration and chart paths are each pinned by a Playwright case, the series mapping by unit tests, and the prebuilt build's round trip, validation and completion at 3600 s by unit tests. The route and engine are unchanged.

## Reviewed
- Range: origin/main 25a4e18...725e1ca (1bfff2a, 725e1ca), 13 files, +815/-3.
- Hand-written logic: +255/-0 (page 99, build-input 81, results 42, result-series 20, builds.ts 9, index.js 4). Excluded: unit tests 135, Playwright 186, build JSON 187, docs and README +52/-3.
- Checked against INVARIANTS (S1, S2, S3, A1, A3), CONTEXT (no open questions), and M1/M2 safety and contracts. Route and `api.ts` are untouched, the client imports no validate, data or simulate module, and nothing is irreversible. No secrets, permissions or auth changes.
- Also read the implementer, review, acceptance-test and suite reports.

## PR body contents the ticket requires
- Transcription omission list: the 0:40 "termina [house]" half and its reason, plus "no step removed for not completing". The inferred 0:40 mining-camp step is noted as confirmed. No "engine does not complete it" cases.
- Mutation record: implementer 16, with the review's 2 ticket mutations folded in as independent re-checks, and acceptance-test 3.
- Out-of-scope finding: research.ts ~86,94 note messages use display names.
- Criteria 2 and 3 ("listed/recorded in the PR description") can now be checked.

## Non-blocking notes
- Commit 725e1ca subject carries the ticket id ("Trim SGS-034 page: ..."). Squash merge uses the PR title, which has no id. Use the PR title as the squash message.
- docs/aoe4-build-order.md "Page" says "Any other failure shows ... (HTTP <status>)" but a network failure shows a different retry message (pages/apps/aoe4-build-order.tsx:63). Doc wording only.
- Notes list keys `${step}-${code}`. These are unique because research.ts emits at most one note per step.
