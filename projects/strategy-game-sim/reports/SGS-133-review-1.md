# SGS-133 review 1

Verdict: **APPROVE**

- Branch `sgs-133-split-scroll-anchoring-run-bar-cap`, tip 464ea8f, base origin/main e15a982 (merge-base equals origin/main). Full review, not delta mode.
- Review worktree: `worktrees/review-sgs-133`. Removal is deferred because of the sandbox EBUSY on `.git/worktrees`, as REPO.md notes.

## Blocking findings

None.

## Spec gaps

None blocking. One design-text drift for the manager (see note 1).

## Acceptance criteria

1. Case (a), anchoring. **Pass.**
   - `aoe4-split-scroll.spec.ts` "clearing the duration error at the end of the page..." checks the preconditions first: the page is scrolled to the end with `mouse.wheel`, `scrollY > 0`, and both column `scrollTop`s are > 0.
   - It reads every rect in one evaluate after 2 rAFs (`barSnapshot`). It asserts that the bar got shorter, that `scrollY` moved at most 1px, and that the bar top is within 1px of 0 and stays within 1px.
   - Mutation, from implementer report 1: `overflow-anchor: none` changed to `auto` fails the test with a 126px move. The rule sits on the page section (first placement). The `html` fallback was not used.
2. Columns unchanged. **Pass.** Exact equality on both `scrollTop`s, which are asserted > 0 before.
3. Capped state precondition and height. **Pass.**
   - `openCappedState` builds the state through the real UI: `blockStorageWrites`, rejecting `writeText`, `saveCopy`, click `copy-saved-link`, wait for the hint, reopen the form, clear the name, wait for `save-copy-name-error`.
   - `cappedPrecondition` runs one evaluate. It checks that the four ids are shown (display, visibility, height > 0), that `scrollHeight > clientHeight`, and that the height is at most 0.4 x 720.
   - Mutation, from implementer report 2: `max-height: none` fails the test. It also fails `belowAtTop` once the earlier expectations are removed.
4. `--aoe4-run-bar-height` equals the rendered height plus margin, and the split ends at the viewport bottom. **Pass.** Polled in one evaluate after the page is scrolled to the end.
5. Case (c) content. **Pass, and the check is not vacuous.**
   - The test clears the copy name (`openCappedState`, spec lines ~231-232) and asserts that `save-copy-name-error` is visible.
   - In one evaluate it sets `scrollTop = 0` and checks `belowAtTop`, then sets `scrollTop` to max and checks `insideAtMax`.
   - My inspection confirmed the dependency on the name error. At 1280x720 without it, `scrollHeight` is 306 against `clientHeight` 287. With it, 339 against 287. The implementer measured the notice bottom at 523.5 against a bar bottom of 532.8 without the error (not below), and 556 against 533 with it.
   - So the test does the step, and `belowAtTop` can fail (it does under the cap mutation).
6. Case (c) focus. **Pass.**
   - `aboveAtMax` (select top above the bar top at max `scrollTop`) is asserted first. Then `locator.focus()`, then a rect-inside check in its own evaluate.
   - In inspection, focusing moved the bar's `scrollTop` from 52 to 41 at 1280x720, which puts the select at the bar's top edge.
7. No sideways scroll, and the focus ring fits at 768x1024 and in the capped state at 1280x720. **Pass.**
   - `focusRingFits` reads the spread from the computed `box-shadow` (`ringIsDrawn` guards spread > 0) and compares against the padding box (`clientLeft`/`clientWidth`).
   - The capped test re-asserts `overflows` first.
   - Mutation, from report 1: removing `padding-inline` and `margin-inline` fails both tests.
