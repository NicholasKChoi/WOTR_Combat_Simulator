# SGS-088 review 2 (delta)

Verdict: APPROVE
Branch: sgs-088-aoe4-workbench-ui-state-kept, tip 515e1c2, base main 2a36296. The previously reviewed tip was 270618a. The branch exists only as a local ref, not on origin. I reviewed it in a detached worktree at 515e1c2.

## Rebase check

`git range-diff fad1e41..270618a 2a36296..515e1c2`:
- `270618a = 8e9c276`. The rebased feature commit is patch-identical to the one I reviewed in review 1.
- `515e1c2` is the only new commit: the rework.

## Rework commit (515e1c2) review

Files: `components/apps/aoe4-build-order/build-input.tsx:88`, `components/apps/aoe4-build-order/workbench.module.css:92-96`, `acceptance/aoe4-step-table.spec.ts:681-690`.

- CSS: `button.activeView:disabled` sets `--bs-btn-disabled-bg`, `--bs-btn-disabled-border-color` and `--bs-btn-disabled-color` from the button's own `--bs-btn-active-*` values. Its specificity (0,2,1) beats `.btn-outline-secondary` (0,1,0), where Bootstrap defines those variables, so stylesheet order does not matter. The `var()` resolves on the same element, which also carries `.btn-outline-secondary`. It uses module CSS variables only, with no Bootstrap utility on the element, so the REPO no-mixing rule holds. The class string is built with `cn` (an array argument, which classnames supports).
- Measured with Playwright at 360x760, 768 and 1280, starting from both Table and Text view (computed styles after the transition settles):
  - Results tab: the active button is `rgb(108, 117, 125)` with white text and a `rgb(108,117,125)` border at opacity 0.65. The inactive button is transparent with grey text at opacity 0.65. Both are disabled.
  - Build tab, before and after: the active button is filled, the inactive one is transparent, opacity is 1 and both are enabled.
  - Screenshots at 360x760 and 1280: the pressed view is clearly filled and both buttons are faded as disabled. This closes review-1 finding 1.
- Test: the new `expect.poll` runs one `page.evaluate` that reads both computed backgrounds, which follows the repo lesson about reading in one evaluate. Mutation check: I removed `styles.activeView` from the button, and the test failed at `aoe4-step-table.spec.ts:690`. I then restored the file, and the worktree was clean afterwards.
- Doc claim `docs/aoe4-build-order.md:841` ("the active view stays marked") now holds both visually and in the attributes (`aria-pressed`, `active`).

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria (all ticked in the ticket)

- Unit helpers (a)-(c): PASS. Unchanged since review 1, and Vitest passes.
- Move/delete carry open state: PASS (acceptance `aoe4-step-table.spec.ts:611`).
- A text edit opens a closed row: PASS (`:631`).
- An open row survives Text/Table and a Run: PASS (`:650`).
- Buttons disabled on Results, a forced click changes nothing, enabled on Build: PASS (`:668`). The test now also asserts the visible fill.
- Pin-compare 500/abort/400/pinTouched cases: PASS (`pin-compare.spec.ts:493-533`).
- `acceptance/aoe4-build-order.spec.ts` is untouched: `git diff 2a36296..HEAD` is empty for that file. The doc grep finds nothing.
- Checks:
  - `npx tsc --noEmit`: clean.
  - `npm run lint:dup`: 0 clones.
  - `npm test`: 47 files, 1475 passed, 10 skipped.
  - `npx next build`: ok.
  - `npm run acceptance` (full suite): 734 passed, 0 failed.
- No invariant regressions: PASS.

Rework 1 Required fixes are all satisfied and ticked.

## Invariants touched

- S1: holds. The delta adds no imports.
- A1-A3: not touched. No lib, data or route files are in the delta.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. `rulesFile` is empty.

## Non-blocking notes

- `workbench.module.css:92`: the `button` element qualifier is not needed for specificity, since `.activeView:disabled` (0,2,0) already wins. Sibling rules in this file use plain class selectors. Harmless.
- Review-1 non-blocking notes still apply and were not in scope for this rework: the `moveFlag` copy of `moveStep`, the fixed 300 ms wait in the pin-compare delayed-500 test, and the optional rewording of the docs line.

## Coverage

- Delta reviewed in full: `build-input.tsx`, `workbench.module.css`, `aoe4-step-table.spec.ts`. The rebased feature commit was confirmed identical through range-diff and not re-reviewed.
- REPO checklist:
  - "Every diff": I ran next build and loaded the page through the Playwright dev server.
  - "AoE4 build order": screenshots and computed styles at 360x760, 768 and 1280. There is no layout or chart change, so the 390/700 overflow check does not apply. The delta does not mix module CSS with Bootstrap utilities.
