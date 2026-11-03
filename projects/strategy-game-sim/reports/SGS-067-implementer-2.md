# SGS-067 implementer 2 (rework 1)
Branch sgs-067-aoe4-inline-issues-suggestions, tip 46987c8 (commits c45738f, 46987c8 on top of 7db4db5). Worktree .claude/code-factory/worktrees/sgs-067-aoe4-inline-issues-suggestions.
Changes: acceptance/aoe4-build-order-inline-issues.spec.ts (no-line spec rewritten with 201x99 'x' lines, scrolled to top, below-fold assert; new repeat-rejection spec; new mid-text line-81-of-151 spec; position helper now requires the rect to be unchanged over 250ms in one evaluate); pages/apps/aoe4-build-order.tsx (line lookup scoped to the gutter test id).
Mutations (all restored): no scrollIntoView -> 5 fail incl. no-line; setRejection(converted.issues[0]) -> only repeat-rejection fails; block start without offset -> only mid-text fails.
Gate: tsc, lint:dup, npm test (1287 pass), full acceptance 661 pass, repeat-each=10 x3 files in parallel on a shared server 260 pass.
