# SGS-106 review 1

Verdict: **REQUEST CHANGES** (one blocking text finding; the code itself is correct)

Reviewed: tip 5bdd00ad3cca9baaf314fd641c65046eaae90414 against base 66354ac (full review, first pass), in a
detached worktree at `$FACTORY_DIR/worktrees/review-sgs-106-smoke-preview` (removed after). The branch
`sgs-106-smoke-preview` exists only locally; it has not been pushed (no `origin/sgs-106-smoke-preview`), so the
worktree was created from the SHA.

## Blocking findings

1. `docs/aoe4-build-order.md:1104` - contract (text) - The new step 1 sentence says save "expects 201 or 200
   with an `{ id, path }` body". The script checks only `id` (`scripts/smoke-preview.mjs:69-72`: status 201/200,
   `typeof id === 'string'`, `SAVED_BUILD_ID_PATTERN`). It never reads `path`, so a deployment that drops `path`
   passes the smoke. That is right per the ticket (step 1 validates only `id`), so the doc overclaims what the
   smoke checks. A doc sentence the diff adds that the code contradicts is blocking.
   Direction: replace the item text with exactly:
   "1. `save`: posts `data/aoe4-build-order/builds/english-1tc.json` with a duration of 1200 s and expects 201 or 200
   with a body whose `id` is a valid build id."

## Classification of the implementer's flagged criterion (second run shows `PASS save: 200`)

**Acceptable. Not NEEDS_SPEC, and not a code defect.** Step 4 (and the `finally` delete) removes the build on
every successful run. The store is content-addressed, so back-to-back runs give `201` with the **same id**. I
reproduced this myself against `next dev` on a throwaway `BUILDS_LOCAL_DIR`: run 1 printed `PASS save: 201
8NZwU5Ld_D5`, and run 2 (with a trailing-slash URL) printed `PASS save: 201 8NZwU5Ld_D5`. Both exited 0 with four
PASS lines. `200` happens only when the build already exists, which the implementer showed by saving first with
curl. The spec leaves no decision open: the delete step settles the behavior. Three places state the same wrong
fact:
- ticket criterion "Local verification … `save` line shows status 200 and the same id";
- ticket Scope item 1 "repeat. … step 1 gets 200 with the same id";
- `design/M6.md` Smoke table, row "repeat" ("saves the same id (200)").

