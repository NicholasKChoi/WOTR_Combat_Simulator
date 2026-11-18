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

next: Q140

## Q137: Restart the question bot service
kind: handoff
options: A) Done | B) Not now
thread: 1572474324223524988
answered: 2026-11-18T06:21Z terminal

The question bot's service could not be restarted from the Claude session, so it may be running older bot code. Run in a normal shell: systemctl --user restart code-factory-bot.service. Nothing is blocked; the bot keeps serving the board meanwhile.

### Answer
A) Done. The bot was restarted at 20:51 on 2026-11-17.

## Q139: Check the M11 changes on preview, then production (M11.8)
kind: handoff
blocks: M11.8 (Owner checks the changes on the PR previews and then produc…)
options: A) Done, all good | B) Found a problem (reply with what you saw) | C) Skip
thread: 1572493779439456296
answered: 2026-11-18T06:21Z terminal

M11.8 is the last open criterion of M11 and needs the owner's eyes; every M11 ticket and chore SGS-201..206 is integrated.
- Check the AoE4 workbench changes (zoom/pan and reset, unit-line series with upgrade dots, shared marker control, chart table, wait reasons, help modal) on the PR preview, then production.

### Answer
A) Done, all good. Owner checked the M11 changes and the four follow-up fixes (#212-#215) in production on 2026-11-17.
