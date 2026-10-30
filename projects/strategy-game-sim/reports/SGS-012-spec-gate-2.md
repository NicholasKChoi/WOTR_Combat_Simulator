# SGS-012 spec gate 2 (respec 2)

Verdict: READY

Checked against branch worktree at 7ab5aee: next-env.d.ts is tracked, AGENTS.md absent, .gitignore lacks both entries, vitest.config.ts is the only config and is referenced only by its own import, tsconfig include lacks **/*.mts, existing include entry pages/apps/combat-simulator.js present. M2.10 and SGS-023 exist. Item 5 gaps from the implementer report (flake, next-env.d.ts, AGENTS.md, vitest warning) are now covered with observable criteria. No open questions. Risk high is correct (framework majors under /api/fight and invariants S2, H1-H3, W1-W2 adjacent). Invariants not contradicted.

Notes (non-blocking):
- design/M2.md still says Recharts 2.15.4; the ticket's On merge hands this to the designer. Fine, but M2 tickets must not start until that lands.
- LOC estimate ~20-30 is business logic only; fine.
- The `npm run dev` criteria (next-env.d.ts regenerate, AGENTS.md absent) need the dev server stopped afterward; acceptance already starts its own.
- Vercel check cannot be confirmed until the branch is pushed; implementer must push.
