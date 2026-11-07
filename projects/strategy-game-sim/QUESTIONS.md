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

next: Q20

## Q15: M6.8: hold only the last (smoke-script) PR for your preview smoke, and let the storage/API PRs merge before it?
kind: confirmation
blocks: M6 (AoE4 workbench re-runs on edit, and builds are saved and op…)
options: A) approve: hold only the smoke-script PR; earlier PRs auto-merge as usual | B) change: also hold the Blob-adapter and API-route PRs until a real-store smoke | C) change: something else (say what)
recommendation: A: the routes are unreachable from the page until the Save PR, and a hold on every storage PR stalls the stack
research: plans/M6-20261105.md
thread: 1568496840058474629
answered: 2026-11-07T05:28Z discord

M6 ships as about eight auto-merged PRs, but criterion M6.8 says the owner smoke-tests 'the M6 PR' preview before merge.
- The smoke script (last PR) is the first thing that can test the real Blob store.
- The Blob adapter and the builds API routes merge to production earlier, unverified against the real store; nothing on the page reaches them until the Save-button PR.
- Proposal: treat the smoke-script PR as 'the M6 PR' and hold it from auto-merge until you report the smoke passed on its preview.

### Answer
A) approve: hold only the smoke-script PR; earlier PRs auto-merge as usual

## Q16: M6.9: should agents save builds with a documented curl/fetch POST, or a new npm run save-build script?
kind: decision
blocks: M6 (AoE4 workbench re-runs on edit, and builds are saved and op…)
options: A) docs only: a documented POST, no new script | B) add npm run save-build -- <file> [url] as an extra ticket
recommendation: A: the POST is one call and an agent can make it from any tool; a script adds a ticket and a CLI to maintain
research: plans/M6-20261105.md
thread: 1568496844261036064
answered: 2026-11-07T05:28Z discord

M6.9 asks the docs to say how an agent saves a build and prints its link, but no planned piece gives agents a save command.
- Option A needs no new code: docs show a plain POST to /api/aoe4-build-order/builds and printing origin + path.
- Option B adds 'npm run save-build -- <file> [url]': one more ticket after the API routes, plus a small CLI contract in the design.

### Answer
A) docs only: a documented POST, no new script

## Q17: Which backlog items should go into M6?
kind: decision
blocks: M6 (AoE4 workbench re-runs on edit, and builds are saved and op…)
options: A) only item 1 (regenerate the stale OpenAPI example inside the API ticket) | B) items 1 and 2 (also re-add the deleted acceptance coverage) | C) none; keep M6 to auto-run and save-by-link | D) other (list the numbers)
recommendation: A: the API ticket already rewrites openapi.json, so the example is nearly free; item 3 disappears with the Run rewrite, item 2 and the older items are their own work
research: BACKLOG.md
thread: 1568496847503237130
answered: 2026-11-07T05:28Z discord

Milestone planning pulls backlog items in. M6 already includes auto-run and save-by-link. Items added since the plan:
- 1) The OpenAPI 200 buildOrder example in docs/api/openapi.json is stale since the villager-target change (its test was deleted in #106). M6's API ticket edits the same file and bumps it to 2.4.0.
- 2) Acceptance coverage deleted in #106 (pinned timelines, veterancy counts, house warnings, spear/longbow timing): unit pins are current, acceptance has none.
- 3) aoe4-small-screen.spec.ts:42 failed once under load (1/734). M6's rewrite drops that run-scroll expectation anyway.
- 4) Older: data freshness CI job, provisional gather rates, English economy tech gaps.

### Answer
A) only item 1 (regenerate the stale OpenAPI example inside the API ticket)

## Q18: OD-7: test the auto-run hook only through Playwright, or add jsdom + Testing Library for unit tests?
kind: decision
blocks: M6 (AoE4 workbench re-runs on edit, and builds are saved and op…)
options: A) no new deps: Vitest on the controller, Playwright on the hook | B) add jsdom + @testing-library/react and renderHook tests
recommendation: A: the controller holds all the rules; the hook is a thin wrapper Playwright already exercises
research: reports/M6-designer-2.md

M6's auto-run logic lives in a plain controller (no React) that Vitest tests with fake timers; a thin React hook wraps it. The repo has no DOM test environment today.
- (a) keeps it that way: the hook's effect wiring is covered only by Playwright.
- (b) adds dev dependencies jsdom and @testing-library/react so the hook is tested at unit speed, with a second Vitest environment.

### Answer

## Q19: OD-8: keep the save rate limit fixed (specs vary x-forwarded-for) or make it env-tunable for tests?
kind: decision
blocks: M6 (AoE4 workbench re-runs on edit, and builds are saved and op…)
options: A) fixed limit, per-spec x-forwarded-for | B) BUILDS_SAVE_LIMIT env var set in Playwright
recommendation: A: no test setting in production code, and it also tests the forwarded-for path
research: reports/M6-designer-2.md

Saving a build is limited to 30 saves per client per hour. In Playwright every request comes from 127.0.0.1, so the whole suite shares one budget.
- (a) keeps the limit fixed; each spec sends its own x-forwarded-for, and one API spec makes 31 saves to hit the 429. The suite tests the shipped number.
- (b) adds a BUILDS_SAVE_LIMIT env var that Playwright raises; production code then reads a test knob.

### Answer
