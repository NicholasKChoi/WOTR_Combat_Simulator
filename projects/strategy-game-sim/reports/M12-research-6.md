# M12-research-6 (frame): My builds rename refresh rule

Source: reports/M12-planner-5.md, "Design questions" row 1. Nothing new gathered (frame depth).

## Question
When another tab's storage write refreshes My builds, may the selected entry take the stored name even if this tab holds a newer one? Blocks SGS-212 (outline E, rename UI). Priority low.

## Options
- A) Take the re-read name only when its stored revision is at least the revision this tab loaded - guards both stale cases (a: this tab's rename failed to store; b: renamed in another browser, stored list still old) - costs one revision comparison; `MyBuildEntry.revision` already exists, no new data - departs from design C12 as written.
- B) Ship C12 as written: the selected entry always takes the re-read name when the list has it - simplest, matches the design - in cases a and b an unrelated write from another tab can put the old name back on the label (conflicts with D17 server-name-wins and the storage-failure rule).

## Recommendation
A: it fixes a visible wrong-name flicker for one comparison with no new data. B is acceptable since the edge is narrow (needs a failed or out-of-date storage entry).

## Unknowns
Not verified in code (frame depth): that the revision compare behaves as the plan describes in every refresh path. SGS-212's spec will pin it.

## Sources
- reports/M12-planner-5.md, "Design questions", row 1 (cites C12, D17)

## Board item

## Q?: When another tab refreshes My builds, keep this tab's newer build name? Yes: only take the stored name if it is not older
kind: decision
blocks: SGS-212
options: A) Keep the newer name: take the stored name only if its revision is not older than the one this tab loaded | B) Always take the stored name: simpler, but an unrelated write from another tab can put an old name back on the label
recommendation: A: one small check prevents the wrong name showing, and no new data is needed
research: reports/M12-research-6.md
priority: low

Only you can pick how much edge-case polish the rename box gets; the rename screen (SGS-212) waits on it. The rule matters only in two rare cases:
- This tab renamed a build but saving the new name in the browser failed; then another tab of the same browser saves something unrelated. Always-take-stored (B) shows the old name again.
- The build was renamed in another browser; this tab shows the server's newer name, but the browser's stored list still has the old one. A write from another tab again brings back the old name under B.
A adds one revision comparison; B ships the design as written. Either way the saved build itself is never changed, only the label shown.

### Answer
