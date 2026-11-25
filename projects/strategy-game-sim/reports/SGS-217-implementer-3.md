# SGS-217 implementer report 3

- Ticket: SGS-217, branch `sgs-217-population-cap-spec`, tip `89bdb014ca94570fde38b041906f57a3b12e921d` (one commit on origin/main base 9bd5a5e... as checked out; base is SGS-216's tip).
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-217-population-cap-spec`
- Status: needs_review

## Files touched
- `acceptance/aoe4-population-cap-mark.spec.ts`: five new tests, two local helpers (`readMark`, `zoomWindow`, `axisX`), imports extended (`estimateLabelWidth`, `timeMarkLabel`, `formatMinSec`, `CHART_MARKER_KINDS`, `bodyDuration`). No existing test or assertion changed (the two changed diff lines are the import lines).

No production code, no other test file touched.

## Tests run
- Full file, task checkout: `timeout 500 run.sh . "npx playwright test acceptance/aoe4-population-cap-mark.spec.ts --reporter=line"` after `commands.acceptanceSetup`: 10 passed (5 existing, 5 new).
- Read zoom window of case 3: `data-zoom-from`/`data-zoom-to` = 936 to 1188, cap 1094.94, plot (grid) width 504 px. Window span 252 < cap 1095. estimateLabelWidth('Population cap 18:15') = 168 px, drawn text about 113 px; (1094.94-936)/252*504+168 = 486 <= 504, so the label fits right of the line.
- `npx tsc --noEmit` clean; `npm run lint:dup` 0 clones; `npx next build` succeeded; `npm test` 96 files passed, 1 skipped; 3168 tests passed, 15 skipped. Codegen: none set.

Invariants encoded: Markers control lists exactly the run's present kinds and none names the cap; a pinned run's cap draws no mark while the `pop-cap` row shows pinned m:ss / current "not reached"; line x equals axis position of cap over whole run and over the zoom window; label right of line inside plot; reset after an outside window restores one mark at same `data-at` and unzoomed x; pointer-down on the label starts a selection and release zooms.

## Pre-existing tests edited
None.

## Doc claims
No docs or comments added.

## Pinned outputs
None.

## Mutation checks
Ran in scratch `mutate-SGS-217` (branch tip before the final amend, see note), provisioned with `link-node-modules.sh .` and `npm run acceptance:setup`. `tree-record.sh` on the task checkout before and after: empty status listing, hash `6d9b3f285ef4cb73bf050b5c44bc358bfe4a646f` both times (match). Every break was reset with `git checkout -- .` and `git diff --exit-code` before the next. Each run used `-g` for the one test, single-file.

Markers control test:
- `chart-legend.tsx` extra `<li>` with `data-kind="pop-cap"`: failed `toHaveCount(present.length)` (expected 3, got 4).
- `chart-legend.tsx` `data-kind` of age-up renamed to `population-cap`: failed `kinds toEqual(present)`.
- `chart-markers.ts` `MARKER_KIND_LABELS.economy` = 'Population cap': failed `not.toMatch(/pop|cap/i)`.
- `present.length > 0` is a data precondition no production break reaches without breaking the control itself; reported as such.

Pinned run test:
- `results.tsx` `timeMark(pinned ?? result)` (the rejected alternative, pinned cap drawn): failed `toHaveCount(0)` on marks.
- `compare.ts` pop-cap row pinned value replaced by current: failed `cells.nth(2)` 'not reached' (got 18:15).
- `compare.ts` pop-cap row current replaced by pinned... in the other direction (current for pinned): failed `cells.nth(1)` (row absent).
- `results.tsx` `pinned={undefined}`: failed the pinned path count.
- `simulate.ts` `populationCapReachedAt ?? 1095`: failed 'the 600 s run does not reach the cap'.
- spec duration changed to 601: failed `bodyDuration` equals 600.

Zoom window test:
- `chart-markers.ts` `timeMarkLabelPosition` ignoring `origin` (side judged without window origin, rejected alternative): failed label left >= line.
- `line-chart.tsx` zoomed XAxis domain `[from, to + 50]`: failed zoomed line x.
- `line-chart.tsx` unzoomed domain `[0, 1500]`: failed whole-run line x.
- `LABEL_CHAR_PX` 4: failed 'estimate wider than drawn text'.
- `data-at` +1: failed `zoomed.at`.
- label `dx: 300`: failed `label.right <= grid.right`.
- duplicate mark when zoomed: failed `zoomed.count` (expected 1, got 2); duplicate always: failed `whole.count`.
- test-side drags: 0.8-0.95 failed 'label fits right of the line'; 0.93-0.99 failed 'cap inside window' (cap > from); 0.1-0.3 failed `cap < to`; 0.01-0.99 failed 'window shorter than cap time'.

Reset test:
- sticky-hidden mark (ref set once outside the window): failed `layout.count`.
- always-drawn with `ifOverflow="visible"`: failed pre-reset `toHaveCount(0)` (recharts alone also clips, so a plain `mark !== null` break did not fail it).
- `reset: () => {}`: failed `not.toHaveAttribute('data-zoom-from')`.
- `data-at` +1: failed `layout.at`; unzoomed domain `[0,1500]`: failed line x.
- test-side window 0.1-0.99: failed 'window ends before the cap time'.

Pointer test:
- `use-chart-zoom.ts` ignoring pointer-down on `text` (label blocks selection, rejected alternative): failed `chart-zoom-selection` visible.
- `if (next) void next` (no zoom on release): failed `data-zoom-from`.
- `setSelection` never called: failed selection visible.
- label `dx: 300` / `dx: -2000`: failed right/left inside-plot checks.
- test-side pre-zoom: failed the not-zoomed precondition.

Items deleted because no break could fail them: `to - from < full span` (a window as long as the run is not a zoom), the second pinned-path assertion in the pinned test, the `found.count` check and the post-release `toHaveCount(0)` selection check in the pointer test. The `present.length > 1` threshold was relaxed to `> 0`.

Note: these deletions were made in the task checkout after the mutation run, then the full file re-ran green (10 passed); deletions cannot add a failing path. The tree record match above compares the task checkout before the scratch with after it (the amend came after the scratch breaks; the after-record was also taken post-amend and equals the before-record because both are clean, committed trees).

## Build, lint
Build, tsc, lint:dup, unit all green (above).

## Invariant check
No INVARIANTS.md path matched; no production change.

## Unverified assumptions added
None beyond the ticket's.

## Out-of-scope findings
- `chart-time-mark` label text appears not to block pointer-down: the pointer test passes at base behavior, and only the added break (ignoring pointer-downs on `text`) makes it fail, so it guards a regression, not a current defect.
- Plot width is 504 px at the 1800 px viewport on this page, so the label fits right only in windows with cap near the left of the window; the spec uses 0.78-0.99.
