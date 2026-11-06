# SGS-097 spec gate 2

Verdict: READY

Both gaps from gate 1 are closed. Checked against origin/main (schema.ts, schema.test.ts, openapi.json, docs/aoe4-build-order.md).

- start.villagers row: `name` is used only by `typed`/`inRange` on the count. The ticket now pairs a long key with count `'6'`, which gives `start: start.villagers.<cut> must be a number`. The existing test at schema.test.ts line 58 shows the same message shape. The unknown-node message for that key is separate, so exactly one message equals the asserted one. Reverting `shortText(node)` in `name` makes the 41 and 5000 rows fail.
- inputs rows: a key of `x` repeated fails `nodeRefIssue` with `unknown node "<q>"` for nodeAmounts. `keyedRecord` reports with path `[key]`, so the label prefix carries the key. Whole-message equality now checks the prefix, and reverting the `checkSimInputs` join makes the 41 and 5000 rows fail.
- The jq check on the 400 description is distinguishing: the exact strings sit today only in the examples (openapi.json lines 1796 to 1812), not in the description (line ~1768).
- `git grep "naming the step and"` matches only the BuildOrderIssue.message description (line 3328). The warning descriptions at lines 3595 and 3636 say "naming the step (1-based)", which is correct for warnings and is not matched.
- docs/aoe4-build-order.md lines 532 and 665 are the sentences Scope names. The On merge quotes were verified in gate 1.
- Risk standard, no open questions, no invariants adjacent, no schemaLibrary issue (no new input fields), and no diagram trigger. The openapi `info.version` (2.3.0) is not referenced by code or tests, so no coupling.

## Notes (non-blocking)

- The final 5000-character case produces a 5000-character key. The criterion says "same lengths 39, 40, 41 and 5000". That reuses the existing table lengths, which is fine.
- Optionally bump openapi `info.version` if the project treats message-text changes as a patch. The ticket does not say, and nothing requires it.
