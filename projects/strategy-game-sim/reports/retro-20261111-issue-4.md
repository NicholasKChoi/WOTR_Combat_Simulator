manage.md: worktree-cleanup EBUSY/EROFS and transient config.lock are not issue lines

## Problem

`references/common.md:64` and `agents/suite.md:31` say EBUSY/EROFS on worktree cleanup is not an issue.
`commands/manage.md` has no such line, and the manager is the one that writes `issue:` lines to the run
log. So the run log keeps filling with known sandbox noise, which the retro then has to filter out.

## Evidence

- One run log after #4: 3 EBUSY lines (one labelled "WSL") and 2 `.git/config.lock` lines, all from worktree
  cleanup or a concurrent git config write that succeeded on retry.
- The previous retro raised the same noise (about 12 lines); the fix landed in suite.md and common.md only.

## Suggested edit

`commands/manage.md`, where the run log's `issue:` lines are defined (and the worktree cleanup step):

```diff
+Not issue lines: EBUSY or EROFS from worktree removal (the sandbox holds the mount; the worktree is
+pruned later), and a `.git/config.lock` error that a retry clears. Log an issue only if the retry fails.
```
