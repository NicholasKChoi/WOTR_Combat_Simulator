# SGS-178 review 1

Verdict: APPROVE (tip 5188c08, base origin/main)

## Blocking findings
None.

## Acceptance criteria
- named-builds.ts no longer exports NAMED_BUILD_VERSION: pass. The diff deletes the export and its doc comment. `git grep -niE "named.?build.?version"` at the tip finds nothing. `npx tsc --noEmit` (the typecheck half of commands.lint) in the task checkout at the same tip exits 0.
- Pre-existing tests unchanged: pass. The diff touches one non-test file.
- No other line of named-builds.ts edited: pass. The diff is exactly 2 deleted lines and nothing else.
- No INVARIANTS.md regressions: pass. A pure deletion of an unreferenced constant changes no behavior, and nothing could be affected.

## Chore check
No owner-visible behavior change and no test assertion change. No doc claims added. No comment added.

## Linter
tsc --noEmit: clean. I did not run lint:dup; a 2-line deletion cannot add clones, and the implementer reports 0 clones.

## Bot
REPO.md was not checked for a reviewBot block beyond the lint grep; for a 2-line deletion this yields no findings either way. Not run.

## Conventions, correctness
Nothing to flag. No other export in the file depends on the removed constant.

## Non-blocking notes
None. UI inspection not applicable (no UI change).

## Coverage
Reviewed lib/aoe4-build-order/named-builds.ts (the full diff). No tests were run, per gate rules. The scratch checkout is removed after this report.
