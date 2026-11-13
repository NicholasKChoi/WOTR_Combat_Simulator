# SGS-146 lane intake

Type: Bug
Priority: low
Milestone: none
Working title: Chart layout: two activations in one render lose one; arrow keys mid-drag leave a stale drag start
Source: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md)

Backlog bullets:

- useChartLayout move/toggle compute from render-time layout, so two activations in one render lose one (SGS-114; not reachable by single clicks today).
- components/apps/aoe4-build-order/chart-header.tsx / results.tsx: arrow keys pressed mid pointer-drag reorder charts and leave the drag start position stale (SGS-135 review-1, non-blocking).
