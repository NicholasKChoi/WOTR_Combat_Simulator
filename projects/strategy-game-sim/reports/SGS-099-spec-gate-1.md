# SGS-099 spec gate 1

Verdict: NEEDS_SPEC

Ticket: `tickets/SGS-099-saved-build-record.md` (M6, design `design/M6.md` C1, C3, C7). Read against the code in
`lib/aoe4-build-order/` (`schema.ts`, `api.ts`, `text-to-build.ts`, `parse-text.ts`, `builds.ts`, `model.ts`,
`test-helpers.ts`), INVARIANTS.md, CONTEXT.md, REPO.md, PROJECT.md, and the dependent tickets SGS-101 and SGS-103.

## Gaps

1. **Acceptance criteria (round-trip, text over 20000) - the input cannot be built - an implementer would guess.**
   The criterion "an order whose formatted text is over 20000 characters gives 400 with `text: <n> characters, more
   than 20000`" needs a valid order (at most 200 steps, `SIM_INPUT_BOUNDS.steps`) whose `formatBuildOrderText` output
   is over 20000 characters. Lines are short. The longest valid line I can build is about 90 to 95 characters (for
   example `when stone >= 100000 build <22-character building id> with 200 from stone#8 then stone#8 walk 60s`; node
   refs are at most `stone#8`, since `MAX_DEPOSITS` is 8; `rally` is only for villagers). 200 lines at about 95
   characters plus the `start` line is about 19,000 characters, under the cap. `name`, `civ` and `source` are not
   formatted, so they do not help. I could not run a construction (no runner was safe to use read-only), so this is
   an estimate; the margin is about 1000 characters. The test row asks for something the real input space very
   likely cannot produce. The design C3 example has the same flaw.
   Proposed fix: state how the row is built. Use the `vi.mock('./parse-text', ...)` that the guard test already
   needs, and have the `formatBuildOrderText` mock return a 20001-character text for one call (the order stays
   valid), asserting 400, the `text: 20001 characters, more than 20000` issue, no 413 and no `ok: true`. Say in
   Scope step 7 that this branch is as unreachable from real input as the guard, but is kept as it is the part-1
   failure path. Alternatively drop the row and keep the `walkSeconds: 2.5` case as the part-1 pin.

2. **Acceptance criteria (413 row) - tells the implementer to use "a multi-byte `name` or `source`"; `name` cannot work -
   an implementer would try the wrong field first.** Step 4 rejects a name over 100 characters (at most 300 bytes at
   3 bytes per character), and a valid order's `name` check runs before step 6, so a name cannot push the record
   over 65,536 bytes. Only `source` (uncapped `text().optional()`) can. Also 200 ordinary steps give roughly 20 to
   30 KB, so `source` must carry the rest.
   Proposed fix: replace "multi-byte `name` or `source`" with "a multi-byte `source` of N characters where N is
   under 65,536 characters but its UTF-8 size takes the record over 65,536 bytes (for example 30,000 three-byte
   characters)". Shorten the same order by shrinking `source` for the `ok: true` side. Add that the name path cannot
   reach 413.

## Checked and fine

- Grounded scope: `buildOrderShape`, `checkBuildOrder`, `outOfRange`, `SIM_INPUT_BOUNDS`, `BuildOrderCatalog`,
  `textToBuildOrder`, `formatBuildOrderText`, `SimulateError`, `MAX_REPORTED_ISSUES`, `BuildOrderIssue` all exist
  with the described signatures. `listBuilds()` and `ENGLISH` exist. The `walk 2.5s` message
  (`expected walk seconds like 4s, got '2.5s'`) matches `withWalk` and `Tokens.take` in `parse-text.ts`;
  `walkSeconds` is `bound(0, 60, false)` so the fractional value passes `checkBuildOrder`.
- Duration messages come from `outOfRange` as the ticket describes; `durationSeconds` bound is 60..3600 integer.
- No runtime import cycle: `api.ts` has only type imports and the new re-exports are `export type`.
- Open questions: none in the ticket or CONTEXT.md. The re-spec of 2026-11-09 settled the `walkSeconds` and
  `isPlainObject` points; the body agrees with design C3 and C7. SGS-103 (deletes the private copy) and SGS-101
  (keeps its own hash helper, does not touch `saved-builds.ts`) match.
- Invariants: A1 and S3 named; the new caps are not game numbers and do not loosen S3.
- Contracts: every C1 name and signature matches the design; `BuildsError` is added to `api.ts` as the design says.
- Dependencies and size: none; about 150 lines of logic.
- Diagrams: single component, none needed.
- Lessons: both LESSONS.md files hold no entries.
- On merge: none is correct (no command, harness or doc the factory uses).
- Risk: `standard` is right. A new contract the design specifies with exact names is excluded from the
  `strongModelTriggers` contract trigger; no `criticalPaths` symbol changes.
- Docs: grep of `docs/`, `ARCHITECTURE.md`, `README.md` for `saved-builds`, `saved build`, `BuildsError` found no
  statement to fix.
- Input validation: nested request; `buildOrder` goes through the zod schema, and the hand checks are the envelope
  only (a plain-object check, `durationSeconds`, `name`). This meets common.md.

## Notes (non-blocking)

- Scope item 2 and the `api.ts` header comment ("Request and response types for POST /api/aoe4-build-order/simulate")
  becomes partly untrue once `BuildsError` and the saved-build types are re-exported. Add "update the header
  comment to cover the builds API types" to item 2.
- Scope step 7 says "return 400 with its issues (capped as in step 5)" but does not say `error` is the first
  issue's message there; say so (and the same for the guard branch, where `error` is its one message).
- The "no input `checkBuildOrder` accepts reaches the guard" claim rests on a read of the formatter. It would not
  hold for a `name` with a newline only if `name` were formatted, and it is not, so it stands; but say that it is
  a claim about today's formatter and no test depends on it (the guard test uses the mock).
- The "exports exactly the C1 names, and no other exported name" criterion is a closed list. It comes from the design
  Modules table and SGS-103 uses the same pattern, so it is accepted; consider replacing it with "exports each C1
  name" plus the node/React/Next grep so a later helper does not fail it.
- Step 2 of the "Check" for the key-order id test: `savedBuildSchema.parse` of an object with a different key order
  yields schema order, so that case passes for any implementation that hashes the parsed output; good.