8. Below 768px the bar is static and uncapped. **Pass.** 700x900, computed `position: static` and `max-height: none`. Mutation (report 1): a cap query at `min-width: 1px` fails it.
9. Existing tests pass. **Pass (by report).**
   - No assertion was changed in a pre-existing test. Every test in the file now uses `gatedTest('aoe4-split-scroll')` (per-test client header), with no expectation changed.
   - The implementer ran every spec that uses `run-bar`, `auto-run-status` or the `save-*` ids: 379 passed, 1 failed. The failure is `aoe4-build-order-step-band.spec.ts:143`, which uses none of those ids and passes 13/13 alone.
   - I ran no acceptance tests, per my role.
10. Helpers defined once and imported; no clones. **Pass.**
    - `Created`, `copyButton`, `copyForm`, `copyName`, `copySubmit`, `submitCopy`, `saveCopy` and `REFUSED_CLIPBOARDS` moved to `acceptance/helpers.ts`. `aoe4-my-builds.spec.ts` imports them, and no test body changed.
    - I ran `npm run lint:dup`: 0 clones in both configs.
11. Docs. **Pass.** I checked each new sentence in `docs/aoe4-build-order.md` against the code:
    - 881, "never takes more than 40% of the viewport height ... scrolls inside itself": `max-height: 40dvh` and `overflow-y: auto` in `min-width: 768px`. Bootstrap's border-box sizing includes the padding and border.
    - "Below 768 px the bar is not stuck and has no height cap": the static rule, with the cap absent below 768px.
    - "The page section turns off the browser's scroll anchoring, so a bar that shrinks does not move the page": `.pageSection` on the page `<section>`.
    - 929, the narrow-layout "static and uncapped" sentence: holds.
    - None of the statements Scope listed is left untrue.
