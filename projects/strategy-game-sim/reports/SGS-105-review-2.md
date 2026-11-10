# SGS-105 review 2

Branch `sgs-105-save-and-open-by-link` at 60d2161310061081dedec168cd67dc8511d8c46f (local only, reviewed by SHA), base main 5b29e9e. This was a full review after rework 1. Review 1 bounced tip 66a9a18.

**Verdict: REQUEST CHANGES**

All six Required fixes from rework 1 landed verbatim. One of them, however, left a garbled doc sentence. Review 1 wrote that direction text, and it dropped the save's "and the duration" clause onto the wrong noun. Separately, the full-diff pass found one test-table convention miss that review 1 did not raise. The code still matches the contract. Lint, unit tests, the build, the bundle check and the wiring greps are clean.

## Rework 1 Required fixes

| Fix | Landed | Evidence |
|---|---|---|
| docs :869 Results-after-load sentence | yes | Verbatim at docs/aoe4-build-order.md:869 |
| docs :920-921 Results-after-load sentence | yes | Verbatim at :918 |
| docs :905-907 saved name | yes, verbatim, but the result reads wrong | See blocking finding 1 |
| docs :875 load sentence | yes | Verbatim at :875 |
| docs :1020-1021 pin label | yes | Verbatim at :1017 |
| Export `sameInput` from auto-run.ts and delete both copies | yes | Exported at auto-run.ts:80 and imported at save-build.tsx:6 and pages/apps/aoe4-build-order.tsx:14. `git grep "a.text === b.text"` finds only auto-run.ts:81. The match at :89 is `sameShown` over `ShownInput`, which is a different type. |

## Blocking findings

1. `docs/aoe4-build-order.md:905-906` - contract (text) - The sentence now reads "an opened build is named by its stored name, without the ` (<id>)` of its select label and the duration, so comments and blank lines are not kept". "and the duration" was the second object of "A save stores the parsed build order ... with the name ... and the duration". The new semicolon clause sits in between, so the doc now says the opened build's name leaves out "the duration". It no longer says a save stores the duration, which Scope "Docs" requires, and which the code does: save-build.tsx:65 posts `durationSeconds: Number(input.duration)`. The cause is review 1's direction text, not the implementer. Direction: replace "A save stores the parsed build order, not the raw text, with the name of the build whose text it equals, or else the selected build's name followed by ` (edited)` (added once, and cut to fit the name cap); an opened build is named by its stored name, without the ` (<id>)` of its select label and the duration, so comments and blank lines are not kept and the text reopens in canonical form." (the sentence spans the line break after "the text") with "A save stores the parsed build order, not the raw text, and the duration, so comments and blank lines are not kept and the text reopens in canonical form. The saved name is that of the build whose text it equals, or else the selected build's name followed by ` (edited)` (added once, and cut to fit the name cap); an opened build is named by its stored name, without the ` (<id>)` of its select label." I checked this text against the code. pin-name.ts:11-17: the first matching option gives `buildName ?? name`. Otherwise the base is cut to 91 characters plus ` (edited)`, a trailing ` (edited)` is not stacked, and an opened option's `buildName` is its stored name. saved-build-loader.ts:21 builds that option.
2. `components/apps/aoe4-build-order/save-build-client.test.ts:61-76` - convention - `postSavedBuild` has four test blocks with the same shape: `stubFetch(respond)` then `expect(await postSavedBuild(request)).toStrictEqual(expected)`. They are `it.each([201, 200])` success, `maps 429 with Retry-After to minutes`, `maps a rejecting fetch to the network message`, and `it.each([201, 200])` non-save body. The blocks differ only in the stub and the expected value, and common.md Tests says such cases go in one table. Direction: fold them into one `it.each<[string, () => Promise<Response>, Awaited<ReturnType<typeof postSavedBuild>>]>` table of `[label, respond, expected]` rows, the way `saved-build-loader.test.ts:65-76` does for `loadSavedBuild`. Keep the `posts the request as JSON` test separate, since it asserts the request and not the result.

## Spec gaps

None.

## Acceptance criteria

`acceptance/aoe4-save-open.spec.ts` is not written yet; it is the acceptance-test gate's job. I checked browser behavior with a throwaway probe spec, which ran under the repo's Playwright config and was deleted afterwards. Rows that review 1 already probed on 66a9a18 still hold for 60d2161: since then the rework changed no UI code, only the import of `sameInput`.

