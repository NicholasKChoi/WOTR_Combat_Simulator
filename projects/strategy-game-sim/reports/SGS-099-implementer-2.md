# SGS-099 implementer 2 (rework 1)
Status: needs_review. Branch sgs-099-saved-build-record, tip 5efa6eeb15c6e90930e0329f11a233d73a9531d5.
Change: lib/aoe4-build-order/saved-builds.test.ts "caps the issues and counts the rest" now takes the uncapped count from checkBuildOrder on the same input, asserts total > MAX_REPORTED_ISSUES, issues.length === MAX_REPORTED_ISSUES, omittedIssues === total - MAX_REPORTED_ISSUES.
Mutation: saved-builds.ts reporting omittedIssues + 1 -> test failed (1 failed, 50 passed); reverted with git checkout.
Checks: saved-builds tests 51/51 pass; tsc --noEmit clean; lint:dup and full npm test run.
No production changes.
