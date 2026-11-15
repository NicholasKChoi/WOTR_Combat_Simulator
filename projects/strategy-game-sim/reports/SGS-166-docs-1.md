# SGS-166 docs report 1

- Ticket: SGS-166. Branch: sgs-166-doc-scroll-rule. Tip: 13a65f3a197de3831b70997945c327bfcae0841c (base 0d708bc).
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-166-doc-scroll-rule

## Docs touched
- ARCHITECTURE.md, Rules: one new bullet on acceptance hover and focus scrolling.

## Doc claims
- "Playwright `hover()` and `focus()` scroll the page when the target is out of view": the comment at acceptance/aoe4-build-order-step-band.spec.ts:157-159.
- "the Bootstrap stylesheet makes that scroll smooth": from the ticket (Context, re-spec 1). NOT independently verified: node_modules is absent in the checkout, and `grep scroll-behavior styles` found no repo CSS.
- "late `pointerenter` events that change state after an assertion passed": same spec comment, lines 157-159.
- "scrollIntoView({ behavior: 'instant' }) on the element ... as acceptance/aoe4-build-order-step-band.spec.ts does": spec line 160.
- "`scrollInstantly` in acceptance/helpers.ts ... scrolls the window to a y offset": helpers.ts:228-233 (`window.scrollTo({ top: y, behavior: 'instant' })`).

## Removed claims
None.

## CONTEXT.md Design docs rows
None.

## Checks
- README.md has no acceptance description; ARCHITECTURE.md had no scroll statement. No inconsistency.
- Lint (tsc, lint:dup): not run, docs-only change to ARCHITECTURE.md, which jscpd does not scan. Codegen: none configured.
- Links: the bullet adds no links. Both named files exist at the base.

## Out-of-scope findings
None.

## Status
needs_review
