# SGS-181 spec gate 2

Verdict: READY

Read at origin/main after `git fetch origin`. `MIN_SUPPORTED_VIEWPORT` is not in `acceptance/helpers.ts` at the base. The ticket lists SGS-179 under Depends on, and design C5 defines it as 1200x800, so this is consistent.

## Gap from gate 1: closed

The first acceptance criterion is now behavior, not a search. Every case runs at 1200 px or wider, shown by passing per-file `npm run acceptance` runs. A deleted case is shown by the spec's case list. The grep survives only as the "check before editing" step in Scope, which is allowed.

## Verified at the base

- **Grounded scope.** These names exist in the three files:
  - `PHONE` and `COMPACT_BELOW_PX`, the compact-mode cases and the two describes slated for deletion.
  - The `[360, 768, 1280]` popover loop at height 760, and the 390x760 run-cell describe.
  - The `[360, 768, 1280]` tick loop at height 900, plus the `showTab` calls in all three files.
- **No unlisted narrow widths.** A grep of `viewport`, `setViewportSize` and `PHONE` over the three files finds only the cases the ticket names.
- **Default viewport.** `playwright.config.ts` uses Desktop Chrome with no override (1280x720). The table-view finish-time case, the hover case and the run-cell border case do not depend on width. The border is a base rule, `.kindBorder`, in `step-annotation.module.css`.
- **Supported rows.** `SPLIT_MIN_WIDTH` is 1200, so both rows get the split layout. The editor column is under 768 px at both rows, per the design, so the compact assertions (finish time hidden, 0.875 rem fonts) hold. Dropping the `COMPACT_BELOW_PX` precondition is correct for the end state.
- **Other checks.**
  - Design inventory rows and C5 match the ticket.
  - The Depends-on is stated.
  - Invariants `none`, risk `low`, unverified assumptions `none` and On merge `none` are each right for a test-only change.
  - Docs: none describe these cases.
  - Open questions: none.
  - No overlap with sibling tickets: SGS-180, SGS-182 and SGS-183 own other specs, and the code ticket removes page code only.
  - Test criteria state behavior. The ticket quotes no stale counts. The "about 17" and "about 250" are estimates outside the criteria.

## Notes (non-blocking)

- The chart and popover loops move from fixed heights (900 and 760) to each row's own height (800 and 900). The ticket already asks the implementer to say so in the report.
- `tsconfig.json` has no `noUnusedLocals`, so review must confirm unused imports and constants are removed. The ticket says this.
