# SGS-011 review (first pass, full)

- Branch: sgs-011-api-models-army-resolver-error at 9336369 (local). Base 96d2602; diff `git diff 96d2602...HEAD`.
- Review worktree: worktrees/review-sgs-011 (detached at 9336369), removed after review.
- Verdict: **APPROVE**

## Blocking findings

None.

## Spec gaps

None. The ticket pins every edit; the owner's decision (delete the file, path 404s) is recorded in CONTEXT.md Decisions.

## Diff (5 files, +5/-10)

- `pages/api/models/army.ts` deleted; `pages/api/models/` is gone.
- `docs/api/openapi.json:6` `info.description` is now "HTTP API of the strategy game simulator site."
- `ARCHITECTURE.md:54-55` keeps "logic and army model live in `lib/combat-simulator/`, and `pages/api/fight.ts` is its route handler"; drops the re-export/served sentences.
- `acceptance/fight-api-spec-surface.spec.ts:26` one `not.toContain('/api/models/army')` assertion replaces the two.
- `acceptance/fight-api-caps.spec.ts:131-134` retitled "the army model is not served as an API route", same literal URL, expects 404.

## Acceptance criteria

1. PASS. File gone. `git grep -n "models/army"` over the whole tree returns exactly `acceptance/fight-api-caps.spec.ts:132` (request URL) and `acceptance/fight-api-spec-surface.spec.ts:26` (not-contain). Caps test title is path-free.
2. PASS. Acceptance test `fight-api-caps.spec.ts:131` passed; manual `next dev -p 3000` + curl GET `/api/models/army` printed 404 (POST also 404).
3. PASS. `jq`: openapi `3.1.0`, paths `/api/fight` only, description has no mention.
4. PASS. Both updated tests pass in the full acceptance run.
5. PASS. `npx tsc --noEmit` exit 0; `npm test` 57/57; `npm run acceptance` 209/209.
6. PASS. `pages/api/fight.ts` and `lib/combat-simulator/**` untouched; full acceptance suite (fight API, validation, caps, page flows) passes; manual GET `/api/fight` -> 405 `{"error":"method GET is not allowed; use POST"}`, incomplete POST -> 400 `{ error }`, same as base behavior.
7. PASS. No change under `lib/combat-simulator/` or to `pages/api/fight.ts`; the only caps-spec hunk is lines 131-134.

All criteria ticked in the ticket.

## Invariants touched

- W1 (combat rules): holds. No dice/leader/casualty/round code changed; `docs/combat-simulator.md` has no mention of the deleted file.
- W2 (independent battles): holds. No simulation code changed.
- S3 (bounded requests): holds. Caps tests other than the army-route one are unchanged and pass.
- S1, S2, H1-H3, A1-A3: not touched.

## spec-checklist.md

- Contracts: `/api/fight` / `runFight` unchanged; CONTEXT.md Key surfaces line about `/api/models/army` is the manager's On-merge edit, not this diff.
- Scope: nothing out of scope; no `golang/` change; no invented constants.
- Naming: test title states intent ("not served as an API route").
- W1/W2/S3: see above. Others N/A.

## Contract / design

- Design (`plans/M1-20261028.md` spec gap 6, row F) asked for `/api/models/army` to be decided; the owner decided delete -> 404, and the diff implements that. No seam the design names is closed: the model stays exported from `lib/combat-simulator/army.ts`, which is what `fight.ts`, `battle.ts`, `simulate.ts` import.
- ARCHITECTURE.md "Where files go" (only route handlers under `pages/api/`; route change updates `docs/api/openapi.json` in the same diff): the diff now conforms to both.

## Linter

`npx tsc --noEmit`: 0 errors (tsconfig.json read: `strict: false`, includes `**/*.ts`, so the acceptance specs are type-checked).

## Review bot

`reviewBot.cli` and `rulesFile` empty in REPO.md; nothing to run or reconcile.

## Conventions

- Test change mirrors siblings in the same file (`request.get(...)` + `expect(response.status()).toBe(...)`, e.g. the API tests above line 128) and the `test.describe('spec file shape')` assertion style in `fight-api-spec-surface.spec.ts:22-27`.
- Commit authored as `choinickolas@gmail.com`; message has no ticket id, factory pointers, or PR numbers.
- No comments added; shipped artifacts carry no factory references.

## Correctness

Nothing to flag: deletion has no importers (whole-tree grep), `next build` route table lists only `λ /api/fight` under `/api`, no 500 path remains. No processes, locks, or resources involved.

## REPO.md Review checklist

- Every diff: `npx next build` pass. No page file touched; loaded `/apps/combat-simulator` under `next dev` (200). The user-visible flow (form -> `/api/fight` -> results) is covered by the passing Playwright page tests.
- Combat simulator (Paths include `pages/api/models/army.ts`): round-trip trace N/A (no field changed). `/api/fight` exercised with curl (405 and 400 cases); valid-request behavior covered by the acceptance suite since `fight.ts` is byte-identical. No dice/casualty change. `docs/combat-simulator.md` exists and is silent on the deleted file, which needs no decision.
- Other sections (Starcraft, Shared code, golang/): paths not touched.

## Merge

`git merge-tree origin/main(2eb3eb3) HEAD` is clean; main's only new change is `acceptance/fight-api-validation.spec.ts`, not touched here.

## Non-blocking notes

- The spec-surface assertion `not.toContain('/api/models/army')` is exactly what the ticket asks for; it would fail if the sentence came back, so it can fail for a real reason. The 404 test fails if any handler or file reappears at that path.
- The army-route test lives in `fight-api-caps.spec.ts`, which is otherwise about caps; placement is inherited from the base and the ticket says to keep it there.
- Reminder for the manager: On-merge factory-file edits (CONTEXT.md component table and Key surfaces, INVARIANTS.md WOTR Paths, REPO.md Combat simulator Paths) still list `pages/api/models/army.ts`.

## Coverage

Reviewed all 5 changed files in full context, tsconfig.json, ARCHITECTURE.md, openapi.json, the M1 plan's notes on this route, and whole-tree grep for importers. Ran tsc, npm test, next build, npm run acceptance, and manual dev-server curls. Dev servers started on port 3000 were stopped; port 3000 confirmed free and no `next` process left. Not reviewed: nothing outstanding.
