# SGS-067 acceptance-test 1: PASS
Tip tested 46987c8; new commit 4102cd4 (acceptance/aoe4-build-order-inline-issues.spec.ts only).
Already covered (existing specs, can fail): live parse issue + gutter mark, knigt -> "did you mean knight?", check issues wait for first Run, edit-fix clears/restores live, valid Run sets checked, two issues in order, scroll rules (line 62, no-line, repeat, mid-text, table view), result kept, server 400, gold info list.
Added: (1) check issue with no near match renders no suggestion element; (2) gutter marks exactly lines 2 and 4 of a 5-line text with two issues.
Both pass 10x under 4 workers. Full file: 14 passed.
Mutations: suggestion element always rendered -> test 1 failed; editor also marks line-1 neighbours -> test 2 failed; both reverted (git diff clean on non-test files).
Nothing listens on 4081. 390 px not tested (later ticket).
