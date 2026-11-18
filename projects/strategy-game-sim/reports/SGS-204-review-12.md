# SGS-204 review 12

Verdict: **APPROVE**

- Branch `sgs-204-upgrade-dot-tier-indicator`, tip d09af46, base `origin/main`. The merge base is 0866156.
- This is a full review. This gate bounced the previous tip, 1f5ebe0 (review 6), and the rework added one commit, d09af46.
- The Chore type stands under the owner's ruling (PROJECT.md Decisions, Q138). It is not a finding.

## Required fixes (Rework 1)

1. **Overlap is decided in pixel space: landed.**
   - `tierTextSlots(dots, height, bounds)` in `result-series.ts` works on each dot's pixel point and its estimated text width.
   - Each text starts alone. Groups whose boxes intersect are merged until no two boxes in different groups intersect. Each group becomes one stack, one row per text.
   - The unit row "two dots a few pixels apart" first asserts that the two texts would intersect if each were placed alone, then asserts that the placed boxes do not.
   - I ran my own mutation that merges only dots at one exact pixel point (time-and-value grouping). Six tests failed, including that row, the three-text cascade row, and the three edge rows. I restored the file afterwards.
2. **Two-tier acceptance test: landed.** It checks `!overlap(line[0].rect, line[1].rect)` inside `expect.poll`, read from one `readTiers` evaluate. `sameBox` is gone.
3. **Pin test single read: landed.** One `readTiers` call with comma selectors reads the rings, the dots and both kinds of text. The result is split by the `pinned:` prefix. Every value it compares comes from that one snapshot.
4. **Docs sentence: landed.** "At one point stack" is replaced with the overlap rule: texts whose boxes would overlap are moved apart, whether their dots share a point or are a few pixels apart.
5. **Invented-id case: present.** `mighty-widgets` with `widget` gives `Mighty`.
6. **On merge item:** for the manager. The CONTEXT.md Key surfaces line should add `upgradeTierName`, `tierTextSlots` and `placeTierText`.

## Pixel-space placement (recharts hooks)

I read the recharts 3.10.1 source in the task checkout's `node_modules`. The texts are placed in the same pixel space recharts draws the dots in:

- **Same scale as the dots.** `useXAxisScale` and `useYAxisScale` (`lib/hooks.js:59-92`) return `selectAxisScale(state, axis, 0, isPanorama).map`. `ReferenceDot`'s `useCoordinate` (`lib/cartesian/ReferenceDot.js:32-51`) maps the dot through the same `selectAxisScale` selectors.
- **Same axes.** `SeriesChart` has one `XAxis` and one `YAxis`, both on the default id. Each `ReferenceDot` takes `x={dot.at}` and `y={dot.value}`, and the text's spec carries the same `at` and `value`.
- **Zoom.** Under a zoom window, the XAxis domain is the window, so the scale follows it. `visibleUpgradeDots` already drops dots outside the window, so no off-plot dot enters the layout.
- **Evidence from the browser.** In every inspected state, each text's vertical centre lines up with its dot's measured centre, or with the stack's centre for grouped texts, to within 0.5 px.
- **Algorithm:**
  - The loop ends after at most n-1 merges, since each pass merges two groups.
  - Texts in one group sit in separate rows of `height`, so they cannot intersect.
  - Each text's x is `cx ± (r + gap)`, so it never covers its own dot.
  - `groupSlots` sorts by `cy` in ascending order, so the dot highest on screen gets the top row, as the doc says.
  - The top and bottom clamp shifts the whole stack.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

1. **Tier-name table over `upgradeTargets`, named cases, invented id: pass.**
   - The table reads `loadGameData('english').upgradeTargets`.
   - The named cases are present: `early-men-at-arms` gives `Early`, `men-at-arms` gives `Upgrade`, `elite-men-at-arms` gives `Elite`, and `mighty-widgets` gives `Mighty`.
   - These tests are unchanged from 1f5ebe0, where their mutation checks are recorded.
2. **Placement unit tests: pass.** The table has six rows: dots a few pixels apart, a ring and a dot at one point, a three-text cascade, and close pairs near the right, top and bottom edges. Each row asserts that no two boxes intersect, that every box is inside the plot, and that no text covers its own dot. Separate tests cover the right-edge flip, the top and bottom stack shifts, and the stack order. My exact-point mutation fails the rows.
3. **Knight/Longbow current texts: pass.** `expectTiers` reads the texts, dots and plot in one evaluate under `expect.poll`, and compares each text with `upgradeTierName`. This test is unchanged.
4. **Two tiers show different, non-overlapping text: pass.**
   - The spec asserts `Early` and `Upgrade`, and `!overlap` read from one evaluate under poll.
   - The implementer recorded this poll failing under exact-point grouping (spec line 519).
   - Inspection: the boxes no longer intersect at any width. At 1280 px, `Early` is at y 666.7-679.7 and `Upgrade` at y 652.7-665.7. At 1200 and 1800 px the y values are the same.
5. **Pinned text fainter, ring and dot texts apart: pass.**
   - Inspection measured opacity 0.6 for the pinned text and 1 for the current text, with the same fill.
   - The non-overlap check reads everything in one evaluate.
   - The implementer recorded it failing with merging removed (line 543).
