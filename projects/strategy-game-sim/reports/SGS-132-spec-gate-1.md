# SGS-132 spec gate 1

Verdict: NEEDS_SPEC (three small gaps, none needs the owner)

Read at origin/main (SGS-128 has no local branch yet; it adds only test helpers and jscpd gates, so
nothing SGS-132 reads at the base is missing). Read: `save-build.tsx`, `build-input.tsx`,
`workbench.module.css`, `save-build.test.ts`, `named-build-client.ts`, `acceptance/helpers.ts`,
`acceptance/aoe4-my-builds.spec.ts` (Escape tests), `docs/aoe4-build-order.md` (run bar, save section),
design M9 C1 and the M9.3 behavior table, and the dependent tickets SGS-128 and SGS-133.

## Gaps

1. Acceptance criteria (4) - "stays empty when the save fails with ... an abort" - the page aborts a
   request only on unmount (`abort.current?.abort()` in the unmount effect, and `send` returns null
   without changing state when aborted). No browser flow can abort a save while the panel stays
   mounted, so this part cannot be tested and an implementer would guess what to assert. A network
   error in Playwright (`route.abort()`) is a different path (it returns a failure outcome). Proposed
   fix: drop "an abort" from the criterion and name the two failure paths the spec exercises: an error
   reply (stubbed status) and a network error (`route.abort()`).

2. Acceptance criteria (2) and Scope Tests - the criterion requires the order with the link shown
   (`save-build`, `save-build-copy`, `save-status`, `saved-build-link`, `copy-saved-link`) and that
   `save-copy-form`, `copy-saved-link-hint`, `my-builds-unavailable` and `save-build-error` sit outside
   the row. `renderToStaticMarkup` cannot show any of these, since `saved`, the form and the error are
   state. Scope's Vitest line covers only the buttons plus the empty status. An implementer would test
   only the static part and leave the rest unchecked. Proposed fix: say which parts the Vitest case
   covers (no link: row children are the buttons and the empty status) and which the new Playwright spec
   covers (link shown: DOM order inside `save-row`; the copy form open, the copy-hint after a refused
   clipboard write, `my-builds-unavailable` with storage throwing, and `save-build-error` are not
   descendants of `save-row`).

3. Acceptance criteria (3) - "`save-status` reads `Saved` in the same render that shows the link" is
   not observable by a test (Playwright cannot see render boundaries). Proposed fix: state the property
   instead, "whenever `saved-build-link` is visible, `save-status` is non-empty, and it is empty
   whenever the link is absent", checked in the same polled assertion or one `page.evaluate`. Also state
   in Scope that `save-status` is derived from `saved`, `settled` and `saving` only (no separate status
   state), which is what makes the property hold.

## Notes

- Everything else checks out: every named file, test id and symbol exists at the base (`SaveBuild`,
  `hideLink`, `linkPanel`, `linkInput`, `SPLIT_MIN_WIDTH = 1200` in `acceptance/helpers.ts`, local
  `saveCopy`/`editedCopy`/`stubNamed`/`reply` in `aoe4-my-builds.spec.ts`); the CSS module has no 1200px
  query; contract names match design C1; the doc sentences Scope lists exist at the cited places
  (lines 873-875, 1087-1092); the existing Escape acceptance tests press Escape with focus on the link,
  so they keep passing under `onLinkKeyDown`; no other open ticket rewrites this code (SGS-133 depends on
  SGS-132 and stays out of the save panel); no open questions; risk `standard` fits (no critical path or
  strong-model trigger).
- The doc line about the narrow layout ("wraps onto several rows", doc line 921) stays true; no change
  needed.
- `.saveStatus` should reset the paragraph's default bottom margin, so the always-mounted empty status
  adds no height to the row (the existing `.linkHint`, `.saveError`, `.saveNotice` use `margin: 0`).
  An empty flex item still adds one `gap`; the implementer may want to confirm the row height is
  unchanged with no save, since the point of the ticket is a shorter run bar.
- The spec file `aoe4-save-status.spec.ts` should use `expect.poll` or one `page.evaluate` for the
  tops and line checks (house lesson, already stated in the criterion for 1280x800; the 390 line check
  needs the same).
