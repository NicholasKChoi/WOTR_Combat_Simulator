# SGS-125 review 1

Branch `sgs-125-save-panel` at be351ae, base main 4489f09. Full review, not delta mode.

**Verdict: REQUEST CHANGES**, plus one spec gap for the designer (see Spec gaps). The production code reads correctly against the contract. The one blocking finding is test-code duplication in the new acceptance spec.

## Blocking findings

1. `acceptance/aoe4-my-builds.spec.ts:1032-1035, 1057-1062, 1080-1083, 1099-1102` - convention - Four tests in "In flight and late answers" repeat the same held-POST setup:
   ```
   const release = await holdRequests(page, NAMED_BUILDS_PATH, 'POST')
   const posts = track(page, isNamedPost)
   await submitCopy(page, '<name>')
   await expect.poll(() => posts.length).toBe(1)
   ```
   Three tests repeat the held-PUT setup (`holdRequests(page, namedBuildUrl('*'), 'PUT')` + track + `saveVersion` + poll) at 1111-1114, 1140-1143 and 1159-1167. The `const responded = page.waitForResponse(...); release(); await responded` step repeats at 1038, 1086, 1117 and 1146.
   - Why: common.md, Tests makes three or more blocks that repeat the same setup a blocking convention finding. Each copy of the hold plumbing can drift on its own (for example, the poll that proves the request left).
   - Direction: add file-local helpers next to `submitCopy`/`saveVersion`:
     - `holdCopy(page, name): Promise<{ release: () => void; posts: Request[] }>`, which holds the POST, tracks it, submits the copy and polls until one POST has left;
     - `holdVersion(page)`, the same for the PUT;
     - `releaseAndAwait(page, release, predicate)`, which arms `waitForResponse`, releases and awaits.

   Use them in the seven tests. Assertions stay as they are.

## Spec gaps (NEEDS_SPEC item for the designer; does not block this rework)

- **Escape after a successful version save.** Copy criterion (ticket line 30), criterion 92 and design/M8.md:562 all say "Escape in the panel hides it and focuses the button that saved". After a version save the build is no longer edited, so `Save a new version` is `disabled` and cannot take focus.
  - The code (`components/apps/aoe4-build-order/save-build.tsx:220-227`) and the docs fall back to focusing `Save as copy`. The test at "Escape after a version focuses the copy button" pins that behavior.
  - The designer must decide one of two options:
    - (a) ratify the fallback: amend criterion 92 and design/M8.md:562 to "...focuses the button that saved, or Save as copy when that button is disabled";
    - (b) require `Save a new version` to stay focusable (aria-disabled instead of disabled).
  - I judge (a) correct, because it matches the docs and the code. Criterion 92 fails its literal text only on this point.
- **Criterion 90 / late-version criteria name `holdRequests(page, NAMED_BUILDS_PATH, 'PUT')`.** That glob (`**/api/.../named-builds`) cannot match `/named-builds/<id>`. The implementer used `namedBuildUrl('*')`, which meets the intent. The ticket text should say `namedBuildUrl('*')`. Text-only, so the designer can fix it when convenient.

## Acceptance criteria

All verdicts below come from reading the tests and code. Acceptance and e2e tests were not run, per the role rules.

| # | Criterion (short) | Verdict | Evidence |
|---|---|---|---|
| 76-80 | Save as copy: form, default name, name rules (1-100 trimmed), Enter/Escape/Tab, Enter in duration | pass | save-build.tsx:189-206, 255-293; my-builds spec "Save as copy" describe |
| 81 | Copy needs a current, valid result | pass | `canSave` save-build.tsx:110; "Save as copy needs a current result" table incl. opacity |
| 82-84 | Copy selects the new build, rewrites the URL, adds to My builds with secret | pass | pages/apps/aoe4-build-order.tsx `recordCreated`; save-build.tsx:163-165 |
| 85-86 | Save a new version only for mine with a secret, only when edited; PUT with Authorization + If-Match | pass | save-build.tsx:111-112, 168-187; named-build-client; save-build.test.ts tables |
| 87 | 412 locks Save a new version for that revision, message shown | pass | save-build.tsx:86, 179; "second-tab 412" test |
| 88 | Failure messages (403/404/412/5xx/network) | pass | "Save failures" 11-row table; messages match docs |
| 89 | Storage unavailable -> warning, session-only edit | pass | save-build.tsx:42, 139, 322-326; "Storage unavailable" tests |
| 90 | In flight / late answers do not change a newer input | pass (spec text gap above) | `send` + `current` save-build.tsx:118-147; "In flight and late answers" describe |
| 91 | Link panel: shows link, Copy link, hand-copy hint, hides on edit | pass | save-build.tsx:294-321; "Link panel" describe |
| 92 | Escape in link panel hides it and focuses the button that saved | fail on literal text only, see Spec gaps | save-build.tsx:220-227 |
| 93 | Secret never in URL, HTML or console | pass | version test checks URL, `page.content()` and console; secret only in header (named-build-client) |
| 94 | Unit: savedMineEntry, isEdited | pass | build-library.test.ts |
| 95 | Unit: SaveBuild render table | pass | save-build.test.ts (it.each over entry kinds; 9-row enabled table) |
| 96 | Old `?b=` links and `saveBuild` route keep working; no `?b=` Save in UI | pass | save-open spec keeps open-path tests; grep for snapshot save in components clean |
| 97 | Docs updated | pass | docs/aoe4-build-order.md checked sentence by sentence against code |
| 98 | Moved/deleted tests listed with reasons | pass (list) / unverified (runs) | implementer report lines 130-170 |
| 99 | Unit, lint, tsc, acceptance pass | unit/lint/tsc pass; acceptance unverified (not run by this gate) | vitest 683 passed; `npx tsc --noEmit`, `npm run lint:dup` clean |
| 100 | No invariant regressions | pass | see Invariants |

