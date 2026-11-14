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

next: Q96

## Q95: Create SGS-156/160 worktrees and clear the stale git config lock
kind: handoff
blocks: SGS-156 (AoE4 auto-houses plan ahead for wood), SGS-160 (Fix results-split spec chart id filter)
options: A) Done | B) Not now
recommendation: A: unblocks both ready tickets
thread: 1571297742318342184

Implementers for SGS-156 (auto-houses) and SGS-160 (results-split spec fix) cannot create worktrees: .git/worktrees is read-only in the sandbox (code-factory #28), and a stale 0-byte .git/config.lock (Nov 11) also breaks git config writes.
- Run in a normal shell (not Claude Code), after confirming no git process is running:
- cd /home/choin/git/WOTR_Combat_Simulator && rm .git/config.lock && git worktree prune
- git worktree add -b sgs-156-auto-houses-plan-ahead .claude/code-factory/worktrees/sgs-156-auto-houses-plan-ahead origin/main
- git worktree add -b sgs-160-results-split-chart-id-filter .claude/code-factory/worktrees/sgs-160-results-split-chart-id-filter origin/main
- SGS-157/158 stay blocked too; nothing else proceeds without it.

### Answer
