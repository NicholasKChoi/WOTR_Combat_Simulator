# SGS-193 review 7 (delta, tip a84332a3 vs bounced cd3add99)

Verdict: APPROVE

## Required fixes (Rework 1)
- Busy test: lines replaced by `await openTable(page, text)`: landed.
- Loop test: `openPage` + `setText` replaced by `await openTable(page, text)`; `showView(page, 'table')` and step-run visibility lines removed from the top of `expectTableAndPopover`: landed. `openTable` (spec :27-32) does the same four calls.
- No assertion changes: confirmed. The delta only removes 8 lines and adds 2 `openTable` calls. Every `expect` on `step-blocked-by` and the popover is untouched. It touches no other file.

## Blocking findings
none.

## Checks
- `tsc --noEmit` is clean. `eslint` could not run in the checkout (it reports an .eslintrc migration error), so lint is unverified here; the delta only removes duplicated calls.
- The earlier notes 1-3 in review-5 stay non-blocking.

## Coverage
Delta diff cd3add99..a84332a3 only (one file, `acceptance/aoe4-step-annotations.spec.ts`). No tests run (role rule).
