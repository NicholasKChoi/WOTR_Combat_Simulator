# SGS-152: Fix two inexact doc statements (pinned line colour, @vercel/blob importers)

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 0 (two doc sentences; no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md); intake reports/SGS-152-intake.md

## Context

Two doc sentences are inexact. Both still exist at `origin/main` (the line has moved: it is now in the pinned-run section of `docs/aoe4-build-order.md`, not near line 971).

1. `docs/aoe4-build-order.md` says the pinned run's series are drawn dashed "in the same color as the current series with that key". `pinnedColor` in `components/apps/aoe4-build-order/chart-rows.ts` gives that colour only when a current series has the key; a pinned-only series (no current series with that key) takes a palette colour by `series.length + pinnedIndex`.
2. `ARCHITECTURE.md`, the AoE4 saved-build storage row, says `blob-build-store.ts` is "the only file that imports `@vercel/blob`". Test files import it too: `blob-build-store.test.ts`, `blob-build-store.live.test.ts`, `blob-lost-writes.acceptance.test.ts`, `named-build-store.acceptance.test.ts` under `lib/aoe4-build-order/`. The intended claim is that it is the only non-test source file that imports it.

## Scope

Chore: changes no behavior the owner sees; documentation wording only.

- `docs/aoe4-build-order.md`, pinned-run chart paragraph (the sentence starting "With a pinned run, each chart also draws the pinned run's series dashed"): make the colour statement cover both cases, a series whose key also exists in the current run and a pinned-only series. The implementer words it against `pinnedColor`.
- `ARCHITECTURE.md`, AoE4 saved-build storage row: restrict the "only file" claim to non-test source (tests and the live and acceptance harnesses also import the package).
- Grep the other docs (README, `docs/`, ARCHITECTURE.md) for the same two claims stated elsewhere, and fix any found. No code, test, or comment in `.ts`/`.tsx` changes.

**Out of scope:** any code change, including `pinnedColor` and the import structure; other doc wording.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The pinned-colour sentence in `docs/aoe4-build-order.md` states what colour a pinned series has both when the current run has a series with that key and when it does not, consistent with `pinnedColor`.
- [ ] The `ARCHITECTURE.md` storage row no longer claims `blob-build-store.ts` is the only file importing `@vercel/blob` without limiting it to non-test source.
- [ ] No other doc under `docs/`, `ARCHITECTURE.md` or README states either inexact claim.
- [ ] Only documentation files change; pre-existing tests keep their assertions.
- [ ] No INVARIANTS.md regressions

## Open questions

none
