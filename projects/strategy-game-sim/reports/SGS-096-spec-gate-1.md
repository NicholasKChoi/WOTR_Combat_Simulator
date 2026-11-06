# SGS-096 spec gate 1

Verdict: READY

Checks:
- Grounded scope: docs/aoe4-build-order.md line 875 holds the only "follows its current" statement (grep over docs, README.md and ARCHITECTURE.md finds that one hit). The spec case "the pinned legend item toggles only the pinned line" exists at acceptance/aoe4-build-order-pin-compare.spec.ts:80. chart-rows.ts has pinnedKey and toggleHidden, and chart-rows.test.ts has a toggleHidden suite.
- Testable criteria: the new case names the testids, opacity, aria-pressed counts and line presence. It pins no stale numbers or lists. The grep criterion holds in the end state.
- Open questions: none. Q12 and Q13 are answered and reflected in the ticket.
- Invariants: none adjacent. Contracts: the `pinned:<key>` key matches the code. Depends-on: none.
- Size: 0 business-logic lines. Diagrams: not triggered. LESSONS: the Playwright lesson concerns layout rects, which this case does not use.
- Risk low: no criticalPaths symbol and no strongModelTriggers hit. On merge: BACKLOG cleanup is a manager follow-up, which is fine.
- Docs: the doc fix is in Scope. Input validation: not applicable.

Notes (non-blocking):
- The new case should reuse the existing spec's `openPage`, `runOk`, `pin` and `path` helpers. It can share setup with the existing case.
- Q12 and Q13 are still marked as open in QUESTIONS.md, which currently has uncommitted changes. The manager should mark them answered.
