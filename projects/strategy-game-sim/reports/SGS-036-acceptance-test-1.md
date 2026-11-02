# SGS-036 acceptance-test 1
Tip tested: ab26368; test commit 319879e923a99ee137356c869df1a0d73ee9fe0d on sgs-036-aoe4-request-hardening. Verdict: PASS.
Tests (all passing): edges spec "issue cap" (99, 100 no key; 101 -> 1; 250 -> 150; 60+60 -> 60 paste then 40 inputs, omitted 20; repeat stable; error == issues[0].message); contract spec "SimulateError issue cap" (real capped body validates; 100 +/- omittedIssues valid; 101 issues invalid; omittedIssues 0 / 1.5 invalid); page spec (omittedIssues 5 shows last li "5 more issues not shown."; absent shows none).
Mutations (each failed, then reverted; git diff --exit-code clean): slice 101 (3 edge tests); always-emit omittedIssues (99/100 tests); inputs-before-order (combined test); page threshold >99 and unconditional line (both page tests); openapi maxItems 1000 (101 test); omittedIssues minimum 0 (0/1.5 test); drop   from WHITESPACE (parse-text.test U+00A0); restore failed-line sawStep (2 parse-text tests).
Suite: tsc OK, npm test 700 pass, npm run acceptance 352 pass.
parse-text.acceptance.test.ts:140 inversion ('bogus\nstart 6 sheep' -> [1]) is correct per Scope 3.
Ticket AC4 and AC11 ticked. No failures, no spec-gaps.
