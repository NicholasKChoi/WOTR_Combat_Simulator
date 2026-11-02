# SGS-047 review 1
Verdict: APPROVE. Tip 86e2674a (base 835aceb). Reviewed in the implementer worktree (read-only; no review worktree created because the branch is not on origin).

## Blocking findings
None.

## Deviation judged
"Waited on" blank for rows with no wait reasons, with waitingOn shown only for flagged rows in a separate "Stuck on" column: matches the ticket (breakdown reasons as `<reason> <m:ss>`; waitingOn id only for a flagged row). Not a deviation from any criterion.

## Acceptance criteria
- grep ids: step-timeline hits exist (14); no `data/` import; no chart-rows import in step-timeline.tsx; format-time import present. PASS
- One row per steps entry, data-step/data-status: PASS (Playwright, ran).
- Labels = formatBuildStep: PASS (unit test; Playwright first row contains "produce villager").
- m:ss / en dash / non-zero ordered breakdown: ordering and non-zero covered by unit test; m:ss and en dash formatting lives in step-timeline.tsx (`time`, `formatMinSec`) and no test asserts it (see notes). Code read: correct. PASS on inspection.
- Flagged + waitingOn, unflagged rows without: PASS (unit + Playwright waiting paste).
- Reaction row data-reaction, whenever label, only one: PASS.
- Edit text keeps labels, next run updates: PASS (resultText captured at click).
- 400 / start-only: no timeline: PASS (null on empty rows; result cleared on failure).
- Fallback labels: PASS (unit).
- docs: page section describes timeline; `timeline` hit present. PASS
- tsc + lint:dup: clean (0 clones). vitest components/apps/aoe4-build-order: 45 pass. Playwright "step timeline" group: 5 pass (port 3877, run finished; no server of mine left). Full npm test / full acceptance not rerun; implementer reports 993 / 527 pass. 1280 px fit test passes.
- Invariants: A1-A3 untouched (display only); hold. S1: no cross-app import.

## Bot
reviewBot.cli empty: no bot run. No REVIEW.md in the repo; no rules file.

## Non-blocking notes
- Time cell formatting (en dash for null, m:ss) is untested: an inverted `seconds === null` check in step-timeline.tsx:7 would fail no test. Consider a pure `formatTimelineTime` in step-timeline-rows.ts with a unit test.
- Acceptance spec lines ~544-549 re-queries the reaction locator twice (cosmetic).
- Hygiene: no ticket ids or factory pointers in code/docs added.

## Coverage
Reviewed: step-timeline-rows.ts, step-timeline.tsx, step-timeline-rows.test.ts, results.tsx, pages/apps/aoe4-build-order.tsx, acceptance spec additions, docs hunk. Siblings: results.tsx, message-lists.tsx style (Bootstrap classes, 4-space indent, no semis) matched. REPO.md has no Review checklist section; not applied.
