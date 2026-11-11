# SGS-119: Add the browser-safe named-build library (ids, secrets, shapes, header parsers)

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M8 / M8.1 (server)
- **Priority**: medium
- **Risk**: standard
  <!-- Not low: it adds a public contract (shapes and header grammar the routes, stores and client all
       use) and handles edit secrets, though the design gives every name exactly, so it is not a
       strongModelTriggers item; no criticalPaths symbol changes; about 150 lines. -->
- **Invariants**: A3 (random bytes are injected, never read inside the pure helpers; the only randomness is the default `random` argument of the two id and secret makers, which no simulation calls)
- **LOC estimate**: ~150 (new `lib/aoe4-build-order/named-builds.ts`, plus a small shared base64url encoder; business logic only, tests excluded)
- **Depends on**: none
- **On merge**: none
- **Source**: `design/M8.md` C1 (library table); `plans/M8-20261110.md` outline H

## Context

M8 adds editable named builds next to the immutable `?b=` content links. Every later named-build ticket
(store methods, routes, client, page) imports its ids, edit secrets, stored and public shapes, keys and
header parsers from one module. This ticket writes that module and nothing that uses it. It is imported by
client code, so it must run in a browser.

## Scope

New file `lib/aoe4-build-order/named-builds.ts`, modelled on `lib/aoe4-build-order/saved-builds.ts`
(zod schema, Web Crypto only, no `node:` imports, same header comment style). It exports exactly the C1
library names of `design/M8.md`, with those shapes:

- `NAMED_BUILD_VERSION` (`1`), `NAMED_BUILD_ID_BYTES` (`16`), `NAMED_BUILD_ID_PATTERN` (`/^[A-Za-z0-9_-]{22}$/`), `isNamedBuildId`.
- `EDIT_SECRET_BYTES` (`32`), `EDIT_SECRET_PATTERN` (`/^[A-Za-z0-9_-]{43}$/`).
- `type RandomBytes = (count: number) => Uint8Array`; `newNamedBuildId(random?)` and `newEditSecret(random?)` return the base64url (no padding) of `random(16)` and `random(32)`. The default `random` fills a `Uint8Array` with `crypto.getRandomValues`. A throwing `random` propagates the throw.
- `editSecretHash(secret): Promise<string>` is `base64UrlSha256(secret)` (43 chars), reusing the existing export of `saved-builds.ts`. `sameSecretHash(a, b): boolean` compares in constant time over equal-length strings (no early exit on the first differing character) and returns `false` when lengths differ.
- `storedNamedBuildSchema` is `savedBuildSchema.extend({ revision: z.number().int().min(1), createdAt: z.string().datetime(), updatedAt: z.string().datetime(), secretHash: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })`; `type StoredNamedBuild` is its `z.infer`; `type NamedBuild` is `Omit<StoredNamedBuild, 'secretHash'> & { id: string }`; `interface CreateNamedBuildResponse` and `interface UpdateNamedBuildResponse` have the exact fields in the design.
- `namedBuildKey(env, id)` (`<env>/named-builds/<id>.json`), `namedBuildPath(id)` (`/apps/aoe4-build-order?n=<id>`), `parseEditSecret(authorization)`, `parseIfMatchRevision(ifMatch)`, `revisionEtag(revision)`, `NAMED_BUILD_CACHE_CONTROL` (`'no-store'`), with the grammars in `design/M8.md` C1 (`Bearer ` plus exactly one space and a 43-char secret; a strong ETag `"<n>"` with `n` in `[1, Number.MAX_SAFE_INTEGER]` and no leading zero).

The bytes-to-base64url conversion (no padding) that `base64UrlSha256` in `saved-builds.ts` does inline becomes
`export function base64UrlEncode(bytes: Uint8Array): string` in `saved-builds.ts`. `base64UrlSha256` calls it on
the digest, and `named-builds.ts` imports it from `./saved-builds` for `newNamedBuildId` and `newEditSecret`, so
jscpd (threshold 0) sees no copy. That edit changes no output of `base64UrlSha256`; the existing `savedBuildId`
and rate-limit tests must pass unchanged.

Do not add `named-builds.ts` to any barrel or import it from routes, stores or components: later tickets do.

