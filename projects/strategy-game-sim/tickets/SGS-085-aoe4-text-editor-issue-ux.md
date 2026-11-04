# SGS-085: Polish text editor issue reporting (gutter mark, wording, all lines at once, Run feedback)

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog triage 2026-11-03: post-M4 UX fixes)
- **Priority**: medium
- **Risk**: standard
  <!-- Not low: changes user-facing issue wording and the exported checkBuildOrder/parseBuildOrderText shapes (additive); no criticalPaths symbol, no API/OpenAPI change, no strongModelTrigger. -->
- **Invariants**: none adjacent (A1-A3 cover the engine; this touches only checking and display)
- **LOC estimate**: ~80 (schema.ts ~15, parse-text.ts ~6, text-to-build.ts ~15, issue-list.tsx ~10, workbench.module.css ~5, page ~12; business logic only)
- **Depends on**: none (SGS-082 deletes `acceptance/aoe4-build-order.spec.ts`; this ticket neither edits nor adds tests there)
- **On merge**: delete the `BACKLOG.md` bullets for the text editor gutter, issue wording, text paste issues and Run with an invalid build (the textToBuildOrder keystroke-cost bullet is dropped too, see Scope 7); none otherwise
- **Source**: `BACKLOG.md` bullets "Text editor gutter ... `data-error`", "Issue wording (`schema.ts:304`)", "Text paste issues (`text-to-build.ts`)", "Run with an invalid build" (all from the post-M4 end-to-end pass 2026-11-02), and "`textToBuildOrder` now runs on every keystroke" (SGS-067 tech-lead)

## Context

The text editor lists issues for a paste, but four things work against the person fixing it: the bad line's number in the
gutter is not visibly marked, the wording leaks JSON field names (`in unit`) and runs the suggestion on without a
separator, a single syntax error hides every other line's unknown-id issues so errors are fixed one round at a time, and
clicking Run on a text with issues gives no message. Explored on main at `ee7ecb9`; every item was reproduced there. Re-explored for re-spec 1 on `b9481e3`.

## Scope

Paths are relative to the repo root.

1. **Gutter mark.** `components/apps/aoe4-build-order/build-text-editor.tsx` already sets `data-error="true"` on the `li`
   of each error line; no rule in `components/apps/aoe4-build-order/workbench.module.css` targets it. Add a rule on the
   gutter's `li[data-error="true"]` that makes the number bold and danger-coloured (`var(--bs-danger, #dc3545)`).
