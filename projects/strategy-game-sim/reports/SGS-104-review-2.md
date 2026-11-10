# SGS-104 review 2

Verdict: **APPROVE**

Branch `sgs-104-split-layout`, tip 32d9d29be00937f22311c5592497c0ba085d671d, base origin/main 5b29e9e. Full review, focused on the rework diff 7e05a8a..32d9d29 (3 files, 6+/8-). Unchanged files rely on review 1's evidence.

Note: the branch is not on origin (`origin/sgs-104-split-layout` does not exist after `git fetch`); I reviewed the local branch, whose tip matches 32d9d29.

## Blocking findings

None.

## Rework 1 Required fixes

1. `docs/aoe4-build-order.md:902-904`: landed verbatim. The paragraph now reads: wide (>= 1800 px) placement, sticky below the run bar, vertical scroll inside the column and sideways scroll inside its own box, all in one sentence; then "Below 1800 px it is stacked above the charts and scrolls with the page." The "it" in the vertical-scroll clause now refers to the column timeline only. The preceding sentence (under 768 px the timeline scrolls sideways inside its own box) still covers the narrow sideways case. Pass.
2. `docs/aoe4-build-order.md:867`: landed verbatim ("When the page is opened directly, its first paint is the tabs layout and it switches to the side-by-side layout after it loads."). I re-read the paragraph: it follows the sentence about the kept tab and comes before the Build panel overflow sentence, and nothing near it contradicts it. It is consistent with `useSyncExternalStore` using `getServerSnapshot` (false) only during hydration. Pass.
3. `components/apps/aoe4-build-order/use-split-layout.ts:14`: landed verbatim ("// False on the server and during hydration, so the first render matches the static HTML."). This is accurate: React uses `getServerSnapshot` on the server and during hydration, and `getSnapshot` on a client-only mount such as a `next/link` navigation. Pass.
4. `acceptance/aoe4-split-layout.spec.ts:165`: the three setup lines are now `await openPage(page)`. `openPage` (`acceptance/helpers.ts:102-106`) is exactly the removed goto, networkidle and `auto-run-status` wait. `setViewportSize(start)` still runs before it, so each case still starts at its intended width. The `AOE4_PAGE` import is dropped, and nothing else in the file uses it. Pass.

## Acceptance criteria

All criteria passed in review 1 at 7e05a8a. The rework touches only doc and comment text plus one test setup refactor, so no runtime behavior changed. The doc criteria the rework addressed (findings 1 and 2) now pass. The other criteria stand on review 1's evidence, and the re-run below confirms them.

## Invariants touched

No runtime code changed in the rework. The invariants assessed in review 1 still hold.

## Commands run (in a detached review worktree at 32d9d29)

- `npx tsc --noEmit`: clean.
- `npm run lint:dup` (jscpd): 0 clones.
- `npm test`: 59 files, 1802 passed, 10 skipped.
- `npx playwright test acceptance/aoe4-split-layout.spec.ts`: 10/10 passed, including both "resize while the Results panel is hidden" cases.

## Bot reconciliation

`reviewBot.cli` and `reviewBot.rulesFile` are not set, so there was nothing to run.

## Non-blocking notes

None new. Review 1's non-blocking notes are already in the backlog.

## Coverage

- Reviewed: `docs/aoe4-build-order.md` (both edited paragraphs, re-read in full), `components/apps/aoe4-build-order/use-split-layout.ts`, `acceptance/aoe4-split-layout.spec.ts`, `acceptance/helpers.ts` (`openPage`).
- Not re-run: the other acceptance specs on the branch. They are unchanged since review 1 and the rework does not touch them.
- The review worktree was removed, and no process I started is still running.
