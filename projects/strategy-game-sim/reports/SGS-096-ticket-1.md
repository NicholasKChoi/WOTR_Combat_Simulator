# SGS-096 ticket author report

File: `.claude/code-factory/projects/strategy-game-sim/tickets/SGS-096-workbench-ui-bugs.md`

Title: Hide a pinned series with its current series, and cover charts resized while Results is hidden. Component aoe4-build-order, Risk standard, Depends on none, about 30 lines of business logic (more if the resize spec finds a chart bug). Checked against `origin/main` at 9274372.

## Per item

1. `NumberControl` draft lost on remount: DROPPED. The draft is cleared by the input's `onBlur`, and activating the Text/Table button blurs the input first. Invalid text also never makes the text unparseable (`setTriggerNumber`, `setNumberField`, `setStartCount` return the step unchanged), so the table never unmounts mid-typing. Read from code, not reproduced in a browser.
2. Resize while Results is hidden: INCLUDED as a spec. `workbench-tabs.tsx` renders Results as a `hidden` tabpanel, `line-chart.tsx` uses `ResponsiveContainer`, and no acceptance spec resizes while Results is hidden. Not run, so it is unknown whether the chart is actually wrong. The ticket says add the spec, fix only if it fails, and report which.
3. Strict Mode double restore POST: DROPPED. There is no `next.config.*` and no StrictMode wrapper. Next 16 enables Strict Mode by default only for the App Router (`define-env.js`: `__NEXT_STRICT_MODE` is false when `reactStrictMode` is unset), so the effect runs once in dev. Read from code, not run.
4. Pinned legend item stays after hiding the current item: REPRODUCES by code. `SeriesChart` and `SeriesLegend` read `hidden.has(key)` with separate `food` and `pinned:food` keys. The fix is a pure helper in `chart-rows.ts` used by `line-chart.tsx` and `chart-legend.tsx`, plus a docs sentence fix at `docs/aoe4-build-order.md` ("a pinned series' item follows its current series' item").

Criteria commands: the one grep (doc sentence) matches on main today and is gone after Scope 3. Nothing else is a runnable command or mutation check.

## Open questions

- owner: the doc word "follows" is ambiguous. The ticket makes hiding the current item also hide the pinned one, with the pinned item still hideable alone. The alternative is to change the doc and keep the two independent.
- designer: M6.2 and M6.3 make item 2 partly moot, since the Results panel is no longer hidden at desktop widths. It remains under the stacked-tab breakpoint, and the spec's desktop step needs rewriting when M6.2 lands.

## Overlap

None with open tickets seen. SGS-088 explicitly left items 1 to 3 in the backlog. Manager follow-up: delete the four BACKLOG bullets once this merges, including the two dropped ones, with the reasons above.
