# SGS-173 ticket report 2 (re-spec)

File: tickets/SGS-173-move-storage-essay-out-of-architecture.md. Lint: clean.

Cause of the bounce: the ticket was written with `Depends on: none` and anchored Storage to `docs/aoe4-build-order.md` after Route. SGS-171 moves Route to `docs/aoe4-build-order-format.md`, so every anchor was wrong once the dependency holds.

Changes:
- Depends on SGS-171. Storage now goes in `docs/aoe4-build-order-format.md`, after Named builds routes and before the Outputs text. The ticket gives the placement reason: the Route sections already hold the store-facing rules.
- The format doc's intro gains a storage mention. The implementer re-reads the base for ARCHITECTURE.md rows and re-runs the reference grep.
- The conditional split bullet is dropped. The file-set criterion is now ARCHITECTURE.md plus `docs/`, plus a README line if the grep finds a stale reference. The route-logic row criterion has a two-sentence bound.
- Header fields and tags are updated and a Re-spec 1 section is added.

No diagrams. Open questions: none. Overlap: none new (SGS-171 is the dependency).
