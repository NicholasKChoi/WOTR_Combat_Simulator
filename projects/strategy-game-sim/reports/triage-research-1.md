# Backlog triage drafts (depth: frame)

Count note: BACKLOG.md has 22 untagged bullets (starting lines 19, 20, 21, 23, 26, 28, 31, 33, 37-45, 57, 61, 64, 67, 70), not 19. All 22 are drafted. Lines 6-17 and 50 are tagged and skipped.

Shared fields for every item:
- kind=decision, blocks=backlog
- OPTS = `A) standalone bug: one small fix PR | B) standalone chore: no visible change, one small PR | C) debug: cause unknown: investigate first, then fix | D) milestone: new behavior or needs a design, bigger | E) docs: edit a doc only | F) drop: remove from backlog`
- research= empty except items 18-22 (path relative to PROJECT_DIR: `../../discovery/milestone-20261113-1.md`)
- Every body's first line is the "why you" line. Filing order = list order. Source line numbers in brackets are for the manager only; not in the board text.

---

## 1 [L19] 
question=Design doc: fix the wrong keyboard-Tab description after "Save as copy"?
options=OPTS
recommendation=E: only the design document is wrong; no app behavior changes
research=
body:
Only you decide if a wording fix to a design note is worth a ticket; nothing else waits on it.
- The design row says one Tab walk after Save as copy reaches the save button, then the link controls.
- No page state allows that: the save button is disabled whenever the link shows.
- Fix is to describe the two states separately. Found while re-specifying the Save-panel ticket.

## 2 [L20]
question=Design doc: make "clear the copy name" a required step in the Save-panel check?
options=OPTS
recommendation=E: only the design row changes; the ticket already calls the step optional
research=
body:
Only you decide whether to spend a ticket on a doc wording fix; nothing else waits on it.
- The check that the notice sits below the bar bottom at top scroll only works with the name cleared (error showing).
- Content is 339px against a 306px version and a 287px bar, so the check fails without it.
- The ticket calls the step optional; the design row should say required. Found in review.

## 3 [L21]
question=AoE4 results charts: show the chart rows as a real table?
options=OPTS
recommendation=D: visible redesign of how rows look; small, best grouped with the other chart polish items
research=
body:
Taste call from your UI feedback of 2026-11-12; only you know how much polish you want now.
- Render chart rows as a real table so collapsed rows look cleaner.
- Nothing is broken today; it is a presentation change.
- Related chart items follow (overlapping lines, shared markers); they could be one chart-polish milestone.

## 4 [L23]
question=AoE4 Buildings chart: make overlapping lines identifiable?
options=OPTS
recommendation=A: plain cause (equal counts stack); medium priority since you cannot read which buildings exist
research=
body:
You saw this on the chart; you decide how much it matters and whether a bug fix or a redesign is wanted.
- Many buildings have the same count (1 or 2), so their lines sit on top of each other.
- You cannot tell which buildings are there.
- Fix could be small (offset, labels) or bigger (different chart); pick D if you want it designed.

## 5 [L26]
question=AoE4 charts: one shared marker control that shows or hides a vertical line on every chart?
options=OPTS
recommendation=D: new behavior across all charts; needs a small design
research=
body:
This adds a feature from your UI feedback of 2026-11-12; only you can say if it is worth building now.
- Define markers once for all charts.
- Clicking a marker toggles its vertical line on every chart.
- Touches every chart, so it pairs naturally with the other chart items.

## 6 [L28]
question=AoE4 build order: let one step repeat its action N times (e.g. build Farm from wood x9)?
options=OPTS
recommendation=D: new step format, touches the editor, JSON and simulator
research=
body:
Your feature request of 2026-11-13; only you decide the priority against other work.
- Today nine farms need nine identical steps.
- A repeat count would run as that many copies of the step.
- Needs a design for the JSON/paste format and the editor.