| Criterion | Verdict | Evidence |
|---|---|---|
| Wiring greps | pass | `router.replace` appears only at pages/apps/aoe4-build-order.tsx:166 and :196. The clipboard call is only at save-build.tsx:87. The builds URL is only in save-build-client.ts:54 and saved-build-loader.ts:10. There are no server-module imports, and the loader and client import nothing from next or react. |
| Bundle | pass | After `npx next build`, `grep -rlF unit_workshop_ram_3_eng .next/static` lists 0 files, and `.next/server` has 4. |
| Unchanged opened build re-saves to the same id | pass (code) | pin-name.ts:13 returns `buildName` for the opened option. Unit row `loaded unchanged keeps its stored name`. Not run in a browser this pass. |
| Unit tests (Scope 11) | pass | 62 files, 1857 passed, 10 skipped. Every table row listed in Scope 11 is present. |
| Save, copy, open in a fresh context | pass (probe) | Review 1 probed focus, selection and the label. This pass: the fresh context sent exactly 1 simulate POST and kept `?b=<id>`. |
| Edited build round trips | pass (probe) | After an edit and a duration of 900, the fresh context read duration 900, the label `ENG 1TC (edited) (cVE0iw8AJSt)` and 1 simulate POST. |
| Same content gives same link | pass (probe) | Two clicks gave POST statuses [201, 200] and the same link value. |
| Save enabled only when current | pass (probe) | Failed (500) and rejected (400) were disabled with opacity 0.5. A held simulate (`updating`) was disabled, and the button was enabled after release and `current`. Review 1 probed invalid. |
| (respec 1) Load keeps `b`; late save | pass (probe) | Review 1 probed the load part. This pass: with the POST held, an edit settled, then the response was released. That left no `saved-build-link` and no `b` in the URL. |
| Edit after save hides link and drops `b` | pass (review 1 probe) | Unchanged code. |
| Edit and undo inside the pause | pass (review 1 probe) | Unchanged code. |
| Copy | pass (probe) | With clipboard permission granted, the button reads `Copied` and `readText()` equals the link. Review 1 probed the rejection hint. |
| Escape closes the panel | pass (review 1 probe) | |
| Save keeps the Enter rule | pass (review 1 probe) | |
| Save errors table | pass (review 1 probe) | |
| Missing or malformed id | pass (review 1 probe, partial); the 500 and aborted-GET rows pass by code | page :138-151 maps every non-ok result to `LOAD_ERRORS`. |
| First `b` wins; back loads nothing | pass (review 1 probe) | |
| Load holds the first run and disables editing | pass (probe) | With the GET held, status was `loading`, `build-order-text` had `aria-busy="true"` and the select was disabled. |
| A saved build that no longer converts | pass (probe) | A route-fulfilled record with `knigt` loaded its text, status `invalid`, 0 simulate POSTs, `tab-build` selected at 390, and no `saved-build-error`. |
| Tab after a load at 390 | pass (code plus the invalid row above) | |
| Leaving during a load aborts it | unverified | The probe saw no `requestfailed` for a GET held by `page.route` after `page.goto('/')`, and logged no console error. A request held in a route handler may not report `requestfailed` under Playwright. In the code, the effect cleanup aborts at page :153, and the `.then` checks `signal.aborted` at :137. The acceptance gate must cover this row with a server-side delay, not a held route. |
| Layout with the link shown | pass (review 1 probe) | No CSS change since. |
| Test hygiene | unverified | The spec is not written yet. |
| Docs | fail | Finding 1. Every other Scope "Docs" statement is present. `starts on Build` has no match; the reload sentence at :869 states the `?b=` exception. |
| tsc, lint:dup, test, next build | pass | `npm run acceptance` was not run in full; that is the acceptance gate's job. |
| No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- S1: holds. The new modules import only from `components/apps/aoe4-build-order/` and `lib/aoe4-build-order/`.
- S3: holds. There is one GET per page load, and none for a malformed id. Each click sends one save POST, and the button is disabled while the save is in flight. The body is built only when the status is `current` and `conversion.ok` (save-build.tsx:59).
- A3: holds. The diff adds no timing-dependent state to the simulation path.
- A1, A2: not touched.

## Lint

`npx tsc --noEmit` is clean. `npm run lint:dup` finds 0 clones.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so there are no bot findings.

## Non-blocking notes

- docs/aoe4-build-order.md:1018 (pin label) and pin-name.ts:5/12 (`savedBuildName`) say `Custom build` "when there are no prebuilt builds". The code checks page-state `builds`, which includes an opened option. With an empty prebuilt list and a `?b=` load, the name would be the option's own name. That cannot happen with today's data.
- Review 1 notes still stand: page :166 replaces with `query: {}`, which drops every key and not only `b`. `initialB.current` is written during render (page :94). Docs :868 and :874 say "prebuilt build" where the opened option behaves the same. The saved-build-loader test for an already-aborted signal stubs a fetch that always rejects.

## Coverage

Reviewed against main:

- pages/apps/aoe4-build-order.tsx
- the aoe4-build-order components: save-build.tsx, save-build-client.ts, saved-build-loader.ts, pin-name.ts, auto-run.ts, build-input.tsx, build-text-editor.tsx and step-table.tsx
- workbench.module.css and step-table.module.css
- acceptance/helpers.ts
- the four new or changed unit test files
- docs/aoe4-build-order.md

Checks run:

- tsc, lint:dup, npm test and next build;
- the bundle grep and the wiring greps;
- a Playwright probe of 4 tests, under the repo config's own `next dev`, which stopped with the run.

Not covered:

- No role profile file exists under code-factory/references.
- No REVIEW.md exists, and the project LESSONS.md is empty.
- I took no new screenshots, because the UI code did not change since review 1's 360, 390, 768 and 1280 checks.
- The full `npm run acceptance` suite was not run.
