# SGS-079 spec gate 1

Verdict: READY. Risk: low confirmed (docs only, one README section, no criticalPaths symbol, no strongModelTriggers).

Checked against main ee7ecb9:
- Scope section exists (README lines 34-65 region); counts reproduce: criterion 1 prints 6 (lines), criterion 2 prints 13 distinct values.
- Inputs that stay are real JSON values (rally times 130/200/560/760 are time triggers in the spear build), so the input/result rule is unambiguous.
- No test, lib or app code reads the README. docs/aoe4-build-order.md "Prebuilt builds" paragraph has no measured values; its 0:21/7:42 line (758) is a message-format example, as the ticket says.
- Diagrams, invariants, contracts, deps, On merge, input validation: not applicable.

Notes (non-blocking):
- The grep criteria do not catch every removed value: "0:21", "(21.2 s)" is caught only by criterion 1, "0:21" and "never reached by 3600 s" are not checked by either. Consider adding `0:21|never reached` to criterion 2 or a third grep.
- Criterion 1 counts lines, not matches (line 35 holds two values); fine as written but the implementer should not read "6" as six values.
- Knight entry "5 deposits run out by 3600 s" is a count, so it stays per the rule, though it is derived from a run; the ticket's spear example treats the same phrasing as allowed. Keep consistent.
- Owner's 2026-11-02 "docs state behavior only" may widen this in M5 to docs/aoe4-build-order.md (e.g. line 758 example); does not change readiness here.
