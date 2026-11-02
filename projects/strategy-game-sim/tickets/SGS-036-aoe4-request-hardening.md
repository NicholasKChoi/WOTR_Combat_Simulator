# SGS-036: Harden the simulate request: issue cap, NBSP, pre-start lines, sparse steps

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.8 (issue list capped, NBSP and pre-start line counting, sparse steps rejected; backlog: route narrows with `ok`)
- **Priority**: medium
- **Risk**: high
  <!-- Plan said low. High per the template: lib/** is a REPO.md criticalPath, and the diff adds a cap that
       enforces S3 and an optional field to the existing SimulateError response. -->
- **Invariants**: S3 (every list an API route returns is capped; this ticket adds the cap), A2/A3 not touched
- **LOC estimate**: ~45 (`simulate.ts` route ~12, `api.ts` ~4, `parse-text.ts` ~4, `validate.ts` ~4, page ~12; tests, docs and OpenAPI excluded)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M3.md "Route" (`MAX_REPORTED_ISSUES`), Left-to-tickets table rows "paste parse NBSP", "paste parse pre-`start` lines", "validate sparse `steps`", "route issue cap"; plan M3-20261101 outline B

## Context

A request can return an unbounded `issues` array (up to one per line of a 20,000-character paste), which S3
requires to be capped. Three smaller defects ride along: U+00A0 and U+202F inside a pasted line are not
whitespace, a pasted line that fails to parse still counts as a step for the "`start` must come before every
step" rule, and `validateBuildOrder` skips holes in a sparse `steps` array.

## Scope

All paths are at base `origin/main` f078c11.

1. `lib/aoe4-build-order/api.ts`: export `MAX_REPORTED_ISSUES = 100`; `SimulateError` becomes
   `{ error: string; issues: BuildOrderIssue[]; omittedIssues?: number }`.
2. `pages/api/aoe4-build-order/simulate.ts` (`handler`, `checkOrder`):
   - Collect order issues then inputs issues exactly as today (`[...order.issues, ...inputs.issues]`), then cap.
     `issues` is the first `MAX_REPORTED_ISSUES` entries; `error` stays `issues[0].message`;
     `omittedIssues` is `total - MAX_REPORTED_ISSUES`, present only when above 0 (100 issues: absent; 101: `1`).
     The cap applies after all issues are combined, so inputs issues beyond the 100th are omitted too.
   - Replace `'issues' in parsed` (`checkOrder`) with `!parsed.ok`. `ParseTextResult` already carries `ok`.
3. `lib/aoe4-build-order/parse-text.ts`:
   - `WHITESPACE` (line 22) matches U+00A0 and U+202F as well as space, tab and `\r`; update its comment.
     Lines still split on `\n` only.
   - `sawStep` (lines 223, 263) is set only when a step line parsed successfully. A line that fails to parse
     does not make a following `start` line a "`start` must come before every step" issue. A failed `start`
     line still counts as a seen `start` (unchanged).
4. `lib/aoe4-build-order/validate.ts:189`: replace `steps.forEach(...)` with an indexed `for` loop so a hole at
   index `i` reaches `checkStep(undefined, i)` and is the same `syntax` issue as a non-object step.
5. `pages/apps/aoe4-build-order.tsx` (`errorMessages`, the `simulation-error` list): read `omittedIssues` from
   the 400 body and, when it is a number above 0, append one list item `N more issues not shown.` (the design's text, used for any N). Keep the list inside
   `simulation-error`.
6. `docs/api/openapi.json` `SimulateError`: add optional `omittedIssues` (integer, minimum 1, description: count
   of issues dropped past the cap), add `maxItems: 100` to `issues`, and fix the `issues` description ("Every
   issue found" is no longer true). Keep `additionalProperties: false` and `required: [error, issues]`.
7. `acceptance/aoe4-simulate-api-contract.spec.ts:298`: the `Record<keyof SimulateError, true>` map gains
   `omittedIssues: true`, or the type check fails.
8. Docs made untrue, fixed here:
   - `docs/aoe4-build-order.md` ~line 487-491 (400 response: "`issues` lists every `BuildOrderIssue`") states the
     cap, `omittedIssues`, and that the cap follows M2 order after combining order and inputs issues.
   - ~line 409-411 and 417-419 (paste tokenization and the `start` rule) state NBSP/U+202F as whitespace and that
     only a parsed step line makes a later `start` an issue.
   - ~line 63 (steps bound) notes that a hole in a `steps` array is a `syntax` issue on that index
     (reachable only from library callers; JSON cannot carry holes).
   - ~line 573 (page 400 display) mentions the "N more issues not shown." line.

**Out of scope:** `Severity` on issues, any other `SimulateError` field, `BuildOrderIssue` shape, the
200-step `out-of-range` rule, parse-text's own `GATHER_NODE_ORDER` (left to the paste-grammar ticket),
splitting lines on anything but `\n`, other docs (the final audit ticket checks the whole).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] A request whose order and inputs produce 101 issues (for example `text` of 101 unparseable lines) returns
      400 with `issues.length === 100`, `omittedIssues === 1`, and `error === issues[0].message`.
- [ ] Exactly 100 issues returns 400 with 100 issues and no `omittedIssues` key.
- [ ] With 60 paste issues and 60 inputs issues (120 total), `issues` is the 60 paste issues then the first 40
      inputs issues, and `omittedIssues === 20`.
- [ ] A 400 body with `omittedIssues` validates against `SimulateError` in `docs/api/openapi.json` (ajv, in the
      contract spec); a body with 101 `issues` or `omittedIssues: 0` does not.
- [ ] On the page, a 400 with `omittedIssues: 5` shows the listed messages plus `5 more issues not shown.`
      inside `simulation-error`; a 400 without it shows no such line.
- [ ] `parseBuildOrderText` treats `produce villager from capital-town-center` and the same line with
      ` ` exactly as the space-separated line.
- [ ] A text of an unparseable line followed by a valid `start` line yields only the unparseable line's issue,
      not a second "`start` must come before every step" issue; a valid step line followed by `start` still
      yields that issue.
- [ ] `validateBuildOrder({ civ: 'english', name: 'x', steps: [step, , step] }, data)` (a hole at index 1) returns a
      `syntax` issue with `step: 1` identical to the one for `steps: [step, null, step]`.
- [ ] `git grep -n "'issues' in parsed" -- pages lib` finds nothing after the change (one match today) and
      `checkOrder` narrows on `ok`.
- [ ] `git grep -n "steps.forEach" -- lib/aoe4-build-order/validate.ts` finds nothing after the change (one match today).
- [ ] Mutation: changing `MAX_REPORTED_ISSUES` handling to slice 101, or dropping the `+ U+00A0` from `WHITESPACE`,
      or restoring `sawStep ||= !isStart`, each fails a named test above.
- [ ] `docs/aoe4-build-order.md` and `docs/api/openapi.json` match the code for every item in Scope 6 and 8.
- [ ] `npx tsc --noEmit`, `npm test` and `npm run acceptance` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
