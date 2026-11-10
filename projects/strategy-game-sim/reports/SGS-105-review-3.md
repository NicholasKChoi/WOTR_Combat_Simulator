# SGS-105 review 3

Branch `sgs-105-save-and-open-by-link` at e2bc300c2259f2a679ced7ee620ec9dca39132e3 (local only, reviewed by SHA in a detached worktree). Base is origin/main 5b29e9e, the merge-base. The local `main` ref is stale at ee7ecb9, so I diffed against `origin/main...HEAD`. This is a full review after rework 2; review 2 bounced 60d2161.

**Verdict: REQUEST CHANGES**

Both rework 2 Required fixes landed as specified. The code still matches the contract. Lint, the unit tests, the build, the bundle check and the wiring greps are clean. One blocking finding remains, and it is a text-only move in the docs. The new "Saving a build and opening it by link" subsection was inserted in the middle of a Page paragraph. As a result, the rest of the Page section now sits under the Save heading. Reviews 1 and 2 missed this; it is not a regression from rework 2.

## Rework 2 Required fixes

| Fix | Landed | Evidence |
|---|---|---|
| docs 905-906: save sentence restores "and the duration"; the name rule gets its own sentence | yes, verbatim | docs/aoe4-build-order.md:905-907. Both sentences read correctly and keep every claim Scope "Docs" asks for: the parsed order, the duration, comments not kept, canonical form, the name rule, and the opened build's stored name without ` (<id>)`. The claims were checked against the code: save-build.tsx:66 posts `durationSeconds: Number(input.duration)`, and pin-name.ts:10-17 holds the name rule. |
| save-build-client.test.ts: fold the four `postSavedBuild` result blocks into one `[label, respond, expected]` table; keep `posts the request as JSON` separate | yes | save-build-client.test.ts:58-75 has one `it.each<[string, () => Promise<Response>, Awaited<ReturnType<typeof postSavedBuild>>]>` with 6 rows (201 ok, 200 ok, 429 Retry-After 90, rejecting fetch, 201 non-save, 200 non-save). That is the same 6 cases as before, so the test count is unchanged (1857). The shape matches saved-build-loader.test.ts:64-74. `posts the request as JSON` is still a separate test at :45-56. |

## Blocking findings

1. `docs/aoe4-build-order.md:901-928` - contract (text) - **What:** the subsection was inserted between two lines of one paragraph. On main, the "Narrow layout: ..." paragraph continues with "At 1200 px and wider the step timeline sits in a column ...". In the branch, that sentence is joined to the end of the 429 save-error paragraph (now :928-930), under the new heading. The `####` heading at :902 stays in effect until `## CivRules seams` (:1058), so the 1200 px layout rule, the step-table text, the pin and compare rules, the HTTP error texts and the prebuilt-builds paragraph (:928-1056) are now all filed under "Saving a build and opening it by link". **Why it matters:** Scope "Docs" says to add the subsection "after the 'Page' text". Here it splits that text, and a reader of the rendered doc finds the wide-layout rule and the pin rules described as part of saving. **Direction (text):** this is a move only, with no wording change. Cut the blank line at :901 and the whole block from `#### Saving a build and opening it by link` through "...or `Too many saves. Try again later.` when the wait is unknown." (the end of :927). The line "page itself does not scroll sideways at 390 px on either tab, even with a long unbroken token in an issue message." should then be followed directly by "At 1200 px and wider the step timeline sits in a column ...", exactly as on main. Paste the block at the end of the Page section: after the line "MAA/Crossbow`." (the last line of "The three prebuilt builds are ..."), with one blank line before the heading and one blank line before `## CivRules seams`. The forward reference at :864 ("one exception: opening a `?b=` link, see below") still reads correctly after the move. Afterwards, `git diff origin/main -- docs/aoe4-build-order.md` should show the narrow-layout and 1200 px lines unchanged.

## Spec gaps

None.

## Acceptance criteria

`acceptance/aoe4-save-open.spec.ts` is not written yet; it belongs to the acceptance-test gate. Since review 2, rework 2 changed only one unit test file and one doc sentence. No production code changed, so the browser rows that reviews 1 and 2 probed on the same UI code still hold.

