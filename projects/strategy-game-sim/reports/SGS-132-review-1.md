# SGS-132 review 1

Branch `sgs-132-save-panel-live-status`, tip `5ab8f45e3c9f9b7c1674532ca60abed475d2bbcb`, base `origin/main` (`5564bd0`, merge-base). Full review (no earlier approved tip).

**Verdict: REQUEST CHANGES** (one blocking test finding, text-free; product code, CSS, docs and the two carve-out spec edits are fine).

## Blocking findings

1. `acceptance/aoe4-save-status.spec.ts:58,75-78` - test - The first test is named "... and is empty while a save is in flight", but its in-flight check cannot fail. Line 73 (`editText(page, 2)`) changes the settled input, and that already hides the link and empties the status. So `{ link: false, status: '' }` at line 77 is true before the held PUT is clicked. If you delete `saving ||` from `saveStatusText` (`save-build.tsx:58`), line 77 still passes because `saved` is already null. A test name that claims a check its assertions do not make is always blocking. The in-flight behavior is really tested by the second test ("keeps the link and empties the status while a second copy is in flight", lines 82-92). It goes from `{ link: true, status: 'Saved' }` to `{ link: true, status: '' }` and fails if `saving ||` is removed from `save-build.tsx:58`, because the status stays `Saved`. Direction:
   - Rename the test to `'reads Saved after a copy and the new revision after each version'`.
   - Replace lines 75-78 (the `holdRequests` call, the click, the vacuous poll and `release()`) with `expect(await saveVersion(page)).toBe(3)`, and keep line 79's poll for `{ link: true, status: 'Saved version 3' }`. That assertion fails if `save-build.tsx:193` passes the loaded revision (2) instead of `response.revision` (3). The status reads `''` just before the save (the link was hidden by the edit) and `Saved version 3` after it.
   - `holdRequests` stays imported, because the second test uses it.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | `saveStatusText` table | pass | `save-build.test.ts` `it.each` has 9 rows. Removing the settled check fails the 3 "since the save" rows, and removing the saving check fails the 2 "in flight" rows. Ran: 27/27 pass. |
| 2 | Static no-save render | pass | `save-build.test.ts:83-93`: `save-panel` > `save-row` with ids `[save-build, save-build-copy, save-status]`, the status empty, and all 3 attributes present. |
| 3 | Browser DOM order with link; below-row elements | pass | Spec line 65 (`LINK_ROW`); lines 231-277 check that each of the 4 elements is outside `save-row`, has parent `save-panel`, and follows the row or an earlier below-row element. |
| 4 | Link visible and no save in flight means non-empty; link absent means empty; in-flight second save; Saved / Saved version N; both viewports | pass (code), test defect noted | Code: the status is derived only from `saved`/`settled`/`saving` (`save-build.tsx:57-60,271`). The second test covers the in-flight case at both viewports. The vacuous assertion in the first test is finding 1. |
| 5 | Empty while in flight; error reply and `route.abort()`; no stale Saved | pass | Spec lines 96-113 go from `Saved` to `{ link: false, status: '' }` with `save-build-error` non-empty. `showFailure` clears `saved` (`save-build.tsx:150-155`). |
| 6 | Empty after text, duration and select change and after Escape; no timer | pass | Spec lines 116-137 and 148-158; the 4 s wait is at line 119. No timer in the code. |
| 7 | `persisted: false` still shows the status | pass | Spec lines 139-145; the below-row placement of `my-builds-unavailable` is covered at lines 248-254. |
| 8 | Escape scope and focus; fails if the handler is on the row or panel | pass | `onLinkKeyDown` is attached only to the link (`:283`) and Copy link (`:285`). Spec lines 148-166: with the handler on `save-row`, Escape on `save-build-copy` would hide the link and fail line 165. |
| 9 | Geometry at 1280 and 390 | pass | Spec lines 169-229, every read in one `page.evaluate` inside `expect.poll`. Inspection: at 1280 the row is 43px tall, the same as the buttons, before and after a save. At 390 the row wraps as buttons / status + link / Copy link. |
| 10 | Test ids kept; `auto-run-status` is the bar's last child | pass | `build-input.tsx` is unchanged from the base (`git diff --stat` empty). `auto-run-status` (`:129`) follows `SaveBuild` (`:118`) as the form's last child. |
| 11 | small-screen sticky: sub-1px tolerance, other assertions unchanged, mutation run noted | pass | The diff only changes `top` to `stuck: Math.abs(top) < 1` and the expected object. The `scrolled` check and `expect(await barPosition(page)).toBe('sticky')` are unchanged. The implementer's report records two mutation runs: `position: static` failed at both viewports, and removing `top: 0` failed `stuck` at 768. |
| 12 | split-scroll sets its own scroll and asserts room; post-wheel unchanged; mutation noted | pass | `scrollInstantly(page, 0)` runs before each wheel, then a poll for `{ room, scrollable }`. The old poll on `room` alone was replaced with a stricter one. The post-wheel `after.page`/`after[other]` assertions are unchanged. The mutation (removing `overscroll-behavior: contain`) is recorded as failing on `after.page`. |
| 13 | `use-run-bar-height.ts` unchanged; no pixel height or min-height tuning | pass | `git diff --stat` on the hook is empty. The only new size in the CSS is `.linkInput { min-width: 8rem }` from 1200px up, which design C1 requires and which does not tune the bar's height. |
| 14 | Docs | pass | Page paragraph and the saving section checked against the code. See Doc claims. |
| 15 | lint:dup, tsc, npm test; new spec passes | pass (lint and unit run by review); acceptance unverified by review | I ran `tsc --noEmit` (clean), `npm run lint:dup` (0 clones in both configs), `npm test` (74 files, 2370 passed, 13 skipped) and `next build` (ok). Review runs no acceptance tests; the implementer reports 804 passing in `acceptance/aoe4-*`. |
| 16 | No INVARIANTS regressions | pass | See below. |

