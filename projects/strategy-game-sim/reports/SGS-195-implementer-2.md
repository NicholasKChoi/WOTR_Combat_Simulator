# SGS-195 implementer report 2 (Rework 1)

- Ticket: SGS-195. Branch sgs-195-marker-control, tip d570df77d7121a800bf2c5045604480018f7d837 (on b0c4d35).
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-195-marker-control (reused as is; no checkout.sh call, so no own-commit check needed).

## Files touched
- acceptance/aoe4-marker-labels.spec.ts: in the "hidden kinds survive ..." test, the new-run step now sets duration 1500 (the template already had 1200), reads the run response, asserts the hidden kind is still in it, then asserts `aria-pressed="false"` and `expectLines(next.markers.length - nextOfKind)`. Required-fixes box ticked (verbatim fix applied). Production code unchanged.

## Tests
- `npx playwright test acceptance/aoe4-marker-labels.spec.ts`: 9 passed (this ticket rewrote the acceptance harness spec, so the implementer ran it once).

## Mutation check
- Break: in results.tsx, reset `hiddenKinds` to an empty set whenever `result` changes. The survival test failed at spec line 238: `aria-pressed` expected "false", received "true" (blacksmith). Restored from backup; git status showed only the spec modified.

## Lint / build
- `npx tsc --noEmit` and `npm run lint:dup` passed (no issues). Full build not rerun: only a spec file changed.

## Doc claims
None added.

## Invariants
Upheld; no production change.

## Unverified assumptions / Out-of-scope findings
None.

## Status
needs_review