## 7 [L31]
question=AoE4 My builds: rename a saved build without saving a copy?
options=OPTS
recommendation=D: new feature across storage, API and library; links must keep working
research=
body:
Your feature request of 2026-11-13; only you decide if it is wanted now.
- The new name shows everywhere the build is listed.
- Existing links to the build keep working.
- Touches the build store, the API and the library UI.

## 8 [L33]
question=AoE4 research: require its building and block that building's queue while it runs?
options=OPTS
recommendation=D: changes simulation rules; needs a design and a building-to-research table
research=
body:
Your feature request of 2026-11-13; this changes build timings, so only you can accept that.
- Attack upgrades need the Blacksmith; spearman veterancy the Barracks; archer upgrades the Archery Range.
- The building must exist, and units queued there pause until the research finishes.
- Existing saved builds may time differently afterward.

## 9 [L37]
question=AoE4 My builds page: check storage is available before rereading on a storage event?
options=OPTS
recommendation=B: low priority; a guard in existing code, found by a ticket implementer and unchanged from before
research=
body:
Only you decide if a small hardening is worth a ticket; nothing waits on it.
- The storage listener (`reread`) in the AoE4 build-order page skips the availability check the rest of My builds uses.
- It predates the recent work; no user-visible failure is reported.
- Whether it can throw with storage blocked is unverified.

## 10 [L38]
question=Add a test-writing rule: scroll targets into view instantly before hover or focus in browser tests?
options=OPTS
recommendation=E: it is a rule for the project's lessons file, not app code
research=
body:
Only you decide whether this becomes a standing rule for all future test writers.
- Playwright hover/focus smooth-scrolls the page.
- The resulting pointer events change state after an assertion already passed, making tests flaky.
- Rule would apply to browser test files only.

## 11 [L39]
question=Build-order doc: note that pinned run colors wrap around the palette?
options=OPTS
recommendation=E: doc-only; review noted it as non-blocking
research=
body:
Only you decide whether a one-line doc fix is worth a ticket.
- The doc omits that the palette index wraps by modulo, so a run after the last color reuses the first.
- Found in a code review as a non-blocking note.

## 12 [L40]
question=Preview smoke script: stop swallowing errors from the reroute step?
options=OPTS
recommendation=B: low priority; failures in the smoke check are hidden today
research=
body:
Only you decide how much to harden the deploy smoke check; nothing waits on it.
- `scripts/smoke-preview.mjs` ignores errors from the fetch and abort calls in an empty catch.
- A failed bypass reroute therefore goes unseen.
- No visible app behavior changes.

## 13 [L41]
question=Preview smoke script: add a test for the browser-close failure path?
options=OPTS
recommendation=B: low priority; test-only addition
research=
body:
Only you decide whether this test gap is worth a ticket.
- The path where closing the browser rejects has no test in `scripts/smoke-preview.mjs`.
- Found by the ticket implementer; no known failure.

## 14 [L42]
question=Acceptance test for results chart ids fails on main: investigate?
options=OPTS
recommendation=C: a red test on main with unknown cause; investigate before deciding what to fix
research=
body:
A red browser test on main blocks trust in every later check; you decide whether to spend effort on it now.
- `acceptance/aoe4-results-split.spec.ts:41` (chart ids) fails reproducibly at two commits (5371c25 and f55e0aa).
- Cause unknown: could be a real chart-id regression or a stale test.