**Out of scope:** routes, store methods, the client, OpenAPI, ARCHITECTURE.md (the routes ticket documents the module with the routes), the `500` handling of a throwing `random` (the routes ticket maps it), any edit to `savedBuildSchema`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `lib/aoe4-build-order/named-builds.ts` has no `node:` import and no `Buffer` use (a grep for both finds nothing in the file), and the module is importable from a component file under `tsc --noEmit`.
- [ ] (respec 1) `named-builds.test.ts` (new) pins the id: `newNamedBuildId` with an all-zero `random` returns 22 `A` characters; with all `0xff` bytes it returns `_____________________w` (21 `_` then `w`: the 2 leftover bits pad to `110000`; an encoder that padded or truncated the last group must fail); `isNamedBuildId` accepts both and rejects a 21-char, a 23-char and a non-string value, and rejects an 11-char `savedBuildId` (the two id classes must never overlap).
- [ ] The same file pins `newEditSecret` with an all-zero `random` (43 `A` characters, matching `EDIT_SECRET_PATTERN`) and that a `random` that throws makes both makers throw (a swallowed error would hand out a predictable id).
- [ ] `editSecretHash` test: a fixed secret gives the 43-char value of an independently computed SHA-256 (the test derives the expected value with `node:crypto` in the test file only, or a literal); two different secrets give different hashes. `sameSecretHash`: equal strings `true`; same length with one character different `false` (a comparison that checked only the first or last character must fail); different lengths `false`; empty strings `true`.
- [ ] `parseEditSecret` table test: `Bearer ` plus a valid 43-char secret returns the secret; each of `undefined`, `''`, `bearer <secret>`, `Bearer  <secret>` (two spaces), `Bearer <secret> ` (trailing space), `Basic <secret>`, and a `Bearer` token of 42 or 44 chars returns `null`.
- [ ] `parseIfMatchRevision` table test: `"1"` gives `1`; `"9007199254740991"` gives `9007199254740991`; each of `undefined`, `W/"1"`, `*`, `"0"`, `"01"`, `1` (unquoted), `"1", "2"`, `"9007199254740992"`, `"-1"`, `""` gives `null`. A parser that accepted a weak ETag or a value above `Number.MAX_SAFE_INTEGER` must fail one row.
- [ ] `storedNamedBuildSchema` test: a sample stored object (the `design/M8.md` example shape) parses; each of a missing `secretHash`, a 42-char `secretHash`, `revision: 0`, `revision: 1.5`, a non-ISO `createdAt` and `version: 2` is rejected. `NamedBuild` is checked at the type level: a `tsc --noEmit` assignment of a `NamedBuild` to a type with a `secretHash` field fails (a `// @ts-expect-error` line in the test file).
- [ ] `namedBuildKey('preview', id)`, `namedBuildPath(id)`, `revisionEtag(3)` and `NAMED_BUILD_CACHE_CONTROL` return the exact strings of the design (`preview/named-builds/<id>.json`, `/apps/aoe4-build-order?n=<id>`, `"3"` with quotes, `no-store`).
- [ ] (respec 1) `saved-builds.ts` exports `base64UrlEncode`, both `base64UrlSha256` and `named-builds.ts` call it, and the btoa/`replaceAll` base64url conversion appears only inside `base64UrlEncode` (a `git grep "replaceAll('+'" -- lib/aoe4-build-order` matches only `saved-builds.ts`).
- [ ] `base64UrlSha256` output is unchanged: the existing `savedBuildId` and rate-limit tests pass without edits, and `npm run lint:dup` and `npx tsc --noEmit` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-10

- Underspecified: the all-`0xff` id sample was wrong (22 `_`; 16 bytes encode to 21 `_` then `w`), and the shared base64url encoder had no name or home.
- Changed: the id criterion now expects `_____________________w`, matching the revised `design/M8.md` C1; Scope names `base64UrlEncode(bytes: Uint8Array): string` exported from `saved-builds.ts` and imported by `named-builds.ts`, with a new criterion that the conversion lives only there.
- No branch work exists yet; nothing to carry over.

## Rework 1 - 2026-11-10 (review)

Review bounced at tip f2b60d55d28e753a078bbb6741531ad305c8bfbb (report: reports/SGS-119-review-1.md). Only gate so far.

Findings:
- `lib/aoe4-build-order/named-builds.test.ts:104`: the "different lengths" row for `sameSecretHash` passes the longer string first (`'abcdef', 'abcde'`). Deleting the length guard at `named-builds.ts:38` leaves all 51 tests passing, so the test cannot catch a missing guard.

Required fixes:
- [ ] Add the row `['the first is a prefix of the second', 'abcde', 'abcdef', false]` to the `sameSecretHash` table and keep the existing row. Confirm by deleting the length guard that the new row fails, then restore it.
