# SGS-181 spec gate 1

Verdict: NEEDS_SPEC (one small gap; everything else checks out)

Read at origin/main after `git fetch origin`. `MIN_SUPPORTED_VIEWPORT` is not in `acceptance/helpers.ts` at the base. The ticket says SGS-179 adds it and lists SGS-179 under Depends on, so this is consistent.

## Gaps

1. Acceptance criteria, first bullet - the check is a search over code. It tells the implementer to grep for `PHONE`, `TABS_VIEWPORT` and `showTab` and cites a clean typecheck as proof. `tsconfig.json` at the base has no `noUnusedLocals`, so `tsc` passes with an unused import or constant left behind. The "no case sets a viewport under 1200 px wide" half has no test or typecheck behind it either. The implementer can only guess what "proven" means here, and the rule is that a search is for doc and comment wording only.
   Proposed fix: state the rule as behavior. Every case in the three files runs at a viewport at least 1200 px wide, which the passing per-file `npm run acceptance` runs show. A deleted case is proven by the spec's case list. Drop the grep from the criterion, or keep it under Scope as the "check before editing" step it already is. If unused-import removal needs enforcing, add `noUnusedLocals` to the tsc run for these three files, or have review confirm each import is still used.

## Verified OK

- **Grounded scope.** Every name the ticket quotes exists at the base. In `aoe4-editor-width.spec.ts`: the `PHONE` and `COMPACT_BELOW_PX` constants and the cases and describes named for deletion or rewrite. In `aoe4-step-annotations.spec.ts`: the `[360, 768, 1280]` popover loop at height 760 and the 390x760 run-cell describe. In `aoe4-chart-views.spec.ts`: the `[360, 768, 1280]` tick loop at height 900. The `showTab` calls are present in all three files.
- **Run-cell border case at the default viewport.** `.kindBorder` is a base rule (4px solid `--kind-color`) in `step-annotation.module.css`. `StepRunCell` is a `td` carrying `styles.kindBorder` and has no overriding border, so the case holds at 1280x720.
- **Compact editor at both supported rows.** The design says the `build-editor` container is under 768 px at every two-column width: about 534 px at 1200 and about 624 px at 1800. The finish-time-hidden and font assertions therefore hold at both rows today. Dropping the `COMPACT_BELOW_PX` precondition is correct for the post-M10 end state.
- **Table view and hover cases at the default viewport.** Neither depends on the card layout. The hover case asserts `data-gutter-active` and the box shadow on the gutter row, and the table case reads `step-finished` in `step-run`.
- **`showTab` removal.** At widths of 1200 and above, `showTab` only asserts the panel is visible. The ticket requires a wait on the content instead, and that is enough.
- **Other checks.** Dependency stated, test-only, no business logic. Invariants `none` is right (no `lib/` or `components/` change). Risk `low`, no `criticalPaths` touched. Unverified assumptions `none` is right (real Chromium, nothing faked). On merge `none` is right. Docs: no doc describes these cases. No open questions. The design inventory rows and C5 match the ticket. SGS-180, SGS-182 and SGS-183 own different spec files, and SGS-184 removes only page code, so there is no throwaway work.

## Notes (non-blocking)

- The chart and popover loops move from fixed heights (900 and 760) to the row's own height (800 for `MIN_SUPPORTED_VIEWPORT`, 900 for `WIDE_VIEWPORT`). Say so in the implementer report. The assertions do not depend on height, but the popover case scrolls lines into view.
- "About 17" `showTab` calls and "about 250 spec lines" are estimates only. They are not in the criteria, which is fine.
