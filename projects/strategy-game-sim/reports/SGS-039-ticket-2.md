# SGS-039 ticket report 2 (re-spec)

File: projects/strategy-game-sim/tickets/SGS-039-aoe4-triggers-reactions-default-amounts.md
Applied items 1-10 of "Moved from SGS-039": title, Context, M3.11 criteria, LOC, Source, risk comment, english-1tc.json block, bar test (parts 1-3 at 1200 and 3600 s, 4-5 at 1200 s), docs Prebuilt builds sentence, acceptance criteria (jq reaction count and mutations removed, ENG 1TC unchanged for all 24 steps, plain `npm run acceptance`), Out of scope.
Folded answers: (a) accrueWait(engine, stepIndexes, seconds); (b) exact-instant wake via wake-only list; (c) reactions validated as ordinary steps in list order; (d) nodeRefIssue return owned by SGS-038, stated once ("reports what SGS-038 defines it to return"). SGS-038 as written names the function and its codes but no object shape, so none is restated.
Open questions: none. Risk: high (unchanged; critical path lib/**, default-run behaviour, public schema).
Judgement call: the manager note said the round-trip note "stays"; the test removal existed only because ENG 1TC gets a depleted step, which now lands in SGS-040. I kept the round-trip test in E (it passes) and left its extension to SGS-040. Change back if you want it removed.
Check: ENG 1TC 3600 s criterion kept (engine fact). Graph row and id unchanged.
