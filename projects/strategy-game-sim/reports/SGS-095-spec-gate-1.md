# SGS-095 spec gate 1

Verdict: NEEDS_SPEC

Checked against origin/main 9274372. The local `main` ref is stale (ee7ecb9, where `MAN_AT_ARMS_STEP` is 23 and the comment reads "house lead-time rule"). The ticket's facts hold on origin/main.

## Verified
- Item 1: `MAN_AT_ARMS_STEP = 34` exists. The first `man-at-arms` produce in the build JSON is at array index 34, and the next two are 49 and 50 (they carry `instance`). The derivation rule is sound.
- Item 2: `describe('quoted ids in issue messages')` builds `cases` at collection (`sites.flatMap`, calling `run` and `expected`). The `it.each` title ends in `%#` (schema.test.ts line 370).
- Item 3: the "Re-pinned for villagerTarget" comment exists at simulate-house-warnings.test.ts line 167.
- Item 4: all three specs use goto + `networkidle`. The test 'clearing battles shows the server error and no results' exists. `submitFight` is attached via React `onSubmit`, so a pre-hydration native submit is plausible.
- Risk low (test-only), Invariants none, Depends none, On merge none, Diagrams not needed, Open questions none. No LESSONS conflict (the polling lesson is cited). Item 1's `instance` note is accurate.

## Gaps
1. Scope item 4 - the hydration signal is unspecified, and product code is out of scope - an implementer would guess. The page exposes no DOM signal for "handler attached". There is no `data-*` attribute, and `#fight-form` looks identical before and after hydration. Any observable state therefore means one of three things: (a) poll React's internal props key on the form element (`__reactProps$...`) via `page.waitForFunction`, (b) add a hydrated marker to `pages/apps/combat-simulator.js` (contradicts "Out of scope: product code" and the Risk comment), or (c) a click-retry loop, which hides the race. Proposed fix: pick one in Scope. Option (a) fits test-only scope; state it, or allow a minimal product marker and then fix Risk, the Scope header, and the `docs/combat-simulator.md` check. Also say whether a failed reproduction (flake not seen in 10+ repeats) still requires the helper change. The "different cause" clause suggests yes, but it is not explicit.
2. Acceptance criterion 4 (mutation check) - as written it cannot hold. 19 references to `checkSimInputs`/`simIssues` exist in schema.test.ts, so making `checkSimInputs` throw globally also fails unrelated tests outside the `quoted ids` describe, contradicting "other tests in the file still run and pass". Proposed fix: say the throw is injected only for one site's input (for example a `houseBuilderSource` value of the test's length), or reword to "the file still collects, and tests outside the affected rows' describe are unaffected by collection".
3. Acceptance criterion 3 - wording is ambiguous about the `simIssues` and `rally` helper definitions in the describe body. They reference `checkSimInputs` inside function bodies and are not called at collection. Proposed fix: "no call executes at describe-body time; calls only happen inside `it` callbacks" instead of a name-based search.

## Notes
- The ticket's "Source" line and Scope item 3 correctly note that the quoted comment text drifted. Fine.
- Item 1: both the `.find` and the `findIndex` + throw shapes are acceptable. Mention that JSON-import types make `action`/`unit` plain strings, so no cast is needed.
- Criterion 7 (10 repeats, several workers) is a good property. Name the exact command in the report so the later run is comparable.
- The local `main` ref is behind origin/main. Make sure the implementer branches from origin/main.
