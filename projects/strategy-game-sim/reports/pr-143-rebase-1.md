# Rebase cascade after #142 squash-merge (main 91cbd64)

| Branch | PR | Old tip | New tip | Own commits | PR base | Footer |
|---|---|---|---|---|---|---|
| sgs-131-my-builds-no-wipe-and-backup | #143 | 398f1cb | 500d8d04e7e343ff34c41079c519767f50e92bc7 | 3 | main (retargeted) | updated |
| sgs-134-chart-layout-model-key-results-collapse | #144 | b02eddd | 9f0956f33b32614cd3d3d7d4a0ded43dfb821255 | 1 | sgs-131-... | updated |
| sgs-136-simulate-production-buildings-series | #145 | a771693 | 4e8e803a779634601e3923cc244ccf66a5df52e4 | 3 | sgs-134-... | updated |
| sgs-140-editor-compact-mode | #146 | cf023bb | b08b1d7d2971f824cddd999c0f10d8ffd8304d84 | 1 | sgs-136-... | updated |

- No conflicts; no aborts. Replay base for #143 was 1c854a6 (old #142 tip); each child's replay base was its parent's old tip.
- Each branch verified: new parent tip is an ancestor, and `parent..HEAD` lists only the child's own commits.
- All pushes used force-with-lease against the old tip. All PRs remain draft; nothing merged.
- `gh pr edit` failed on the classic-Projects GraphQL deprecation error. Base retarget and footers were applied through `gh api PATCH` instead. #143 base confirmed `main`.
- Footers list #143..#146 (bare numbers) with the `->` marker; the merged #142 entry was dropped.
