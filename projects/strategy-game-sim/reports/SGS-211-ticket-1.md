# SGS-211 ticket report (ticket-1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-211-repeat-paste-text-and-table-field.md

Summary: "Repeat in the paste text (xN) and the step table Repeat field, with the page spec". Feature, M12, aoe4-build-order, risk standard, ~70 business-logic lines. Depends on SGS-208 and SGS-210.

Scope: trailing `xN` in `parse-text.ts` for every non-produce action, last token, with node/id positions unchanged and the produce exception kept. `formatAction` prints `x<repeat>` last whenever present, and planner row 4 is stated as settled (no round-trip claim for produce). Repeat number field in `step-table.tsx` `actionFields` for build and move only (`step-field-repeat`). `changeAction` keeps `repeat` for `REPEATABLE_ACTIONS` only. `FIELD_LABELS.repeat` is NOT added, because SGS-208 does that. New `acceptance/aoe4-repeat-step.spec.ts`. Docs: format doc paste grammar, and the UI doc optional-field list.

Criteria cover:
- parse forms, position rules and node/id slots;
- printing and round trip;
- `checkSaveBuildRequest` accepting a repeated build now that the interim round-trip 400 is gone;
- the table field and `changeAction`;
- the page spec:
  - `step-copies` and three `step-copy` items;
  - Enter and Space opening the `<details>` copy list, with a visibility check;
  - test ids staying distinct from the combined cell's (each matches exactly one element, with the list open and closed);
  - Repeat edit in the table reformatting the line;
  - one shaded span read from the run response;
- existing specs unchanged;
- tsc, unit tests and lint:dup.

Names used from the dependencies' end state: `REPEATABLE_ACTIONS` (new `repeat.ts`), and the test ids `step-copies`, `step-copy-list` and `step-copy` (with `data-copy`) plus the combined-cell ids.

Unverified assumptions: none. The native `<details>` toggle that SGS-210 left unverified is exercised in Chromium by this ticket's spec.

Diagrams: none (single-component, outside the core loop).

Open questions: none.

Lint: `ticket-lint.py --graph ... --spec ... origin/main` exits 0 with no errors or warnings. It first flagged Invariants `none` (now A3) and `repeat.ts` missing at base (reworded as new in SGS-208).

Overlap: none with open tickets beyond the declared dependencies. The `step-more` spec counts the optional fields of a `produce` row only, so it is unaffected.

Observations for the manager (not blocking):
- The SGS-210 per-copy items are visible only when the list is open, so the spec asserts visibility, not the `open` attribute.
- Changing a row's action closes the row (existing doc rule), so a kept `repeat` is hidden under More options after a build to move change. The text line still shows `xN`.
- `ticket-lint` ran against `origin/main` (d80751b), where the dependencies' files do not exist yet. Scope names them only as end-state references.
