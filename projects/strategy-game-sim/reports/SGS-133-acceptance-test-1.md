# SGS-133 acceptance-test 1

Verdict: PASS. Tip 464ea8f, no new commit (the implementer's specs already cover every criterion expressible in the harness; no gaps found, nothing to add). Worktree tree clean after run.

## Tests written
None new. Existing tests in acceptance/aoe4-split-scroll.spec.ts reviewed against M9.12 criteria:
- :253 clearing duration error at page end keeps scrollY, bar top and column scrolls (case a; asserts scrolled and bar shorter first)
- :279 capped state: precondition, height <= 0.4 x 720, --aoe4-run-bar-height = bar + margin, split ends at viewport, notice below bar at scrollTop 0 and inside at max (cases b and c content)
- :315 build-order-select above bar at max scroll, inside after focus (case c focus)
- :350 and :356 no sideways scroll and focus ring inside padding box at 768x1024 and capped
- :362 below 768px: position static, max-height none

## Run
Harness provisioned (link-node-modules, playwright install chromium). Results, all observed:
- aoe4-split-scroll.spec.ts: 16/16 passed
- aoe4-my-builds, save-status, save-open, small-screen, auto-run, compact-view, my-builds-unreadable, build-order-run-errors: 163/163 passed
- client-check, inline-issues, m4-flow, pin-compare, step-annotations, named-builds-create, named-builds-version-saves, auto-run-contract, step-band: 107/107 passed (the known step-band flake did not occur)
- `npx tsc --noEmit` and `npm run lint:dup`: pass, 0 clones
- Not run: the API-only specs that mention save-ids in request bodies (no run-bar UI), and `npm test`.

## Mutation checks (workbench.module.css, each undone with git checkout; `git diff --exit-code` on non-test files clean)
- `overflow-anchor: none` -> `auto` (placement: `.pageSection` on the page section): case (a) test fails at the scrollY drift assertion (received 126 vs <= 1). Other 5 passed.
- `max-height: 40dvh` -> `none`: cap test fails (expected true received false), focus-reach test fails, capped focus-ring test fails. Caveat: the cap test's first failing assertion is `state.overflows` (precondition), not the height or content check, so the content check itself is not independently shown to fail; the cap is still pinned by the test.
- Removed `padding-inline`/`margin-inline` on `.runBar`: both focus-ring tests (768 and capped) fail on the toEqual.
- Media query `min-width: 768px` -> `100px`: below-768 test fails (maxHeight "360px" vs "none").

## Failures
None.

## Criteria not expressible
Docs criterion (docs/aoe4-build-order.md wording), `npm test` and invariants: not browser-observable; left to review.
