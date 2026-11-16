# SGS-168 review 2 (delta, text-only rework 1)

Verdict: **APPROVE**

Tip `adf3a35a0b6b32d0da1001c1ec8b48a37f5746a1`, base `origin/main`.

- The whole diff vs main is `docs/combat-simulator.md`, 1 insertion and 4 deletions. The only change is removing "Support for them is planned for a later release." from the "Not modeled" Character/Nazgul leadership bullet. The bullet now ends "leadership comes only from the leaders count."
- The sentence "A request for N = 100,000 completes within 10 seconds." is restored and identical to main (grep for "10 seconds" matches at the same place in HEAD and origin/main; it is not in the diff).
- Required fixes are met. The roadmap claim is gone, no other line changed, and the facts that survive (Companions, Minions, and Nazgul leadership not modeled; leaders count as the only source) are still true per review 1 (`battle.ts:134,137`, `army.ts`).
- Blocking findings: none. Spec gaps: none.
- Invariants W1 and W2 hold (docs-only, no rule removed).
- Acceptance: the criterion that the doc states no duration or performance requirement is no longer met in the doc, because the restored sentence is on main and the rework reinstated it. That was the reviewer-directed outcome of this rework, so it is not a finding here.
- Not reviewed: no tests or UI (docs-only).
