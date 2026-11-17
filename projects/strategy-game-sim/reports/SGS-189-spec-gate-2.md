# SGS-189 spec gate 2

**Verdict: READY**

I applied both reorders to a scratch checkout of origin/main (87f0cd7) with a script that follows the Scope's order lists. I then ran `npx vitest run lib/aoe4-build-order`.

## Checks

- **Orders.** Both lists are valid permutations of the 74 Knight/Longbow steps and the 61 Council Hall steps. Preserving the existing formatting gives a diff of 44 changed lines per file, so byte-for-byte step preservation is achievable.
- **Unit tests.**
  - Exactly one test fails: `research.acceptance.test.ts` "holds 20 tier-2 longbowmen ...", with `expected 838.018581311992 to be greater than 840`.
  - All other tests pass, including `builds.test.ts` for every build, `simulate-construction.test.ts` and `text-to-build.test.ts`.
  - This matches the ticket's claim that exactly one test moves and that the completion drops below 840 s.
- **Conversion re-pin.** The rule in the ticket can fail for a real reason. It derives the window from `completedAt`, asserts a non-zero tier-2 stock first, and asserts no tier 2 at any later sample.
- **Acceptance specs.**
  - I grepped the specs that load either build. The ones I read derive their indices and times from the result (`findIndex`, `indexOf`), so they do not pin step positions.
  - The ticket states this as a rule with examples rather than a closed list.
  - I did not run the acceptance suite.
- **README.**
  - The Council Hall paragraph has the three untrue clauses the ticket names. These are the 660 s `iron-undermesh`, the `bloomery`/`fitted-leatherwork` position, and the Castle blacksmith techs before `lumber-preservation`.
  - The Knight/Longbow entry still holds against the new order. The four blacksmith techs follow `build kings-palace` (27), and `veteran-longbowmen` and the Castle techs follow `produce knight` (new index 46). The 10:00 farm block comes after the third stable.
- **Other criteria.**
  - Invariants: A3 is named and nothing contradicts it.
  - Risk is low: no `criticalPaths` symbol is touched.
  - Dependencies: none.
  - On merge: `none`.
  - Unverified assumptions: `none` is correct.
  - Open questions: none.
  - Overlap: no throwaway-work overlap with SGS-190, which leaves these orders alone.
  - Input validation and diagrams: no trigger fires.

## Notes

- The current test also asserts `count(result, 'longbowman-3', 1800)` is 72. The re-pin rule does not say whether that final-count assertion stays. The implementer can keep it with the re-measured value, or drop it in favour of the "no tier-2 at any later sample" rule. Either is acceptable and neither is a blocker.
- design/M11.md still says the longbow counts move only. This is known, and the ticket is correct.
- The scratch checkout `spec-SGS-189` was removed. The edits to it were scratch only.
