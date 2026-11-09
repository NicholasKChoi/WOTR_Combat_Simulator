# M6 designer pass 3: ticket-agent questions

Design: `design/M6.md`, updated in place. Code read at origin/main 1e6d6c2. No owner decision is needed.

## Decisions

| # | question | decision | where in the design |
|---|----------|----------|---------------------|
| 1 | C3 `walkSeconds: 2.5` example | The example was wrong. `walkSeconds` is not integer-bounded, so `checkBuildOrder` accepts 2.5, but `formatBuildOrderText` writes `walk 2.5s` and the grammar accepts only whole seconds. The save gets part 1 of the round trip: the `syntax` issue `line <n>: expected walk seconds like 4s, got '2.5s'` plus any issue the partial order adds. The `invalid` "converted order differs" branch stays as a guard (C3 part 2). No input reaches it today, because every accepted order either re-parses equal or fails part 1. It catches a future formatter or grammar change. Test: `vi.mock('./parse-text', importOriginal)` with `formatBuildOrderText` as a `vi.fn` wrapping the original, and `mockReturnValueOnce(<another shipped build's text>)`, which must give the single `invalid` issue. No test-only export. | C3 rows 8 and 9, Left to tickets (unit test layout) |
| 2 | one source for `notAnObjectError` | `api-route.ts` is the only source of `notAnObjectError` and `isPlainObject`, and `saved-builds.ts` imports both from it. SGS-099 lands first with a private interim copy, and SGS-103 deletes that copy (the body and any plain-object check) and imports from `./api-route`. | Modules, C7 "One source, browser-safe" |
| 3 | zod override | Confirmed: `"overrides": { "zod": "$zod" }`. | C2 Dependencies |
| 4 | file store `bumpCounter` atomicity | No lock file. It does a synchronous read-modify-write (`readFileSync`, then `mkdirSync`/`writeFileSync`, with no `await` in between). That makes it atomic inside one process, so ten concurrent calls lose nothing, and it never returns `'contended'`. Across processes it is not atomic, which is accepted for a store that only dev and tests use. `putBuild` uses `wx`/`EEXIST`. | C2 File store |
| 5 | `buildStoreFromEnv` memo | Confirmed: only the no-argument call is memoized, per module instance. An explicit `env` gives a fresh store and is not memoized. A rejection is not memoized. | C2 selection, step 3 |
| 6 | OpenAPI names | Confirmed: component `SavedBuildWithId` (closed, `SavedBuild` properties plus `id`, `SavedBuild` still referenced). It is an OpenAPI name only, with no TS type. Operation ids are `saveBuild`, `getSavedBuild` and `deleteSavedBuild`. | C3 OpenAPI names, C4 |
| 7 | error texts | Confirmed: 429 `too many saves from this client; try again later`, 503 `storage is unavailable; try again later`, 404 `no saved build with that id` (every 404, for an invalid id or an absent build, on GET or DELETE), 500 `the stored build could not be read`. 413 is `saved build: <bytes> bytes, more than 65536`. | C3 Error texts, C4 |
| 8 | bundle and layout | Decided up front: `englishCatalog` moves to a new server-only `lib/aoe4-build-order/english-catalog.ts`, imported by `simulate.ts` and `builds/index.ts`. `api-route.ts` exports exactly six names and has no `data.ts` or other server-only import, so it is browser-safe. The bundle check (`unit_workshop_ram_3_eng` is in `.next/server` and not in `.next/static`) is now a plain criterion with no fallback. | Modules, C7, Extension points |
| 9 | name drift on save | Decided as a technical fix, not an owner decision. As designed, re-saving an unchanged opened build gave a new id, which breaks C1 (equal content gives an equal id), and repeated edit-and-save cycles grew the name until the 100-character cap made Save fail with no fix available in the UI. `PrebuiltBuild` gains `buildName?: string`, and `savedBuildOption` sets it to the stored name. New `savedBuildName(builds, text, selected)` in `pin-name.ts`: unchanged text gives the matching option's `buildName ?? name`; edited text gives `<base> (edited)`, where `base` is the selected option's `buildName ?? selected` with one trailing ` (edited)` removed and cut to fit 100 characters. Save posts `savedBuildName`. `pinName` (pin label) is unchanged. The samples table is in C6. Note: the cap is `SAVED_NAME_MAX_CHARS = 100`, not 400. | C6 "the saved name", Save and link "click", `?b=` GET 200 |
| 10 | save client names | Confirmed: `save-build-client.ts` with `postSavedBuild` and `saveFailureMessage(status, retryAfter, body)`, and `loadSavedBuild` returning `{status:'ok', saved} \| {status:'not-found'} \| {status:'failed'}`. | Modules, C6 |
| 11 | smoke usage exit | Confirmed: exit 2 with `usage: npm run smoke:preview -- <url>` before any request. Added: a URL whose protocol is not `http:`/`https:` is also a usage error. | Smoke "usage", "exit codes" |
| 12 | smoke line format | Confirmed: `PASS <step>` / `FAIL <step>: <reason>`, steps `save`, `read back`, `open` and `delete`, and `PASS save: <status> <id>`. The production line `FAIL production deployment: delete is disabled` is the only other literal. | Smoke "ordering, failure" |

## Tickets to re-spec

- **SGS-099** (Q1): In the round-trip criterion, keep the fractional `walkSeconds` case expecting the `syntax` issue from part 1. Replace "the implementer finds an order, or tests a non-exported compare function" with the `vi.mock` guard test above. Drop both open questions. Q2 needs no scope change: the private copy stays and SGS-103 removes it.
- **SGS-101** (Q4): Fix the file store `bumpCounter` as a synchronous read-modify-write with no lock file that never returns `'contended'`, and drop the open question. Q3 and Q5 match the ticket as written.
- **SGS-103** (Q2, Q6, Q7, Q8):
  - `api-route.ts` exports exactly six names, with no `englishCatalog` and no `data.ts` import (add a grep criterion).
  - New `english-catalog.ts` exports `englishCatalog`. `simulate.ts` and `builds/index.ts` import it there, and its memo test moves with it.
  - Scope item 3 also replaces any private plain-object check in `saved-builds.ts`.
  - Fix `SavedBuildWithId`, the operation ids and the four error texts as settled.
  - Drop the three open questions.
- **SGS-105** (Q8, Q9, Q10):
  - The bundle check becomes a plain criterion with no fallback.
  - `PrebuiltBuild.buildName?`, `savedBuildOption` returning `buildName`, `savedBuildName` in `pin-name.ts` with a `pin-name.test.ts` table of the C6 samples, and Save posting `savedBuildName`.
  - Add an acceptance case: open `?b=<id>`, then Save unchanged, and the link has the same id.
  - Drop the three open questions.
- **SGS-106** (Q11, Q12): Add the non-http(s) URL to the usage error, and drop the two open questions. Everything else is confirmed as written.

SGS-100, SGS-102 and SGS-104 are unaffected.
