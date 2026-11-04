# SGS-083 review 1

Verdict: APPROVE (tip b43d72aff28bb4a950ae12319403dacfc9c403a3, diff vs b9481e3)

## Blocking findings
None.

## Contract
- stepSpan (step-timeline-rows.ts): null when startedAt null; in-progress uses end (not completedAt); completed uses completedAt; clamped to [0,end] with to >= from. Matches Scope 1.
- StepTimeline props, handlers (pointerenter/leave, focus/blur), tabIndex 0, data-active, cn(table-warning, table-active): matches Scope 2. Existing data-* and cells unchanged.
- Results: rows memoized and passed down; active state stored as {result, step}, compared by result identity (no key, no effect); highlight passed to all four SeriesChart. Matches Scope 3.
- SeriesChart: ReferenceArea for from<to, ReferenceLine for from===to, both with chart-step-band/data-from/data-to; exactly one per chart; markers, Y/X domain, legends untouched; pinned run gets no band. Matches Scope 4.
- Docs paragraph updated; each claim checked against code (hover/focus, all charts, in-progress to end, zero-length line, no band without start, clears on leave/blur/new run). No remaining sentence says the timeline is non-interactive.
- Scope 6 acceptance spec absent by design (acceptance gate). Its browser criteria left unticked.

## Lint / checks run
- npx tsc --noEmit: clean. npm run lint:dup: 0 clones. vitest components/apps/aoe4-build-order: 228 passed.
- Prettier is not part of commands.lint (30 files already fail it on main); ignored.

## Bot
reviewBot.cli not set; nothing to reconcile.

## Invariants
S1 holds (all changes under components/apps/aoe4-build-order and docs). No other invariant adjacent.

## Non-blocking notes
- docs/aoe4-build-order.md: the new sentence's first line is about 150 chars, longer than the surrounding ~120-col wrap; consider rewrapping.
- Pointer leaving a row clears the active step even if that row still has keyboard focus; acceptable per the owner's "hover and focus" answer.
- stepSpan's `completedAt ?? end` fallback for a completed row with null completedAt is unreachable by contract; harmless.

## Acceptance criteria
- Pass (ticked): stepSpan table (all six ticket rows plus two clamp rows; implementer's mutation checks plausible); existing tests unchanged and passing, cells untouched; docs; no INVARIANTS regressions.
- Unticked, need the acceptance spec/browser: hover bands on four charts, zero-length band, geometry, keyboard focus/blur, no-start row, active row box-shadow, post-Run reset, and the final tsc/lint/test/acceptance criterion (acceptance spec part).

## Coverage
Reviewed all six changed files; read ticket and implementer report. Used the existing task worktree read-only (no review worktree created; origin ref for the branch not fetched as a remote branch). Ran no browser.
