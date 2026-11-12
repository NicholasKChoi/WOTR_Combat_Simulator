# SGS-133 implementer report 1

Status: needs_spec (designer question). The CSS, docs, helper moves and most tests are committed and green, but the capped test state the ticket prescribes cannot meet its own stopping rule, so acceptance criteria 3 (partly), 5 (partly) and 6 (the cancel-button reachability half) are not met.

- Branch: sgs-133-split-scroll-anchoring-run-bar-cap, tip 1027decd69b3738c7a3df5b29ec149519168781d (base origin/main 91cbd64, which contains SGS-132)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-133-split-scroll-anchoring-run-bar-cap

## The blocking gap (designer question)

Ticket Scope: the capped state at 1280x720 must make both `scrollHeight > clientHeight` and `save-copy-cancel`'s bottom below the bar's bottom at `scrollTop` 0. It says to add real content in order (the link and copy form, then the clipboard-refused hint, then the copy-name error) and, if even that does not meet both, to stop and report a designer question without tuning the viewport.

I built the full state: storage writes throw, clipboard `writeText` rejects, `saveCopy`, click `copy-saved-link` (hint shows), reopen the copy form, clear the name (`save-copy-name-error` shows). Measured at 1280x720 (bar 288px = the cap):

- `scrollHeight` 339 > `clientHeight` 287: the overflow condition holds.
- `save-copy-cancel` spans y 398 to 441 while the bar's bottom is at y 533: it is 92px inside the bar. The second condition fails.
- The overflow comes only from content after the form: `copy-saved-link-hint` (483 to 515) and `my-builds-unavailable` (524 to 556).
- In DOM order the `save-copy-form` (with its name error, which sits inside the name field and does not push the cancel button down, because the form row is `align-items: flex-start`) comes before the hint and the unavailable notice. The cancel button stays near the top of the bar's content. Nothing in the enumerated content, or the duration error (about 25px on the first row), can push it 92px lower.

So no state built from product UI at 1280x720 puts `save-copy-cancel` below the cap after SGS-132's compact save row. Design M9.12 case (c) ("`save-copy-cancel` (the bar's last focusable control)") was written against the pre-SGS-132 layout; it also says "last focusable control", which is no longer true of the DOM order once the hint and notice are below it. Needed from the designer: a different reachability control or state (for example the last focusable control in the capped state, `copy-saved-link` or `save-copy-cancel` with a taller form), or accept a cap test without a below-the-cap control.

I did not add the cancel-below-bar assertion or the focus-reach test. Committed instead (so the manager has what passes): the overflow condition (`scrollHeight > clientHeight`), the 0.4 x 720 height bound, the `--aoe4-run-bar-height` and split-bottom checks, and `auto-run-status` inside the bar at max `scrollTop`.

## Second gap: `auto-run-status` "shown"

`auto-run-status` renders an empty `<p>` whenever the status is `current` (`autoRunStatusMessage('current', _)` returns `''`), so it has zero height and is never "shown" in the Playwright sense after a completed run. Also, a settled change (a run triggered by editing) clears `saved-build-link` and `my-builds-unavailable`, so a run cannot be completed after the link state is built. The test relies on the run that `openPage` already completed (status `current`) and, in the precondition, treats `auto-run-status` as shown when it is rendered (display not none, visibility not hidden). The rect-inside-bar check at max `scrollTop` is therefore a position check of a zero-height element. The ticket's wording needs a decision: either make the status non-empty in the state (hold a run so the status reads Computing or Updating) or accept position-only.

## Third deviation: bar top at the end of the page

At the end of the page the sticky bar's top reads 0.797px, not 0, before and after clearing the error. `useRunBarHeight` ceils the property (existing behavior), so the split is under 1px shorter than the space, and the sticky bar is pushed up by the remainder. The test asserts `|barTop| <= 1` and `|after.barTop - before.barTop| <= 1` instead of the ticket's exact 0. I did not touch `useRunBarHeight` (out of scope).

## Files touched

- `components/apps/aoe4-build-order/workbench.module.css`: `.runBar` gets `max-height: 40dvh`, `overflow-y: auto`, `padding-inline: 0.25rem` and `margin-inline: -0.25rem` from 768px up (the padding leaves room for Bootstrap's 4px focus ring, the negative margin keeps the bar's content aligned with the container); new `.pageSection { overflow-anchor: none; }`.
- `pages/apps/aoe4-build-order.tsx`: imports the module and puts `workbenchStyles.pageSection` on the page `<section>`.
- `docs/aoe4-build-order.md`: the "Page" paragraph and the narrow-layout sentence (quoted below).
- `acceptance/aoe4-split-scroll.spec.ts`: new describe with 5 tests; the file's `test` is now `gatedTest('aoe4-split-scroll')` (per-test client header, as the saves hit the real route).
- `acceptance/helpers.ts`: gains `Created`, `copyButton`, `copyForm`, `copyName`, `copySubmit`, `submitCopy`, `saveCopy`, `REFUSED_CLIPBOARDS` (moved from the my-builds spec; `blockStorageWrites` was already here).
- `acceptance/aoe4-my-builds.spec.ts`: removed the moved definitions and imports them; no assertion changed.

