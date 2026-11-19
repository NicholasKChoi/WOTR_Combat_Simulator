# SGS-212 implementer report 7 (Rework 1)

Ticket SGS-212, branch sgs-212-rename-ui-saved-builds, tip e5f987df51ee5a1f400a14a701fec7829cc0502d (was 125c2f4), checkout /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-212-rename-ui-saved-builds. Status: needs_review.

Own-commit check: skipped (no origin/<branch> ref); checkout.sh reused the checkout, tip unchanged.

## Files touched
- components/apps/aoe4-build-order/save-build.tsx: Rename button gets `aria-busy={busy ? 'true' : undefined}`.
- components/apps/aoe4-build-order/save-build.test.ts: `Panel` takes an optional `conversion`; an `unconvertible` conversion (the acceptance spec's text) is asserted `ok === false`; the "text does not convert" row uses it; "marks all three buttons busy" now also checks `rename-build`.
- acceptance/aoe4-rename-build.spec.ts: unconvertible check waits for `auto-run-status` `data-status="invalid"` first; the late-answer test asserts Rename is disabled while the PATCH is held.
- Ticket: Required-fixes boxes ticked.

## Tests
- save-build.test.ts: 38 passed. Full `npm test`: 3017 passed, 15 skipped.
- acceptance/aoe4-rename-build.spec.ts, run after `acceptanceSetup`: `npx playwright test acceptance/aoe4-rename-build.spec.ts` gave 29 passed.

## Mutation checks (all undone)
- save-build.tsx:113, `canRename = showVersion && conversion.ok && ...`: failed "when the text does not convert, Rename enabled is true".
- save-build.tsx Rename button, aria-busy removed: failed "marks all three buttons busy while a saved build loads".
- save-build.tsx:113, `!saving &&` removed from `canRename`: acceptance "answered after the input changed ..." failed on `expect(renameButton).toBeDisabled()` at spec line 264.
- The added `data-status="invalid"` wait is a synchronization step, not an assertion; no break applies.

## Clean
tsc and lint:dup pass (0 clones), `next build` passes. No codegen. No docs changed. No pre-existing test assertions edited, only the row fixed per the checklist.

Doc claims, pinned outputs, unverified assumptions, out-of-scope findings: none.
