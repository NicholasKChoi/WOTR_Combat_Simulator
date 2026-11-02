# SGS-040 spec gate 3
Verdict: READY.
Edit verified: acceptance/aoe4-simulate-api-timelines.spec.ts (SGS-038 tip 93a1e2b) spreads english1tc.steps (24) then reads body.steps[24], [25], [26] (the appended research/produce steps); indexes 14, 22, 23 are ENG 1TC's own. With the reaction at index 24, appended steps shift to steps.length+0/+1/+2, as the ticket says. Expected values stay because the test pins the finite nodes null (SGS-039) so the depleted reaction never arms and reactions do not delay the cursor. No other test on main/branch uses steps[24+] or a 24-step literal (grep).
Other checks pass: scope names exist, criteria testable, no open questions, risk standard fits (parse-text.ts not a criticalPaths symbol), docs/README in Scope.
Notes: none blocking.
