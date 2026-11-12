# SGS-129 spec gate 1

**Verdict: READY**

## Checks run
- Base origin/main (cdc51b1). Ran `npx tsc --noEmit --strict --incremental false` in a detached worktree: exactly three TS7053 errors, at `lib/combat-simulator/simulate.test.ts` (61, 198) and `acceptance/fight-api-contract.spec.ts` (144). This matches the ticket and design M9.13.
- tsconfig.json at base has `strict: false` and `strictNullChecks: true`, as the ticket quotes.
- `git grep strictNullChecks`: only tsconfig.json and `ARCHITECTURE.md` line 11 ("TypeScript 7, `strict: false` with `strictNullChecks: true`"). The ticket names the ARCHITECTURE.md Stack section. Both are in Scope, so no stale doc is left.
- `FightOutcomes = Record<OutcomeKind, OutcomeTally>` (`lib/combat-simulator/fight-api.ts:23`). The errors come from string indexing. A typed `Record<string, OutcomeTally>` view fixes them without `any` or suppressions.
- No other M9 ticket in TASK-GRAPH edits tsconfig or these two test files, so there is no throwaway-work overlap. The ticket covers the ordering risk ("if tsc reports further errors... fix those the same way").
- Invariants: none touched. No assertion changes. Risk `low` is right (config plus typing-only test edits, no criticalPaths symbol changed). On merge `none` is valid. Unverified assumptions `none` is fine (no external service). No open questions. No diagram trigger. No validation boundary.

## Gaps
None.

## Notes (non-blocking)
- ARCHITECTURE.md line 11-12 also says `tsconfig.json` only type-checks `.ts`/`.tsx`, yet `include` lists `pages/apps/combat-simulator.js`. This is pre-existing and out of this ticket's scope. The implementer may reword the sentence while editing that line.
- Context's "exactly three errors" is a base-time count. It is verified, and Scope covers later errors with a rule, so it is not a criterion gap.
- Because SGS-129 has no dependencies and the other M9 tickets add code, whichever merges second must be strict-clean. The tech-lead should merge SGS-129 early or rebase the others against it.
