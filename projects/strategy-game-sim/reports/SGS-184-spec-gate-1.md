# SGS-184 spec-gate report 1

Verdict: READY

Read at origin/main (6411526) after `git fetch origin`. SGS-179 to SGS-183 are drafts and touch only `acceptance/`, so the component, page and CSS files are the same at the base. No scratch checkout was needed.

## Checks

- Grounded scope: `workbench-tabs.tsx`, `use-split-layout.ts`, `workbench-tabs.test.ts`, `build-input.tsx` (`viewDisabled`, `disabled={viewDisabled}`), `step-table.tsx` (`styles.startSpacer` at line 244, `d-flex d-md-inline-flex` at line 90), both CSS modules and the page (`tab`, `awaitingLoadTab`, `resultsEnabled`, `shownTab`, `split`, `viewDisabled`) all exist as described. Every `@media` and `@container` rule the ticket names exists, and those are the only ones in the AoE4 components. No other file imports `workbench-tabs` or `use-split-layout` outside `acceptance/`. `showTab`, `TABS_VIEWPORT` and `SPLIT_MIN_WIDTH` stay in `helpers.ts` until this ticket, which matches what SGS-179 to SGS-183 say in their own scope.
- C4 arithmetic holds. At 1199 the outer container gives a 933 px content width, the floor lifts the section to 1113 px, and at 1200 it is 1113 px. At 390 the section overflows, so `scrollWidth` exceeds `innerWidth`.
- Contracts C1, C2, C4, C6 and C7 match design/M10.md. Dependencies are stated. Risk `standard` fits: no `criticalPaths` entry is touched.
- Invariants are none, correct: A1 to A3 cover the engine, not layout.
- No open questions. The owner has answered OD1 and OD2, and the ticket agrees with the design Decisions.
- Docs are left to SGS-185. That is the design's delivery order, and SGS-185 depends on this ticket, so it is not a gap. Code comments at the seams are in Scope.

## Notes (non-blocking)

1. Dead CSS-module class. Deleting `button.activeView:disabled` leaves `styles.activeView` with no rule. It is used only in `build-input.tsx:111` (`['active', styles.activeView]`). Scope should also say to drop `styles.activeView` from that className, or the implementer leaves a reference to an undefined class.
2. Viewport mismatch in the first criterion. It asserts the no-tablist and two-panel checks at `MIN_SUPPORTED_VIEWPORT` and `WIDE_VIEWPORT`. Scope adds the `tablist` role check to the "split at 1280" case, which uses `SPLIT_VIEWPORT`. Say which viewports the check runs at. A sibling case with rows `[MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]` satisfies the criterion.
3. Section locator. The width criterion reads "the page section's border-box width", but the section has no test id (`pages/apps/aoe4-build-order.tsx:346`, `<section class="container pageSection">`). Name the locator, for example the `section` that contains the `h1`, or add a test id.
4. Criterion 7 ("`.editor` is not a size container"). It is checkable as a computed `containerType` of `normal`, or left to the reviewer reading the CSS, which the criterion already says. Fine as is. Do not turn it into a grep of the CSS.
5. The first criterion's cases already hold at the base at 1200 and 1800: today's code shows two columns, so no tablist and both panels visible already pass. The new cases only guard against regression, and the server-render and below-1200 cases are the ones that can fail on the base. This is acceptable.
6. The tab-order and keyboard rule (B10) is covered by the kept `aoe4-split-tab-order.spec.ts`. SGS-180 leaves that file unchanged.
