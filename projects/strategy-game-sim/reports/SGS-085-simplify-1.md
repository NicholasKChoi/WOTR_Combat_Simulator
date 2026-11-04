# SGS-085 simplify 1
New tip: 5f7a23c (was 8e88f78). Not pushed.
Changed: schema.ts orderSchema local `fields` renamed `perStep` (it is the object with per-step rules, cross-checks are added after). Nothing else warranted: the diff was already tight, comments meet the bar, no behavior change.
Results: tsc clean; lint:dup no clones reported; npm test 48 files, 1483 passed, 10 skipped.
