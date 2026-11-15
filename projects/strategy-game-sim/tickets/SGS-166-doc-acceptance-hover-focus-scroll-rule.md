# SGS-166: Document the instant-scroll rule for acceptance hover and focus sequences

- **Type**: Docs
- **Component**: site
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 4 (one short bullet in ARCHITECTURE.md; no code)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md bullet "(docs) LESSONS candidate (acceptance/**)" (from SGS-150, reports/SGS-150-implementer-1.md)

## Context

A Playwright `hover()` or `focus()` that needs the target in view scrolls the page, and the page smooth-scrolls (the Bootstrap stylesheet sets `scroll-behavior: smooth`; no repo CSS does). Rows then slide under the still pointer and fire late `pointerenter` events that change app state after an assertion already passed, so the test is flaky. `acceptance/aoe4-build-order-step-band.spec.ts` (the step-band hover test) avoids it by calling element `scrollIntoView({ behavior: 'instant' })` on the first row before the hover and focus steps. `acceptance/helpers.ts` already has `scrollInstantly`, which scrolls the window to a y offset (it does not scroll a target into view), and `settledScrollY` for the same reason. No repo doc states the rule, so a new acceptance test can reintroduce the flake. ARCHITECTURE.md is the repo's style source for implementers and already lists `acceptance/` and `acceptance/helpers.ts` in its Rules section, so it is the home. A LESSONS.md entry already covers the related rect-reading flake, but state-dir lessons are not repo docs.

## Scope

- `ARCHITECTURE.md`, section "Rules": add one bullet on acceptance tests that hover or focus. It states that Playwright `hover()` and `focus()` scroll the page and the site's Bootstrap stylesheet scrolls smoothly, that the resulting late `pointerenter` events can change state after an assertion passed, and that a test scrolls its targets into view instantly before the hover and focus sequence, so no step scrolls. Word the examples distinctly: element `scrollIntoView({ behavior: 'instant' })` in the step-band spec scrolls a target into view, while `scrollInstantly` in `acceptance/helpers.ts` scrolls the window to a y offset; the bullet must not suggest the helper scrolls to a target.
- Check `ARCHITECTURE.md` and the acceptance description in `README.md` for a statement this makes inconsistent; none is expected.

**Out of scope:** any code or test change; a new helper (for example an element-scroll helper); LESSONS.md or BACKLOG.md edits; the rect-reading rule.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `ARCHITECTURE.md` Rules states that acceptance tests scroll hover and focus targets into view instantly before the sequence, and why (smooth scrolling plus late `pointerenter` events change state after an assertion passed).
- [ ] The bullet names `scrollInstantly` in `acceptance/helpers.ts` (as a window-offset scroll) and `acceptance/aoe4-build-order-step-band.spec.ts` (as the element `scrollIntoView` example), both of which exist at the base. (respec 1)
- [ ] No file other than `ARCHITECTURE.md` changes (README.md only if Scope's check finds a contradiction).
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-15

- Underspecified: the ticket implied `scrollInstantly` scrolls a target into view (it scrolls the window to an offset), and attributed smooth scrolling to the site rather than the Bootstrap stylesheet.
- Changed: Context, Scope, and the example-naming criterion now word the two scroll mechanisms distinctly and name Bootstrap as the source.
- Stands: all other scope and criteria; no code work existed.
