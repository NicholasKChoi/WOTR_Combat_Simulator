# SGS-106 review 2 (delta, rework 1 text)

Verdict: **APPROVE**

Branch `sgs-106-smoke-preview`, tip 0aee0751a40e8e7ac9159cb9bb682770f75412d4. Delta reviewed: 5bdd00a..0aee075 (one commit, `0aee075 Describe the smoke save step without the removed path field`).

## Blocking findings

None.

## Spec gaps

None.

## Rework 1 required fixes

- PASS - `docs/aoe4-build-order.md` step 1 now reads exactly: "1. `save`: posts `data/aoe4-build-order/builds/english-1tc.json` with a duration of 1200 s and expects 201 or 200 with a body whose `id` is a valid build id." (0aee075:docs/aoe4-build-order.md:1103). The old text spanned 1103-1104; both lines were replaced by the single line. Matches the code: `scripts/smoke-preview.mjs:69-72` checks status 201/200 and `SAVED_BUILD_ID_PATTERN.test(id)` only.
- PASS - Local verification re-run twice and recorded in `reports/SGS-106-implementer-2.md`: `BUILDS_LOCAL_DIR` set to a throwaway dir, port 3123, both runs exit 0 with four `PASS` lines, both `save` lines `201 8NZwU5Ld_D5` (same id, 201 after run 1's delete). Dev server stopped, throwaway dir holds no build record (only a rate-limit counter file), no secret printed. Satisfies the corrected Local verification criterion (ticket, Other criteria).
- The remaining "Required fixes" items in the Rework 1 block (read back differs, open fails, delete refused, delete leaves the build, usage, other directory) are spec test rows carried in the checklist; the spec file and script are unchanged in this delta (`git diff --stat 5bdd00a 0aee075` shows only `docs/aoe4-build-order.md`, 1 insertion, 2 deletions), so their review-1 status stands.

## Nothing else changed

`git diff --stat 5bdd00a 0aee075`: `docs/aoe4-build-order.md | 3 +--`, one file. No code, spec, `package.json` or lock-file change.

## Acceptance criteria (delta)

- Docs criterion: the smoke subsection no longer claims a `{ id, path }` check; the remaining `{ id, path }` mentions (lines 1069-1070) are in the agent how-to's status table describing the API response, which is correct. Every `protection-bypass` match is spelled `x-vercel-protection-bypass` (lines 1091, 1099). PASS.
- Local verification: PASS (above).
- All other criteria: unchanged since review 1 (no code touched).

## Invariants

No INVARIANTS.md entry is reachable from a one-line doc change. Holds.

## Lint / bot

Docs-only delta; no linted file changed. No review bot run for a text-only delta.

## Non-blocking notes

- The new line is 160 characters while the surrounding list items wrap near 120. The file already has 78 lines over 120, and the ticket mandated the exact text, so not a finding.
- The implementer report records the two runs as one block ("Run 1 and run 2 each printed") rather than two pasted transcripts. The lines are identical by the criterion's own expectation, so this is accepted; the PR body should show the output as well, per the criterion.
- The branch is not on origin yet (`git ls-remote` empty); reviewed from the local ref, which resolves to the stated tip.

## Coverage

Reviewed: `git diff 5bdd00a 0aee075` in full, `docs/aoe4-build-order.md` lines 1060-1112 at the tip, `scripts/smoke-preview.mjs:60-80`, `reports/SGS-106-implementer-2.md`, ticket Rework 1 block and Other criteria. No worktree needed (read via `git show`).
