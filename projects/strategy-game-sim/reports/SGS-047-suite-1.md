# SGS-047 suite 1: PASS
- tsc, lint:dup (0 clones), next build: clean
- npm test: 995 passed (38 files)
- npm run acceptance: 527 passed
- Change: moved null/en-dash and m:ss formatting (formatStepTime, formatWaitBreakdown) from step-timeline.tsx into step-timeline-rows.ts, with unit tests. No behavior change.
- Tip: 5303896a3e4992974ad0b44206c4906c5d18842f
