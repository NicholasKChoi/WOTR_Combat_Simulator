# SGS-011: Remove the accidental /api/models/army route

- **Type**: Bug
- **Component**: wotr-combat-simulator
- **Milestone / criteria**: M1 / none (bug follow-up)
- **Priority**: low
- **Risk**: high
  <!-- (respec 1) strongModelTriggers apply: `pages/api/models/army.ts` is in the INVARIANTS.md WOTR Paths (W1, W2), and the change removes a served route and edits docs/api/openapi.json, a public-schema file. Logic size is ~0. -->
- **LOC estimate**: ~0 business logic (delete a 2-line file; edit one openapi description string, one doc paragraph, two acceptance tests)
- **Depends on**: none
- **On merge**: (respec 1) remove `pages/api/models/army.ts` from these factory files: CONTEXT.md component table line 22 (wotr-combat-simulator Paths); CONTEXT.md Key surfaces line 34 (drop the sentence "`/api/models/army` is served but not part of the API."); INVARIANTS.md WOTR Combat Simulator `Paths:` line 23; REPO.md review checklist "Combat simulator" `Paths:` lines 88-89. CONTEXT.md Decisions line 77 already records the owner decision and needs no edit.
- **Source**: bug seen in the full acceptance run in `reports/SGS-006-implementer.md` (Notes 2); base `main` at 96d2602; owner decision 2026-10-29 in CONTEXT.md Decisions

## Context

`GET /api/models/army` logs `error - TypeError: resolver is not a function` and returns 500. `pages/api/models/army.ts` is a 2-line re-export of `Army`/`BaseArmy` from `lib/combat-simulator/army` with no default handler. Next.js serves every file under `pages/api/` as a route, and ARCHITECTURE.md says only route handlers belong there. The owner decided on 2026-10-29 to delete the file so the path returns 404 (recorded in CONTEXT.md Decisions); this replaces the earlier decision to keep it as an undocumented route.

## Scope

Exploration at 96d2602: nothing imports `pages/api/models/army.ts`. `git grep models/army` finds only `ARCHITECTURE.md:55`, `acceptance/fight-api-caps.spec.ts:132`, `acceptance/fight-api-spec-surface.spec.ts:26`, and `docs/api/openapi.json:6`. `pages/api/fight.ts` and `lib/combat-simulator/{battle,simulate}.ts` and their tests import `./army` from `lib/combat-simulator/` directly. The model already lives in `lib/combat-simulator/army.ts`, so no move is needed.

- Delete `pages/api/models/army.ts` (and the then-empty `pages/api/models/` directory). The route then returns 404.
- `docs/api/openapi.json`: remove the sentence about `/api/models/army` from `info.description` (line 6). Leave the rest of the description.
- `ARCHITECTURE.md`, "Existing code that predates this layout" (lines 54-57): drop the sentences saying `pages/api/models/army.ts` re-exports the model and is still served. Keep the statement that the logic and army model live in `lib/combat-simulator/` and `pages/api/fight.ts` is its handler.
- `acceptance/fight-api-spec-surface.spec.ts` lines 26-27: replace the two assertions on `info.description` (contains `/api/models/army`, matches `not part of the API`) with one asserting the description does not mention `/api/models/army`.
- `acceptance/fight-api-caps.spec.ts` lines 131-134: the test `the army model route keeps the status it had before the logic moved` expects 500. (respec 1) Keep the request to the literal URL `/api/models/army`, change the expected status to 404, and retitle the test to say the army model is not served as an API route, without repeating the path in the title.

Adjacent invariants (respec 1): W1 (combat follows docs/combat-simulator.md) and W2 (N independent battles) cover the WOTR Paths that list this file; S3 (bounded simulation requests) covers the caps spec being edited. The change touches no dice, casualty, round, per-battle state, or cap logic, and the other tests in the caps spec stay as they are.

**Out of scope:** any change to `lib/combat-simulator/army.ts` behavior; `/api/fight` behavior or spec; adding a default handler or a 405/404 body for the old path; other `pages/api/` cleanups; the factory-file edits (listed under On merge, applied by the manager on integrate; shipped code must not reference them).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] (respec 2) `pages/api/models/army.ts` no longer exists, and `git grep "models/army"` over `pages/`, `lib/`, `components/`, `acceptance/`, `docs/`, `ARCHITECTURE.md` finds exactly two matches: the request URL in the 404 test in `acceptance/fight-api-caps.spec.ts`, and the not-contain assertion in `acceptance/fight-api-spec-surface.spec.ts`. The caps test's title does not contain the path.
- [x] (respec 1) `GET /api/models/army` returns 404: the caps acceptance test asserts it under `npm run acceptance`, and against a manual `npm run dev`, `curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/models/army` prints `404`.
- [x] `docs/api/openapi.json` `info.description` no longer mentions `/api/models/army`, still parses as OpenAPI 3.1, and `paths` still lists only `/api/fight`
- [x] The spec-surface acceptance test and the caps acceptance test are updated as above and pass
- [x] `npx tsc --noEmit`, `npm test`, and `npm run acceptance` pass
- [x] `POST /api/fight` responses are unchanged
- [x] (respec 1) W1, W2, S3 hold: no file under `lib/combat-simulator/` or `pages/api/fight.ts` changes, and every other test in `acceptance/fight-api-caps.spec.ts` is unchanged and passes

## Open questions

None.

## Re-spec 2026-10-29

- Underspecified: the ticket reversed a recorded owner decision without confirmation, understated risk while the file sits in the WOTR invariant Paths, had an AC2 log check with no way to capture the log, and left the grep exception in AC1 ambiguous.
- Changed: owner answer (delete, 404) folded into Context; Risk high with W1, W2, S3 named; AC2 is a 404 check via the caps spec and curl; AC1 pins the literal URL in the caps spec and a path-free title; factory-file follow-ups (now including REPO.md Combat simulator Paths) moved into On merge.
- Branch work: none exists for this ticket; nothing to carry over.

## Re-spec 2026-10-29 (2)

- Underspecified: AC1 required exactly one `models/army` grep match, but the Scope's not-contain assertion in the spec-surface test needs the literal path, so a correct implementation would fail AC1.
- Changed: AC1 now expects exactly two matches (caps 404 test request URL; spec-surface not-contain assertion) and keeps the path-free caps test title. Nothing else changed.
- Branch work: none exists for this ticket; nothing to carry over.
