# Rebase cascade after squash-merge of #131 (origin/main a440406)

| Branch | New tip | Own commits | PR base | Footer |
|---|---|---|---|---|
| sgs-112-server-debt (#132) | 92d5ccc3f6b3c1ae7cdbc10e6d580258dd28a5e8 | 3 | main (was sgs-122-named-build-client) | updated |
| sgs-115-split-scroll (#133) | 3bc3a1ed511289b48d8fab1a81777921da7e41e6 | 3 | sgs-112-server-debt | updated |

- #132 replayed with `--onto origin/main ab88283` (dropped the two squashed #131 commits). Own commits verified via git log origin/main..HEAD.
- #133 replayed with `--onto 92d5ccc ea1b924`. Own commits verified.
- No conflicts. Both force-pushed with lease.
- Footers now list only #132 and #133 (merged #130, #131 removed), marker `<!-- cf-stack -->`.
- `gh pr edit` fails on a Projects-classic GraphQL deprecation error, so base and body were changed via `gh api -X PATCH`; base of #132 confirmed `main`, #133 body confirmed.
- Worktree cleanup: `git worktree remove` failed with EBUSY. Deferred cleanup at /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/rebase-sgs-112-server-debt (detached HEAD, nothing to lose).
