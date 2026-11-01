# SGS-029 spec gate 1

**Verdict: READY.** Confirmed risk: **high** (public input contract and issue codes, S3 bound table, over 150 lines of business logic). No gaps. Notes below are non-blocking.

Checked against origin/main 68e004a, design/M2.md, CONTEXT.md, INVARIANTS.md, SGS-025, SGS-026, SGS-028, and the snapshot.

## Checks
1. Grounded scope: PASS. `validate.ts` is new and the ticket says so. `GameData` (`byBaseId`, `base`, `civData`), `classifyTech`, `buildGameData` and `loadGameData` exist. `effects.test.ts` uses `loadGameData` as described. `BuildStart`, `BuildOrderLines` and the `rally` step arrive with SGS-026 (verified in that ticket); `BuildOrderIssue`, `SimInputs` and `TripInputs` are already in `model.ts`. `BaseRules.gatherNodes[n].trip.*.value` and `walkSeconds.value` exist, so the A1 defaults are readable.
2. Testable criteria: PASS. Each criterion has a named failing and passing case. Snapshot spot-checks match the examples:
   - `wheelbarrow-1` is `producedBy: ['mill']`.
   - `villager-1` is produced by `capital-town-center`, `kings-palace` and `town-center`.
   - `forestry-1` is only an id (baseId `forestry`), so the `unknown-id` example holds.
   - `military-academy-3` and `bloomery-2` exist.
3. Open questions: none in the ticket or CONTEXT.md.
4. Invariants: S3, A1 and A3 are named and none is contradicted.
5. Contracts: PASS. The signatures, the unnamed result unions, the exact four exports, the bounds rows, the issue codes and the `trips`-merge text all match design/M2.md. The ticket relies on SGS-025 and SGS-026 only for names they define.
6. Dependencies and size: SGS-025 and SGS-026 are stated. ~330 LOC including tests and doc is under 400. SGS-028 is a sibling and the no-import-of-`parse-text` rule is explicit.
7. Diagrams: none required, and the ticket says so.
8. Lessons: both LESSONS.md files are empty.
9. Decisions: the body agrees with the design, including the wave 4 and wave 5 pins (per-node-then-per-field merge, repeat research).
10. On merge: `none` is correct. The ticket adds no command, harness or design doc.
11. Risk: `high` is correct. It meets the public-contract, S3-bound and over-150-lines triggers.
12. Docs: PASS.
    - The ticket adds a paragraph under the bounds table.
    - It adds three `invalid` rules to the Issues list that SGS-025 writes.
    - It greps the doc for `validateBuildOrder`, `resolveSimInputs` and `SIM_INPUT_BOUNDS`.
    - On main those names appear at doc lines 38, 321 and 333. All three are consistent with the ticket.
    - Stale villager-`produce`-needs-`rally` text (doc l.322, 324-326) is SGS-025's, and the ticket correctly passes villager `produce` without `rally`.

## Notes (non-blocking)
- `classifyTech` throws on a non-technology entry and takes one `SnapshotEntry`, while `byBaseId` returns an array. Today every technology and upgrade baseId has exactly one entry and no baseId mixes types. The implementer should classify the entries of the resolved baseId (first rejected wins) and only after the type check, so it never throws. Worth one sentence in check 4.
- The 200 caps (`triggerCount`, `count`, `builders`, `instance`, `startVillagers`, `steps`) are hard-coded S3 caps in `SIM_INPUT_BOUNDS`, not read from `base.maxPopCap`. The ticket's A1 line ("no game number in `validate.ts`") could say so, since the design writes `Trigger.count` as "= maxPopCap".
- Issue order inside one step with several problems (for example an out-of-range `count` and an unknown `producer`) follows field-declaration order. Only `issues[0]` for such multi-problem steps is affected, and the criteria use single-problem cases.
- Check 6's "starting building is a villager producer" issue is a `start` issue. For paste with no `start` line it carries no `line`, and for JSON it carries no `step` or `line`. This matches check 9; just keep a test for it.
- Estimate: 9 check groups plus `resolveSimInputs` in ~330 LOC is tight; an implementer may land near 400.