| Criterion | Verdict | Evidence |
|---|---|---|
| Wiring greps | pass | `router.replace` appears only at pages/apps/aoe4-build-order.tsx:166 and :196. The clipboard call is only at save-build.tsx:87. The builds URL is only at save-build-client.ts:54 and saved-build-loader.ts:10. The server-module grep finds no match, and so does the next/react grep on the loader and client. |
| Bundle | pass | After `npx next build`, `grep -rlF unit_workshop_ram_3_eng .next/static` lists 0 files, and `.next/server` has 4. |
| Unchanged opened build re-saves to the same id | pass (code, plus review 2) | pin-name.ts:13 returns `buildName ?? name`, and saved-build-loader.ts:21 sets `buildName`. |
| Unit tests (Scope 11) with the listed rows | pass | `npm test`: 62 files, 1857 passed, 10 skipped. The `postSavedBuild` rows (201, 200, 429/90 giving 2 minutes, network, `{}` body as a failure) are all in the new table. |
| Save, copy, open in a fresh context | pass (review 1 and 2 probes) | Code unchanged. |
| Edited build round trips | pass (review 2 probe) | |
| Same content gives same link | pass (review 2 probe) | |
| Save enabled only when current | pass (review 1 and 2 probes) | |
| (respec 1) load keeps `b`; late save | pass (review 1 and 2 probes) | save-build.tsx:71 drops a stale response, and page :163-167 skips the URL check while `loading`. |
| Edit after save hides the link and drops `b` | pass (review 1 probe) | |
| Edit and undo inside the pause | pass (review 1 probe) | |
| Copy | pass (review 1 and 2 probes) | |
| Escape closes the panel | pass (review 1 probe) | |
| Save keeps the Enter rule | pass (review 1 probe) | Save is `type="button"` (save-build.tsx:100). |
| Save errors table | pass (review 1 probe) | |
| Missing or malformed id | pass (probe plus code) | |
| First `b` wins; back loads nothing | pass (review 1 probe) | `initialB` is set once (page :95), and the effect is keyed on `router.isReady` only. |
| Load holds the first run and disables editing | pass (review 2 probe) | |
| A saved build that no longer converts | pass (review 2 probe) | |
| Tab after a load at 390 | pass (code plus probe) | |
| Leaving during a load aborts it | unverified | Same as review 2: the code aborts in the effect cleanup (page :153) and checks `signal.aborted` at :137. The acceptance gate must exercise this with a server-side delay, not a held route. |
| Layout with the link shown | pass (review 1 probe) | No CSS change since then. |
| Test hygiene | unverified | The spec is not written yet. |
| Docs | fail | Finding 1 (placement). Every Scope "Docs" statement is present and quoted exactly. The only `starts on Build` match (:869) states the `?b=` exception. There is no measured timing and no rate-limit number. |
| tsc, lint:dup, test, next build | pass | I did not run `npm run acceptance` in full. I ran `aoe4-narrow-layout.spec.ts` and `aoe4-auto-run.spec.ts` to load the page: 21 passed. |
| No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- **S1**: holds. The new modules import only from `components/apps/aoe4-build-order/` and `lib/aoe4-build-order/` (`saved-builds`, `parse-text`, `text-to-build`).
- **S3**: holds. There is at most one GET per page load and none for a malformed id. Each click sends one POST, with Save disabled while a save is in flight (save-build.tsx:103). The body is built only when the status is `current` and `conversion.ok` (:60).
- **A3**: holds. Nothing timing-dependent was added to the simulation path.
- A1 and A2 are not touched.

## Lint

`npx tsc --noEmit` is clean. `npm run lint:dup` finds 0 clones.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty in REPO.md, so there are no bot findings to reconcile.

## Non-blocking notes

- docs :862-863: "a text/table toggle and the run status (`auto-run-status`) and the Save build button" has two "and"s, and it puts Save after the status, but in the DOM Save comes first (build-input.tsx:108-109). If the doc is being touched anyway, suggested text: "a text/table toggle, the Save build button and the run status (`auto-run-status`)".
- These notes from reviews 1 and 2 still stand:
  - page :166 replaces with `query: {}`, which drops every query key, not only `b`;
  - `initialB.current` is written during render (page :95);
  - docs :874 still says "choosing a prebuilt build", though choosing the opened option behaves the same;
  - the `Custom build` rule in docs :1018 and pin-name.ts is phrased on "no prebuilt builds" but checks the page-state list;
  - the saved-build-loader test for an already-aborted signal stubs a fetch that always rejects.

## Coverage

Reviewed against origin/main 5b29e9e:

- pages/apps/aoe4-build-order.tsx;
- in components/apps/aoe4-build-order/: save-build.tsx, save-build-client.ts, saved-build-loader.ts, pin-name.ts, auto-run.ts (the export), build-input.tsx, build-text-editor.tsx and step-table.tsx;
- the four new or changed unit test files;
- acceptance/helpers.ts;
- docs/aoe4-build-order.md, the whole Page section.

Checks run:

- `npm ci`, tsc, lint:dup, `npm test`, `npx next build`;
- the bundle grep and the wiring greps;
- two page acceptance specs (21 passed), under the Playwright harness's own server, which stopped with the run.

Not covered:

- No new browser probes or screenshots, because no UI code changed since review 2.
- The full `npm run acceptance` suite was not run.
- No role profile file exists under code-factory/references.
- No REVIEW.md exists, and the project LESSONS.md is empty.
