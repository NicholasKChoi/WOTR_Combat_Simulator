# SGS-125 review 2 (Rework 1, delta)

Branch `sgs-125-save-panel` at ac5b1e6 (local), base main 4489f09. Delta mode: I bounced be351ae in review 1, and the rework changes only `acceptance/aoe4-my-builds.spec.ts` (+35/-41). Reviewed `git diff be351ae..ac5b1e6`, plus the helpers it calls (`holdRequests`, `track`, `submitCopy`, `editedCopy` in acceptance/helpers.ts and the spec).

**Verdict: APPROVE**

## Blocking findings

None.

## Required fix (Rework 1)

- [x] File-local helpers used at every repeated site. Landed.
  - `holdCopy(page, name)` (spec:598-604) holds the POST, tracks it, submits and polls for 1 post. It replaces the setup at all 4 sites (spec:1056, 1078, 1096, 1110).
  - `holdVersion(page, beforeClick?)` (spec:606-614) does the same for the PUT with `namedBuildUrl('*')`. It replaces the setup at all 3 sites (spec:1119, 1143, 1161).
  - `releaseAndAwait(page, release, matches)` (spec:616-620) arms `waitForResponse` before `release()`. It replaces all 4 release-and-wait sites (spec:1059, 1099, 1122, 1146).
  - No remaining `holdRequests` call in the spec sits outside the helpers. The other `waitForResponse` sites (spec:575, 583, 651, 704, 765) await a click or Enter, not a release, so they are not part of the finding.

## Rework diff checks (assertions unchanged, listener ordering)

- **Assertions.** Every `expect` in the 7 tests is the same before and after; only the setup lines moved into the helpers. No test name changed.
- **In-flight create test (spec:1068-1091).** The `puts` and `requestfailed` trackers now attach before `holdCopy` instead of between the hold and the submit. No named request is sent between `editedCopy` finishing and the submit inside `holdCopy` (`holdRequests` only registers a route), so both trackers see the same events as before. `posts` comes back from `holdCopy`, and `[posts.length, puts.length]` still reads the same arrays.
- **Held-version test (spec:1156-1167).** The order is the same as before: the PUT hold is registered, then `editedCopy` runs (through `beforeClick`), then puts are tracked, the click happens and the test polls. The `response` listener now attaches before `editedCopy`. It filters on `isNamedPut`, and `editedCopy` (spec:589-596) sends only a POST and a simulate, so `answered` stays `[]` until release. It is still the same assertion.
- **Late 503/412 table (spec:1140-1153).** `stubNamed(page, 'PUT', ...)` is still registered before the hold. Playwright runs the last-registered route first, so the hold falls back to the stub on release, as before. The implementer's mutation check (`save-build.tsx:179` conflict check broken -> failure at spec:1151) confirms the refactored path still fails on that break.
- **Doc claim** (spec:606 comment: "`beforeClick` runs with the hold already active, so a copy saved there must pass the PUT-only hold"). It holds. `holdVersion` awaits `holdRequests(..., 'PUT')` before `beforeClick`, and `holdRequests` sends non-matching methods on with `route.fallback()` (acceptance/helpers.ts:152).

## Spec gaps

The two items from review 1 are now recorded in the ticket's Rework 1 "Text-only updates": Escape after a version save focuses Save as copy, and the PUT hold uses `namedBuildUrl('*')`. This review raises no new gaps.

## Acceptance criteria

The criteria are not tagged `(rework N)`, and the delta touches no production code. All verdicts from review 1 carry over. Changes from review 1:
- Criterion 90 (in flight / late answers): **pass**. The tests read the same values through the helpers.
- Criterion 92 (Escape focus): **pass** under the ratified text-only update (falls back to Save as copy).
- Criterion 99: **pass** for lint/tsc. **Unverified** for acceptance, because this gate does not run acceptance tests. The implementer reports 9/9 passing in the edited describes.

## Invariants touched

None. The delta is test-only. A1-A3, S1, S3 and edit-secret confidentiality are unaffected.

## Linter

`npx tsc --noEmit && npm run lint:dup` in the review worktree: tsc reports 0 errors, and jscpd reports "Found 0 clones."

## Bot reconciliation

`reviewBot.cli` is empty (REPO.md:24-27), so there are no bot findings. `rulesFile` is empty.

## UI inspection

Skipped. The delta changes no UI.

## Non-blocking notes

1. `releaseAndAwait` (spec:616) has no explicit return type, while the neighbouring helpers declare theirs (`editedCopy` spec:589, `holdCopy` spec:598). This is cosmetic.

## Coverage

- Reviewed:
  - the full rework diff be351ae..ac5b1e6;
  - the call sites of the three new helpers;
  - `holdRequests` in acceptance/helpers.ts;
  - `editedCopy`, `submitCopy` and the other `waitForResponse` sites in the spec;
  - the ticket Rework 1 section, review 1 and the implementer-2 report.
- REPO.md review checklist: no build is needed, because `next build` does not compile acceptance specs and no production file changed.
- Not run: acceptance and e2e tests (forbidden for this gate).
