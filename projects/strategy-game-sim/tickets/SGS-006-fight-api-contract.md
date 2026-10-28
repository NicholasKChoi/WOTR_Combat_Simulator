# SGS-006: Document the /api/fight contract and export shared request/response types

- **Type**: Task
- **Component**: wotr-combat-simulator
- **Milestone / criteria**: M1 / M1.7
- **Priority**: medium
- **Risk**: standard
  <!-- Not low: the doc states the S3 caps and W1/W2 behavior (adjacent invariants) and moves the
       response/request types into a shared module. Not high: no runtime behavior or wire shape changes. -->
- **LOC estimate**: ~60-120 (doc prose plus one types module and the import edits in `pages/api/fight.ts`; business logic ~20 lines of type declarations)
- **Depends on**: SGS-005 (Outline F depends on E, the N-battles/frequencies ticket; the 405/400 error contract comes from D, which E depends on). Delivered last.
- **Source**: M1.7; Outline F and spec gaps 6 and 7 in `plans/M1-20261028.md`

## Context

`/api/fight` has no written contract. Today the request is JSON with form-named string fields, and the
response is an unexported `BattleStats` interface in `pages/api/fight.ts`, read by
`components/apps/combat-simulator/results.js` through an untyped page. M1.7 asks for a reviewable API
surface: a doc plus exported types, so a shape change shows up in review.

## Scope

Write against the code as merged by D and E, not the current `main` (`main` still returns the single-battle
`BattleStats` with no validation, no 405/400). Read the merged `pages/api/fight.ts` first; where it differs
from the description below, the merged code and the combat design doc win, and this ticket records the
difference rather than changing behavior.

1. **Shared types module** `components/apps/combat-simulator/fight-api.ts` (inside the component's paths,
   and not under `pages/api/`, where Next.js would expose it as a route). Export named types for:
   - the request body (the six fields `attack-regs`, `attack-elts`, `attack-ldrs`, `defend-regs`,
     `defend-elts`, `defend-ldrs`, plus N if E made it a request field);
   - the success response (the shape E ships);
   - the error response body D ships for 400 and 405.
2. **`pages/api/fight.ts`** imports those types and uses them for the handler's request and response
   (for example `NextApiResponse<FightResponse | FightError>`), replacing the local unexported
   `BattleStats`. No change to runtime behavior or wire shape.
3. **`pages/apps/combat-simulator.js`** (and `results.js` JSDoc, which today says "should map to
   pages/api/fight.ts result") references the exported response type via a JSDoc `import()` typedef.
   Both files are `.js`, and `tsconfig.json` does not set `checkJs`, so this is documentation, not a
   compiler gate. Do not add `checkJs` or convert files to TypeScript here.
4. **Contract doc**: a section "`/api/fight`" in `docs/combat-simulator.md` (if that doc has merged) or a new
   `docs/api.md` (otherwise; pick whichever exists at implementation time and say which). Contents:
   method and path; request fields with type (strings from the form, parsed as integers), accepted
   ranges and total cap exactly as D enforces them; the 405 and 400 responses with status and body
   shape, with one example per error class D defines; the success response field by field with units,
   including the outcome frequencies E defines and how they relate (for example, counts sum to N); N's
   default and maximum and whether it is a request field; the zero-unit-start behavior as D defined it.
   Include one request and one response example, produced by running the endpoint, not hand-typed.
5. **`/api/models/army`**: pending owner decision (see Open questions). Do not change
   `pages/api/models/army.ts` or document it until the decision is recorded on this ticket.

The shipped doc and code comments must not mention ticket ids, invariant numbers, or factory files.

**Out of scope:** any change to `/api/fight` runtime behavior, validation, caps, or response shape (those
belong to D and E); the CONTEXT.md "Key surfaces" update (human/manager action after merge); JSON schema
or runtime validation of the contract; `checkJs` or TypeScript conversion of the page and components;
StarCraft helper and `golang/`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] One module exports named request, success-response, and error-response types, and
      `pages/api/fight.ts` imports them (no local duplicate `BattleStats` or equivalent remains).
- [ ] `npx tsc --noEmit` passes, and changing a field name in the exported response type makes
      `fight.ts` fail to compile (verify once locally and note it in the PR; no committed test required).
- [ ] `npx next build` succeeds, and `/api/fight` does not gain a new route (no types file under `pages/api/`).
- [ ] The doc lists every request field with its accepted range, and each range matches what the running
      endpoint accepts and rejects (check the boundary values with curl against `npm run dev`).
- [ ] The doc's 405 and 400 examples are the real response bodies of the running endpoint for a non-POST
      call and for an out-of-range field.
- [ ] The doc's success example is a real response, and every field in it appears in the doc with a
      description and the exported response type.
- [ ] The doc states N's default and maximum and whether N is a request field, matching the code.
- [ ] The wire behavior of `/api/fight` is unchanged by this ticket: the same requests produce the same
      status codes and response shapes as before it (spot check three requests: valid, invalid field, GET).
- [ ] Neither the doc nor any changed code or comment references ticket ids, invariant numbers, or factory files.
- [ ] No INVARIANTS.md regressions (adjacent: W1, W2, S3; the doc must not contradict the combat design doc).

## Open questions

1. **`/api/models/army` is an accidental public route (plan spec gap 6; undecided by the owner).**
   `pages/api/models/army.ts` is under `pages/api/`, so Next.js serves `/api/models/army`; the file has no
   default export. Options:
   - **(a) Move the model out of `pages/api/`**, for example to `components/apps/combat-simulator/` or a
     sibling module, and update imports in `pages/api/fight.ts`. Then CONTEXT.md, INVARIANTS.md (W paths) and
     the REPO.md review-checklist paths that name `pages/api/models/army.ts` must be updated by the
     manager. This adds a small file move to this ticket (~10 lines of import edits).
   - **(b) Leave it in place and document it as unsupported**: the contract doc states that
     `/api/models/army` is not part of the API and may change or disappear.
   The author does not choose. Scope item 5 is blocked on this decision; items 1-4 can proceed, but the
   manager should record the owner's answer on this ticket before implementation starts.
2. **"Reviewable" (plan spec gap 7).** This ticket reads M1.7 as doc plus exported TypeScript types. If the
   owner wants a checked-in JSON schema or a contract check in the acceptance harness, scope changes.
3. **Doc location.** `docs/combat-simulator.md` section versus a standalone `docs/api.md`. The ticket allows
   either based on what exists at implementation time; the owner may prefer one.
