# SGS-047 ticket report

File: tickets/SGS-047-aoe4-step-timeline.md. Component aoe4-build-order, risk low, size ~70 business-logic lines, On merge: none.
Depends on SGS-042 (waitingOn, waitBreakdown) and SGS-040 (formatBuildStep); SGS-039 transitively (reaction).
Scope: new step-timeline-rows.ts (pure, vitest-reachable) and step-timeline.tsx; results.tsx gets a `text` prop; the page keeps
`resultText` captured at the run click; Playwright spec additions; docs page section. No OpenAPI change. No diagram.
Criteria: ids/attributes, one row per step, labels from the text run, m:ss and en dash, flagged/reaction, stale-text, 400 and empty steps, docs.
Checked: `git grep -i step-timeline` in components/pages/acceptance/docs/lib finds 0 today. Mutation criteria: none.
Overlap: results.tsx and page with SGS-045, 046 (not yet written), 048, 049 (rebase only).
Note: SGS-046 has no ticket file yet; the ticket names it only in Out of scope.
Open question (designer): m:ss formatter duplication; ticket imports formatMinSec from ./chart-rows (SGS-042 proposes a shared engine copy).
