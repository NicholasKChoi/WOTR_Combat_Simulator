# M12-research-2: OD1, how a repeated step's copies show (depth: frame)

Question: should a repeated step (e.g. `build farm x9`) show as one table row with combined times and a closed per-copy list (A), or as one read-only sub-row per copy (B)? Blocks M12 design approval.

Source: design/M12.md "Owner decisions" OD1 (lines 410-417), section C6 (lines 149-156), extension table (line 382). No new facts gathered at frame depth.

## Options
- A - one row per step in both views; combined times (first copy's start, last copy's finish, summed wait), `k of n done`, closed `Each copy` native details list; text popover lists copies - smallest change, table and text read the same; per-copy times need one tap - conflicts: none.
- B - step row plus one indented read-only sub-row per copy with its own run cell; text view as in A - more visible per copy; up to 200 extra rows and a second row kind to keep in sync with editing and reordering - conflicts: none found.

## Recommendation
A, as the design does. Smallest change, and `StepAnnotation.copies` already carries one run per copy, so B stays addable later (design/M12.md:382).

## Unknowns
Whether the owner wants per-copy times visible without a tap; only the owner's preference settles it.

## Sources
design/M12.md:149-156, 382, 408-417 (under the project dir).

## Board item
Filed as Q143 in QUESTIONS.md (kind=decision, blocks=M12, priority=high):

    ## Q143: Show a repeated step's copies as one row with a closed per-copy list?
    options: A) One row with combined times, 'k of n done', and a closed Each copy list: smallest change, table and text read alike | B) One read-only sub-row per copy under the step: more visible per copy, up to 200 extra rows to keep in sync
    recommendation: A: smallest change, and a per-copy view can be added later without rework
    research: reports/M12-research-2.md
