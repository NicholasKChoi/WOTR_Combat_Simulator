# SGS-013 implementer 2 (rework 1)

- Branch `sgs-013-aoe4-design-doc`, tip 006d3a414cabe66b4106d92856b9669d47110705 (prev b9c9dc4), base 0b985f3, not pushed.
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-013-aoe4-design-doc
- Commit authored as choinickolas@gmail.com.

## Files

- `docs/aoe4-build-order.md`: rework edits only (33 insertions, 16 deletions); now 441 lines (bound 300-450).

## Required fixes (all ticked in the ticket)

1. Data sources, "Calibration and cross-check": trip walk and drop-off defaults in `rules/base.json` are tuned so effective rates land near the calculator's net values, labeled unverified; "never a source" limited to raw gather rates.
2. Hand-entered rules paragraph: supply, starting state, overlay effect rows, trip walk/drop-off defaults labeled unverified; sheep, deer and boar carry capacities observed in game and not labeled unverified; never "all hand values unverified".
3. Issues: replaced the glosses with design/M2.md's "Issue codes" table (seven codes, shared by JSON and paste; JSON shape / unknown `action` is `syntax`; villager `produce` without `rally` is `invalid`, reported on `step` or `line`), plus the rule of thumb.
4. Outputs `times`: Sampling rule (0, s, 2s, ... including `durationSeconds`; last sample is `durationSeconds` when not a multiple; one value per sample; t=0 reflects zero-time steps started at t=0).
5. Non-blocking: `forestry-1` used in the coverage list too; overlay rows no longer called `HandValue`s ("as a `HandValue`, or, for an overlay effect row, as fields of the `OverlayEffect`"); paste examples and the `#k` grammar example use `capital-town-center`. The `tier` wording note was not in the checklist and is unchanged.
6. Criterion 12 now satisfied by the two sentences in fixes 1 and 2.

## Checks

- Hygiene grep (ticket criterion 2): no output, exit 1.
- `git grep -c '^```mermaid'`: 2.
- `git diff --stat 0b985f3`: only `docs/aoe4-build-order.md`.
- Codegen/build/lint/tests: doc-only change; no code touched, not rerun.

## Invariants

A1, A2, A3, S3 statements unchanged and upheld. No other invariant touched.

## Out-of-scope findings

- design/M2.md's issue table lists `none` as a valid trigger `kind`, while the doc's JSON section (unchanged) describes triggers as `time` or `villagers` and an omitted trigger as no condition. Transcribed as given; the designer may want to confirm whether `{ kind: 'none' }` is a real `Trigger` variant.
- Line 147 (trip-model formula) exceeds 110 characters; pre-existing, untouched.

## Status

needs_review
