# M6 planner report 1 (2026-11-05)

Plan: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/plans/M6-20261105.md`

Read against origin/main 9274372 and `design/M6.md` (OD-1 to OD-6 set to (a)). No tickets were created and
TASK-GRAPH.md was not edited.

## Outlines (9)

| key | title | risk | dependsOn | criteria / backlog |
|-----|-------|------|-----------|--------------------|
| A | Saved-build record, id and save checks (C1) | standard | none | M6.4, M6.6; backlog 2 |
| B | Build store seam, Blob adapter, save rate limit, `@vercel/blob` + zod override (C2, C5) | high | A | M6.4, M6.6; backlog 2 |
| C | `builds` API routes, OpenAPI 2.4.0, contract check (C3, C4) | standard | A, B | M6.4; backlog 2 |
| D | Auto-run controller hook (`useAutoRun`) | high | none | M6.1; backlog 1 |
| E | Wire auto-run into the page; remove Run, scroll and stale; rewrite Run specs | high | D | M6.1, M6.3, M6.9; backlog 1, 3, 6 |
| F | Split layout at 1200 px; timeline split to 1800 px; resize-while-hidden spec | standard | E | M6.2, M6.9; backlog 1, 4 (spec) |
| G | Save button, copyable link, `?b=<id>` load | standard | C, E | M6.5, M6.9; backlog 2 |
| H | `npm run smoke:preview` and the agent how-to | standard | C, G | M6.7, M6.9; backlog 2 |
| J | Pinned legend item follows its current item; number draft survives the view toggle | low | none | backlog 4 (draft), 5 |

Waves: 1 = A, D, J; 2 = B, E; 3 = C, F; 4 = G; 5 = H.

## Coverage

Every code criterion is covered. M6.8 is owner evidence and is a human action: the owner runs the smoke on H's PR preview.

## Design questions

There are 16 (Q1 to Q16); the plan has the full table. The ones that matter most:
- Q1: who owns the debounce and the settled input.
- Q3: there is no DOM test environment for the hook.
- Q9: the 30-saves-per-hour limit is shared across the whole Playwright suite.
- Q12: how the `.mjs` smoke script reads the first shipped build.
- Q13: is the legend rule about ordering or toggle linkage?
- Q14: invalid table drafts.

## Spec gaps

1. M6.8 says "the M6 PR", but M6 ships as nine auto-merged PRs. Proposal: the manager holds H's PR from auto-merge until the owner's smoke passes. B and C reach production before any real-Blob check.
2. M6.9 says "how an agent saves a build" but names no command. The plan assumes docs only; the owner should say if a save CLI is wanted.
3. The Run-spec rewrite is about 74 matches, not about 40.
