# SGS-040 implementer report 1

Branch sgs-040-aoe4-paste-grammar-deposits-reactions, tip 607bccb4bf1abe977b28880873ccb7ab05335d64 (base origin/main 9a1a074).
Worktree: $FACTORY_DIR/worktrees/sgs-040-aoe4-paste-grammar-deposits-reactions

## Files
- lib/aoe4-build-order/parse-text.ts: NODE_TOKEN, node(), `move all`, when/whenever parsing (ParsedTrigger), formatTrigger(step), formatBuildStep (exported), formatStart via NODE_REFS; GATHER_NODE_ORDER deleted.
- data/aoe4-build-order/builds/english-1tc.json: appended the gold reaction step (25 steps, earlier steps untouched).
- lib/aoe4-build-order/parse-text.test.ts: node token, move all, when/whenever, formatBuildStep tests; representable extended.
- lib/aoe4-build-order/builds.test.ts: strict round trip, whenever-line assertion, gold bar at 1200 and 3600, ENG 1TC 3600 s test.
- docs/aoe4-build-order.md, data/aoe4-build-order/README.md: paste forms, bar at both horizons, ENG 1TC reaction.
- Edited existing tests (below).

## Existing tests edited (forced by the new ENG 1TC step / `when` grammar)
- parse-text.test.ts "triggers > rejects 'when 9 pause a'": expected token `'when'` -> `'runs'` (`when` is now a prefix; 9 is a valid node-shaped token, the error is the missing `runs`).
- simulate.test.ts "depletions and warnings > are empty while every node is infinite": prebuilt now lists gold#2 (4000, not run out) because the reaction names it; one-step order unchanged.
- simulate-triggers.test.ts "default amounts": "runs ENG 1TC dry..." now expects gold#2 present, not depleted; "keeps every ENG 1TC start time" compares the first 24 steps and expects the reaction null with infinite nodes.
- acceptance/aoe4-simulate-api-timelines.spec.ts (ticket-named): appended-step indexes from english1tc.steps.length.
- acceptance/aoe4-simulate-api-markers.spec.ts "classifies a tech ... as other": same index change.
- acceptance/aoe4-simulate-api-triggers.spec.ts "keeps every step start time..." (25 steps, last null when infinite) and "runs gold deposit 1 out..." (gold#2 present not depleted, reaction starts at depletedAt, node-depleted is info with 0 idle).
- acceptance/aoe4-simulate-api-depletion-engine.spec.ts noDepletion helper ignores gold#2.
The ticket said other ENG 1TC tests keep their values; these four acceptance specs and two unit tests could not (they encode "no gold#2 / 24 steps / idle 2"). Values for pinned timings unchanged.
Not written: new Playwright specs (acceptance gate owns them; instruction), parse-text.acceptance.test.ts additions.

## Results
- tsc: clean. lint:dup: 0 clones. npm test: 988 passed. `next build`: ok. Full `npm run acceptance`: 521 passed. codegen: n/a.
- GATHER_NODE_ORDER grep 0 hits; `'a node name', ID` 0 hits. ENG 1TC reaction count 1, steps 25.

## Mutation checks (all reverted)
- formatTrigger depleted -> undefined: builds round trip, whenever line, parse-text round trip, formatBuildStep tests fail.
- reaction -> never 'whenever': same tests fail. Dropping `reaction` in parseAction: whenever parse + round trips fail.
- `move all` print: the ternary was an equivalent mutant (String('all') is 'all'), so the code now uses String(step.count) alone.
- `>` message branch off: "rejects when wood > 400" fails.
- formatStart reversed node order: start-order tests fail.
- Remove reaction step from JSON: builds 3600 s bar part 4/5 and ENG 1TC test fail.
- triggerHolds depleted case disabled: both ENG 1TC 3600 s tests fail.
## Invariants
A1: no numbers/lists added to parse-text.ts (NODE_REFS from model). A3: parse/format pure, deterministic.

## Out-of-scope / notes
- Node 24 used; no runtime mismatch.

Status: needs_review
