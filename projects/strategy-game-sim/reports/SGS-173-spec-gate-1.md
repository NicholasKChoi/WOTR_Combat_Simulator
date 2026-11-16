# SGS-173 spec gate 1

**Verdict: NEEDS_SPEC**

## Gaps

1. **Dependencies / Scope / criteria** - The ticket's header says `Depends on: none`, but TASK-GRAPH.md lists SGS-173 as depending on SGS-171, and the launch prompt says the same. SGS-171 (draft, not merged) moves "Route" (with "Builds routes" and "Named builds routes") out of `docs/aoe4-build-order.md` into the new `docs/aoe4-build-order-format.md`. Once the dependency holds, every anchor in Scope and the criteria is wrong at the base the implementer builds on: the "add `## Storage` directly after Route in `docs/aoe4-build-order.md`" instruction, the Scope bullet that links the Route bullets to the new section, and the "only docs change" criterion that names `docs/aoe4-build-order.md`. The Sibling-ticket overlap bullet only covers the case where the split lands first as a different backlog item, and it is written as a conditional. An implementer must guess which file holds Storage and which one's intro and links to update. Proposed fix:
   - Set the header to `Depends on: SGS-171`.
   - Rewrite Scope and the criteria to name `docs/aoe4-build-order-format.md` as the Storage home: after the Named builds routes subsection and before the Outputs text.
   - Drop the conditional bullet.
   - Add that the format doc's intro (which SGS-171 requires to state the doc's job) gains a mention of storage behavior, so the intro stays true.
   - Say the implementer re-reads the base for ARCHITECTURE.md row text, because SGS-171 also edits ARCHITECTURE.md ("App design doc" row, Rules), and re-runs the reference grep against the three docs.
   - Replace the criterion "no file outside ... `docs/aoe4-build-order.md`" with "only `ARCHITECTURE.md` and files under `docs/`, plus a README line if the grep finds a stale reference".
2. **Placement decision (non-owner, minor)** - SGS-171 assigns Route to the format doc, and Storage is not in its section assignment. Putting store behavior in a "format" doc is defensible because the Route sections already state the 503/VERCEL rules, but the ticket should say so. Otherwise a reviewer may ask for the model doc. Fold it into the fix for gap 1.

## Checks that passed

- Grounded scope: `build-store.ts`, `blob-build-store.ts` and `save-rate-limit.ts` exist at `origin/main`. `BLOB_SDK_RETRIES = 1`, the `VERCEL_BLOB_RETRIES` default, the `accept-encoding: identity` fresh read, the `contended` outcome and the `test:blob-live` script all exist. The storage row and the route-logic row sit at ARCHITECTURE.md lines 25 and 26.
- No other ARCHITECTURE.md, README or code reference to the "saved-build storage" row was found. No code comment points at ARCHITECTURE.md.
- The claim that the Route sections state only the 503 and `buildStoreFromEnv` pointer matches the base.
- Invariants none, Risk low (docs only), On merge `none`, Unverified assumptions `none`, and the diagram and Open questions fields are fine.
- Criteria are mostly observable. The row-trimming ones ("one line", "short roles") are checkable by a reviewer.
- No throwaway overlap with SGS-174 (does not edit ARCHITECTURE.md) or SGS-172 (README only, does not copy the essay). SGS-171's ARCHITECTURE.md edits touch other rows.

## Notes

- Criterion 37 ("cut to files and short roles") has no size bound. Consider "each row is at most two sentences", but this is not blocking.
- The ticket's "about 30 lines" and "over a few lines" are context wording, not criteria, so they are fine.
