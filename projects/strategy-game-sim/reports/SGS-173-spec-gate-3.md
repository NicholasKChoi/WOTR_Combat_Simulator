# SGS-173 spec gate 3

**Verdict: READY**

Judged against the SGS-171 tip `124dc82` (branch `sgs-171-split-aoe4-build-order-doc`).

## Gate 2 gap: closed

- The "Local saved builds" row (ARCHITECTURE.md line 27 at the tip) states the file store's environment selection today. Scope now trims it to the placement fact and links the Storage section, which is option (a) from gate 2. The matching criterion was added.
- The "no two places that can drift" criterion now holds in the end state Scope requires.
- Both gate 2 notes are taken up. The route-logic row is bounded at "at most four sentences in total". The "a refused save writes nothing" rule has its own criterion. `save-rate-limit.ts` does have a `refused` update outcome.

## Re-checked at the tip

- The `## Route`, `### Builds routes`, `#### Named builds routes` and `## Outputs` headings exist (lines 216, 244, 265, 290), so the Storage placement is unambiguous.
- Rows 25 to 27 of ARCHITECTURE.md are as the ticket describes.
- No doc or code comment cites the "saved-build storage" row by name.
- Docs only, so Risk, Invariants, Unverified assumptions, On merge and Diagrams stand.
- No criterion pins a count or line number.

## Notes (non-blocking)

- The route-logic row holds several facts: the `RouteReply` body-type rule, the one cap on reported issues, the 405 and not-an-object answers, and the `errorReply`, `storageUnavailable` and `idFailure` helpers. The criterion allows each to be kept in the row or found in the design docs. The implementer should check the Route sections for the 405 and not-an-object answers and the issue cap, and move them only if missing, as Scope says.
