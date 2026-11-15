# SGS-162: Check My builds availability before the storage listener rereads

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 5 (the `reread` listener in `pages/apps/aoe4-build-order.tsx`, business logic only)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md standalone chore "`reread` ... does not check `myBuildsAvailable(storage)`", found by the SGS-147 implementer (`reports/SGS-147-implementer-1.md`, Out-of-scope findings)

## Context

The page's mount effect that loads My builds returns early unless `myBuildsAvailable(storage)` holds, so a browser whose storage cannot be written never lists stored builds. The `reread` listener for `storage` events in the same page checks only `storage === null` and then calls `readMyBuilds`, so it can list stored builds on a page where My builds is treated as unavailable. This makes the two paths use one availability rule.

## Scope

- `pages/apps/aoe4-build-order.tsx`, the `useEffect` that registers `reread` on `window` `storage` events: apply the same availability rule the mount effect uses (`browserStorage()` null or `myBuildsAvailable(storage)` false means return without reading or updating `entries` or `secrets`). Keep the key filter (an unrelated key is ignored, a null key still rereads) and the existing `withRereadMyBuilds` behavior unchanged.
- Order inside `reread`: the key filter returns first, before `myBuildsAvailable` is called. `myBuildsAvailable` (`components/apps/aoe4-build-order/my-builds-storage.ts`) writes and removes a probe key, and each write fires a `storage` event in every other open tab. Probing before the key filter would let one tab's probe wake another tab's listener, which probes and wakes the first, without end. With the filter first, an event for any key other than the My builds key or null (the probe key included) returns without touching storage, so a probe never triggers another probe.
- This changes no behavior the owner sees on a page where storage works; the only difference is on a page where `myBuildsAvailable` is false, where a storage event no longer populates My builds, matching what the mount effect already does. `docs/aoe4-build-order.md` (Named builds, the sentence that a save in another tab or a storage clear updates this tab's My builds) stays true for pages with usable storage; the implementer checks whether it needs to say that only applies when My builds is available, and edits it only if it reads as untrue.
- Tests: a test of the new rule per the existing acceptance coverage of storage events in `acceptance/aoe4-my-builds.spec.ts` (the two-tab case and the `storage unavailable` describe, with `blockStorageWrites` from `acceptance/helpers.ts`), or a unit test if the listener can be exercised without the page. Existing tests keep their assertions.

**Out of scope:** the mount-time load effect, `readMyBuilds`, `myBuildsAvailable`, `withRereadMyBuilds`, `recordCreated`, and any change to the My builds storage format.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] On a page where storage writes fail, a `storage` event for the My builds key (or a null key) leaves the My builds list unchanged (no My builds group appears when builds were stored from another tab); a test fails if the listener reads and applies stored builds there. (respec 1)
- [ ] A `storage` event for a key other than the My builds key or null causes no storage write in the receiving tab; a test fails if the listener runs the availability probe (or any other write) before the key filter returns. (respec 1)
- [ ] On a page where `myBuildsAvailable` is true, a storage event for the My builds key and a null-key event still update My builds, and an event for an unrelated key still leaves them unchanged (pre-existing tests keep their assertions).
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-15

- Underspecified: the ticket kept the key filter but never said it runs before the `myBuildsAvailable` probe, whose write fires `storage` events in other tabs and could loop between tabs; criterion 1 also named secrets, which the page does not show.
- Changed: Scope fixes the order (key filter first, then the probe); a new criterion requires that an unrelated-key event causes no storage write; criterion 1 now observes only the My builds list, which stands for entries and secrets both.
- No branch work exists yet; nothing to keep or discard.
