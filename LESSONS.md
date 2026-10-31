# Repo lessons

## Lockfile name after npm install

After any `npm install` in a worktree, `git diff package-lock.json | grep '"name": "sgs-'` must print
nothing. The root package.json has no `name`, so npm writes the worktree folder name into the lockfile;
revert those lines before committing. Delete this entry when SGS-024 merges.
