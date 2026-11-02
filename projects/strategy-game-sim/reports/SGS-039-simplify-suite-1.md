# SGS-039 simplify + suite 1

Tip: unchanged, 72ed7214a6501eed87cfa9d3c016a0bd14c9f5f6 (no commit made).

Simplify: no trims. The engine diff (offerStep shared by cursor and reactions, waitingSteps, triggerWakeAt) and the validate.ts table-driven trigger checks are already minimal; remaining candidates (isReaction helper, duplicate INFINITE_NODES in acceptance/helpers.ts vs test-helpers.ts) are used several times or avoid pulling vitest helpers into Playwright, so left alone. Comments pass the bar; no ticket ids in the diff.

Ticket ids (SGS-0..) in commit subjects/bodies on origin/main..HEAD: none. None in the diff text either.

Suite (Node 24):
- tsc --noEmit: pass; lint:dup: 0 clones
- npm test: 37 files, 934 tests passed
- next build: success
