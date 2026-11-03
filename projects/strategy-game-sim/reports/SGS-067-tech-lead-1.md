# SGS-067 tech-lead 1

Decision: no blockers. Opened draft PR.

## PR
- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/79, base `main`, head `sgs-067-aoe4-inline-issues-suggestions` at fa59ca2a96a5bbe534719eee6c8a7536f9dd9f31 (pushed now, no new commits), draft. The body was set with `gh api PATCH`. It has no stack footer because this is a single PR.

### Merge risk
**low** - page-local UI state only. No API, schema, config or critical-path symbol changes, a revert fully undoes it, and acceptance specs cover the changed behavior.

### Review focus
No hotspots: the change derives the issues list from the text through the existing, length-capped `textToBuildOrder` and adds a scroll effect. Acceptance specs cover each branch: live versus checked issues, the flag set by a valid Run, scroll to a line, to a mid-text line, to the list with no line, a repeated rejection and the table view.

## Reviewed
- Range: origin/main 12639c4 .. fa59ca2 (5 commits, all authored by choinickolas@gmail.com). The merge base is origin/main, and the stack check passes: the diff holds only this task.
- Files: pages/apps/aoe4-build-order.tsx (+26/-7), build-text-editor.tsx (+8/-2), issue-list.tsx (+6/-1), text-lines.ts (+8), text-lines.test.ts (+15/-1), docs/aoe4-build-order.md (+8/-3), acceptance/aoe4-build-order.spec.ts (+2/-2), acceptance/aoe4-build-order-inline-issues.spec.ts (+234, 14 specs).
- Hand-written logic: +48/-10.
- Invariants checked:
  - S1: imports stay in-app.
  - S3: `textToBuildOrder` checks the length cap before parsing, so live conversion is bounded and sends nothing.
  - A1-A3: lib and data untouched.
- Criteria checked: no criticalPaths symbol touched, no API, schema or openapi change, no security surface. CONTEXT.md lists no open questions.

## Non-blocking notes
- The scroll effect depends only on `[rejection]` and reads `view` from the render. This is intentional: it should fire once per rejection. Because `rejection` is a fresh object on each Run, a repeated rejection scrolls again, and a spec covers that.
- `runSimulation` now uses the render-time memoized `converted` instead of converting again. It is equivalent, because the click handler closes over the same render's `text`.
- `textToBuildOrder` now runs on every keystroke, on up to 20000 characters. It was not profiled; if typing in long builds feels slow, debounce it.
