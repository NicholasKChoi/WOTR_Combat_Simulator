# SGS-162 review 1

Verdict: APPROVE. Tip 06eb4218d3bdb4280ac11075d3bee55161ccdee0, base origin/main.

## Blocking findings
None.

## Acceptance criteria
1. Storage writes fail, My builds key event leaves the list unchanged: pass. `pages/apps/aoe4-build-order.tsx` `reread` now returns when `!myBuildsAvailable(storage)`. The test 'another tab storing builds does not make this tab list them' (`storage unavailable`) waits for the key event to arrive, then asserts 0 My builds options. The implementer's mutation check (gate dropped) made it fail with 2 received. A null-key event is not tested separately. It shares the same code path, so this is acceptable.
2. An unrelated key causes no storage write: pass. The key filter is the first line of `reread`, before `browserStorage()` and the probe. The test wraps `setItem` and `removeItem`, clears the record, waits until the unrelated-key event arrives, and asserts `[]`. The precondition holds: the My builds list is shown and the writes record is reset. Moving the probe first would add a `setItem` and fail it (mutation recorded).
3. Usable storage keeps its behavior: pass. The key filter and `withRereadMyBuilds` are unchanged, and no pre-existing assertion was edited (diff is additions only in the spec).
4. Invariants: none listed for this ticket; none touched.

## Chore check
No owner-visible change on a page with working storage. No existing assertion changed.

## Doc claim
`docs/aoe4-build-order.md` now reads "While the browser can store the list, a save in another tab, or another tab clearing the storage, updates this tab's My builds." This matches the `myBuildsAvailable` gate in `reread`.

## Lint
`npx tsc --noEmit && npm run lint:dup`: clean (0 clones). I ran no acceptance or build.

## Review bot
None configured (`reviewBot.cli` empty).

## Conventions
The new helpers `watchStorageKeys` and `seenStorageKeys` sit next to the existing `seedMyBuilds` helpers. Tests use the existing `blockStorageWrites`, `openPage` and `groupOptions`. Only two tests were added, so no table is needed.

## Non-blocking notes
- `toHaveCount(0)` in the unavailable test passes on its first poll if React has not yet rendered. The preceding `expect.poll` for the event key makes this unlikely, and the mutation check showed it fails when the gate is removed.
- UI inspection not run: the diff changes no markup or styles.

## Coverage
Reviewed: `pages/apps/aoe4-build-order.tsx`, `acceptance/aoe4-my-builds.spec.ts`, `docs/aoe4-build-order.md`, `my-builds-storage.ts` (`myBuildsAvailable`), and `blockStorageWrites` in `acceptance/helpers.ts`. I did not run the acceptance tests, and I rely on the implementer's mutation records for them.
