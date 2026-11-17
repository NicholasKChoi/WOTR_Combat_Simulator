# SGS-189 review 1

Verdict: APPROVE. Branch sgs-189-reorder-builds, tip b17652dd8bef709f3a6e7d049ff6b50ee28b629d, base origin/main.

## Blocking findings
None.

## Acceptance criteria
- Step order and multiset: pass. I rebuilt each file's expected order from the base by the ticket's index lists with a script. The branch steps equal it exactly (Knight/Longbow 74, Council Hall 61, every index used once). Non-step fields are identical. The diff is only moved lines (24/24 and 20/20 numstat).
- builds.test.ts unchanged and passing: pass. The diff touches no test other than research.acceptance.test.ts, and the implementer records the full `npm test` green. I did not rerun unit tests.
- Re-pinned conversion test: pass. The window comes from `result.steps[veteran].completedAt`, and `completedAt` is asserted defined. `after` is the first sample at or after it, with `expect(after).toBeGreaterThan(0)`. Tier 2 = 20 and tier 3 = 0 at `before`. Tier 2 = 0 and tier 3 = 20 at `after`. Tier 2 is 0 at every later sample. The final tier 3 count is 71. The non-zero tier-2 stock is asserted first. The two mutation checks the implementer recorded (leaving a unit unconverted; converting at start) both fail it. The report records the completion time (838.0186 s) and the counts. The title names the 20 it pins.
- Only the conversion test changes an assertion: pass (one test file in the diff).
- Acceptance specs: unverified. I run no Playwright, and the implementer did not run it either (acceptance-test gate owns it). The diff changes no assertion in any spec.
- Council Hall README: pass. I read the new paragraph against the new file order:
  - 660 s blacksmith with `steeled-arrow`
  - 690 s mining camp and move, then `iron-undermesh`
  - 780 s White Tower, then `bloomery` and `fitted-leatherwork`
  - 900 s farms, then `fertilization`, `veteran-longbowmen`, `veteran-spearmen`, `decarbonization`
  - then `lumber-preservation`, `textiles`, `specialized-pick` and two farms
  - then `insulated-helm`, `balanced-projectiles`, `wedge-rivets`

  The reorder is named as a transcription choice. Knight/Longbow README: unchanged. I checked each placement sentence against the new file order and none contradicts it:
  - `steeled-arrow` sits at index 29 and the other three blacksmith techs at 35, 42 and 45, all after `build kings-palace` at 27.
  - `produce knight` is at 46, followed by `veteran-longbowmen` and the four Castle techs.
- INVARIANTS: A3 holds. This is a static data reorder with no engine change, and the tests are deterministic. Other invariants have no touched path.

## Lint
`npx tsc --noEmit && npm run lint:dup` run in the task checkout: 0 errors, 0 clones.

## Bot
`reviewBot` is not configured; skipped.

## Non-blocking notes
- The README line "`insulated-helm`, `balanced-projectiles` and `wedge-rivets`. Past the population cap these techs spend part" is longer than its neighbours. This is cosmetic.
- The new README transcription-choice clause claims the order keeps the floors and cap. The `builds.test.ts` cases back this, per the implementer's green run.

## Coverage
Reviewed the diff of the 2 JSON files, the README and research.acceptance.test.ts. I also read the Knight/Longbow step list and the Council Hall README entry. No UI change, so no UI inspection. No unit or acceptance tests were run.