Placement of `overflow-anchor: none`: on the page section (the first placement). It made case (a) pass; the `html` fallback was not needed.

## Tests

- `npx tsc --noEmit && npm run lint:dup` (both configs): pass, 0 clones.
- `npm test`: 75 files passed, 1 skipped; 2411 tests passed, 15 skipped.
- `npx next build`: pass.
- `aoe4-split-scroll.spec.ts` under Playwright: 15 passed (10 existing, 5 new).
- `aoe4-my-builds.spec.ts`, `aoe4-small-screen.spec.ts`, `aoe4-save-status.spec.ts` (touched helpers and the layout): 102 passed. The other specs that use `run-bar`/`save-*` ids were not run; the acceptance gate owns them.

New tests and the invariants they encode:

1. Clearing the duration error at the end of the page (1280x800, long build, both columns scrolled): `scrollY > 0` and the bar got shorter first; then `scrollY` within 1px, bar top within 1px, both column `scrollTop`s unchanged (and asserted > 0 before). All rects read in one evaluate after 2 frames.
2. Capped state: precondition evaluate (link, copy form, storage warning, hint, `auto-run-status` present; `scrollHeight > clientHeight`; height <= 0.4 x 720), then `--aoe4-run-bar-height` equals bar height plus margin within 1px with `workbench-split` ending at the viewport bottom, then `auto-run-status` inside the bar at max `scrollTop`.
3 and 4. Focus ring of `build-order-select` (spread read from computed `box-shadow`) lies inside the bar's padding box and `scrollWidth <= clientWidth`, at 768x1024 and in the capped state (the overflow is re-asserted there).
5. At 700x900 the bar computes `position: static` and `max-height: none`.

## Pinned outputs

None; the focus ring spread is read from the engine at runtime.

## Mutation checks (each undone, `git diff` of the CSS clean afterwards)

- `workbench.module.css` `overflow-anchor: none` changed to `auto`: test 1 failed at `Math.abs(after.scrollY - before.scrollY) <= 1` (received 126).
- `max-height: 40dvh` changed to `none`: test 2 failed at the precondition `expect(state.overflows).toBe(true)` (the uncapped bar no longer overflows). The `height <= 0.4 x 720` assertion was not reached.
- `padding-inline` and `margin-inline` removed: tests 3 and 4 failed on `ringInside: false`.
- Cap media query changed from `min-width: 768px` to `min-width: 1px`: test 5 failed on `maxHeight` (received "360px", expected "none").
- Not mutated: the `--aoe4-run-bar-height` and split-bottom assertions and the `auto-run-status` position assertion (no production line the ticket allows me to break reaches them without touching `useRunBarHeight`).

## Doc claims

In `docs/aoe4-build-order.md` ("Page" paragraph), replacing "At 768 px and wider a run bar stays at the top of the viewport while the page scrolls; below that it scrolls with the page.":

- "At 768 px and wider a run bar stays at the top of the viewport while the page scrolls, and it never takes more than 40% of the viewport height: when its content is taller, the bar scrolls inside itself." Backed by `workbench.module.css` `.runBar` (`position: sticky`, `max-height: 40dvh`, `overflow-y: auto` in `min-width: 768px`); test 2 checks overflow and the height bound.
- "Below 768 px the bar is not stuck and has no height cap, so it scrolls with the page." Backed by the unchanged static rule and test 5.
- "The page section turns off the browser's scroll anchoring, so a bar that shrinks does not move the page." Backed by `.pageSection` and test 1 (checked for the duration error only).

Narrow-layout sentence: "the run bar is static and uncapped, scrolls with the page and wraps onto several rows": same backing (test 5).

## Pre-existing tests edited

None changed in assertion. `aoe4-split-scroll.spec.ts`: the test base changed from Playwright's `test` to `gatedTest('aoe4-split-scroll')` for all tests in the file (sets a per-test `x-forwarded-for`; no expectation changed). `aoe4-my-builds.spec.ts`: moved definitions imported from `helpers.ts`, no test body changed.

## Unverified assumptions added

- The ticket's assumption that a `max-height: 40dvh` box scrolls a focused control into view is unchecked: the case (c) test that would verify it was not written (see the blocking gap).
- Bootstrap's focus ring spread (4px) is read at runtime; `padding-inline: 0.25rem` equals it. If the ring spread changes, the focus-ring test fails.

## Invariant check

No INVARIANTS.md entries apply to the paths (CSS, one page class, docs, acceptance). Hook `useRunBarHeight` unchanged. Run-bar children not reordered.

## Out-of-scope findings

- `useRunBarHeight` ceils the property, which makes the sticky bar read 0.797px from the top at the end of the page (see the third deviation).
- Next logs "Detected `scroll-behavior: smooth` on the `<html>` element" in the acceptance runs (existing).

## Status for the manager

needs_spec: ask the designer for (1) a reachability control and state that works with SGS-132's layout (cancel button is 92px inside the cap at 1280x720 with every enumerated addition), and (2) the meaning of "shown" for `auto-run-status` (empty at status `current`). Everything else in the ticket is implemented, committed and green.