12. Lint, types and unit tests. **Pass.** I ran:
    - `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
    - `npm test`: 77 files passed, 1 skipped; 2455 tests passed.
    - `npx next build`: pass.
    - `aoe4-split-scroll.spec.ts` under acceptance: 16 passed, from implementer report 2.
13. No INVARIANTS.md regressions. **Pass.** See Invariants.

## Invariants touched

- A1-A3 (paths `pages/apps/aoe4-build-order.*` and `components/apps/aoe4-build-order/**`): hold. The change is CSS and one className, and nothing in the simulation path changed.
- S1-S3: not touched (no shared paths). S1 still holds, since the page imports only its own app's module.

## Spec checklist

- Contracts: no field, API or metric names changed.
- Scope: nothing out of scope. No `golang/`, no `useRunBarHeight` change, no reordered run-bar children.
- Naming: `pageSection` and `REFUSED_CLIPBOARDS` state their intent.
- A1-A3: not affected.

## Bot reconciliation

There is no `reviewBot` block in use (`cli` and `rulesFile` are empty), so this section was skipped.

## UI inspection

- I served the task worktree on port 3877 with `npx next dev`. `inspect.cjs` in the scratchpad stubbed the named-builds POST with a 201, so no storage write happened.
- It loaded `/apps/aoe4-build-order` at 375x760, 768x1024 and 1280x720 in these states: default, default with the select focused, capped (link, hint and form open), capped with the name error, capped with the bar at max `scrollTop`, then the select focused, then the page scrolled to the end.
- Clipped overflow in the run bar: none.
- Overlapping siblings in the run bar: none.
- Mid-word wraps: none.
- Document horizontal overflow: none at any width.
- Bar metrics:
  - 1280x720 capped: height 288, which is 40% of 720, so 60% of the viewport is left as the REPO checklist requires. `scrollHeight` 339 with the name error, 306 without.
  - 768x1024 capped: 409.6, which is 40dvh.
  - 375: `position: static`, `max-height: none`, height grows freely (777px capped). Same as before.
- Screenshots read: `capped-1280-nameerror`, `capped-1280-barmax-focus`, `capped-768-pageend` (bar stuck at top 0, select focus ring fully visible inside the 4.5px inline padding) and `capped-375-nameerror`. Nothing broken.
- The server was stopped and port 3877 is free. The task worktree's `git status` is clean.

## Non-blocking notes

1. **Design text drift.** `design/M9.md` row M9.12 (b) leaves clearing the copy name out of the capped-state steps, and the ticket calls that step "optional". But (c) says `my-builds-unavailable` "has its bottom below the bar's bottom" at `scrollTop` 0, which holds only with `save-copy-name-error` shown. Without the error the notice sits about 9px inside the bar (measured above).
   - The test does the step, so the code and tests are right.
   - The manager or designer should make the step required in the design row so a future re-spec does not drop it.
   - The margin with the error is about 23px at 1280x720, which depends on font metrics.
2. **Anchoring is off at every width.** `.pageSection { overflow-anchor: none; }` (`workbench.module.css:23`) applies at every width, including the static narrow layout and the tabs layout.
   - There, content growing above the viewport (an error or link appearing in the static bar while the user reads results lower down) now pushes the page instead of being anchored.
   - The ticket and design place the rule this way and state the scrollY rule without a width range, so this is not a finding. Flag it to the designer if the narrow layout should keep anchoring.
3. **Focus ring cut off after a focus scroll.** When the browser scrolls a focused control into view in the capped bar, it aligns the control's border box to the scrollport edge. The top 4.5px of the focus ring is then cut off. In inspection, `build-order-select` sat at the bar top at `scrollTop` 41 after focus.
   - The ticket's ring criterion covers `scrollTop` 0 only.
   - `scroll-padding-block: 0.25rem` on `.runBar` would keep the ring visible. Optional.
4. **Bootstrap utilities and module CSS on one element.** The REPO.md checklist says not to mix Bootstrap spacing utilities with module CSS on the same element. `build-input.tsx:48` already mixes them on the run bar (`py-2 mb-3 d-flex` with `styles.runBar`), and the diff adds `padding-inline` and `margin-inline` from the module.
   - Nothing is overridden: the utilities set only the block-axis padding and the bottom margin.
   - Bootstrap has no default negative-margin utility to do the job instead.
   - Left as a note.
5. **Small test-style departures.**
   - `aoe4-split-scroll.spec.ts` `openCappedState` uses inline `page.getByTestId('save-copy-form')` and `page.getByTestId('save-copy-name')` although this diff exports `copyForm` and `copyName` from `helpers.ts`. It imports only `copyButton`.
   - `REFUSED_CLIPBOARDS[0].script` picks the rejecting clipboard by array position. A lookup by `name`, or a named export, would survive a reorder.
   - Cosmetic.
6. **Screenshot without a focus ring.** In the inspection screenshot `capped-1280-barmax-focus` no ring was drawn on the select, while `capped-768-pageend` drew it. This is likely headless focus emulation in my script, not the page. The acceptance test reads a non-zero spread from the computed `box-shadow`, which covers it.

## Coverage

- Reviewed in full:
  - `components/apps/aoe4-build-order/workbench.module.css`
  - `pages/apps/aoe4-build-order.tsx`
  - `docs/aoe4-build-order.md` (both edited paragraphs)
  - `acceptance/helpers.ts` (the moved helpers)
  - `acceptance/aoe4-my-builds.spec.ts` (the import swap and removed definitions)
  - `acceptance/aoe4-split-scroll.spec.ts` (every new test against the Bar)
- Read for context: `use-run-bar-height.ts`, `build-input.tsx:43-48`, and the `gatedTest` and `blockStorageWrites` helpers. `workbench.module.css` is imported by 7 other files, all of which follow the `styles` or `workbench` naming pattern.
- Ran: lint (tsc and jscpd), `npm test`, `npx next build`, and the UI inspection.
- Not run (my role): acceptance specs. Acceptance coverage was judged by reading the tests and the implementer's recorded runs and mutation checks.
- REPO.md review checklist:
  - "Every diff": build run and page loaded.
  - "AoE4 build order": screenshots at 375, 768 and 1280. I did not load 360x760 or 390/700 separately; 375 and 768 bracket them and the bar is static and uncapped below 768.
  - No other section applies.
