# SGS-151 ticket report 2 (re-spec)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-151-shared-blob-test-fake.md

- Depends on: SGS-142. Its branch tip (sgs-142-replace-named-missing-key-conflict) edits describe('replaceNamed') with per-test mockResolvedValue and head-based cases; it does not touch counterBlob. Scope describes that end state and says to leave those rows alone.
- Etag form: each write yields a quoted strong etag `"e<n>"` and the weak-read mode returns it prefixed `W/`. Seeding takes an explicit etag. A new criterion pins the form in the shared fake's own test. named-build-store.acceptance.test.ts only generates `etag-N` and never asserts it, so changing it is safe.
- Non-blocking notes folded in:
  - `get`/`put` stay single-await so the parallel-bump event order holds, with a criterion for it.
  - The module is named `*test-helpers.ts` so it falls under the stricter `.jscpd.tests.json` pattern.
- Lint: ticket-lint.py printed no errors. No diagrams (single component, test-only).
- Open questions: none. Overlap: only SGS-142, via the shared test file.
