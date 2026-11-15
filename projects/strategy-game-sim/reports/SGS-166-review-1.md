# SGS-166 review 1

Verdict: APPROVE. Branch sgs-166-doc-scroll-rule, tip 13a65f3a197de3831b70997945c327bfcae0841c. Docs ticket, risk low.

## Blocking findings
None.

## Docs check (each sentence in the new ARCHITECTURE.md Rules bullet)
- "Playwright `hover()` and `focus()` scroll the page when the target is out of view": holds. It matches the comment and behavior in acceptance/aoe4-build-order-step-band.spec.ts:157-159.
- "the Bootstrap stylesheet makes that scroll smooth": verified. pages/_app.js:1 imports `bootstrap/dist/css/bootstrap.css`. Bootstrap 5.3.8 (package.json and the lockfile) sets `:root { scroll-behavior: smooth }` at node_modules/bootstrap/dist/css/bootstrap.css:190-192. No repo CSS sets `scroll-behavior`; the only match is `overscroll-behavior` in workbench.module.css:40. Qualification: Bootstrap wraps the rule in `@media (prefers-reduced-motion: no-preference)`. Playwright's default reducedMotion is `no-preference`, so it applies in the acceptance runs. The bullet's claim holds for acceptance tests.
- "Rows then slide under the still pointer and fire late `pointerenter` events that change state after an assertion passed": matches the spec comment at step-band.spec.ts:157-159.
- "`scrollIntoView({ behavior: 'instant' })` on the element before the hover and focus sequence, as acceptance/aoe4-build-order-step-band.spec.ts does": holds. The spec calls it at line 160 and does the hover and focus steps afterward (lines 165-173).
- "`scrollInstantly` in `acceptance/helpers.ts` ... scrolls the window to a y offset, not to a target": holds. It does `window.scrollTo({ top: y, behavior: 'instant' })` at helpers.ts:228-233. The bullet does not suggest it scrolls to a target.

## Acceptance criteria
1. ARCHITECTURE.md Rules states the rule and the why: pass.
2. Names `scrollInstantly` as a window-offset scroll and the step-band spec as the element `scrollIntoView` example; both files exist at the base: pass.
3. Only ARCHITECTURE.md changed (`git diff --stat`: 1 file, 7 insertions). README.md has no acceptance statement that conflicts: pass.
4. No INVARIANTS regressions (ticket Invariants: none, docs only): pass.

## Non-blocking notes
- The Bootstrap smooth-scroll rule is conditional on `prefers-reduced-motion: no-preference` (see above). Not worth a change, since the default test browser matches it.
- The bullet's first sentence says tests scroll "hover and focus targets". The step-band spec scrolls only the first row up front and then asserts both rows are visible. That fits the rule.

## Lint, bot, conventions
- commands.lint was not run. The diff changes only markdown, and there is no code to type-check.
- No review bot is configured.
- The bullet matches the bold-lead-sentence style of the sibling Rules bullets. No ticket ids or factory pointers appear in it.

## Coverage
Reviewed ARCHITECTURE.md (the diff), pages/_app.js, node_modules/bootstrap/dist/css/bootstrap.css (read from the main checkout's installed copy, version 5.3.8), acceptance/helpers.ts, acceptance/aoe4-build-order-step-band.spec.ts, and README.md. No UI changed, so no UI inspection ran.
