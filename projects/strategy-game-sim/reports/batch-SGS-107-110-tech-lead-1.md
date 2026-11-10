# Batch SGS-107..110 tech-lead gate 1

Decision: PASS, no blockers, no untested hotspots. Four stacked draft PRs opened (stacking: footer, marker `cf-stack`).

## PRs (bottom to top)

| Task | PR | Base | Head tip | Merge risk |
|------|----|------|----------|------------|
| SGS-107 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/118 | main (a933173) | sgs-107-step-annotation-model 74733e0 | low |
| SGS-108 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/119 | sgs-107-step-annotation-model | sgs-108-step-run-cell 7731840 | low |
| SGS-109 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/120 | sgs-108-step-run-cell | sgs-109-row-hover-drop-timeline 4da1a30 | low |
| SGS-110 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/121 | sgs-109-row-hover-drop-timeline | sgs-110-text-gutter-annotations 3c68fb2 | low |

### #118 SGS-107
## Merge risk
**low** - client-only UI helpers, no public surface or `criticalPaths` symbol, a revert fully undoes it, and unit tests pin the alignment and stale rules.

## Review focus
No hotspots: the new alignment (`alignSteps`, `buildAnnotations`) and `resultsStale` are pure functions with table tests over insert, delete, edit, swap, duplicate and capped-suffix cases, and every status and input mismatch for staleness; the rest is a module rename.

### #119 SGS-108
## Merge risk
**low** - client-only UI, no public surface or `criticalPaths` symbol, a revert fully undoes it, and unit and acceptance tests pin the run cell, the tones and the stale dimming.

## Review focus
No hotspots: the run cell renders the annotation model below this PR, whose alignment is unit-tested; the cell contents, warning tint, stale dimming and `aria-describedby` wording are each asserted in `acceptance/aoe4-step-annotations.spec.ts` and `step-annotation.test.ts`.

### #120 SGS-109
## Merge risk
**low** - client-only UI, no public surface or `criticalPaths` symbol, a revert fully undoes it (the timeline comes back), and acceptance tests pin the hover, focus and clear behavior.

## Review focus
No hotspots: the active step is held per result and dropped when no annotation still maps to it, and each enter, leave, focus, blur, start-row, new-run and unaligning-edit path is asserted in `acceptance/aoe4-build-order-step-band.spec.ts`.

### #121 SGS-110
## Merge risk
**low** - client-only UI, no public surface or `criticalPaths` symbol, a revert fully undoes it, and unit and acceptance tests pin the line mapping and the caret and hover shading.

## Review focus
No hotspots: the step-to-line mapping (`annotationsByLine`) is table-tested including out-of-range lines, and the gutter alignment with line numbers, the syntax-error case, the caret, hover, blur and last-input-wins paths are each asserted in `acceptance/aoe4-compact-view.spec.ts`.

## What was reviewed

- Range: origin/main a933173 .. 3c68fb2 (11 commits, all authored choinickolas@gmail.com, no ticket ids or PR numbers in messages or code).
- Stack linear: each tip is an ancestor of the next; each per-task diff contains only its own task.
- Branches were not on the remote before this gate; pushed bottom up, no new commits. No pre-existing PRs.
- Files: components/apps/aoe4-build-order/{step-annotations.ts, step-annotation.tsx, step-table.tsx, results.tsx, build-text-editor.tsx, auto-run.ts, auto-run-status.ts, build-input.tsx, line-chart.tsx, step-timeline*.ts(x) removed, *.module.css}, pages/apps/aoe4-build-order.tsx, docs/aoe4-build-order.md, plus unit and acceptance specs.
- Reviewable LoC (excluding unit and acceptance tests): SGS-107 +195/-113, SGS-108 +290/-156, SGS-109 +95/-245, SGS-110 +121/-10.
- Checks: invariants A1-A3 and S1-S3 (no engine, data, route or cross-app change; `LONG_WAIT_SECONDS` is a UI threshold, not a game number); no `criticalPaths` symbol touched; no API/schema/OpenAPI/saved-build change; removed `--run-bar-height`, step timeline ids and `timelineRows` have no remaining readers outside the spec asserting their absence; `result.steps[i].step === i` holds in the engine (simulate.ts:866), so indexing by run step is sound; CONTEXT.md open questions: none.

## Non-blocking notes

- SGS-108 changes when the charts dim: now as soon as the live input differs from the shown run (debounce window included), not only after an invalid, rejected or failed run. Documented and pinned; called out in the #119 summary.
- `resultsStale` treats a changed build selection with identical text as not stale (auto-run.test.ts pins this). Intended per the tests; noting it as a behavior a reviewer might question.
- `git push -u` printed upstream-tracking hints (remote config quirk); the remote refs match the expected tips.
- Narrow screens (<768 px) not assessed, out of scope for M7 per the owner.
