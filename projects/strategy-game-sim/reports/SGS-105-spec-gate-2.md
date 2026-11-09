# SGS-105 spec gate 2

Verdict: READY

Checked against: the re-spec ticket, spec-gate-1 report, ticket-3 report, SGS-102 (current), SGS-103 (current), design/M6.md (C6, controller rules, Page wiring, Save and link, `?b=` load), PROJECT.md strongModelTriggers, and `origin/main` via git grep.

## Earlier gaps

1. Wiring greps vs test files: closed. The `navigator.clipboard` and `/api/aoe4-build-order/builds` greps now carry `':!*.test.ts'`. The `from 'next|from 'react` grep is limited to the two non-React source files. On `origin/main` none of these greps has a match today, so the end-state rule is clean.
2. Interim render and late save response: closed.
   - Item 8 compares only while `status !== 'loading'`.
   - Design controller rules: `input` while held records live only (settled does not change); `release` settles and fires, then `onChange` copies the new state. So the render where the load has ended but the hook has not released still reports `loading` with the default input as `settled` and is skipped. The next non-`loading` state already carries the loaded input, which equals the baseline.
   - A failed load needs no wait (baseline = default input = settled).
   - A save response whose input differs from the current settled `text`, `duration`, `selected` shows no panel, makes no `router.replace`, and leaves the baseline alone. A criterion pins both.

## Agreement with SGS-102 first-paint state

SGS-102 (re-spec 3) says the hook returns status `loading` with `settled` equal to the args before the controller exists, and while `hold` is true the controller state is `loading` with `settled = initial`. Both are `loading`, which item 8 skips, so the two tickets agree. SGS-102 states `hold = !router.isReady` only and lists `savedLoadInFlight` as out of scope (G). SGS-105 item 6 adds it as `hold = !router.isReady || savedLoadInFlight`, consistent with design "Page wiring". SGS-102's `useAutoRun` args and `release` ordering ("after `input` with the same render's values") match what item 6 relies on. Save reading `status === 'current'` is also fine at first paint (`loading` gives a disabled button).

## Other checks

- Grounded scope: unchanged from gate 1. New files are marked new. The docs grep target `starts on Build` is still present on `main`.
- Contracts vs SGS-103: 201 and 200 `{ id, path }`, 400 `SimulateError`, 413 and 503 `BuildsError`, 429 with `Retry-After`, 405; GET 200, 404 (malformed id and absent), 500, 503; helpers `BUILDS_PATH`, `buildPath`, `postBuild`, `uniqueClient`; `englishCatalog` in server-only `english-catalog.ts`. All match.
- Testable criteria: no stale counts or line numbers; the bundle string has a stated replacement rule; the existing-tests rule is in Scope.
- Open questions: none. Invariants S1, S3, A3 named, no contradiction. Diagram present. LOC ~205. On merge none is correct. Docs: Scope covers the docs. Input validation: GET body goes through `savedBuildSchema.safeParse`; the POST body is validated server-side.

## Dependency watch (SGS-103 is being re-specced)

If SGS-103 changes any of these, SGS-105 must follow:
- the status codes and bodies of the two builds routes (drive the `saveFailureMessage` table and `loadSavedBuild` mapping);
- the `{ id, path }` response shape;
- `postBuild(request, body, client)` helper signature and `uniqueClient`;
- keeping `api-route.ts` and `saved-builds.ts` free of game data (drives the bundle criterion);
- the 429 `Retry-After` header form (whole seconds).

## Notes (non-blocking)

- Item 6's example derivation uses `initialB` without saying where it comes from. It must be derived from `router.query.b` during render once `router.isReady` is true (query is populated on that render), not from state set by the effect, or the first ready render has `hold` false and the default build fires. The stated invariant ("no render may have isReady true, b present and hold false before the load ends") and the "exactly one simulate POST" criteria would catch a wrong choice, so this is not a gap. A half-line naming the source would remove the guess.
- Risk `standard`: the `hold` source decides which input the first run uses (strongModelTriggers item 2, order of operations, A3, applied by SGS-102 to its controller wiring). SGS-105 adds a hold source, not a new rule. Defensible as standard; the owner may read it as high.
- SGS-102's docs rewrite may remove or rephrase "a reload starts on Build". The criterion "every match also states `?b=`" then holds vacuously; fine. The "select holds the prebuilt builds only" sentence is found by phrase (`prebuilt builds`), not by an exact grep; acceptable.
- SGS-104 overlap handling (rebase, no split-flag reads) is still stated.
