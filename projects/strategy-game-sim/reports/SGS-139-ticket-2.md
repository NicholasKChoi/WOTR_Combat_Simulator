# SGS-139 ticket re-spec report

File: projects/strategy-game-sim/tickets/SGS-139-marker-legend-hover-focus-labels.md

Re-spec 1 (the ticket had no earlier Re-spec section, so this is N=1).

- Scope now adds `activeMarkerKind(markers, hoverKind, focusKind)` (design C8) and sets `active` from it.
- Scope adds the stale-state rule: when markers change and `hoverKind` or `focusKind` has no marker left, `SeriesChart` resets that state to null. The implementer chooses set-state-during-render or an effect.
- New criteria, both tagged (respec 1):
  - an `activeMarkerKind` table test with the six rows from M9.7;
  - the markers-change case: no empty label set while age-ups exist, and the stale state is reset.
- The Open questions entry is deleted and the section reads `none`.
- A Re-spec 1 history section is appended.
- Lint: `ticket-lint.py` printed no errors.
- Not run: no command criteria were added, so there was nothing to execute against the code.
- Overlap: none new.
