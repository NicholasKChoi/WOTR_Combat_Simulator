Title: manage.md: acceptance-test model is its frontmatter model, not risk-picked

## Problem
The acceptance never-skip paragraph says "Launch it on those specs; risk picks the model as usual",
but the model table has risk rows only for implementer and review; every other agent uses its
frontmatter model (acceptance-test: sonnet). Two manager sessions read it oppositely in project
strategy-game-sim: drive-1533 pass 3 ran SGS-127 (high) acceptance on sonnet; drive-1641 pass 2 ran
SGS-136 and SGS-130 (twice) on opus. Opus acceptance cost about $4 over 3 launches against about $1.8
over 6 on sonnet, with no acceptance finding in the window.

## Suggested edit
commands/manage.md, acceptance never-skip paragraph:

```diff
-Launch it on those specs; risk picks the model as usual.
+Launch it on those specs with its frontmatter model (REPO.md `models` may override).
```
