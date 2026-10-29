# Batch 1 tech-lead gate - 2026-10-28

## Decision
No blockers. Pushed both branches and opened two independent draft PRs against main. There is no stack: the tasks do not depend on each other, so gh-stack linking does not apply and no stack footer was written.

| Task | Branch @ tip | PR | Base |
|------|--------------|----|------|
| SGS-001 | sgs-001-wotr-combat-design-doc @ 47c8931 | #14 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/14 | main |
| SGS-007 | sgs-007-unit-test-runner @ e2ce61d | #15 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/15 | main |

Both PRs are drafts. I added no new commits. Every commit is authored by choinickolas@gmail.com.

## Reviewed
- origin/main d54af2e..47c8931 (1 commit): docs/combat-simulator.md, +168/-0. Checked it against the CONTEXT.md decisions (dice and re-roll caps, the 10-unit cap with leaders capped separately at 5, invalid all-leader armies, the elite downgrade, N default 1000 and max 100,000 within 10 s, the outcome statistics, field names left to OpenAPI). It matches. The four departures are tagged "owner to confirm", so they are left open rather than decided unilaterally. The PR reviewer guide calls them out. I spot-checked one Current code claim: results.js does hard-code the Shadow and Free labels.
- origin/main d54af2e..e2ce61d (2 commits): package.json +2/-1, vitest.config.ts +8, utils/utils.test.ts +28, package-lock.json regenerated (+~3200/-217). The lockfile is still v2 and its top-level name is unchanged. next 12.1.6, react 18.2.0, react-dom, bootstrap, and classnames are unchanged. Transitive bumps stay within their majors: nanoid 3.3.4 to 3.3.20, picocolors 1.0.0 to 1.1.1, source-map-js 1.0.2 to 1.2.2. Every resolved URL points at registry.npmjs.org. The required Gate-log notes are in the PR body, with no ticket ids.
- Invariants: neither diff touches app code. W1 now has a doc to point at. Nothing is irreversible, there are no security or concurrency changes, and no consumer contract changes.

## Non-blocking notes
- Whichever of PR #15 and the pending Playwright change merges second must regenerate package-lock.json (noted in the PR #15 body).
- `gh pr edit` fails in this repo with a classic Projects GraphQL deprecation error. I set the bodies with `gh api -X PATCH repos/<repo>/pulls/<n> -F body=@file`. Future tech-lead runs should use that.
- Before merge, the owner must settle the four "owner to confirm" departures on PR #14 and drop the tags.
