# SGS-041 re-spec 1

Source: reports/M3-designer-4.md decision row 4, design/M3.md Behavior rows `research | multi-tier tech` and `research | notes`.

Changes to tickets/SGS-041-aoe4-research-multitier-note-severity.md:
- Both open questions removed (section now says None).
- Scope 1: `researchEntry(baseId, state: EffectState): SnapshotEntry | undefined` stated as design-fixed; `researchNotes` explicitly keeps `byBaseId.get(step.tech)[0]`, pure, not calling `researchEntry`.
- Out of scope line reworded (design fixes the lowest-age rule).
- Criteria unchanged; re-ran the grep criteria on main: `byBaseId.get(step.tech)[0]` 2 matches today (lines 35, 78), `entry.name` 2 matches (86, 94), as stated.
- Risk unchanged: high. No remaining open questions. Existing branch work: none noted.
