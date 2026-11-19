# M12-research-3: OD2, where Rename lives (depth: frame)

**Question**: Where does renaming a saved AoE4 build live: a Rename button in the save row, or a My builds manager dialog?

Changes with the answer: the UI surface of M12.2 (rename). The PATCH endpoint (`renameNamedBuild`) is the same either way.

## Options
- A - Rename button in the save row renames the selected My build, opening a small name form shared with Save as copy - reuses existing selection, lock and status; one more button in the row - conflicts: none known.
- B - My builds manager dialog listing every saved build, each with Rename - rename without selecting; more work (new dialog and list); natural home for delete later - conflicts: none known.

## Recommendation
A, as the design does: smallest change that reuses existing state. B can be added when delete needs a manager.

## Unknowns
Not checked at frame depth: the current width of the save row on the desktop layout (1200 px floor) and whether a third button fits.

## Sources
- design/M12.md, "Owner decisions" OD2 (line 419) and Summary (lines 19-24).

## Board item
Filed as Q142 in QUESTIONS.md (kind=decision, blocks=M12, priority=high):
- Title: Where should renaming a saved AoE4 build live? A Rename button next to Save
- Options: A) Rename button in the save row: renames the build you have selected, one more button | B) My builds manager dialog: rename any build without selecting it, more work
- Recommendation: A: it reuses the existing selection and lock, and a manager can wait until delete needs one
