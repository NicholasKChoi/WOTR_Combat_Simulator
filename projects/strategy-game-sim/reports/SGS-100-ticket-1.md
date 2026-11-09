# SGS-100 ticket author report 1

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-100-auto-run-controller.md`

Summary: Add the framework-free auto-run controller (`components/apps/aoe4-build-order/auto-run.ts`) and the browser simulate client (`simulate-client.ts`), with Vitest fake-timer and stubbed-fetch tests (OD-7 (a)). Component aoe4-build-order, ~220 logic lines, risk high, depends on none, criteria M6.1. The page is not wired. Behavior-preserving page edit: `postSimulation` moves out of `pages/apps/aoe4-build-order.tsx` (no signal at its two call sites), and `errorMessages` and the catch use `simulationFailureMessage` and `readRejection` so the strings exist once. No acceptance spec changes. Dropped: the Strict Mode pin-restore abort.

Diagram: a Mermaid state diagram of the controller (loading, fire rules 1 to 5, running, updating, current, invalid, rejected, failed, dispose).

Open questions: none.

Details the design table left open, fixed in Scope as rules (the manager may want the designer to confirm):
- An abort (rule 1, rule 3, newer rule 5, dispose) also makes that request's response stale, so it is dropped even if a stubbed `post` ignores the signal. Dropping is by request identity, not by AbortError.
- A 2xx body that cannot be read as JSON is `failed` with the network message (matches today's page `catch`).
- `durationError` wording is fixed in the ticket: `Duration is required.` and `Duration must be a whole number of seconds from ${min} to ${max}.` with the bounds from `SIM_INPUT_BOUNDS.durationSeconds`.
- `AutoRunDeps.post` takes a `SimulateRequest`, while C6 `postSimulation` takes `(buildOrder, durationSeconds, signal)`. The hook ticket (E) must adapt one to the other; noted as out of scope here.

Shared symbols defined (exact names):
- `simulate-client.ts`: `postSimulation`, `readRejection`, `simulationFailureMessage`
- `auto-run.ts`: `AUTO_RUN_DEBOUNCE_MS`, `AutoRunStatus`, `LiveInput`, `ShownInput`, `AutoRunDeps`, `AutoRunState`, `AutoRunController`, `createAutoRunController`, `durationError`, `requestKey`

Overlap with existing tickets: none found. SGS-100 is the first M6 ticket; tickets E and later depend on these names. Criteria with commands (`git grep` for react/next/window/document imports, `function postSimulation`, `fetch(` in the page) were checked against main at 1e6d6c2; they match Scope's end state. The worktree was removed.
