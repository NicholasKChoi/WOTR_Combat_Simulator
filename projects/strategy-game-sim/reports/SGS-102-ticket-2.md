# SGS-102 ticket re-spec 2

File: projects/strategy-game-sim/tickets/SGS-102-wire-auto-run.md (rewritten in place; Re-spec 2026-11-09 (2) change log appended).

Folded all five blocking findings: (1) no-Run criterion asserts on the run-simulation test id and /^run\b/i; (2) stale grep narrowed to results-stale, .stale, stale=; (3) postSimulation closed list replaced by "no local definition in the page, fetch( only in simulate-client.ts"; (4) BuildInput gets one onBuildSelect prop, selectBuild calls only it, the page handler does setSelected, set text, flush; (5) omitted-issues li has data-testid build-order-issues-omitted, and the Fix N summary counts listed issues only.
Also folded: paused clock for the under-500 ms assertion, "every results-stale assertion", the small-screen scroll-margin test named and rewritten or removed, held page.route responses released at test end, controller created in an effect.
No open questions. Diagrams unchanged. Greps were checked against origin/main: the narrowed stale grep matches today only in results.tsx, the page and the CSS (all removed by Scope).
