# SGS-042 simplify + suite 1

Tip: unchanged (6c76b951c75171da2fe1a89affe42e00ba8490f3). No commit made.

Trims: none. The diff has no reuse, simplification or efficiency wins that are safe; accrueWait stays the only waitBreakdown writer and wake times are untouched. The only new comment (acceptance spec, next dev compile time) records a real constraint. No ticket ids in new comments.

Suite (Node 24):
- tsc --noEmit: pass; lint:dup: 0 clones
- npm test: 36 files, 872 tests passed
- next build: pass
