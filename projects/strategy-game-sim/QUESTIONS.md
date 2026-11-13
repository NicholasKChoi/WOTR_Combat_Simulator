# Strategy Game Simulator: Questions

Open owner questions. The manager adds and deletes items with `bot/board.py`; the Discord bot fills
`thread` and the Answer section. An answered item stays until the manager routes the answer (manage.md
Owner answers), then the manager deletes it. The owner reads items on a phone without the repo, so
each item stands alone: ids carry their titles (board.py glosses `blocks`; gloss ids in the body by
hand), each option names its tradeoff, and the body holds at most three findings with their numbers.
Detail goes in the research report. Each item has this shape:

    ## Q<n>: <the question, one line>
    kind: decision | confirmation
    blocks: <task ids or milestone, comma-separated; glossed with titles on add>
    options: A) <option>: <tradeoff> | B) <option>: <tradeoff>
    recommendation: <option letter>: <one line why>
    research: <report path relative to PROJECT_DIR>
    thread: <Discord thread id; bot only>
    answered: <UTC time> <source>

    <why it is asked, in a sentence or two>
    - <finding behind the recommendation, with numbers; at most three>

    ### Answer
    <the owner's answer; empty while open>

next: Q94

## Q68: AoE4 results charts: show the chart rows as a real table?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: D: visible redesign of how rows look; small, best grouped with the other chart polish items
thread: 1570872017211621426

Taste call from your UI feedback of 2026-11-12; only you know how much polish you want now.
- Render chart rows as a real table so collapsed rows look cleaner.
- Nothing is broken today; it is a presentation change.
- Related chart items follow (overlapping lines, shared markers); they could be one chart-polish milestone.

### Answer

## Q70: AoE4 charts: one shared marker control that shows or hides a vertical line on every chart?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: D: new behavior across all charts; needs a small design
thread: 1570872033540051058

This adds a feature from your UI feedback of 2026-11-12; only you can say if it is worth building now.
- Define markers once for all charts.
- Clicking a marker toggles its vertical line on every chart.
- Touches every chart, so it pairs naturally with the other chart items.

### Answer

## Q71: AoE4 build order: let one step repeat its action N times (e.g. build Farm from wood x9)?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: D: new step format, touches the editor, JSON and simulator
thread: 1570872036354691227

Your feature request of 2026-11-13; only you decide the priority against other work.
- Today nine farms need nine identical steps.
- A repeat count would run as that many copies of the step.
- Needs a design for the JSON/paste format and the editor.

### Answer

## Q72: AoE4 My builds: rename a saved build without saving a copy?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: D: new feature across storage, API and library; links must keep working
thread: 1570872039483375686

Your feature request of 2026-11-13; only you decide if it is wanted now.
- The new name shows everywhere the build is listed.
- Existing links to the build keep working.
- Touches the build store, the API and the library UI.

### Answer

## Q73: AoE4 research: require its building and block that building's queue while it runs?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: D: changes simulation rules; needs a design and a building-to-research table
thread: 1570872042885087383

Your feature request of 2026-11-13; this changes build timings, so only you can accept that.
- Attack upgrades need the Blacksmith; spearman veterancy the Barracks; archer upgrades the Archery Range.
- The building must exist, and units queued there pause until the research finishes.
- Existing saved builds may time differently afterward.

### Answer

## Q74: AoE4 My builds page: check storage is available before rereading on a storage event?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: B: low priority; a guard in existing code, found by a ticket implementer and unchanged from before
thread: 1570872045343088801

Only you decide if a small hardening is worth a ticket; nothing waits on it.
- The storage listener (`reread`) in the AoE4 build-order page skips the availability check the rest of My builds uses.
- It predates the recent work; no user-visible failure is reported.
- Whether it can throw with storage blocked is unverified.

### Answer

## Q75: Add a test-writing rule: scroll targets into view instantly before hover or focus in browser tests?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: E: it is a rule for the project's lessons file, not app code
thread: 1570872048069247017

Only you decide whether this becomes a standing rule for all future test writers.
- Playwright hover/focus smooth-scrolls the page.
- The resulting pointer events change state after an assertion already passed, making tests flaky.
- Rule would apply to browser test files only.

### Answer

## Q76: Build-order doc: note that pinned run colors wrap around the palette?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: E: doc-only; review noted it as non-blocking
thread: 1570872052515082381

Only you decide whether a one-line doc fix is worth a ticket.
- The doc omits that the palette index wraps by modulo, so a run after the last color reuses the first.
- Found in a code review as a non-blocking note.

### Answer

## Q77: Preview smoke script: stop swallowing errors from the reroute step?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: B: low priority; failures in the smoke check are hidden today
thread: 1570872054918680719

Only you decide how much to harden the deploy smoke check; nothing waits on it.
- `scripts/smoke-preview.mjs` ignores errors from the fetch and abort calls in an empty catch.
- A failed bypass reroute therefore goes unseen.
- No visible app behavior changes.

