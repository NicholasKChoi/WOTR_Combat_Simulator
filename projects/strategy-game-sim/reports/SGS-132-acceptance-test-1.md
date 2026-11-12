# SGS-132 acceptance-test 1

Verdict: PASS. Branch `sgs-132-save-panel-live-status`, tip b8816c2 (was c88e938). Harness provisioned and ran (Playwright, Chromium, `acceptanceSetup` run first).

## Tests written
The implementer's `acceptance/aoe4-save-status.spec.ts` already covered every criterion that the browser can show, so I wrote no new tests. My only change is the test-only commit b8816c2, which removes the unused `namedBuildUrl` import (line 9). `npx tsc --noEmit` and `npm run lint:dup` pass: 0 clones.

## Runs (all seen)
- `aoe4-save-status.spec.ts` plus `aoe4-small-screen.spec.ts` and `aoe4-split-scroll.spec.ts`, `--repeat-each=3`: 117 passed, 0 flaky.
- `aoe4-my-builds`, `aoe4-save-open`, `aoe4-auto-run`, `aoe4-auto-run-contract`, `aoe4-narrow-layout`, `aoe4-split-layout`, `aoe4-compact-view`, `aoe4-named-builds-create`, `aoe4-named-builds-version-saves`: 140 passed.

## Mutation checks
Each break was undone with `git checkout --`, and a final `git diff --exit-code` on components, docs and lib was clean. Line numbers are in the tip's `components/apps/aoe4-build-order/`.
| Break | Test that failed | Failing assertion |
|---|---|---|
| `save-build.tsx:58` remove `saving \|\|` | in-flight test, both viewports | `{link: true, status: ''}` vs `Saved` |
| `save-build.tsx:145` store `revision: 1` | "reads Saved ... revision" | status `Saved version 2` vs `Saved version 1` |
| `save-build.tsx:245` put `onKeyDown={onLinkKeyDown}` on `save-row` | "Escape on Save as copy leaves link" | link true/`Saved` vs false/'' |
| `save-build.tsx:230` `hideLink` no longer clears `saved` | both "hides the link" tests | link/status stay shown |
| `save-build.tsx:233-234` `hideLink` no longer focuses | both "hides the link" tests | `toBeFocused` on `save-build-copy` |
| `save-build.tsx:152` `showFailure` keeps `saved` | both failed-saves tests | link true vs false (stale Saved) |
| 2s `setTimeout` clearing `saved` added after line 110 | "stays shown past a few seconds" | `Saved` vs '' |
| `save-build.tsx:91` `linkVisible` ignores the settled input | text, duration and select "is empty after" tests | link true vs false |
| `save-build.tsx` row `</div>` moved to the end of the panel | all four "shown outside the row" tests | `inRow`, `parent`, `after` |
| `workbench.module.css` `.saveStatus` gets `min-height: 4rem` | "adds no height" | row height diff 29.5 vs <=2 |
| `workbench.module.css` `.linkInput` `min-width: 40rem` plus `nowrap` to `wrap` at 1200px | "share one line" at 1280 | `aligned` and `oneLine` false |
| `workbench.module.css` `.saveRow` base `flex-wrap: nowrap` | "wraps in DOM order" at 390 | `wrapped` false |
| `workbench.module.css:2` `.runBar` `position: static` | small-screen "stays sticky" at 768 and 1280 | position `sticky` vs `static` |
| `workbench.module.css:3` `top: -300px` | small-screen "stays sticky" at 768 | sub-1px top check (the 1280 case passed, see below) |
| `workbench.module.css:26` remove `overscroll-behavior: contain` | split-scroll "each column scrolls on its own" | page scroll Expected 0, Received 200 |

## Weak spots
- Removing `margin: 0` from `.saveStatus` (CSS) leaves "empty status adds no height" passing. Bootstrap's `p` margin-bottom (16px) is smaller than the buttons' height, so the margin is unobservable. The test does fail on a real height regression (`min-height: 4rem`). Not a defect.
- A plain `flex-wrap: wrap` at 1200px alone leaves "share one line" passing, because the content fits at 1280. The overflow and one-line assertions fail once the content overflows (row 4 of the table).
- At 1280x720 the "stays sticky" test has under 1px of page scroll range in the split layout, so `top: -300px` does not fail it there. The `position` assertion and the 768 case do cover the mutation. This is the ticket's design (sub-1px tolerance), not a gap to fix.
- The `saveStatusText` settled-input check and `saving` check are pinned at the unit level by the implementer's `it.each` table. In the browser the effect that clears `saved` hides the settled-input check. I did not mutate the unit tests.
- Not mutated: the `my-builds-unavailable` "still shows" test (storage-notice behavior predates this ticket).

## Failures
None.

## Criteria not expressible
None. The screen-reader announcement is covered by attributes only, as the ticket states.
