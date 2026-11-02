# SGS-037 acceptance-test 1

Result: PASS. Tip tested 279bcf9, new commit d4c7cf1 on the task branch (test file only).

- Added acceptance/aoe4-simulate-api-depletion.spec.ts (5 tests): empty `depletions` and `warnings` for four orders (start line, villagers, research, JSON order with durationSeconds), and identical bodies on repeat. All pass.
- Ran with the existing contract, edges and simulate-api specs: 137 passed.
- Byte compare vs origin/main 2049e95 (handler called on both trees): 5 x 200 bodies identical except the appended `,"depletions":[],"warnings":[]`; 3 x 400 bodies identical.
- Contract spec already validates NodeRef, FiniteNodeRef, SimWarning (closed, described, tagged), NodeDepletion, Severity, StepWait, DepositRef against the TypeScript consts: no gap.
- Mutations: non-empty depletions in simulate.ts, and dropping `warnings` -> 4 of 5 fail each; reverted, `git diff --exit-code -- lib` clean.
- tsc and lint:dup pass. Ticket criteria already ticked; none changed.
