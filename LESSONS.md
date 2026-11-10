# Repo lessons

- Playwright layout checks read every rect in one `page.evaluate` (or wrap the check in `expect.poll`); never compare two sequential `boundingBox()` calls. Why: Bootstrap's `scroll-behavior: smooth` and recharts redraws moved elements between reads, causing flaky reworks (SGS-066, SGS-068, SGS-070) and flakes in `pin-compare.spec.ts` and `aoe4-step-table.spec.ts`.
- In Vitest, CSS-module imports are proxies (vitest.config.mts sets no `css` option): `styles.x` is always "x", so asserting a className contains `styles.x` cannot fail on a style bug. Assert the class only to prove which branch rendered, and pin visual state in Playwright with getComputedStyle.
  Why: SGS-108 r1 dictated a `styles.stale` assertion that review 2 found could not fail; step-annotation.test.ts:33-39 is in BACKLOG for the same reason.