## Invariants touched

- S1 (apps do not import each other): holds. The new imports stay inside `components/apps/aoe4-build-order` and `lib/aoe4-build-order`.
- A1-A3 (sim/auto-run path): not touched beyond reading `settled`. `useAutoRun.flush` is called with the new selected key only when the settled input is unchanged (`sameInput`). Holds.
- Edit-secret confidentiality (ticket): holds. The secret is read from My builds storage or the create response, sent only as `Authorization: Bearer`, and never rendered or put into a URL or log.

## Bot reconciliation

No `reviewBot` is configured; there are no bot findings.

## Linter and checks

- `npm run lint` / `npx tsc --noEmit`: clean.
- `npm run lint:dup` (jscpd, which covers lib/components/pages-api, not acceptance): 0 clones. jscpd does not scan acceptance specs, which is why the duplication finding above was not caught by the linter.
- `npx next build` in the review worktree: passes.

## UI inspection

I served the task worktree on port 3471 (`serve.sh`) and ran two Playwright scripts from the scratch dir. The server was stopped afterwards.
- Widths: 360, 375, 390, 768 and 1280.
- States: idle, copy form, form with name error, link panel, version-ready (edited mine build), and the storage-unavailable warning (375 and 1280).
- Overflow or clipping inside the run bar: none. `scrollWidth` equals the viewport at every width.
- Sibling overlap among the save-panel elements: none.
- Mid-word wraps: none, including a 60+ character name and the warning text.
- Styles: Save a new version and Save as copy have the same enabled styles (opacity 1, blue). A faded copy button in one 375 screenshot was a hover transition; re-measured, it is enabled at opacity 1.
- REPO.md 60% rule at 360x760: holds, because the run bar is static below 768 px.
- At 1280x720 the sticky run bar is about 43% of the viewport with the form and link open, and 52% (376 px) with form, link and warning all open. See note 7.

## Non-blocking notes

1. save-build.tsx:133-139. The `if (current)` guard in `showSuccess` is fine. Note that a late success still sets `unstored` against `settledNow.current`, so the warning appears for an input the user did not save. This is consistent with the docs ("this browser could not store the edit key"), because the key really was not stored.
2. In pages/apps/aoe4-build-order.tsx, the storage listener ignores `event.key === null` (`localStorage.clear()` in another tab). The My builds list in this tab stays stale until reload. This is an edge case.
3. `recordCreated` prepends without applying the cap of 50, and `secrets` are never pruned. Within one session, a build evicted from storage by another tab still offers Save a new version until reload. The docs say it "then opens read-only here", which is true after reload.
4. `withRereadMyBuilds` drops this tab's session-only (unstored) mine entries when another tab rewrites the list.
5. save-build.tsx:197-200. Escape in the copy form focuses the copy button even if it became disabled in the meantime, so focus is lost to body. This is rare.
6. The clipboard test does not assert that "Copied" persists until the next change.
7. Run-bar height at 1280x720 with form, link and warning all open is 52%. The 0.4 bound in the layout test is a test bound inherited from the old save-open layout test, not a spec, and the test checks fewer states at once. Worth watching if the panel grows.
8. acceptance/helpers.ts: `holdRequests` release changed from `route.continue()` to `route.fallback()` (deviation 1, matches the ticket text). I checked the other users of `holdNextSimulate` (aoe4-auto-run.spec.ts:188, :275; aoe4-auto-run-contract.spec.ts:37, :47). None of those tests registers an earlier simulate stub, and the pin-compare stub calls `continue()`, so released requests still reach the network. No behavior change.

## Coverage

- Reviewed in full:
  - `components/apps/aoe4-build-order/save-build.tsx`, `build-input.tsx`, `build-library.ts` (+ test), `save-build.test.ts`, `workbench.module.css`;
  - the `pages/apps/aoe4-build-order.tsx` diff;
  - `acceptance/helpers.ts`, `acceptance/aoe4-my-builds.spec.ts`, the `acceptance/aoe4-save-open.spec.ts` diff;
  - the `docs/aoe4-build-order.md` diff;
  - the ticket, design/M8.md save-panel section, and spec-checklist.
- REPO.md checklist:
  - Every diff: build and page load done.
  - AoE4: screenshots at 360/375/390/768/1280, overflow at 390/768/1280, and the 60% rule are done. No Bootstrap utility classes sit on the same element as module CSS; `cn` is used.
- Not done: acceptance and e2e runs (forbidden for this gate). The 360x760 sticky check only confirmed that the bar is static there.
- No LSP findings beyond the callers already covered (`entryWithText` un-export has no remaining importers).
