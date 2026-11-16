# SGS-172 docs report 2 (rework 1)

- Branch: sgs-172-readme-entry-point, tip 1c0d25f6d41fad14b78296dd583281a5b9e4560e
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-172-readme-entry-point

## Docs touched
- README.md: the two Required fixes, applied verbatim (2 lines).

## Doc claims
- smoke:preview needs "Chromium from `npm run acceptance:setup` (the open step launches it)": scripts/smoke-preview.mjs line 109 `chromium.launch`, line 112 error "run npm run acceptance:setup".
- "fails on a production deployment, where deleting builds is disabled": scripts/smoke-preview.mjs line 162 (405 -> "FAIL production deployment: delete is disabled").
- 401/403 and bypass secret sentence: unchanged, scripts/smoke-preview.mjs line 73.
- docs/ bullet: "design docs for the WOTR combat simulator and the AoE4 build order": matches the Apps table (StarCraft has no design doc).

## Removed claims
- "the design docs, one per app": contradicted by StarCraft having no design doc.

## CONTEXT.md Design docs rows
None.

## Checks
Text-only change to two lines; no links added, lint/codegen not run (README is not checked by commands.lint). Ticket Rework 1 boxes ticked.

## Out-of-scope findings
None.

## Status
needs_review
