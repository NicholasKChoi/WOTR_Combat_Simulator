# SGS-105 implementer 4 (Rework 3, text)

Branch sgs-105-save-and-open-by-link, worktree .claude/code-factory/worktrees/sgs-105-save-and-open-by-link.
Tip: see summary (commit amended once to remove a doubled blank line before `## CivRules seams`).

Change: docs/aoe4-build-order.md only. Moved the "#### Saving a build and opening it by link" block (heading through "...when the wait is unknown.") to after the line ending "MAA/Crossbow`.", one blank line each side before `## CivRules seams`; removed the blank at the old :901. "At 1200 px and wider ..." now follows the Narrow layout paragraph. Note: the block ended at :928 in the file (ticket said :927); the block was moved whole.

Verification: git diff --stat shows 1 file; line multiset diff (sorted added vs removed lines) differs only in blank lines (the removed blank and the added blank separators); word diff shows no changed words. No code touched, so build/lint/tests not re-run (text-only).
Status: needs_review