### Answer

## Q78: Preview smoke script: add a test for the browser-close failure path?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: B: low priority; test-only addition
thread: 1570872057774870603

Only you decide whether this test gap is worth a ticket.
- The path where closing the browser rejects has no test in `scripts/smoke-preview.mjs`.
- Found by the ticket implementer; no known failure.

### Answer

## Q79: Acceptance test for results chart ids fails on main: investigate?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: C: a red test on main with unknown cause; investigate before deciding what to fix
thread: 1570872060291580018

A red browser test on main blocks trust in every later check; you decide whether to spend effort on it now.
- `acceptance/aoe4-results-split.spec.ts:41` (chart ids) fails reproducibly at two commits (5371c25 and f55e0aa).
- Cause unknown: could be a real chart-id regression or a stale test.

### Answer

## Q80: Acceptance test for the step band failed once on main: check whether it is flaky?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: C: intermittent failure, cause unknown; a recent fix may already cover it
thread: 1570872063831318639

Flaky tests waste review time; you decide whether to chase this one or drop it.
- `acceptance/aoe4-build-order-step-band.spec.ts:143` failed at f55e0aa and passed once at 5371c25.
- A later change (#160, settled-state waits) may already fix it; unverified.
- Pick F if you would rather wait and see whether it fails again.

### Answer

## Q81: Depletion-engine acceptance test: assert the exact first-arrival time, not just "> 0"?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: B: low priority; test-only, closes a gap a mutation slipped through
thread: 1570872066314469398

Only you decide how strict the tests must be; nothing waits on it.
- The idle-arrival test only checks the time is above 0.
- A change that keeps the latest arrival instead of the first still passes.
- So the first-arrival rule is not pinned by any test.

### Answer

## Q84: AoE4: import and export builds in the community overlay format?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: D: scanner says medium; lets you load shared guides and export to the in-game overlay
research: ../../discovery/milestone-20261113-1.md
thread: 1570872085910393077

Only you decide if sharing with the community is a goal now.
- aoe4guides supports import/export of the AoE4_Overlay file, the de facto exchange format.
- The overlay's exact format could not be retrieved; the first ticket must fetch a real export.
- Villager counts and notes map poorly to simulator actions.

### Answer

## Q86: WOTR combat: add max rounds and retreat?
kind: decision
blocks: backlog
options: A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog
recommendation: D: scanner says low priority; the code seams exist, but check the rulebook first
research: ../../discovery/milestone-20261113-1.md
thread: 1570872095309570209

Only you decide whether WOTR, the least developed app, gets work now.
- Today it runs one battle configuration; the response already allows other outcome kinds.
- Rules must be checked against the WOTR rulebook before specifying; only the dice and re-roll rule was confirmed.
- Character and Nazgul leadership stays out of scope.

### Answer

## Q91: Create two task worktrees outside the sandbox so SGS-157 and SGS-158 can be built
kind: handoff
blocks: SGS-157 (AoE4 buildings chart overlapping lines), SGS-158 (WOTR dice hit on 5 or 6)
options: A) Done | B) Not now
recommendation: A: both bug fixes wait on it
thread: 1570889533950525533

The drive sandbox cannot write .git/worktrees, so implementers for SGS-157 (buildings chart overlap) and SGS-158 (WOTR dice hit on 5 or 6) could not start. Branches exist at main; no code written.
- Run in a normal terminal in the repo (WOTR_Combat_Simulator):
- 1. rm -f .git/config.lock (only if no git process is running)
- 2. git worktree add .claude/code-factory/worktrees/sgs-157-buildings-chart-overlap sgs-157-buildings-chart-overlap
- 3. git worktree add .claude/code-factory/worktrees/sgs-158-dice-hit-5-or-6 sgs-158-dice-hit-5-or-6
- Then set both rows to ready and drive again. SGS-156 (spec) proceeds without it.

### Answer

## Q93: Create a task worktree outside the sandbox so SGS-156 can be built
kind: handoff
blocks: SGS-156 (AoE4 auto-houses plan ahead for wood)
options: A) Done | B) Not now
recommendation: A: SGS-156 waits on it
thread: 1570898977279447070

SGS-156 (auto-houses plan ahead for wood) passed spec-gate and is ready, but the drive sandbox cannot write .git/worktrees, so its implementer cannot start. Same blocker as Q91.
- Run in a normal terminal in the repo (WOTR_Combat_Simulator):
- git worktree add -b sgs-156-aoe4-auto-houses-plan-ahead-for-wood .claude/code-factory/worktrees/sgs-156-aoe4-auto-houses-plan-ahead-for-wood main
- Then drive again; the row is already ready (set branch=sgs-156-aoe4-auto-houses-plan-ahead-for-wood).

### Answer
