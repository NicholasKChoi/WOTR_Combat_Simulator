# SGS-083 ticket report

File: tickets/SGS-083-aoe4-highlight-step-span-on-charts.md. Risk low, Depends on none, base main (explored at cc9bb04; the primary checkout is on an unrelated branch, so main was read via git show).

Key finding: StepTimeline is a table with no time axis, so a vertical band cannot go on it; the ticket puts the band on the charts' shared X axis (ReferenceArea in SeriesChart), driven by hover/focus on a timeline row. State lives in Results (activeStep), new pure helper stepSpan in step-timeline-rows.ts, docs updated, unit table test plus one new acceptance spec (not in the spec SGS-082 deletes).

Open questions (all owner, each with a default): hover vs select (default hover + focus); band on charts vs a new axis on the timeline (default charts); span for in-progress steps (default start to run end).

Diagrams: none (single component). Criteria commands: none run (no grep/mutation criteria; stepSpan does not exist yet). Overlap: SGS-082 deletes acceptance/aoe4-build-order.spec.ts; the new spec is a separate file. Backlog bullet should be deleted when this merges.
