# SGS-165 docs report 1

- Ticket: SGS-165. Branch: sgs-165-doc-pinned-color-wraps. Tip: 8330189f3c6e53432a3870325898859bfc154771
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-165-doc-pinned-color-wraps

## Docs touched
- docs/aoe4-build-order.md: pinned-run chart paragraph (only file changed).

## Doc claims
- "an index past the last palette color wraps around to the start, so colors then repeat, as they do for current series." True: `seriesColor` in components/apps/aoe4-build-order/chart-rows.ts returns `PALETTE[index % PALETTE.length]`, and `pinnedColor` and the legend use it for both current and pinned-only series.

## Removed claims
None.

## Other color-index statements
Grep of the doc for palette/color found only the kind-colour text (fixed per step kind, not index-based) and the legend text, which states no index rule. No other change was needed.

## CONTEXT.md Design docs rows
None.

## Checks
- Lint (tsc, jscpd): not run; a one-paragraph Markdown change.
- Codegen: none configured.
- Links: none added.
- No palette length quoted.

## Out-of-scope findings
None.

Status: needs_review
