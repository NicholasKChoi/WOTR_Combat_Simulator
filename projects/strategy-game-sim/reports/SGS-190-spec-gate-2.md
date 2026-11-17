# SGS-190 spec gate 2

**Verdict: NEEDS_SPEC** (one doc gap; the two gaps from gate 1 are closed)

## Gaps

1. **Docs / `docs/aoe4-build-order-format.md` wait-reasons section goes untrue and is not in Scope** (check 11).
   - Missing: the busy-building wait is reported as `prerequisite` and reserves its cost, and the busy check runs after the resources check. At origin/main (87f0cd7) the format doc says otherwise:
     - line ~467, the `prerequisite` row of the `waitingOn` table: lists only "no targeted instance exists / unit above age" for `produce` and "no producing instance / every tier above age" for `research`. A busy target is now a `prerequisite` cause too.
     - line ~470, the `resources` row: "this is the only reason that reserves". A step waiting for a busy building now reserves too.
     - line ~472: "The order is `prerequisite`, then `villagers` or `population`, then `resources`." For `produce` and `research` the busy part of `prerequisite` is checked after `resources` (check 5 / B-B7 check 4), so a single fixed order no longer holds.
   - Why an implementer would guess: Scope's Docs section covers only `docs/aoe4-build-order.md` and the README. SGS-200 (docs) only "checks, does not rewrite" sentences the busy-building ticket already edited, so nobody owns these three statements and they ship false.
   - Proposed fix: add to Scope Docs: update those three statements in `docs/aoe4-build-order-format.md` (the busy wait is a `prerequisite` cause; a step waiting for a busy building also reserves; the busy check comes after the resources check). Add a criterion: a search over `docs/aoe4-build-order-format.md` for `only reason that reserves` finds nothing, and the `prerequisite` row names a busy building. Wording stays the implementer's. Remove the overlap in SGS-200's "check" line if desired.

## Checked and fine

- Gate 1 fixes: the two reserve sentences, the README "Nothing is omitted." line, and the re-pinned tier test are now in Scope and criteria. Verified against origin/main: all search strings (`While it waits on resources`, `short of resources alone`, `Queue length is not consulted`, `replaces its order (a switch)`) match once at base, the README entry at lines 92 to 94 has both untrue sentences, and the four research steps exist in the Spear/Longbow build.
- Grounding: all 22 re-baseline test names exist at the base; `startingWith` and `tierCountAt` are local to `research.test.ts` and not in `test-helpers.ts`; `researchTarget` comment at `research.ts:9` says queue length is not consulted; `engine-common.ts` type-imports `EngineState` from `simulate.ts` today, consistent with C7c; "exports exactly the seam names" test exists.
- Contracts: C7, C7c, C7d, C7e and B-B1..B-B13 in design/M11.md match the ticket; the sample values come from the design. Criteria are behavior or rule based; the tier test derives times from `completedAt`, not a window.
- Risk high is right (`offerSteps` is a criticalPaths symbol, order of operations changes). Diagram present. Open questions none. On merge is a single well-formed item. Unverified assumptions none is fine (no external service). No overlap with other open tickets (SGS-192 extends these handlers after this one).

## Notes

- SGS-189 (`tickets/SGS-189-reorder-knight-longbow-council-hall-builds.md`) still pins the "holds 20 tier-2 longbowmen" completion to (840, 845] in its Scope and criteria, which gate 1 of SGS-189 or its in-flight re-spec is expected to change. SGS-190 handles either outcome (it re-pins by rule and says it does not assume the window), so this is not a gap here, but confirm SGS-189's re-spec lands before SGS-190 starts.
- The SGS-190 design text (M11.5a row) still says the completion "now completes at 841.2 s, still in (840, 845]"; the ticket correctly calls its own measurement non-binding.
