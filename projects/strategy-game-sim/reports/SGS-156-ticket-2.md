# SGS-156 re-spec 1 report

File: $PROJECT_DIR/tickets/SGS-156-aoe4-auto-houses-plan-ahead-for-wood.md

Q88 answer B folded in: the house cost stays held while the house is due and affordable but builders are unavailable.

- Scope 2: added the keep-holding rule. The house starts when builders free up, and holding may stall steps and orders.
- Scope 3 and the ordering criterion: now say "with builders available".
- Scope 4: renamed "No deadlock on resources". The "no reserve while income of a short resource is 0" rule is kept, because that house is not due. The text says it does not conflict with the builder hold, since the cost is banked and builders return.
- New criterion (respec 1): the hold is not released for lack of builders, and the house starts when builders become available.
- Open questions: now "none".
- Added `## Re-spec 1 - 2026-11-13`.
- Risk stays high.
- Lint passes.
