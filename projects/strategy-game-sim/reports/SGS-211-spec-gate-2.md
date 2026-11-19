# SGS-211 spec gate (report 2)

Verdict: NEEDS_SPEC

Ticket lint: no errors, no warnings. Code read at origin/main; SGS-208 and SGS-210 are drafts with no branch, so their contracts were read from their ticket files.

## Gaps

1. Criteria (item 2), page spec "closed on first render and after a reload" - the spec saves nothing, and the page does not persist the editor text. `pages/apps/aoe4-build-order.tsx` starts `text` from `builds[0]` and restores only a pinned run from storage. After a reload the typed repeated line is gone, so no repeated row exists to check. The implementer would have to guess what "after a reload" means (save the build, which the spec forbids, or something else). Fix: drop "after a reload", or replace it with "after the same text is typed again" or "after the row re-renders on the next run". Keep "closed on first render".

2. Criteria (item 2), table-field bullet says "Covered by the spec below for the page", but the spec's cases do not cover most of it. The spec bullets never check: `step-field-repeat` is offered on a build row and a move row only; letters leave the step unchanged; `0` shows the inline `out-of-range` issue; a pasted `xN` row starts open. `actionFields` is not exported and the inline issue is rendered, so unit tests cannot cover these. Fix: add spec bullets for each of the four. For the inline issue, name the observable as the step's inline issue list containing text for code `out-of-range`; take the exact test id from `aoe4-step-table.spec.ts` rather than quoting a message.

3. Scope (item 2), "a row in the tests of `checkSaveBuildRequest` (`builds-routes.test.ts` and `named-builds-routes.test.ts` style)". The round-trip rule (`roundTripIssues`, the message `reopening it as text would change the build`) lives in `lib/aoe4-build-order/saved-builds.ts`, and its tests are in `saved-builds.test.ts` (the message assertion is near line 232, describe at line 133). The routes tests only call `checkSaveBuildRequest` to build fixtures. The implementer must guess the file. Fix: name `lib/aoe4-build-order/saved-builds.test.ts` for the new row.

## Notes (non-blocking)

- Changing a row's action closes the row (UI doc: "An edit that changes a row's action closes that row"; `step-table.tsx` `open.map((was, i) => i !== index && was)`). Build to move now keeps `repeat`, so the kept value sits in a closed row behind More options. This follows the existing rule, but say so in the UI doc edit, or state that the row stays open when the kept step sets `repeat`. The UI doc statement at line 74 may need an exception either way.
- The ticket says to grep for "changing a row's action carries only trigger and reaction". The grep found no such sentence in `docs/aoe4-build-order-ui.md` or `page-help.tsx`. The only nearby statement is the closing rule above. The Docs bullet can be reduced to that.
- The criterion "closed copy list holds exactly three `step-copy` items ... once opened" is ambiguous: items are in the DOM while closed, and the visibility check is the point. Reword: the list holds three items; they are not visible until it is opened.
- `step-field-repeat` last in the field list for build and move: the existing `aoe4-step-table` `optionalByRow` check only names subsets (build row `builders, then, walkSeconds`; move row `walkSeconds`), so it stays valid as the ticket claims.
- Verified correct against code: `COUNT`, `parseAction`, `withWalk`, `Tokens.end`, `formatAction` exist and match the ticket's description. `NODE_TOKEN` accepts `x9`, and `schema.ts` reports `unknown-id` for an unknown node, so the `move 3 sheep to x9` criterion holds. Existing `parse-text.test.ts` rows asserting `x3` after `walk 4s` or `-> sheep` on `produce` remain syntax issues. The format doc statements the ticket quotes (lines 67, 72, 96, 98, 102) match. The risk `standard` is right: no `criticalPaths` symbol is touched. `Unverified assumptions: none` is acceptable because the spec drives a real browser for the `<details>` keyboard toggle.
