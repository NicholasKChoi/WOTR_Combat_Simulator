# SGS-108 spec gate 3 (delta, re-spec 2)

**Verdict: READY**

## Gate-2 gaps
1. Contracts: closed. `design/M7.md` lines 89-91 now list `StepKindLegend({ testId?: string })`, `annotationToneClass(run, stale): string` and `StepTimes`. Ticket Scope 1 cites them with matching signatures.
2. Tone-class unit table: closed. Scope names the CSS module keys `warn` and `stale`. The criterion compares against `styles.warn` and `styles.stale`, and asserts first that they are non-empty and differ.

## New StepTimes scope and criterion
Sound. `step-started` and `step-finished` ids and texts match the design's DOM contract (lines 113-114, which reuse the same ids in the gutter). The criterion renders `StepTimes` and `StepRunCell` and compares the texts for `completed` and `in-progress` runs, which catches a drifting duplicate. The run cell's layout is unchanged. SGS-110 can consume `StepTimes` without touching `StepRunCell`.

## Notes (non-blocking)
- The design's file table (line 38) and the M7.1 row (line 121) do not list `annotationToneClass` or `StepTimes` in their export lists. The Contracts block does, so this is cosmetic.
- SGS-110 wording that predates `StepTimes` is SGS-110's gap, not SGS-108's.
