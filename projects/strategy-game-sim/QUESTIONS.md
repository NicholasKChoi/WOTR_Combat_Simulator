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

next: Q36

## Q35: Next milestone after M7: which backlog items go in?
kind: decision
blocks: M8
options: A) UI asks + bugs: M8 = the 3 owner UI requests plus the ~8 correctness bugs; debt stays in backlog | B) UI asks only: small milestone of the 3 owner UI requests | C) A plus test/cleanup debt sweep | D) AoE4 data accuracy (gather rates, overlay gaps, freshness CI) | E) other: name items
recommendation: A: owner-requested UI work plus real user-visible/security bugs; test debt is low value per ticket
research: ../../BACKLOG.md
thread: 1569871725116526624

M7 (build order is the step timeline) is done and there is no M8. BACKLOG.md holds 46 items; which should the next milestone take?
- UI/owner asks (3): split layout with separately scrolling columns + consistent heading sizes; pinned-run legend lists each resource once; step-table run cell needs labels.
- AoE4 data (3): CI freshness check on the aoe4world snapshot; provisional gather rates; English economy overlay gaps (forestry effect, crosscut-saw carry).
- Bugs/correctness (~8): ?b= load drops other query keys; 'Waited 0:00' for waiting steps; unset VERCEL_ENV fails open on DELETE; refused saves still write Blob; table badge wrap; textarea scroll; README build text.
- Test/cleanup debt (~30): weak or vacuous assertions, duplicated helpers, doc text fixes, CSS-module proxy in vitest, playwright env guard.
- Tooling (1): TypeScript LSP for agents.

### Answer
