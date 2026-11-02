# SGS-042 review 2 (delta, rework 1)

Verdict: **APPROVE**

Branch `sgs-042-aoe4-step-wait-step-stuck`, tip 9f310651a5c00227d244e86f593bc8ef9d968736 (not yet on origin; reviewed from the local ref in a detached worktree). Delta reviewed: `git diff e25e383..9f31065` (2 files, +8/-11). Base origin/main 1d5f5c9. Round 1 (`SGS-042-review-1.md`) covered the full branch at e25e383.

## Blocking findings

None.

## Rework items

- (rework 1) `docs/aoe4-build-order.md:637-638`: `Waiting --> Started` and `Armed --> Started` now read "every check passes (startedAt)". Only those two labels changed. Fixed.
  - Consistent with the diagram's own `Armed --> Waiting: a check fails (prerequisite, villagers, population or resources)`, with the reasons table and the check-order sentence under it (doc lines 650-665), and with the code: `runInstant` starts a step only when the handler returns `started: true` (`simulate.ts:421-429`). Otherwise it records `waitingOn` and returns.
  - The other mermaid diagram (doc:528, request flow) does not cover step start. The status table (doc:642-647) is unchanged and still right.
- (rework 1, optional) No-handler test (`simulate.test.ts:498-516`): uses `withHandler('research', undefined as never, ...)` and now asserts `warnings` contains `step-stuck`. Fixed.
  - `withHandler` (`test-helpers.ts:72-85`) sets the key to `undefined` rather than deleting it. `simulate.ts:421` reads `stepHandlers[step.action]`, so the fallback path is the same either way.
  - The test's trailing `steps[1].status === 'completed'` assertion confirms the handler was restored.
- (rework 1, optional) The stuck determinism test now also compares `waitBreakdown` across two runs (`simulate.test.ts:840`). Fixed. The comparison cannot catch nondeterminism inside a single process, but it costs nothing and the criterion asks for it.

## Mutation checks (each restored with `git checkout`; tree clean afterwards)

| mutation in `simulate.ts` | result |
|---|---|
| no-handler fallback returns `{ started: true }` (line 422) | 'leaves an action with no registered handler waiting and blocking' fails |
| fallback reason `'resources'` instead of `'prerequisite'` | 'reports prerequisite for an unregistered action' fails (that test pins the reason, not the no-handler seam test) |
| no `step-stuck` emitted (line 849 filter `&& false`) | the no-handler test fails on the new assertion |
| `step-stuck` suppressed only for the `research` action | the no-handler test fails |

The new assertion fails when the code is wrong.

## Gates (Node 24.22.2, fresh `npm ci` in the review worktree)

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `npm test`: 36 files, 872 tests, all pass.

## Acceptance criteria

I verified all criteria in round 1 at e25e383 (see `SGS-042-review-1.md`). The delta touches only one doc label pair and two tests, so none of those verdicts change. The rework strengthens two of them:
- the no-handler `step-stuck` part of the step-stuck criterion;
- the Determinism criterion (`waitBreakdown` and `warnings`).

All criteria and both rework fix items are ticked in the ticket.

## Invariants

The delta has no production code change, so no invariant is touched. The round 1 conclusions stand.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty in REPO.md, so there was no bot to run.

## Non-blocking notes

- Out of scope, pre-existing on main: `docs/aoe4-build-order.md:147` (Ordering and triggers) still says "Once armed, it waits until it is affordable and supply allows it, then starts."
  - This understates the waits. A `build` also waits on builders, steps above the current age wait, and steps wait on missing instances.
  - The sentence is identical on main (1d5f5c9:147), and neither this branch nor the ticket touches it. The detailed paragraph and table at lines 650-665 are correct.
  - Suggested follow-up: reword it to "waits until every check passes (see the reasons table below), then starts", or have a later docs ticket pick it up. A human reviewer could notice it next to the new diagram labels.
- Hygiene: the commit message and diff contain no ticket ids or factory pointers.

## Coverage

- Reviewed: the full delta in `docs/aoe4-build-order.md` and `lib/aoe4-build-order/simulate.test.ts`.
- Also read for consistency: `simulate.ts:415-430,755-790,849`, `test-helpers.ts:withHandler`, and doc lines 140-152, 520-545, 625-672.
- REPO.md has no `## Review checklist` section, so there were no extra repo review steps.
- Acceptance (Playwright) was not rerun: the delta has no route or schema change, and round 1 covered it.
