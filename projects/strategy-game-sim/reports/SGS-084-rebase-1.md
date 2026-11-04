# SGS-084 rebase 1
- New tip: 5c9a348 (branch sgs-084-aoe4-gather-rate-per-villager; was b37d345). Base: origin/main 9dfe36ff7200d7705ab4a8017b5dc3622cada9fd. Not pushed. Two commits replayed (764989d, 5c9a348), both in the first-commit conflict only.
## Conflicts (commit 42f836e)
- line-chart.tsx: imports merged to `type ReactNode, useEffect, useRef, useState` plus recharts with `ReferenceArea`; props have both `highlight = null` and `headerControls`.
- results.tsx: single `useMemo, useState` import; kept main's rows/active/highlight and the branch's perVillager/gatherRateSeries.
- docs/aoe4-build-order.md: auto-merged.
## Checks
- tsc --noEmit: pass. lint:dup: 0 clones. npm test: 46 files, 1452 passed, 10 skipped.
- playwright step-band + chart-readability: 11 passed. next build: succeeded. No server left running.
