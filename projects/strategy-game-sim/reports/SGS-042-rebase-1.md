# SGS-042 rebase 1

Branch `sgs-042-aoe4-step-wait-step-stuck` (local only, not pushed), worktree `.claude/code-factory/worktrees/sgs-042-aoe4-step-wait-step-stuck`.

- Old tip: `904e2d6a6857868e2171399a075d72acfab8687f` (on old main `d8d202d`)
- New base: `origin/main` `1d5f5c9315ee8e73c8a6ed0bb7977747d62c373b` (SGS-044 markers, SGS-048 UI)
- New tip: `e25e383970806b2587f55236dc2233c4a55b310d`, author choinickolas@gmail.com

```
$ git log --oneline origin/main..HEAD
e25e383 Report why each build step waits and warn on steps stuck at the horizon
```

## Conflicts and resolution

Only two hunks conflicted; everything else (docs/aoe4-build-order.md, model.ts, research.ts, tests, acceptance specs) auto-merged.

1. `lib/aoe4-build-order/simulate.ts`, the `import type { ... } from './model'` line: took the union, keeping `ChartMarker` (main) and `SimWarning`, `StepWait` (branch). The auto-merged body already had both sides: engine init has `markers: []` alongside the waiting/accrual changes; `accrueWait` exported; result keeps `depletions`, `warnings = sortWarnings([...nodeResults.warnings, ...stuck])` (single call) and `markers: [...engine.markers].sort(compareMarkers)`.
2. `docs/api/openapi.json`, `SimulationResult.properties.warnings`/`markers`: kept the branch's `warnings` description (step-stuck now emitted) and main's new `markers` property. `ChartMarker`/`ChartMarkerKind` schemas, `markers` in `SimulationResult.required` and in the 200 example, and StepTiming's required `waitingOn`/`waitBreakdown` with the updated step examples all merged cleanly. Checked that the file re-serializes byte-identically as 2-space JSON.

No semantic decision was needed beyond merging both sides. The seam-name test (`simulate.test.ts`: 14 exports, including `accrueWait`), the model-exports test and the edges spec key list match the merged code; they passed unchanged.

## Gates (Node v24.22.2)

- `npx tsc --noEmit`: pass
- `npm run lint:dup`: pass (0 clones)
- `npm test`: pass (36 files, 872 tests)
- `npx next build`: pass
- `npm run acceptance`: pass (429/429)

Nothing pushed; main untouched.
