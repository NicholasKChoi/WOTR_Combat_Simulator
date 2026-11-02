# SGS-060 implementer 1
Status: needs_review. Branch sgs-060-aoe4-api-specs-send-build-order, tip f5d5e84f1eec3204b98cd1c86d21051bb21472d7 (base sgs-075 7037d48), worktree $FACTORY_DIR/worktrees/sgs-060-aoe4-api-specs-send-build-order.
Files: 12 acceptance/aoe4-simulate-api*.spec.ts (api, edges, contract, depletion, depletion-engine, markers, research, spend-population, timelines, triggers, waits, house-warnings), +78/-93.
Tests: playwright aoe4-simulate-api* 317 passed; full npm run acceptance 601 passed; npm test 1221 passed/8 skipped; tsc and lint:dup clean. next build not run (test-only change).
Mutations: issue cap slice(0,..)->slice(1,..) in pages/api route: 41 failed; dropped "cannot produce" check in schema.ts: 4 failed; both reverted.
Deleted: syntax paste @1:61 (covered by parse-text.acceptance.test.ts line 75-78), CRLF edges test, paste half of issue location (renamed "a JSON step issue carries step and no line"). No lib test added.
Cap specs: 99/100/101/200 and combined 60+60 as specified; contract capped test uses 101 bad steps.
Deviation: remaining `text` lines are 24 not 16: main-branch specs added since the ticket. checks.spec (5: pasted knigt with line, 20001/20000 text cases), issue-shape.spec (3: paste knigt line, 20001 text). Left as text-rule/line-on-400 specs for the remove-text ticket. house-warnings warm-up converted (file added after ticket). paste() helper removed from api spec (unused).
