# SGS-204 implementer 5

Status: needs_review
Branch: sgs-204-upgrade-dot-tier-indicator, tip 1f5ebe0 (base main 0866156)
Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-204-upgrade-dot-tier-indicator

## Files
- components/apps/aoe4-build-order/result-series.ts: `upgradeTierName`, `tierTextSlots`, `placeTierText` (+ types).
- components/apps/aoe4-build-order/upgrade-tier-text.tsx (new): `UpgradeTierText`, the `<text>` the ReferenceDot `label` element renders; reads `usePlotArea` and the dot's viewBox.
- components/apps/aoe4-build-order/line-chart.tsx: `label={<UpgradeTierText/>}` on both ReferenceDot blocks; slots from `tierTextSlots([...pinnedDots, ...currentDots])`; `PINNED_TIER_TEXT_OPACITY = 0.6`.
- components/apps/aoe4-build-order/result-series.test.ts: unit tests for the three functions.
- acceptance/aoe4-units-chart-upgrade-dots.spec.ts: 5 new cases (describe "tier texts").
- docs/aoe4-build-order-ui.md ("Upgrade dots"), components/apps/aoe4-build-order/page-help.tsx (Units paragraph).

## Design
Placement is split in two pure functions because a label render only knows its own dot's pixel box: `tierTextSlots` groups dots by data-space point (same `at` and `value`, pinned and current together), and `placeTierText` gives pixel position from the dot box, its slot, an estimated text width (`estimateLabelWidth`) and the plot area. Right of the dot, flipped left if it would cross the right edge; slots stack around the dot's height; the stack shifts as a whole to stay inside top/bottom. Text: `paintOrder=stroke` white halo, `LABEL_FONT_SIZE`, current opacity 1, ring 0.6.

## Tests
- `npm test`: 91 files passed, 2885 passed, 15 skipped. result-series.test.ts: 44 passed (upgradeTierName table over every `upgradeTargets` entry from loadGameData, the three man-at-arms cases, veteran vs elite, invented `mighty-widgets`/`widget` gives `Mighty`; tierTextSlots; placeTierText: lone, shared point, right edge, top edge, bottom edge).
- Acceptance (run once because the ticket requires the spec cases): upgrade-dots spec 17/17; help-modal 15/15; readability, marker-labels, zoom, pin-compare, layout, chart-views 127/127.
- tsc, lint:dup (0 clones), `next build`: clean.
- No pre-existing test or assertion edited.

## Acceptance finding (ticket assumption wrong)
Criterion 4's "second tier on a line" cannot use `elite-longbowmen`: elite upgrades need age 4 and no run reaches Imperial (start age is data, landmark rule covers ages 1-3; the research waited on `prerequisite` until 20:00). The spec instead edits the Spear/Longbow/MAA build to research `early-men-at-arms` and `men-at-arms` before `steeled-arrow`, giving `Early` and `Upgrade` on the Man-at-arms line. The ticket's note that two tiers land together at age 4 holds only for a start age set in data (as in the scratch unit run).

## Mutation checks
Unit (all in result-series.ts, each undone; failing test named by its assertion):
- `<=` to `<` in the segment compare: `men-at-arms` rows fail (`Men` vs `Upgrade`).
- fallback returns the id: same rows fail (`men-at-arms` vs `Upgrade`).
- capitalisation dropped / first segment replaced: 14 rows fail (every tiered row and Early row).
- tierTextSlots skips first key: the slots table test fails; `slot + 1` to `slot`: slots test and the shared-point placement test (`193 not 193`) fail.
- `fitsRight` forced true; x not flipped; anchor fixed `start`: the right-edge test fails on anchor / x / each respectively.
- `(slot + 0.5)` to `0.5`: shared-point test and top-edge stack test fail.
- top shift to 0: top-edge test fails (`15 >= 20`); bottom shift to 0: bottom-edge test fails (`385 <= 380`).
- gap to 0, stack offset to 0: lone-text test and right-edge test fail.
- Deleted one assertion no break could fail (`x - width >= left` in the flip case).
Acceptance (each undone):
- pinned opacity 0.6 to 1 and current opacity 1 to 0.5: the pin test fails on `toBeLessThan` / the opacity equality.
- tier name returns the whole id: the current-dot and two-tier tests fail.
- `recharts-label` class added: all 5 tier tests fail.
- slots forced to one: the ring/dot test fails (first attempt passed because ring radius 5 vs 4 shifted the box by 1 px; tightened to a no-overlap check, then failed on the break).
- `fitsRight` forced true: the right-edge test fails (first attempt passed because the dot was not close enough; zoom end now derived from the upgrade time and the test asserts the dot is within 40 px of the right edge).
- Not broken separately: the follow-the-dot test; each text is a child of its dot's element, so it cannot outlive the dot without a structural change.

## Doc claims
- docs/aoe4-build-order-ui.md "Each dot and each ring also shows its tier name as visible text beside it ... `Upgrade` otherwise (`men-at-arms`)": `upgradeTierName` in result-series.ts; testids in line-chart.tsx. "to the right of its dot, or to its left when it would cross the plot's right edge ... stays inside the plot's top and bottom edges": `placeTierText`. "drawn exactly when its dot or ring is": the text is the dot's `label`.
- page-help.tsx: "marks when an upgrade lands and names its tier beside it": same code; keeps `upgrade dot` and `unit line`.
- Code comments: the `placeTierText` comment and the `UpgradeTierText` comment (viewBox is the dot's bounding box, recharts 3.10.1 per the ticket assumption, confirmed in Chromium by the passing spec).

## Unverified assumptions
Ticket's recharts label assumption held in Chromium (no `recharts-label` class, text in the dot layer, viewBox = dot box). Added: text width is `estimateLabelWidth` (8 px per char), larger than real width, so the flip can happen slightly early; the acceptance spec checks the real box is inside the plot.

## Invariants
A1: the tier name works from the data ids alone, no tier or unit list (unit case with an invented pair). A2/A3 untouched. The dots keep testid, series, label, at, fill, stroke, dash, radius, layer order, title; existing dot assertions pass unchanged.

## Out-of-scope findings
- None blocking. Note for the ticket's On merge: add `upgradeTierName`, `tierTextSlots`, `placeTierText` (three functions, not two) to CONTEXT.md Key surfaces.

## Not run
Nothing skipped. Codegen is unset in REPO.md.
