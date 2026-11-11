# SGS-121 ticket author, re-spec 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-121-named-build-routes-openapi.md

## Summary

"Add the named-build routes, adapters, OpenAPI 2.5.0 and API specs", component aoe4-build-order, M8 / M8.1 (server), Risk high, about 220 business-logic lines, depends on SGS-112, SGS-119 and SGS-120 (none integrated, no local branches). It covers the create (15 rows), update (22 rows) and GET/DELETE (7 rows) tables of design C1, the two Next adapters, OpenAPI 2.4.0 to 2.5.0, the unit table tests, two new acceptance specs, and the docs.

## Folded in from spec-gate round 1

- Gap 1 (log search criterion): the criterion now says every `console.` call in `named-builds-routes.ts` logs `builds: named id collision` or `builds: stored build failed its schema`, plus at most the zod error. None may pass `req`, `authorization`, a secret, a hash or a stored record. `idFailure` and `storageUnavailable` log from `builds-routes.ts`.
- Gap 2 (closed lists): the contract criterion now states properties instead of lists:
  - the two named-builds paths are present;
  - every operationId is non-empty and unique;
  - the four named operations have exactly their Scope statuses;
  - each new schema is referenced, closed, fully described, and has its C1 property set (no `secretHash` on `NamedBuild`).
  - The `2.5.0` version pin stays.
- Existing specs (part of gap 2): Scope now gives a rule with examples instead of naming one spec. Exploration found that `acceptance/fight-api-spec-surface.spec.ts` also hand-lists the path set, which the old ticket missed.
  - A version pin becomes `2.5.0`.
  - A literal path list becomes either the route-files-under-`pages/api/` property or a presence check.
  - The criterion checks this with `git grep -n "2\.4\.0" -- acceptance`, which must find nothing, and requires that no spec compares `spec.paths` keys to a literal list.
- Note 1: Scope and the Invariants line now say GET and DELETE never call `takeSaveSlot`. The GET/DELETE criterion asserts no `bumpCounter` call and an unchanged counter.
- Note 2: the live budget test uses a client of its own (Scope and criterion).
- Note 3: Scope says `saveBuild`'s description and 429 text stay unchanged.
- Note 4: this is about ordering only, so the ticket does not change.
- Design revision: the only change relevant here is that `storedNamedBuildSchema` timestamps accept only the `Z` form. The ticket already writes `new Date(nowMs).toISOString()`, so nothing changed.

## Criteria checked against origin/main

- `2.4.0` currently appears in `aoe4-builds-api-contract`, `aoe4-gathered-resources` and `aoe4-simulate-api-issue-shape`. These are the lines Scope moves.
- Literal path lists are in `aoe4-builds-api-contract` and `fight-api-spec-surface`. Scope moves both.
- `@vercel/blob` is imported only by `blob-build-store.ts` and its test.
- `named-builds.ts` does not exist yet, so the `node:` grep finds nothing.
- Lint: `ticket-lint.py` prints no errors.

## Diagrams

The existing read/act/record flowchart of the update order is unchanged.

## Open questions

none

## Overlap

None new. The `saveBuild` 500 stays with SGS-112. The stores and library stay with SGS-119 and SGS-120.
