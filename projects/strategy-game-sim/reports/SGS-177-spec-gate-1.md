# SGS-177 spec gate 1

**Verdict: READY**

Checked at origin/main (fetched). The ticket is test-only, so I read `lib/aoe4-build-order/simulate.test.ts` and the three scanned sources; I ran no tests.

## Check results
- Grounded scope: `literalsOf` exists at lines 823-837 of `simulate.test.ts`. It strips `//` with `/\/\/.*$/gm`, blanks quoted strings with `'[^']*'|\`[^\`]*\``, and blanks `/^...$/` regexes. All of this matches the ticket's description. `source()` is at line 811.
- Testable criteria: the criteria are behavioral. They name an apostrophe, a backtick, `/* 42 */` and a `//` inside a string. None pins a count or line number. The "same allowed literals and counts" in criterion 1 is the existing rule (`5` once in simulate.ts, `1e-9` in engine-common.ts), so it is acceptable.
- Open questions: none. Invariants: none touched. Contracts: none. Size, risk, On merge and Unverified assumptions all fit a test-only change.
- Docs: the "avoid `'` and backticks" rule is not stated in the scanned sources, per the ticket's own search at the base. I did not repeat that search.
- Throwaway work: no other open ticket touches this helper (TASK-GRAPH row only).

## Notes (non-blocking)
- `simulate.ts`, `civ-rules.ts` and `engine-common.ts` contain no `/^...$/` regex literal today. The ticket's "regex literals the scan already blanks" is vestigial but harmless. The implementer can keep the `/^...$/` blanking inside the new pass, or drop it if the scan still passes. Dropping it would break the "Keep ... unchanged" wording. It is safer to keep it, but not as a general regex tokenizer.
- Template-literal `${...}` expressions are blanked today, so a number inside one is ignored. The new pass should keep that behavior and not become stricter. Criterion 1 (passes on the current sources) covers this.
- The third Scope bullet ("Examples of the same helper's neighbors") is informational. The implementer should leave the `exports exactly` test alone.
