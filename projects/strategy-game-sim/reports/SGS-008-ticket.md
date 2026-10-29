# SGS-008 ticket authoring report

File: tickets/SGS-008-skip-vercel-deploys-for-state-branch.md
Type Bug, component site, M1 with no criterion (site-level ops hygiene), Risk standard (config surface), ~7 LOC, no deps.

Explored: origin/main has no vercel.json; package.json has only dev/test scripts; origin/code-factory-state contains only
factory files. Fetched Vercel's git-configuration doc: `git.deploymentEnabled` supports branch names and minimatch
patterns, but it does not say whether the pushed commit or the production branch supplies vercel.json. Not verified
empirically (no Vercel write actions taken).

Pin: vercel.json on code-factory-state (orphan, so main's file is not in its tree; pushed-commit read is the likelier
behaviour), committed directly as a factory-state change, no code PR. Fallback: human-set Ignored Build Step.
Verification: vercel ls -m githubCommitRef=code-factory-state count unchanged after state pushes; main/PR still deploys.

Diagrams: none (one-line statement). Open questions: docs gap on which commit is read; optional vercel.json on main;
confirm state-branch-only flow in TASK-GRAPH. Overlap: none with SGS-001..007.
