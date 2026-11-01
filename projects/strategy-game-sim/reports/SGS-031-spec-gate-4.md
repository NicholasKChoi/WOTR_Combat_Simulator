# SGS-031 spec gate 4 (respec 3 check)

Verdict: READY

Checked against worktree .../worktrees/sgs-031-aoe4-build-move-ages @ 1d514ee (merge-base with origin/main is a714a23, SGS-030 merged).

## Respec 3 change
- All eight named tests resolve to real tests, in the named files and describes (simulate.test.ts lines 219, 286, 408, 515, 612; simulate.acceptance.test.ts lines 78, 87, 252; the seven describes exist and contain them).
- Running both files on the branch: exactly those eight fail (5 + 3, 61 pass). The set the ticket lists is the exact set that needs the pin; no ninth failure and no listed test that already passes.
- The shared-run note for the two acceptance tests under "hand-computed timeline" is accurate (adjacent tests, one describe-level run).
- The diff check is well-formed: `git diff origin/main -- <two test files>` works (origin/main already holds SGS-030). Today it shows only the Seam-test edit in simulate.test.ts, so the "outside the Seam test only autoHouses: false lines" rule is checkable. Final criterion, Scope 5 and Out of scope agree (eight pins, nothing else, `<= 3` bound kept). No other section contradicts it.

## Notes (non-blocking)
- The Seam edit also changes the shared test-handler helper at the top of simulate.test.ts (save and restore the previous handler). It is outside the Seam test body, so a literal reading of the diff check flags it. Scope 5 bullet 2 covers it in intent; consider saying "the Seam test and its handler helper".
- Scope and criteria still cite "68e004a" for line numbers and "files do not exist on 68e004a"; origin/main is now past SGS-030. Harmless for the rework, since the grep criteria are about the final tree.
- A diff "changed line" that merely reflows an inputs object to fit `autoHouses: false` counts as allowed; the criterion says "added or changed lines that add autoHouses: false", which is fine.
