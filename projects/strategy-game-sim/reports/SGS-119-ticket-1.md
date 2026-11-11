# SGS-119 ticket 1 (re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-119-named-build-shapes.md

## Summary

SGS-119, "Add the browser-safe named-build library (ids, secrets, shapes, header parsers)". Component: aoe4-build-order. Size: about 150 business-logic lines. Depends on: none. Risk: standard. On merge: none. The criteria cover the browser-safety of the module, id and secret makers (sample outputs and throw propagation), `editSecretHash` and `sameSecretHash`, the `parseEditSecret` and `parseIfMatchRevision` tables, `storedNamedBuildSchema` and the `NamedBuild` type, the key, path, ETag and cache strings, the single shared base64url encoder, an unchanged `base64UrlSha256`, and invariants.

## Re-spec changes (from spec-gate 1)

- Blocking gap: the id criterion now expects all-`0xff` bytes to give `_____________________w` (21 `_` then `w`). This matches the revised `design/M8.md` C1 row `NAMED_BUILD_ID_BYTES`, which already has the fix. Tagged `(respec 1)`.
- Minor gap: Scope now names `export function base64UrlEncode(bytes: Uint8Array): string` in `saved-builds.ts`. `base64UrlSha256` calls it, and `named-builds.ts` imports it from `./saved-builds`.
- New `(respec 1)` criterion: `base64UrlEncode` is exported, and `git grep "replaceAll('+'" -- lib/aoe4-build-order` matches only `saved-builds.ts`.
  - I ran it against origin/main. Today it matches only `saved-builds.ts`, in the inline conversion in `base64UrlSha256`.
  - It still holds in the end state.
- Appended `## Re-spec 1 - 2026-11-10`.
- No SGS-119 branch exists, so no branch work carries over.
- The spec gate's optional extra null rows for `parseIfMatchRevision` were not added.
- `ticket-lint.py` reports no errors.

## Diagrams

None needed. The change stays in one component and does not touch the core control loop.

## Open questions

None.

## Overlap

None new. Later named-build tickets import this module. `base64UrlEncode` is a name that exists only in this ticket; the design does not need it.
