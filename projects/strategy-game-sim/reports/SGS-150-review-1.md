# SGS-150 review 1

Verdict: APPROVE. Tip 9450b3493428bdb3afc255d6013a16a26e995353, diff of two spec files only (`git diff --stat`: step-band spec, small-screen spec).

## Blocking findings
None.

## Acceptance criteria
1. No assertion removed or weakened: pass. Step band: the five transitions are kept (focus under, hover start clears, focus duration-seconds, hover target draws, focus start-row control clears). The old `bands`/`activeRows` counts are now one evaluate; additions are `active: 1` when drawn and a cleared check after focusing `duration-seconds`. Small screen: the `static` check, run status 200 and unchanged scroll, and the Build-tab check are untouched. `barTop` not-a-number plus `< 0` became `barAbove: bar.top < 0`, and `overlaps: 0` and `scrolled: true` are in the same toEqual. Nothing is looser.
2. Small-screen reads: pass. `before` is polled until `> 0` (scroll confirmed to take effect). Scroll, bar position and title overlap are read in one polled evaluate with an instant scroll. `settledScrollY` was already one evaluate.
3. Step-band settle: pass. Each step is `expect.poll` over one evaluate. The real cause (smooth scroll from hover() moving rows under the pointer, late pointerenter) is addressed at the root: the page is scrolled instantly up front so no step scrolls. This matches the implementer's reproduced cause (10/30 at base) and the Lessons entry on smooth scroll.
4. Mutation checks: pass, recorded in the implementer report (sticky at <768px fails the static check, then barAbove with the static check removed; removing the start row's onFocus or onPointerEnter clear fails `expectState(cleared)`). I did not re-run them (no test runs at review).
5. Repeat runs: pass on the record (both tests, 60 repeats, 10 workers, 120 passed; whole files 8 repeats, 168 passed). Base reproduction recorded for step-band; small-screen reported as not reproduced and hardened, as the ticket allows.
6. `tsc --noEmit` and `lint:dup` pass (I ran both: 0 clones). No production files changed.
7. Invariants: none apply; no regression.

Chore check: no owner-visible behavior change, no pre-existing assertion changed.

## Bot
`reviewBot` has no cli; skipped.

## Conventions
The lesson entry in LESSONS.md line 3 (one evaluate or poll) is followed. `scrollInstantly` style matches helpers.ts:228. The one added comment states a hidden constraint and is accurate. The Lessons candidate (hover/focus smooth scroll) is for the manager to decide.

## Non-blocking notes
- The `visible` precondition (acceptance/aoe4-build-order-step-band.spec.ts, start-row test) checks only that each row's vertical centre is `<= innerHeight`. It does not check a row is fully in view, which is what makes Playwright skip scrolling. It is deterministic at the fixed viewport and passed 120 runs, so I did not block.
- The ordering depends on `duration-seconds` not triggering a scroll when focused after the up-front scroll; passed 120 runs, so it holds in practice.
- Small-screen test: the one-shot `expect(await barPosition(page)).toBe('static')` right after openPage is unchanged and reads a computed style, not layout, so not a flake source.

## Coverage
Reviewed both spec diffs in full, helpers.ts scroll helpers, LESSONS.md layout entry, and the implementer report. UI inspection not applicable (test-only diff). No tests run.
