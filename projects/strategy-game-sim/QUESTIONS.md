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

## Q18: OD-7: test the auto-run hook only through Playwright, or add jsdom + Testing Library for unit tests?
kind: decision
blocks: M6 (AoE4 workbench re-runs on edit, and builds are saved and op…)
options: A) no new deps: Vitest on the controller, Playwright on the hook | B) add jsdom + @testing-library/react and renderHook tests
recommendation: A: the controller holds all the rules; the hook is a thin wrapper Playwright already exercises
research: reports/M6-designer-2.md
thread: 1568499195646578728

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
thread: 1568499198473543690

Saving a build is limited to 30 saves per client per hour. In Playwright every request comes from 127.0.0.1, so the whole suite shares one budget.
- (a) keeps the limit fixed; each spec sends its own x-forwarded-for, and one API spec makes 31 saves to hit the 429. The suite tests the shipped number.
- (b) adds a BUILDS_SAVE_LIMIT env var that Playwright raises; production code then reads a test knob.

### Answer
