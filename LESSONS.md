# Repo lessons

- Playwright checks that compare layout values (rects, SVG path coordinates, scroll offsets, label
  positions) read every value in one `evaluate` and wrap the comparison in `expect.poll` or `toPass()`;
  never compare values from separate calls. Why: Bootstrap's `scroll-behavior: smooth` and recharts
  redraws move elements between reads: reworks SGS-066, SGS-068, SGS-070, SGS-157 (end-y read per path),
  flakes in `pin-compare.spec.ts`, `aoe4-step-table.spec.ts`, and the step-band spec (SGS-162 RCA).
  Paths: `acceptance/**`.
  Retire when: the site drops `scroll-behavior: smooth` and the charts stop animating redraws, or
  `acceptance/helpers.ts` exports a helper that reads a set of layout values in one evaluate and every
  spec uses it.
