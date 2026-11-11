# Stack rebase after #123 merge

New main: 55bb1ed. Replay used `git rebase --onto`; ancestor and own-commit checks passed. No conflicts.

| Branch | New tip | Own commits | PR base | Footer |
|---|---|---|---|---|
| sgs-117-unit-test-debt (#124) | 612a4f3131c5e96aa6843f93456a5b1ec6a4ca45 | 1 | main (retargeted) | updated |
| sgs-119-named-build-shapes (#125) | c193077e1ec55cf31efe72fe06abefa2213be03e | 2 | sgs-117-unit-test-debt | updated |

Footers now list #124, #125 (the merged #123 is dropped). Both pushes used force-with-lease against the old tips.

Note: `gh pr edit --body-file` fails on a Projects-classic GraphQL deprecation error. The base retarget still worked. The bodies were set through `gh api -X PATCH`.
