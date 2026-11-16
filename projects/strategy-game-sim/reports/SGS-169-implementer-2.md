# SGS-169 implementer-2 (Rework 1)

- Branch: sgs-169-effect-not-simulated-debug-severity, tip 372f015b2be340b989b9da76d7bd7a3a0fe5b799
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-169-effect-not-simulated-debug-severity
- Touched: docs/aoe4-build-order.md line 483, "so the user sees" changed to "so an API client sees". Nothing else changed (1 line diff).
- Doc claim: "worded with the tech's `baseId` so an API client sees its effect is not simulated". Backed by researchNotes emitting tech-effect-unmodeled at debug, which only the API response carries.
- Tests, codegen, build, lint: not run; docs-only one-line change, as the checklist said to change nothing else.
- Invariants: no code touched.
- Status: needs_review
