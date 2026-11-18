# SGS-203 spec gate (report 4)

Verdict: READY

Checked against origin/main (fetched). No dependencies. Re-spec 1 closed both gaps from report 2.

## Checks

- Grounded: `MarkerControl` (chart-legend.tsx, root `cn(styles.legend, 'small mb-3')`, returns null without kinds), `results-last-good` and `chart-table` in results.tsx, `results-column` in workbench-columns.tsx, `.column` shared with `build-column`, `useRunBarHeight` and `.runBar` all exist as described.
- The sticky parent is `results-last-good`, which holds the control and the whole table, so sticking holds across the table length. `.column` is the scroller.
- Docs: lines 137 and 159 of `docs/aoe4-build-order-ui.md` match the ticket's quotes. Line 135 ("the marker control below is the only one") stays true.
- Criteria are observable: rect and `elementFromPoint` checks in one `evaluate` inside `expect.poll`, `scroll-padding-top` computed value, `aria-pressed`. The existing-test rule is stated as a rule, not a list. Risk standard is right (no criticalPaths symbol). Invariants, On merge, Diagrams, Open questions and the Unverified assumptions entry are fine. No overlap with SGS-204, SGS-205 or SGS-206.

## Notes (non-blocking)

- Criterion 4 says "tabbing from the control to a lower chart's drag handle". The next tab stop after the control is the first chart's handle, so the implementer must focus a lower chart's handle (repeated Tab, or `focus()`) with the column scrolled so that handle is out of view. Intent is clear.
- The hook must run before `MarkerControl`'s early `return null`, with a ref on the root. It must clear the property when the root is absent, which the no-marker criterion covers.