The shipped doc sentence ("A second run saves the same content, so it reuses the same link") is true, and so is
the spec's "repeat run" (a stub that answers 200 proves 200 is accepted). The owner's M6.8 merge condition (four
PASS lines, exit 0) is unaffected. Manager action: reword the criterion and the Scope bullet to "exits 0 and its
`save` line shows the same id (201 after the previous run's delete; 200 only if the build was still stored)".
Queue the `design/M6.md` repeat-row fix with the line 627 `extraHTTPHeaders` fix already noted in Re-spec 3.
Tell the owner to expect 201 on a repeat run.

## Spec gaps

None blocking (see the classification above).

## Acceptance criteria

| criterion | verdict | evidence |
|---|---|---|
| all steps pass | pass | spec row l.148: exit 0, exact four lines, request log `[POST, GET, OPEN, DELETE, GET]` with favicon filtered, posted body deep-equal |
| repeat run | pass | spec l.256: 201 then 200, same id; the second run also covers the trailing slash |
| secret set is sent and never printed | pass | row l.157 checks the header on every origin-stub request; afterEach l.241 checks the sentinel against every run's stdout and stderr |
| secret unset 401 / 403 | pass | `expectProtected` l.233: exit 2, stderr message, empty stdout, only `[POST]` |
| secret set, first response 401 | pass | row l.179; code `smoke-preview.mjs:68` gates on `!secret` |
| save fails | pass | row l.187: `['FAIL save: status 400: x']`, log `[POST]` |
| read back differs | pass | row l.196: no open line, DELETE sent |
| open fails | pass | row l.205, 90 s timeout; DELETE is the last request |
| delete refused in production | pass | row l.215: exact line list |
| delete leaves the build | pass | row l.223 |
| usage (3 rows) | pass | l.280-296: exit 2, stderr exactly USAGE, empty stdout, no request |
| runs from another directory | pass | l.267; the script path is absolute, so only the fixture path depends on cwd (the implementer's mutation check confirms) |
| package.json script, no lib imports, no tsx | pass | `package.json` diff; `git grep -nE "from '\.\./(lib\|components\|pages)" -- scripts` finds nothing; the script imports only `node:fs`, `node:util`, `@playwright/test` |
| no app code / contract touched, lockfile unchanged | pass | changed files: ARCHITECTURE.md, acceptance spec, docs/aoe4-build-order.md, package.json, scripts/smoke-preview.mjs; `package-lock.json` has no diff |
| header only to deployment origin (two-origin) | pass | row l.157 asserts `/asset.js` was fetched once with no bypass header; code `routeBypassToOrigin` l.86-92 (see note 1 on redirects) |
| read-back compares the GET body's buildOrder; local run passes | pass | l.80-82; my local run printed `PASS read back` |
| Local verification | pass with the wording correction above | implementer report plus my reproduction (port 3781, store left with only a rate-limit counter, server stopped) |
| Docs content | **fail until finding 1 is fixed**, otherwise pass | Both subsections are present, with every status and its action, `<origin><path>`, both names, four steps, three exit codes, the first-failure stop and the production refusal. All three `protection-bypass` matches are spelled `x-vercel-protection-bypass`. The implementer ran the curl. |
| ARCHITECTURE.md Scripts row | pass | l.36; the `.mjs` is outside the tsconfig `include`, so the "not type-checked" claim holds |
| PR body merge-hold sentence | unverified | no PR opened yet |
| npm test, lint, acceptance pass | pass (lint and new spec re-run by me); unit and full acceptance per implementer | `npx tsc --noEmit` clean, `npm run lint:dup` 0 clones; `npx playwright test acceptance/smoke-preview.spec.ts` 15 passed (39 s) |
| No INVARIANTS regressions | pass | see below |

## Invariants touched

- S3 (bounded time): holds. One POST per run, and no loop or retry. Every `fetch` has `AbortSignal.timeout(15 s)`
  (l.48). The open step shares a 30 s deadline across goto, waitForFunction and waitFor (l.109-125). `chromium.launch`
  uses Playwright's default launch timeout. The browser is closed in `finally` (l.131).
- A3 (adjacent via the saved record): holds. The read-back compares by value with `isDeepStrictEqual` and imports
  no schema.
- S1, S2, A1, A2, W*, H*: not touched.

## Spec checklist

Contracts: route paths, `SAVED_BUILD_ID_PATTERN` value, step names and lines match `design/M6.md` Smoke and the
ticket. Scope: nothing out of scope, no `golang/`. No invented constants (1200, 15 s and 30 s come from the ticket
and design; the doc's "60 to 3600" matches `saved-builds.ts` checks and the existing doc table). Naming fine.

## Lint

`npx tsc --noEmit && npm run lint:dup`: clean, 0 clones. jscpd's config covers only `lib/`, `components/` and
`pages/api/` for the AoE4 app, so `scripts/` and `acceptance/` are outside it, and tsc does not check `.mjs`.

## Bot reconciliation

`reviewBot.cli` is empty and `rulesFile` is empty, so no bot ran.

## Non-blocking notes

1. `scripts/smoke-preview.mjs:44` and `:90` - concurrency of trust: Node `fetch` follows redirects and keeps
   custom headers on a cross-origin redirect. Playwright's `route.continue({ headers })` also applies the
   override to redirects the request starts. If the deployment ever 3xx-redirects to another host, that host
   would receive the bypass header, which strains the doc's "to the deployment's origin only" (l.1099). Today
   the only plausible redirect target is Vercel itself. Option: `redirect: 'manual'` on fetch, which makes a 3xx
   fail the step.
2. `scripts/smoke-preview.mjs:150` - the `FAIL smoke: <message>` line is a third fixed format the ticket and design
   do not list. It is effectively unreachable: every step wraps its errors in `StepFailure`, and the fixture read
   at l.155 sits outside the `try`. Harmless, but one could drop it or map it to the current step.
3. `docs/aoe4-build-order.md:1112` "Each step prints one line, `PASS <step>` or `FAIL <step>: <reason>`" leaves out
   that the save line is `PASS save: <status> <id>`. Optional wording: "Each step prints one line, `PASS <step>`
   (save adds the status and id, `PASS save: <status> <id>`) or `FAIL <step>: <reason>`."
4. `acceptance/smoke-preview.spec.ts:259,272,290` - "repeat run", "runs from another directory" and the usage rows
   pass `{}` as env, so they inherit the shell's `VERCEL_AUTOMATION_BYPASS_SECRET`. The doc tells the owner to
   export it, so a run from that shell sends the real secret to the local stub, and the afterEach checks only the
   sentinel. Default the env to the sentinel in `run`. The implementer report's "every row runs with the sentinel
   except the two secret-unset rows" is inaccurate.
5. `acceptance/smoke-preview.spec.ts:123` - `Number(error.code)` is 0 when the child dies on a signal (`code` is
   null), so a killed run would read as exit 0. Low risk, since no timeout or kill is set.
6. "runs from another directory" is a separate test, not a row of the table as the ticket phrased it. That is
   fine: it needs a different `run` call. The stub setup pair (`startAssetStub` + `startStub`) appears in 4
   places, and a `startStubs(options)` helper would tidy it. Below the blocking bar: the scenarios already sit in
   tables.

## Conventions

- `scripts/` has no siblings (first file). Its plain ESM with `node:` imports is consistent with the ARCHITECTURE row.
- Acceptance spec vs `acceptance/aoe4-builds-api.spec.ts:1` (bare `crypto` import) and
  `acceptance/aoe4-save-open.spec.ts` (loop-over-table style): matches. The scenarios are table-driven with shared
  stub helpers, as the ticket requires.
- No ticket ids, factory pointers or process history in shipped files.

## Review checklist (REPO.md)

- Every diff: no page, component or lib code changed. `next build` per implementer. I ran the smoke itself
  against `next dev`, which loads `/apps/aoe4-build-order?b=<id>` in Chromium end to end (three runs, all
  four steps PASS; with a sentinel secret set, the output does not contain it).
- AoE4 section: the diff touches no path the section lists (`docs/aoe4-build-order.md` is its design doc, not a
  listed path). I still checked the doc's new sentences against the code and OpenAPI: the status table matches the
  `saveBuild` responses in `docs/api/openapi.json`, including 400 `issues` and 429 `Retry-After`.

## Coverage

Files reviewed in full: `scripts/smoke-preview.mjs`, `acceptance/smoke-preview.spec.ts`,
`docs/aoe4-build-order.md` (new subsections and the preceding "Saving a build and opening it by link"),
`ARCHITECTURE.md`, `package.json`. Also cross-checked `docs/api/openapi.json` builds responses,
`lib/aoe4-build-order/saved-builds.ts` bounds, `design/M6.md` Smoke and `tsconfig.json`. Not run by me: the full
`npm run acceptance`, `npm test` and `next build` (implementer reports them passing). No PR exists yet, so the
PR-body criterion is unverified. Nothing I started is still running: the dev server was killed by process
group, and port 3781 is free.
