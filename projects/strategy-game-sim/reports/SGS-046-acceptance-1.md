# SGS-046 acceptance 1: PASS

Tip tested 923cbb6; new tip is the commit adding `acceptance/aoe4-step-table.spec.ts` (see git log of sgs-046-aoe4-step-table-editor). Node 24, port 3647, server stopped.

Tests (11, all pass; plus the 36 existing aoe4-build-order and pin-compare specs, 47 total passing):
- default build: step-row count equals step lines, no unavailable notice, row 0 produce/villager
- table edits (add, unit change, move up, delete) rewrite the text; comments and blank lines dropped, start kept
- typed text fills the table (time 90, build house from wood) and is never reformatted
- every step form: reaction checkbox only on the reaction row and checked, move all, gold#2, bank and villagers fields; unchecking rewrites only that line
- unparsable text: table and step-add absent, notice names the issue, table returns after a parsable fill
- unknown unit and tech render `<id> (unknown)` with data-unknown, text untouched
- number fields: clearing x3 drops it, 7 gives x7; required seconds ignores empty and abc, blur restores value
- move buttons disabled at ends, swap, delete all leaves start line, add still works
- table buttons never POST
- Run posts exactly the textarea text after a table edit and charts draw
- review ask: rally `to` select has no empty option, picking it keeps the table; build `then` and produce `rally` empty choices keep the table

Not covered: build-order-select to another prebuilt (only one prebuilt exists, so the criterion cannot be expressed); an edit during an in-flight run not changing the displayed result (not written; no hook to hold a run open without mocking).

Mutation checks (each failed the named test, then reverted with git checkout; tree clean): rally to allowEmpty always true -> rally test; move-up disabled false -> move buttons test; data-unknown removed -> unknown test; blur not clearing draft -> number test; reaction checked false -> every-step-form test; add inserts at 0 -> table edits test.

No failures. Lint: repo has no eslint config; prettier applied; jscpd run clean.