### Doc claims checked

- Page paragraph: "a save panel (`save-panel`) on its own row ... and the run status (`auto-run-status`), which comes last". True: `.savePanel` is `flex: 1 1 100%`, and `auto-run-status` is the last child.
- "Escape with focus on the link or on Copy link hides the link and returns focus to the button that saved, or to Save as copy when that button is disabled; Escape on a save button does nothing". True (`hideLink`, `onLinkKeyDown`).
- "The link, the save status and any save error go away on the first settled change". True: the effect at `:96-105` and the derivation in `saveStatusText`.
- Save-row paragraph (order, items below the row, no wrap from 1200px, wraps in order below that, `role="status"`, the two texts, empty while in flight / after a failure / when no link, no timer, "A failed save also hides the link"). All true. A failure the user is not looking at (`current` false) can only happen after the settled input changed, which already hid the link.

## Invariants touched

- A1, A2, A3: the diff touches `components/apps/aoe4-build-order/**` but no simulation code, game numbers, spending or randomness. They hold.
- S1-S3: no shared paths touched. Not applicable.
- spec-checklist: Contracts (names match design C1 exactly: `save-panel`, `save-row`, `save-status`, `saveStatusText`, `SavedStatus`, `Saver`, `onLinkKeyDown`, `.savePanel`, `.saveRow`, `.saveStatus`); Scope (nothing out of scope; no `golang/`; no timer); Naming ok; A1-A3 hold.

## Lint

`npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so there is nothing to reconcile.

## UI inspection

Served the task worktree with `npx next dev` on port 4731 and ran `/tmp/claude-1000/sgs132-review/inspect.cjs` with the repo's Playwright. The server was stopped afterwards and port 4731 is free.

States loaded at 1280x800, 768x1024, 390x844 and 360x760: no save; copy form open; after Save as copy (link shown); after an edit and Save a new version.

- Overflow (clipped content in the run bar): none in any state.
- Document horizontal overflow: 0 at every width.
- Overlap: only `editor-view-text`/`editor-view-table`, which is Bootstrap's `btn-group` -1px border overlap. It predates this diff and is not caused by it.
- Mid-word wraps: none.
- Styles: `save-status` margin is 0 and its color matches `auto-run-status` (`rgba(33,37,41,0.75)`). The empty status is 0x0 and the row height equals the button height (43px) with no save.
- 1280 after save: buttons, `Saved`, link and Copy link sit on one line with tops equal (347). Screenshot `1280-saved.png` checked.
- 768 after a version save: `Saved version 2` sits on the buttons' line, and the link and Copy link wrap to the next line (`768-version.png`).
- 390 after save: buttons / `Saved` + link / Copy link (`390-saved.png`).
- 1280 form: the form row sits below the save row (`1280-form.png`).
- Run-bar share of the viewport: 22-28% at 1280x800, 31% at 768x1024. Below 768 the bar is `position: static`, so the 60% rule does not apply (360: 63% with the link shown, not sticky).
- At 1280, 390 and 360 my script's version save raced the edit's debounce, so those `-version` states show no link. This is a flaw in the script, not the product: the 768 run and the spec's version tests cover that state.

## Non-blocking notes

- `workbench.module.css:158-162`: `.saveStatus` repeats the three declarations of `.autoRunStatus` (`:121-125`) exactly. The file groups shared rules elsewhere (`.linkHint, .saveError, .saveNotice` at `:189`), so `.autoRunStatus, .saveStatus { ... }` would match the file's style.
- `save-build.tsx:330`: `saved !== null &&` is redundant because `linkVisible` implies it and the hint does not read `saved`.
- `aoe4-save-status.spec.ts`: Escape on `save-build` (as opposed to `save-build-copy`) and the "focus the version button when it saved" path are not tested. The criterion's "fails if attached to save-row" requirement is still met through `save-build-copy`.
- `aoe4-save-status.spec.ts`: `openPage` + `saveCopy` opens most tests. Both are already helpers and some tests put a step before `openPage`, so this is not a duplicated-setup finding.
- At 768 after a version save, the select still read "(edited)" and Save a new version stayed enabled in my run. `pages/apps/aoe4-build-order.tsx` (`isEdited`, `recordUpdated`) is not touched by this diff, and the likely cause is my free-form text being formatted differently from the saved order. I did not investigate further, and this is not a finding against this ticket.

## Coverage

- Reviewed: `save-build.tsx`, `workbench.module.css`, `save-build.test.ts`, `acceptance/aoe4-save-status.spec.ts`, `acceptance/helpers.ts` (the helper move), `acceptance/aoe4-my-builds.spec.ts` (imports only, no assertion changed), `acceptance/aoe4-small-screen.spec.ts`, `acceptance/aoe4-split-scroll.spec.ts`, `docs/aoe4-build-order.md`. I read `build-input.tsx` and `use-run-bar-height.ts` to confirm they are unchanged.
- Test-file diff across the whole branch: only the two carve-out tests changed assertions. In `aoe4-my-builds.spec.ts`, local helpers moved to `helpers.ts` with no assertion changes.
- REPO.md checklist: "Every diff" (`next build` ok, page loaded) and "AoE4 build order" (no copied lib helper or tolerance, no Bootstrap utilities mixed with module CSS on the new elements, `cn` used, viewport share checked). I checked layout at 768 instead of 700; the layout and wrap rules are the same across that range.
- Not reviewed: acceptance runs (review does not run them; relied on the implementer's record).
- Cleanup: the review worktree was removed and the preview server stopped.
