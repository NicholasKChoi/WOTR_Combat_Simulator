# Rebase cascade: #140 onto main

| branch | new tip | own commits | PR base | footer |
|---|---|---|---|---|
| sgs-129-strict-typescript | 0d103044bc8aa41f45ad6c53b1576d481f570d47 | 1 | main (already main) | updated (only #140 remains) |

Replayed with `git rebase --onto origin/main 802e222`. No conflicts. origin/main is an ancestor of the tip and `origin/main..HEAD` shows only "Turn on strict in tsconfig". Force-pushed with lease (fedc989 -> 0d10304). Body patched via `gh api -X PATCH`. The worktree is still at /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/rebase-129 and gets removed next.
