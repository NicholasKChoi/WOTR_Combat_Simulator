# SGS-008 review 1

Verdict: APPROVE

Diff reviewed: `git show 2a8b73e` on code-factory-state (one new root file, vercel.json, 8 lines). Remote tip at check: aeffa70.

## Blocking findings
None.

## Spec gaps
None. The open questions were settled at the spec gate on 2026-10-29.

## Acceptance criteria
- PASS: valid root vercel.json. It parses with json.load, sets `git.deploymentEnabled["code-factory-state"] = false`, and has no other keys besides `$schema`. The content matches the pinned block byte for byte. aeffa70 carries the same file (same md5).
- PASS: a baseline was recorded before the push: 9 Error Preview deploys, newest 8ynh9a3dz. The ticket said 6; more accumulated after it was written.
- PASS (live): no new deployment after either push. I checked at 2026-10-28T21:27:58-07:00, about 2m12s after aeffa70 (committed 21:25:46) and about 4m after 2a8b73e. `vercel ls ... --meta githubCommitRef=code-factory-state` still shows 9 deploys, and the newest is still 8ynh9a3dz. GitHub combined status for both 2a8b73e and aeffa70 is "pending" with 0 statuses and 0 check-runs. There is no Vercel status at all, so none is failing. ("pending" with zero statuses is just GitHub's empty default.)
- DEFERRED, not failing: main/PR still deploys. This can't be observed until the next main push or PR preview. The risk is low: main (8532a0b) has no vercel.json, and the state-branch file is not in main's tree because the branch is an orphan. Re-check the next PR for the `Vercel – wotr-combat-simulator` status and a new Ready deploy.
- PASS: main is untouched. `git ls-tree origin/main` has no vercel*, and the commit only touches code-factory-state.
- PASS (vacuous): the stop-on-failure condition. Vercel did not build, so there is no blocker and no fallback.
- PASS: no INVARIANTS regressions. No app code was touched.

## Invariants touched
None. The file is not on main and does not reach the app build.

## Linter
Not applicable: there is no JS/TS in the diff. The JSON validated.

## Bot reconciliation
reviewBot.cli is empty and rulesFile is empty, so there was nothing to reconcile.

## Conventions / correctness
- The commit message has no ticket id, no PR number, and no factory pointers. The author is choinickolas@gmail.com, as the spec gate resolved.
- Key spelling matches the Vercel schema (`git.deploymentEnabled`, branch key, boolean false).

## Non-blocking notes
- `vercel ls -m` is deprecated in CLI 65.5.0 in favour of `--meta`. Future checks and the ticket text should use `--meta`.
- REPO.md CI notes could record that state-branch pushes no longer deploy. A human can choose to add that; it is out of scope here.

## Coverage
Reviewed: vercel.json at 2a8b73e and aeffa70, the commit metadata, main's tree, Vercel deploy list, and GitHub status and check-runs for both SHAs.
The REPO.md Review checklist ("npx next build", page flows) does not apply: no pages or app code changed. Not reviewable yet: the main/PR deploy criterion (deferred).
