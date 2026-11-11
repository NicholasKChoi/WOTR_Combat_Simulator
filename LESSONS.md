# Repo lessons

- Playwright layout checks read every rect in one `page.evaluate` (or wrap the check in `expect.poll`); never compare two sequential `boundingBox()` calls. Why: Bootstrap's `scroll-behavior: smooth` and recharts redraws moved elements between reads, causing flaky reworks (SGS-066, SGS-068, SGS-070) and flakes in `pin-compare.spec.ts` and `aoe4-step-table.spec.ts`.
