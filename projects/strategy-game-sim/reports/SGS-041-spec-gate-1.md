# SGS-041 spec gate 1

Verdict: READY

Checks 1-12 pass. Scope names match the tree and design/M3.md (Modules rows for research.ts, effects.ts, model.ts; Behavior rules `research | multi-tier tech` and `research | notes`; Severity table; OpenAPI paragraph). Depends-on SGS-037 provides Severity; SGS-035 provides payCost and test-helpers. Risk high is correct (lib/** critical path, public schema change). Invariants A1-A3 are named and not contradicted. Docs in scope. No open questions. The grep criteria hold on main today (entry.name x2, byBaseId.get(step.tech)[0] x2). Code references check out: research.ts handler line 35, simulate.ts `researched: new Set()` at line 613, effects.ts activeEffects, `data.byId` exists for id lookup.

## Notes (non-blocking)
- effects.ts: today's `activeEffects` filters `e.type === 'technology'`. The ticket says "collects effects only from entries whose id is in researchedIds" and does not say whether the type filter stays. Snapshot upgrades have no effects (11 upgrades, 0 with effects), so results are the same either way, but a test using editGameData could add an effect to an upgrade. Suggest stating "keep the technology filter" or "drop it".
- Scope 5 says 34 `researched:` sites; grep finds 31 in lib/aoe4-build-order/*.test.ts. Tests like modified-value.test.ts that pass `researched: new Set(['wheelbarrow'])` and expect an effect must also supply the matching entry id in `researchedIds`, not an empty set, or the effect disappears. Worth one sentence.
- research.test.ts:400-402 asserts 'Bloomery' / 'Admiralty' display names in note messages; it needs updating to baseId wording (covered by the criterion allowing changed note messages).
