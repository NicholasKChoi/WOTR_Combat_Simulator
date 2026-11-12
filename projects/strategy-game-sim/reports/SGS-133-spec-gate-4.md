# SGS-133 spec gate 4

Verdict: READY

Read at origin/main (SGS-132 is integrated there as #141) and the branch tip 1027dec. No tests were run (browser-based).

## Round-3 gaps: closed

- The capped state is now the design's (b) list. I checked it against `save-build.tsx` at the base. After `saveCopy` with failing storage, `saved-build-link` and `my-builds-unavailable` show. `copy-saved-link` with a rejecting `writeText` sets `copy` to `failed`, which shows `copy-saved-link-hint`. `openForm` only sets `form`, so `saved` and `unstored` stay and the form reopens. DOM order is save-row, form, hint, unavailable, error. `my-builds-unavailable` is the last child when no save error shows.
- Overflow is expected to hold. The implementer measured `scrollHeight` 339 against `clientHeight` 287 at 1280x720 with the optional name error included. That error is about one line high, so without it the content should still exceed the cap. The precondition asserts it, so a miss fails loudly.
- `auto-run-status` criterion removed, as is right: `autoRunStatusMessage('current', ...)` is empty.
- Case (a) tolerance matches the implementer's measured 0.797px bar top.
- `build-order-select` is the first control in `build-input.tsx`, and the max `scrollTop` is about 52px, so its top is above the bar's top before focus.
- The mutation criterion (`40dvh` to `none`) can fail: the precondition's overflow assertion fails on an uncapped bar. The implementer's earlier run showed this.
- Helpers `saveCopy`, `submitCopy`, `blockStorageWrites` and the refused-clipboard scripts are already in `acceptance/helpers.ts` on the branch.
- Docs, risk (standard), Invariants (none), On merge (none), Depends-on and size are unchanged and fine. Open questions: none. The ticket agrees with M9.12 in `design/M9.md` (revised 2026-11-12).

## Notes (non-blocking)

- Case (c)'s "focus scrolls the control into view" assumption is listed under Unverified assumptions, and criterion 6 checks it.
- `aoe4-my-builds-unreadable.spec.ts` keeps its own local `saveCopy` (line 64 at base). Scope names only the split-scroll and my-builds specs for the clone check, so this is outside the ticket. Run `lint:dup` to confirm.
- The ticket's criterion 3 expects the mutation to fail "including the case (c) content check". With `none`, the precondition fails first, so the (c) check is never reached. This is harmless, but the report can state the failing assertion.
