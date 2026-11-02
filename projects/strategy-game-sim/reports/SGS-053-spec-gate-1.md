# SGS-053 spec gate 1

Verdict: NEEDS_SPEC (one small gap; otherwise ready)

Checked against main code and docs: parse-text.ts:260 (syntax issue, line only), simulate.ts:246-247 and unitSeries sort, page text at pages/apps/aoe4-build-order.tsx:35 and :63, houses.ts:25 and villagerWalk, effects.ts:79 and :89, effects.test.ts:57-59, mermaid block, design/M2.md lines 31/140/198/369. All cited facts hold; grep counts in the criteria are correct today (shaft-mining 1, admiralty 0, EffectState 0). Risk low is right (docs only, no lib/** change). No invariants adjacent. No open questions. On merge covers the state-branch design/M2.md edits.

## Gaps
1. Docs / Scope item 7 - docs/aoe4-build-order.md ~line 272 also says "Builders walk `inputs.walkSeconds` each way" for the builder walk, the same stale claim as ~line 221 (code divides by the villager moveSpeed multiplier). An implementer fixing only line 221 leaves a contradicting sentence, and the builder-walk criterion would pass anyway. Fix: add line 272 to item 7 (reword to `inputs.walkSeconds / moveSpeedMultiplier` each way) and extend the criterion to "every builder-walk statement". Also decide whether ~line 219 "a `start.rally` route uses `inputs.walkSeconds`" gets the divisor (villagerWalk divides any walk); say so in the ticket.

## Notes
- Context says "root so every later M3 ticket rebases on corrected text", but only SGS-054 lists SGS-053 as a dependency. Fine for correctness; just not enforced ordering for other doc-editing tickets (conflict risk only).
- Line numbers drift (effects.ts exports at :79/:89 are correct; the Issues paragraph is at ~422, not 421). Harmless given "~".
- Mermaid: new edge `parse -->|"syntax issues"| error` is valid before/after `error` is declared; the existing unlabeled `parse --> validate` could be labeled "ok" for symmetry (optional).
