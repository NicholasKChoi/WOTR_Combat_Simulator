# SGS-053: Fix M2 doc wording in docs/aoe4-build-order.md and design/M2.md

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.8 (doc wording)
- **Priority**: low
- **Risk**: low
- **Invariants**: none adjacent (text only; no file under `lib/**` changes)
- **LOC estimate**: ~30 lines of prose in `docs/aoe4-build-order.md`, ~6 in `design/M2.md`; 0 business logic
- **Depends on**: none
- **On merge**: the manager applies the `design/M2.md` edits listed in Scope on the `code-factory-state` branch (that file is state, not in the repo, so the PR cannot carry it). No REPO.md or CONTEXT.md change.
- **Source**: design/M3.md "Left to tickets" (M3.8 doc wording); plan M3-20261101 outline S

## Context

Eight statements in `docs/aoe4-build-order.md` and four in `design/M2.md` disagree with the shipped M2 code or
omit a behavior a reader needs. This ticket is a root so every later M3 ticket that edits the same doc rebases
on corrected text. Each fix below was checked against the code on `main` (f078c11).

## Scope

### `docs/aoe4-build-order.md` (in the PR)

1. **Parse `syntax` issues carry `line` only.** `parse-text.ts:260` pushes `{ code: 'syntax', message, line }`
   with no `step`. The "Issues" paragraph (~line 421) says a paste step issue carries both `step` and `line`;
   state that this holds for validation issues on a parsed step, and that a `syntax` issue raised while
   parsing a line carries `line` only. Make the "Route" 400 bullet (~line 490) agree.
2. **`unitsProduced` order.** The `unitsProduced` bullet (~line 508) gives no order. `simulate.ts:654`
   (`unitSeries`) sorts by first spawn time, then unit id. State that.
3. **A counted `produce` does not resume the default villager order.** The Queues paragraph (~line 160)
   says the default order is replaced by a `produce` or `pause`. State that when a counted `produce` spawns
   its last unit the instance's order becomes empty (`simulate.ts:246-247`), so the villager order is not
   restored; only a research resumes the instance's own order (the existing ~line 180 sentence).
4. **"Any other HTTP failure".** The Page section (~line 574) says "any other failure shows ... (HTTP
   <status>)". `pages/apps/aoe4-build-order.tsx:35` produces that text only for a non-ok HTTP status (and a 400
   with no issues); a thrown fetch or body-parse error shows "The simulation could not be run. Please try
   again." (`:63`). Reword to "any other HTTP failure" and state the second text.
5. **JSON `start` issue carries neither `step` nor `line`.** The "Issues" paragraph already says this; the
   "Route" 400 bullet (~line 490) lists only pasted step, JSON step and `inputs` issues. Add the `start` cases
   (pasted `start`: `line` only; JSON `start`: neither).
6. **Parse-fails branch in the diagram.** The mermaid `flowchart LR` (~line 464) has no edge from
   `parse` to `error`. Add `parse -->|"syntax issues"| error`.
7. **Move-speed divisor in the builder walk.** The walk list (~line 221) says auto-house builders walk
   "at `inputs.walkSeconds`". The code divides by the villager `moveSpeed` multiplier on both legs
   (`houses.ts:25-26` for the lead time, `simulate.ts:300-303` `villagerWalk` for the walk). Write
   "`inputs.walkSeconds / moveSpeedMultiplier`".
8. **`shaft-mining` example.** ~Line 341 uses `shaft-mining` as an `effects-unmodeled` example, but it has an
   overlay row, so it is `supported` (`effects.test.ts:57-59`; the base id `admiralty` is the unmodeled one,
   `research.acceptance.test.ts:283-286`). Use `admiralty`.

### `design/M2.md` (state branch; applied by the manager after merge, per On merge)

- ~Line 369: "`walk Ns` is always last on `produce`, `build`, `move` lines" gains `rally` (the paste grammar in
  `docs/aoe4-build-order.md:406` and `parse-text.ts:284` already allow it on `rally`).
- ~Line 140: "`start: {}` is valid" becomes "`start: {}` is well-formed (not a `syntax` issue; an English
  order still needs `start.rally`)", matching the doc.
- ~Line 31, the `effects.ts` row: add `EffectState` and `ModifierTarget` to the exports (both are exported at
  `effects.ts:79` and `:89`).
- ~Line 198: the `effects-unmodeled` example `shaft-mining` becomes `admiralty`.

**Out of scope:** any code, test or `docs/api/openapi.json` change (its location paragraph already states
the issue rules correctly); M3 behavior text (each M3 ticket updates its own sections, and the audit ticket
checks the whole); the `data/aoe4-build-order/README.md` `shaft-mining-3` note, which is accurate.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `grep -c "shaft-mining" docs/aoe4-build-order.md` is 0 (1 today) and `grep -c "admiralty" docs/aoe4-build-order.md` is 1 (0 today).
- [ ] `grep -c 'parse -->|"syntax issues"| error' docs/aoe4-build-order.md` is 1 (0 today), and the mermaid block still renders (edge syntax matches the existing edges).
- [ ] `grep -c "any other HTTP failure" docs/aoe4-build-order.md` is 1 (0 today), and the doc names the "Please try again." text for a thrown request error.
- [ ] The doc states that a `syntax` issue from parsing a paste line carries `line` only, in both the Issues paragraph and the Route 400 bullet, and the Route bullet lists the pasted `start` (line only) and JSON `start` (neither) cases.
- [ ] The `unitsProduced` bullet states the order: first spawn time, then unit id (matches `simulate.ts` `unitSeries`).
- [ ] The Queues text states that a counted `produce` leaves the instance with no order after its last unit and the default villager order does not resume.
- [ ] The builder-walk bullet states `inputs.walkSeconds` divided by the villager move-speed multiplier for auto-house builders.
- [ ] Each corrected statement was compared with the code cited in Scope; no code, test or `openapi.json` file is in the diff (`git diff --stat origin/main` lists only `docs/aoe4-build-order.md`).
- [ ] After merge, `design/M2.md` has 0 `shaft-mining` (1 today), 1 `admiralty` (0 today), `EffectState` and `ModifierTarget` in the effects.ts row (0 `EffectState` today), `rally` in the "walk Ns is always last" sentence, and no "`start: {}` is valid" (1 today).
- [ ] No INVARIANTS.md regressions

## Open questions

none
