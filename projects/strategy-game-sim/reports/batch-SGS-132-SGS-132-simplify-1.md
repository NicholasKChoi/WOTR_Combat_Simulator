# Simplify pass: sgs-132-save-panel-live-status

Old tip b8816c2, new tip 5957beacaf8e450ab31c457fe509c56a10e779bf (one commit, not pushed).

Changes
- workbench.module.css: `.saveStatus` grouped with `.autoRunStatus` (identical rules); duplicate block removed.
- save-build.tsx: dropped redundant `saved !== null &&` on the copy-failed hint (`linkVisible` already implies it). The other `saved !== null && linkVisible` at the link render was kept because `saved.link` needs the narrowing in the JSX.

Reviewed the rest of the diff (saveStatusText, onLinkKeyDown, showSuccess revision param, docs): no further reuse or comment-bar issues; no style-source or LESSONS rule touched (LESSONS rule covers acceptance/** only, unchanged).

Checks (run directly with nvm 24; run.sh path unavailable because CLAUDE_PLUGIN_ROOT was unset)
- tsc --noEmit: clean
- lint:dup: 0 clones
- vitest on components/apps/aoe4-build-order: 26 files, 702 tests passed
- No browser or e2e tests run.