## 15 [L43]
question=Acceptance test for the step band failed once on main: check whether it is flaky?
options=OPTS
recommendation=C: intermittent failure, cause unknown; a recent fix may already cover it
research=
body:
Flaky tests waste review time; you decide whether to chase this one or drop it.
- `acceptance/aoe4-build-order-step-band.spec.ts:143` failed at f55e0aa and passed once at 5371c25.
- A later change (#160, settled-state waits) may already fix it; unverified.
- Pick F if you would rather wait and see whether it fails again.

## 16 [L44]
question=Depletion-engine acceptance test: assert the exact first-arrival time, not just "> 0"?
options=OPTS
recommendation=B: low priority; test-only, closes a gap a mutation slipped through
research=
body:
Only you decide how strict the tests must be; nothing waits on it.
- The idle-arrival test only checks the time is above 0.
- A change that keeps the latest arrival instead of the first still passes.
- So the first-arrival rule is not pinned by any test.

## 17 [L45]
question=AoE4 auto-houses: plan ahead for wood so houses are not late?
options=OPTS
recommendation=D: fix changes simulation rules (look-ahead plus wood reserve); needs a design
research=
body:
Your request of 2026-11-13; it changes build timings, so only you can accept the new rule.
- Today a house starts only when wood reaches 50, so the town center is already housed with 4-8 on wood.
- Example (English 1 TC Council Hall build): housed 100/100 at 12:35, 110/110 at 13:44, 120/120 at 14:45.
- Fix: include wood gathering time in the look-ahead and reserve wood so other steps do not spend it first.

## 18 [L57]
question=AoE4 sim: measure timing accuracy against real games (and replace provisional gather rates)?
options=OPTS
recommendation=D: scanner says high priority; every other feature is worth little if timings are off
research=../../discovery/milestone-20261113-1.md
body:
Only you decide where milestone effort goes next; this would absorb the provisional gather rates item.
- No milestone criterion compares simulated timings (age-up, unit-out) with real play.
- Shape: pick 3-5 reference builds with known real timings, assert within a stated tolerance, cite the patch.
- Skipping it means you keep tuning builds against unverified numbers.

## 19 [L61]
question=AoE4: import and export builds in the community overlay format?
options=OPTS
recommendation=D: scanner says medium; lets you load shared guides and export to the in-game overlay
research=../../discovery/milestone-20261113-1.md
body:
Only you decide if sharing with the community is a goal now.
- aoe4guides supports import/export of the AoE4_Overlay file, the de facto exchange format.
- The overlay's exact format could not be retrieved; the first ticket must fetch a real export.
- Villager counts and notes map poorly to simulator actions.

## 20 [L64]
question=AoE4: show the game patch on every result and saved build?
options=OPTS
recommendation=D: small milestone, medium priority; saved builds silently go stale otherwise
research=../../discovery/milestone-20261113-1.md
body:
Only you decide if shared links should carry their patch; you share links with others.
- The game patches about monthly (17.0 on 2026-10-22); the data snapshot (17.0.12182) is refreshed by hand.
- Shape: patch label in the results header and saved builds, plus a periodic check that the snapshot is current.
- Scanner notes it could also be two standalone chores.

## 21 [L67]
question=WOTR combat: add max rounds and retreat?
options=OPTS
recommendation=D: scanner says low priority; the code seams exist, but check the rulebook first
research=../../discovery/milestone-20261113-1.md
body:
Only you decide whether WOTR, the least developed app, gets work now.
- Today it runs one battle configuration; the response already allows other outcome kinds.
- Rules must be checked against the WOTR rulebook before specifying; only the dice and re-roll rule was confirmed.
- Character and Nazgul leadership stays out of scope.

## 22 [L70]
question=AoE4: optional spread of outcomes (several runs with a seed)?
options=OPTS
recommendation=D: scanner says low priority and defer until the accuracy work shows where the model is off
research=../../discovery/milestone-20261113-1.md
body:
Only you decide whether ranges instead of one number are wanted; reply "later" to park it.
- The sim is deterministic; real games vary (travel, scouting, losses).
- The doc lists a spread of outcomes as an extension point (runs and a seed in the request).
- Low value until timings are verified against real games.

---

Recommendation tally: E (docs) 1, 2, 10, 11; D (milestone) 3, 5, 6, 7, 8, 17, 18-22; A (bug) 4 (medium); B (chore) 9, 12, 13, 16 (all low); C (debug) 14, 15.

Unknowns: whether item 9's `reread` can fail with storage blocked, and whether the #160 waits already fix item 15 (neither verified at frame depth). Item 4 may be a milestone if the owner wants a redesign.

Sources: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/BACKLOG.md lines 19-71; /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/discovery/milestone-20261113-1.md lines 59-84; /home/choin/git/code-factory/templates/QUESTIONS.md.