6. **The text follows its dot: pass.** The text is the `ReferenceDot` label content, and the spec is unchanged from 1f5ebe0.
7. **Right-edge dot text inside the plot: pass.** The spec is unchanged, and the flip logic is unchanged.
8. **Existing dot properties unchanged, no `recharts-label` class: pass.**
   - No assertion that existed before the branch was edited. The only removed line in the test files is an import line.
   - The rendered texts have no class attribute (`cls=null` in the inspection).
   - `tsc` is clean, and `result-series.test.ts` passes 51/51. I did not run the full unit suite; the implementer reports 2892 passed.
9. **Doc and help text: pass.** I checked each clause of the new doc sentence against the code:
   - "Of dots and rings alike": `tierTexts` in `line-chart.tsx` lists both.
   - "Overlap where each sits alone": the alone boxes are checked first.
   - "Stack of one row each around their dots' mean height": `groupSlots`.
   - "The higher dot's text on top": sorted by `cy` ascending.
   - "Inside the plot's top and bottom edges": the `shift` in `placeTierText`.
   - No sentence limits the rule to dots at one point.
   - The help text says the dot "names its tier", keeps the phrases `upgrade dot` and `unit line`, and does not contradict the doc.
   - The new code comments in `result-series.ts` and `upgrade-tier-text.tsx` match the code.
10. **No hard-coded tier or unit words (A1): pass.** The only new values are UI pixel quantities (row height `fontSize + 2`, gap 3).

## Invariants touched

- **A1:** holds. No game number, tier list or unit list was added.
- **A2, A3:** not touched. No `lib/` or data file changed.
- **S1:** holds. The imports stay within the app, recharts and the acceptance helpers.

## Chore check

- No pre-existing test assertion changed.
- The visible text is allowed by the Q138 Decision.

## Lint and build

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `npx next build`: succeeded in the scratch.

## UI inspection

- **How it ran:** `npx next dev` served the task checkout on port 3877, and a scratch `inspect.cjs` loaded the page with the repo's Playwright. The server was stopped afterwards and the port is free.
- **States, each at 1200, 1280 and 1800 px:**
  - Knight/Longbow, current run only.
  - The same build pinned and rerun at 1190 s, so the ring and dot share a point.
  - The same build pinned and rerun at 900 s.
  - Spear/Longbow with `research early-men-at-arms` and `research men-at-arms` inserted before `research steeled-arrow`, which is the two-tier man-at-arms state.
  - That two-tier build pinned and rerun at 1190 s, which gives four texts at two nearby points.
- **Checks on every state:**
  - every tier text inside the plot;
  - no pairwise intersection among all tier texts;
  - no text covering any dot centre;
  - no tier text intersecting a marker label;
  - no horizontal document overflow;
  - opacity and fill;
  - no page errors.
- **Result:** every check passed in all 15 state and width combinations.
  - In the two-tier state the texts are 1 px apart vertically, where review 6 measured them overlapping.
  - In the four-text state they stack in the order pinned Upgrade, Upgrade, pinned Early, Early, with no overlap.
- **Screenshots read:** `w1280-maa-two-tiers`, `w1280-maa-pinned`, `w1800-maa-two-tiers` and `w1200-pinned-shared`. All the texts are readable. The scratch was removed after the inspection.

## Bot reconciliation

There is no `reviewBot` CLI or rules file, so this section does not apply.

## Non-blocking notes

- **`?? 0` fallback.** `upgrade-tier-text.tsx` maps an undefined scale result to pixel 0 with `?? 0`. That only happens for a value the scale cannot map, and the dot would not be drawn then either. Returning `null` for that text would be cleaner.
- **Stack far from its dot.** A merged stack is centred on the mean height of its dots. With many texts in one group, a row can sit more than one row away from its own dot (19 px in the four-text pinned state). It is still readable, and it is the documented rule.
- **Tier texts over marker lines.** The texts can cross vertical marker lines (the magenta unit-tier lines in the man-at-arms state). The white halo keeps them readable, and marker lines are out of scope.
- **Review 6's `pinnedColor(...)` note.** The expression is still written twice in the pinned block, for the stroke and the text colour.
- **Test box helper.** The test's `tierBox` repeats the box maths of the private `tierTextBox`. As an independent check in the test, that is acceptable.

## Coverage

- **Files reviewed:** all 7 changed files, with the delta 1f5ebe0..d09af46 read line by line:
  - `result-series.ts`, `result-series.test.ts`, `upgrade-tier-text.tsx`, `line-chart.tsx`, `page-help.tsx`;
  - `docs/aoe4-build-order-ui.md`;
  - `acceptance/aoe4-units-chart-upgrade-dots.spec.ts`.
- **Other source read:** recharts 3.10.1 `lib/hooks.js` and `lib/cartesian/ReferenceDot.js`.
- **Not run:** acceptance and browser test files, by design.
- **REPO.md review checklist:** the "Every diff" and "AoE4 build order" sections were applied, including the 1200, 1280 and 1800 px screenshots and `next build`.
- **LSP:** not available. I found callers by grep: only `line-chart.tsx`, the unit test and the acceptance spec import the changed functions.
