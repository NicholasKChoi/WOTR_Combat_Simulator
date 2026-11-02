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

next: Q4

## Q1: M4 zod schema: turn on strictNullChecks so types come from the schema?
kind: decision
blocks: M4 (AoE4 build order workbench polish (results first, schema va…)
options: A) Precursor ticket enables strictNullChecks and fixes 177 errors: types declared once, in the schema | B) Keep hand-written model.ts types, cast zod output, add a round-trip test on shipped builds: every type written twice
recommendation: A: one source of truth for types; the errors are mostly mechanical test fixes
research: design/M4.md

M4 (AoE4 build order workbench polish) moves validation to one zod schema. The project compiles with strict: false, so z.infer makes every required field optional.
- Turning on strictNullChecks reports 177 errors, mostly in tests.

### Answer

## Q2: M4: should the simulate API keep accepting raw text?
kind: decision
blocks: M4 (AoE4 build order workbench polish (results first, schema va…)
options: A) Keep text, checked by the same schema: no break, small extra route branch | B) Keep text but mark it deprecated in OpenAPI: no break, signals future removal | C) Remove text: breaks API callers, ~70 acceptance requests rewritten
recommendation: A: no contract break; the text branch can be deleted later
research: design/M4.md

M4 makes the AoE4 build order page post structured {buildOrder, inputs} to /api/aoe4-build-order/simulate instead of raw text.
- Removing text breaks external API callers and means rewriting about 70 acceptance-test requests.

### Answer

## Q3: M4: after a veterancy upgrade, do unit counts move to the higher tier?
kind: decision
blocks: M4 (AoE4 build order workbench polish (results first, schema va…)
options: A) Units move to the upper tier when the upgrade completes: matches the game, changes the series meaning | B) Keep cumulative produced counts and add a separate unitsByTier series: no meaning change, one more series
recommendation: A: the chart then shows the army you actually have
research: design/M4.md

M4 makes veterancy upgrades convert existing units instead of only new ones. That changes what the unitsProduced series means.
- With A, knight + longbow at 1800 s: tier-2 longbows drop to 0 at 850 s and tier-3 ends at 66.

### Answer