2. **Wording, field name.** `lib/aoe4-build-order/schema.ts`: `knownId` and `nodeAt` build `... in ${name}` into the problem
   text (`unknown unit "knigt" in unit`, `unknown node "wod" in from`, `unknown node "x" in start.villagers`). Carry the
   field name beside the text (a new optional member on `Problem`, passed through `report` in the issue `params` the way
   `suggestion` is) and append ` in <field>` in `toOrderIssue` only when the issue has no paste line, that is when `lines`
   is absent or has no entry for it. JSON-sourced messages (the route's `steps[0]: unknown unit "knigt" in unit`) do not
   change; a paste-sourced message ends after the offending value: `line 2: unknown unit "knigt"`.
   (respec 1) Update the Node references paragraph of `docs/aoe4-build-order.md` that says a step-field, `start` or
   `depleted`-trigger message reads `<reason> in <path>` (`unknown node "iron" in start.rally`): the ` in <path>` suffix
   appears only in a message without a paste line (JSON-sourced, the route's); a paste message reads `line N: <reason>`.
3. **Wording, suggestion.** `components/apps/aoe4-build-order/issue-list.tsx`: when `issue.suggestion` is set, render the
   message followed by `.`, a space, and the suggestion span (the `. ` join is added whatever the message ends with,
   including a closing quote or other punctuation; (respec 1)) (`data-testid="build-order-issue-suggestion"`, drop its
   `ms-2`) whose text is `Did you mean <suggestion>?`. The `li`'s text reads `line 2: unknown unit "knigt". Did you mean knight?`.
   Update the paragraph in `docs/aoe4-build-order.md` that says the list "adds `did you mean <id>?`".
4. **All lines at once.**
   - `lib/aoe4-build-order/parse-text.ts`: the failure variant of `ParseTextResult` also carries the steps and `start`
     that parsed as `partial: { order: BuildOrder; lines: BuildOrderLines }` (same shapes as the success variant, built
     from the lines without a syntax error). Its `issues` stay the syntax issues only, so the table view's
     `step-table-unavailable` notice (`parsed.issues[0].message` in the page) and `step-timeline-rows.ts` are unchanged.
   - `lib/aoe4-build-order/schema.ts`: `checkBuildOrder` takes an optional fourth argument that limits the check to field
     checks and each step's cross-field rules (skipping the `start` rules and the cross-step rules, which depend on every
     line being present, as the "Checks run in three tiers" text in the design doc already says). Name it for what it
     does, not who calls it. Default behaviour is unchanged.
   - `lib/aoe4-build-order/text-to-build.ts`: on a parse failure, run that limited check on `partial` and return
     `{ ok: false, issues }` with the syntax issues and the check issues merged in ascending line order (a syntax issue
     and a check issue never share a line). The result still has no `lines` member, so the page keeps showing these issues
     live, without a Run.
   - (respec 1) The merge is a stable sort by `line` with every issue that has no `line` placed before every issue that
     has one. Issues without a line keep their check order among themselves, and issues on one line keep the order they
     had. In a paste the only check issues without a line are the order-level ones (`civ`, `name`, the step-count cap
     `N steps, more than 200`), which check order already puts first. A `start` issue has a line whenever `partial`
     has a `start`, because `partial.lines.start` is set exactly when the `start` line parsed.
   - (respec 1) Check issues returned on a parse failure have no `step` member: the index would point into
     `partial.order.steps`, which `textToBuildOrder` does not return. They keep `line`. A text that parses still
     returns `step` and `line` as today.
   - A text with no syntax error behaves as today: check issues stay hidden until the first Run (`checked` in the page).
   - Update the design doc's page paragraph ("parse issues (and the length cap) show at once, and check issues show from
     the first Run on", and "It lists every issue in check order") to say that, while any line fails to parse, the
     field and per-step issues of the lines that did parse are listed with the syntax issues at once, in line order
     with line-less issues first; otherwise the list is in check order as today.
   - (respec 1) Update the **Issues** paragraph of the design doc (the one that says only `textToBuildOrder` sets
     `line` and lists which issues carry `step` and `line`): a check issue on a parsed paste step carries `step` and
     `line` when the text parses, and `line` only while another line fails to parse. Its other statements stay.
   - (respec 1) Update the design doc's mermaid flowchart node `t2b` (now `textToBuildOrder: 20,000-char cap,
     parseBuildOrderText, checkBuildOrder with lines`) so it shows both paths: the full check with lines when the text
     parses, and the limited check (field and per-step rules) on the parsed lines when a line fails to parse. The
     edge labels and the other nodes do not change.
5. **Run with issues.** `pages/apps/aoe4-build-order.tsx`: `rejection` is set when Run finds `converted.ok === false`;
   reset it to `null` when a Run converts. Pass `rejection !== null` to `IssueList` (new prop, for example `rejected`),
   which then renders, above the list and inside `build-order-issues`, a paragraph `data-testid="build-order-issues-summary"`
   with the text `Fix 1 issue to run the simulation.` for one issue and `Fix N issues to run the simulation.` for N > 1
   (N is the number of listed issues). (respec 1) The summary stays while `rejection` is set and N tracks the list
   as it changes: an edit that leaves issues shows the summary with the new count, and an edit that leaves no issue
   shows no summary because the list itself is not rendered. Run stays enabled and still sends nothing, clears the shown result, selects Build
   and scrolls as the design doc describes; the summary is the visible response. Update the sentence about a text that
   does not convert in the design doc.
6. **Tests to edit (rules; respec 1).** The implementer lists every test it edits.
   - Any unit or acceptance test that pins a paste-sourced `... in <field>` message or the old suggestion text
     (`did you mean <id>?`) takes the new expected value.
   - Any unit or acceptance test that asserts a text with a syntax error lists only syntax issues, that check issues
     are hidden while a line fails to parse, or that `textToBuildOrder` returns a parse failure equal to
     `parseBuildOrderText`'s result, takes the new expectation: the syntax issues plus the field and per-step issues
     of the parsed lines, merged as Scope 4 says. A test whose failing text has no check issue on its other lines
     keeps its expected value.
   - JSON-sourced expectations (`steps[N]: ... in producer`, route 400 bodies) keep their expected values.
   - Do not add or edit tests in `acceptance/aoe4-build-order.spec.ts`.
7. **Dropped from the source bullets.** The keystroke-cost bullet no longer needs a fix: measured on main with the English
   catalog, `textToBuildOrder` on 200 steps / 11,199 characters took about 3 ms per call (parse alone about 0.6 ms) and the
   input is capped at 20,000 characters, so no debounce is added. The implementer does not need to re-measure.

**Out of scope:** debouncing; disabling Run; changing route (JSON) messages or `docs/api/openapi.json`; the table view; other
messages that name JSON fields (`count: 0 is outside 1..200`, `trigger.seconds`); the remaining backlog bullets (sticky bar,
tab keyboard navigation, marker labels).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] On the page, the gutter number of a line with an issue has computed `font-weight` 700 and a computed `color` different
      from a non-error line's number (case in `acceptance/aoe4-build-order-inline-issues.spec.ts`: paste `start -> sheep` and
      `at 8 vils fly capital-town-center` (INVALID_PASTE), assert both computed values on line 2 and line 1; fails if the CSS rule is absent).
- [ ] `textToBuildOrder('start -> sheep\nproduce knigt from stable', catalog)` returns the issue message
      `line 2: unknown unit "knigt"` with `suggestion: 'knight'`; `build hous from wood` gives `line N: unknown building "hous"`;
      `produce villager from capital-town-center -> wod` gives `line N: unknown node "wod"`.
- [ ] `checkBuildOrder` on a JSON order (no `lines`) still returns `steps[0]: unknown unit "knigt" in unit` and
      `steps[2]: unknown building "nowhere" in producer`; the route's 400 messages are unchanged (unit test in `schema.test.ts`).
- [ ] An issue with a suggestion renders as the exact `li` text `line 2: unknown unit "knigt". Did you mean knight?` and the
      suggestion span's text is `Did you mean knight?`; an issue without a suggestion has no `.` appended and no suggestion span.
      (respec 1) A suggestion issue whose message already ends in punctuation is still joined by `. ` (component test row
      with a message ending in `)` and suggestion `knight`: text is `<message>. Did you mean knight?`).
- [ ] Test case (text-to-build.test.ts): `start -> sheep\nproduce knigt from stable\nbuild hous` (line 3 fails to parse) returns
      `ok: false` with two issues in line order: `line 2: unknown unit "knigt"` (`unknown-id`, line 2, suggestion `knight`) then the
      line 3 syntax issue. It catches a regression to "parse failure hides check issues". A second row: `start -> sheep\nfly\nproduce knigt from stable\nbuild house from wod\nbuild`
      (lines 2 and 5 fail to parse, lines 3 and 4 hold unknown ids) returns all four issues, ordered by line 2, 3, 4, 5.
      No returned check issue has a `step` member (respec 1).
- [ ] (respec 1) Test case (text-to-build.test.ts), line-less ordering: `start -> sheep`, then 201 lines of
      `pause capital-town-center`, then `fly` (the last line fails to parse; the text stays under the 20,000-character cap)
      returns `ok: false` whose first issue is the step-count cap issue (`out-of-range`, no `line`, message ends
      `more than 200`) and whose next issue is the `fly` line's `syntax` issue with that line's number. It catches a merge
      that sorts line-less issues last or treats a missing line as 0 inconsistently (unstable order), and a limited
      check that drops the step-count cap.
- [ ] Test case (text-to-build.test.ts): a text whose `start` line fails to parse and whose other lines are valid
      (`start nonsense\npause capital-town-center`) returns only the `start` syntax issue; no `start: no start.rally ...` issue
      and no cross-step issue (for example a repeated `research`) appears for a text with any syntax error. Catches the limited
      check running the `start` or cross-step rules on a partial order.
- [ ] Test case (text-to-build.test.ts): a text with a syntax error on one line and `produce longbowman from stable` on another
      still reports `line N: stable cannot produce longbowman` (a per-step cross-field rule runs on the lines that parsed).
- [ ] `parseBuildOrderText` on a failing text returns the same `issues` as before, plus `partial` holding only the lines that
      parsed, with `partial.lines.steps[i]` the paste line of `partial.order.steps[i]` (parse-text.test.ts, a text where the first
      step line fails so the indexes shift).
- [ ] In the browser, pasting `start -> sheep\nproduce knigt from stable\nbuild hous` shows, without clicking Run, two issues
      (line 2 `unknown-id`, line 3 `syntax`) and both gutter lines marked; fixing line 3 so it parses hides line 2's issue again
      until the first Run (the existing "check issues wait for the first Run" behaviour).
- [ ] In the browser, clicking Run on a text with one issue shows `build-order-issues-summary` with exactly
      `Fix 1 issue to run the simulation.`, and with two issues exactly `Fix 2 issues to run the simulation.`; nothing is POSTed
      to the simulate route; the summary is absent before the first rejected Run and absent after a Run that converts
      (acceptance case in `acceptance/aoe4-build-order-client-check.spec.ts` or `-inline-issues.spec.ts`, using `runRejected`).
      (respec 1) After the two-issue rejected Run, an edit that fixes one issue shows exactly
      `Fix 1 issue to run the simulation.` without another Run.
- [ ] `docs/aoe4-build-order.md` describes the new live-issue rule and its line order, the `Did you mean <id>?` text, the
      omitted field name in paste messages (Node references paragraph: ` in <path>` only without a paste line), the `line`-only
      check issues on a parse failure (Issues paragraph), the limited check in the `t2b` flowchart node, and the summary line
      (respec 1); `git grep -n "did you mean <id>" docs README.md ARCHITECTURE.md` finds no match (the doc names
      `Did you mean <id>?`); `git grep -n "checkBuildOrder with lines\"\]" docs/aoe4-build-order.md` finds no match (the
      `t2b` node names both paths).
- [ ] `npx tsc --noEmit`, `npm run lint:dup` and `npm test` pass; `npm run acceptance` passes with no test added to or edited in
      `acceptance/aoe4-build-order.spec.ts`.
- [ ] No INVARIANTS.md regressions

## Open questions

None blocking. Chosen without the owner (reversible): Run keeps being enabled and shows a summary line rather than being
disabled, because check issues only appear after the first Run, so a Run disabled "because of issues" would hide the reason.

## Re-spec 2026-11-04

- Underspecified: where line-less issues go in the parse-failure merge, the existing-test rule for syntax-error texts that now list check issues, and three doc passages (Node references ` in <path>`, Issues paragraph, `t2b` flowchart node) that Scope 2/4 make untrue.
- Changed: Scope 2, 3, 4, 5, 6 and criteria tagged `(respec 1)`: stable sort with line-less issues first plus a 201-step test row; check issues on a parse failure carry `line` without `step`; general test-edit rules replace the named examples; `. ` join regardless of punctuation; summary N tracks edits.
- No branch exists yet; nothing to keep or discard.
