# SGS-096: Document that a pinned legend item is independent of its current item

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog cleanup 2026-11-06; independent of M6)
- **Priority**: low
- **Risk**: low
  <!-- Docs sentence plus one acceptance case; no chart, engine, API or schema code changes, no criticalPaths symbol. -->
- **Invariants**: none adjacent (A1-A3 are not touched). S1 holds: no imports change.
- **LOC estimate**: 0 business-logic lines (one docs sentence; one acceptance case, which is test code).
- **Depends on**: none
- **On merge**: none (manager follow-up: delete the BACKLOG.md bullets this ticket names as Source, and the SGS-066 resize bullet is deferred to M6, so move it under M6 rather than delete it)
- **Source**: BACKLOG bullet "SGS-084 review-1: after hiding the current `Gold` legend item, `Gold (pinned)` still shows". Owner answers Q12 (B) and Q13 (A), 2026-11-06. Checked against `origin/main` at `9274372`.

## Context

`docs/aoe4-build-order.md` says "a pinned series' item follows its current series' item", but the chart keeps the pinned item under its own `pinned:<key>` key: hiding `Gold` leaves `Gold (pinned)` drawn. The owner decided the code is right and the doc is wrong.

## Scope

1. **Reword the doc.** In `docs/aoe4-build-order.md`, next to the legend description ("Clicking a legend item hides that series ... a pinned series' item follows its current series' item."), replace the clause with a statement that a pinned item is hidden and restored under its own `pinned:<key>` key, independent of its current series' item (hiding `Gold` does not hide `Gold (pinned)`, and the reverse). Grep the doc, `README.md` and `ARCHITECTURE.md` for `pinned series' item` and `follows its current` and fix any other statement of the old rule. No code change in `chart-rows.ts`, `line-chart.tsx` or `chart-legend.tsx`.
2. **Pin the independent behavior.** The existing case "the pinned legend item toggles only the pinned line" in `acceptance/aoe4-build-order-pin-compare.spec.ts` covers hiding the pinned item leaving the current line. It does not cover the reverse. Add a case in the same spec for hiding the current item leaving the pinned line drawn. `toggleHidden` tests in `chart-rows.test.ts` already cover per-key toggling; add no helper or unit tests.

**Out of scope:** any chart or legend behavior change; a Playwright spec for resizing the window while the Results panel is hidden (deferred to M6, which covers the narrow-width stacked-tab case, Q13); the dropped items below; engine, route and data files.

Dropped from the original rough task, checked on `origin/main` at `9274372`:

- `NumberControl` draft lost on the Text/Table toggle (`components/apps/aoe4-build-order/step-table.tsx`): the input's `onBlur` clears the draft before the toggle acts, and invalid text never makes the step text unparseable (`step-table-model.ts` setters return the step unchanged). Read from code, not reproduced in a browser.
- Restore POSTs twice in dev Strict Mode (`pages/apps/aoe4-build-order.tsx`): no `next.config.*`, no `StrictMode` wrapper, and Next 16 does not enable Strict Mode by default for the Pages Router.

## Diagrams

Docs and test only; no diagram required.

## Acceptance criteria

- [x] In `acceptance/aoe4-build-order-pin-compare.spec.ts`, with a pin and a later run, clicking the current legend item `food` in `chart-gather-rates` leaves no `food` line, leaves the `pinned:food` line drawn, dims only the `food` item (`opacity` 0.5, exactly one item `aria-pressed=true`), and leaves `pinned:food`'s legend item at full opacity; clicking `food` again restores the `food` line. The case catches a change that hides the pinned line with its current series.
- [x] The existing case "the pinned legend item toggles only the pinned line" still passes unedited.
- [x] `git grep -n "follows its current" -- docs README.md ARCHITECTURE.md` finds nothing, and the doc states that a pinned item is hidden under its own key, independent of its current item.
- [x] No file under `components/apps/aoe4-build-order/` other than tests changes.
- [ ] `npx tsc --noEmit`, `npm test`, `npm run lint:dup` and the touched acceptance spec pass.
- [x] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 2026-11-06

- Underspecified: two owner questions (Q12 pinned-legend reading, Q13 resize spec) were open.
- Changed: Q12 answer B turns item 1 into a doc rewrite plus one reverse-direction acceptance case, dropping the helper and its unit tests; Q13 answer A moves the resize spec to M6 (Out of scope). Risk lowered to low, LOC to 0; On merge stays none.
- Branch work: none exists.
